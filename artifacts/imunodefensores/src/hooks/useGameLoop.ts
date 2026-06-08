import { useState, useEffect, useRef, useCallback } from 'react';
import { EnemyDef, ENEMY_DEFS, TowerDef, TOWER_DEFS, PHASE_MAPS, PhaseDef, EnemyType, TowerType } from '../lib/constants';

export interface Entity {
  id: string;
  x: number;
  y: number;
}

export interface Enemy extends Entity {
  def: EnemyDef;
  hp: number;
  maxHp: number;
  pathIndex: number;
  distanceToNext: number;
}

export interface Tower extends Entity {
  def: TowerDef;
  lastAttack: number;
  attackAnim?: number;
  hp: number;
  maxHp: number;
}

export interface Projectile extends Entity {
  targetId: string;
  damage: number;
  speed: number;
  type: "single" | "aoe";
}

export interface Particle extends Entity {
  life: number;
  color: string;
  vx: number;
  vy: number;
}

const FIRST_WAVE_PREP  = 12000; // 12s before wave 1 (was 20s)
const BETWEEN_WAVE_PREP = 4000; // 4s between waves — next wave starts even if enemies remain
const TOWER_MAX_HP      = 150;
const ENEMY_TOWER_DAMAGE = 12;  // HP/s dealt to a tower per adjacent enemy (within 48px)

export function useGameLoop(phase: PhaseDef, started: boolean, vaccineReady: boolean) {
  const [leucocitos, setLeucocitos] = useState(phase.startCurrency);
  const [hp, setHp] = useState(100);
  const [waveIndex, setWaveIndex] = useState(-1);
  const [waveRunning, setWaveRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [vaccinesActive, setVaccinesActive] = useState<EnemyType[]>([]);
  const [prepTimeLeft, setPrepTimeLeft] = useState(FIRST_WAVE_PREP);
  const [isPrepPhase, setIsPrepPhase] = useState(true);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [citizens, setCitizens] = useState<{ x: number; y: number; id: string; vaccinated: boolean }[]>(
    phase.hasVIPs ? [
      { x: 2, y: 1, id: 'c1', vaccinated: false }, { x: 5, y: 3, id: 'c2', vaccinated: false },
      { x: 8, y: 2, id: 'c3', vaccinated: false }, { x: 1, y: 6, id: 'c4', vaccinated: false },
      { x: 6, y: 7, id: 'c5', vaccinated: false }, { x: 9, y: 6, id: 'c6', vaccinated: false },
    ] : []
  );

  const enemiesRef      = useRef<Enemy[]>([]);
  const projectilesRef  = useRef<Projectile[]>([]);
  const particlesRef    = useRef<Particle[]>([]);
  const lastTimeRef     = useRef(performance.now());
  const reqRef          = useRef<number>(0);
  const vaccinesActiveRef = useRef<EnemyType[]>([]);
  const waveIndexRef    = useRef(-1);
  const waveRunningRef  = useRef(false);
  const gameOverRef     = useRef(false);
  const victoryRef      = useRef(false);
  const prepTimeRef     = useRef(FIRST_WAVE_PREP);
  const isPrepPhaseRef  = useRef(true);
  const vaccineReadyRef = useRef(vaccineReady);
  const lastWaveDoneRef = useRef(false); // last wave queue empty, waiting for enemies to clear

  useEffect(() => { vaccinesActiveRef.current = vaccinesActive; }, [vaccinesActive]);
  useEffect(() => { vaccineReadyRef.current = vaccineReady; }, [vaccineReady]);

  const waveState = useRef<{
    queue: { type: EnemyType; time: number }[];
    timeToNext: number;
  }>({ queue: [], timeToNext: 0 });

  const spawnWave = useCallback((index: number) => {
    const wave = phase.waves[index];
    if (!wave) return;
    const countMult    = 1 + index * 0.25;
    const intervalMult = Math.max(0.5, 1 - index * 0.1);
    const queue: { type: EnemyType; time: number }[] = [];
    let cursor = 0;
    wave.enemies.forEach(we => {
      const scaledCount    = Math.round(we.count * countMult);
      const scaledInterval = Math.round(wave.interval * intervalMult);
      for (let i = 0; i < scaledCount; i++) {
        queue.push({ type: we.type, time: cursor });
        cursor += scaledInterval;
      }
    });
    queue.sort((a, b) => a.time - b.time);
    waveState.current    = { queue, timeToNext: queue.length > 0 ? queue[0].time : 0 };
    waveIndexRef.current = index;
    waveRunningRef.current = true;
    setWaveIndex(index);
    setWaveRunning(true);
  }, [phase]);

  const gameMap = PHASE_MAPS[phase.id] ?? PHASE_MAPS["1"];

  const loop = useCallback((time: number) => {
    if (gameOverRef.current || victoryRef.current) return;
    const dt = Math.min(time - lastTimeRef.current, 100);
    lastTimeRef.current = time;

    // ── Prep phase countdown ────────────────────────────────────────────────
    if (isPrepPhaseRef.current && !waveRunningRef.current) {
      const needsVaccineFirst =
        phase.id === "2" &&
        phase.vaccineTarget &&
        waveIndexRef.current === -1 &&
        !vaccinesActiveRef.current.includes(phase.vaccineTarget) &&
        !vaccineReadyRef.current;

      if (!needsVaccineFirst) {
        prepTimeRef.current -= dt;
        setPrepTimeLeft(Math.max(0, prepTimeRef.current));

        if (prepTimeRef.current <= 0) {
          const nextIndex = waveIndexRef.current + 1;
          if (nextIndex < phase.waves.length) {
            isPrepPhaseRef.current = false;
            setIsPrepPhase(false);
            spawnWave(nextIndex);
          } else {
            victoryRef.current = true;
            setVictory(true);
          }
        }
      }
    }

    // ── Spawn enemies from queue ────────────────────────────────────────────
    if (waveRunningRef.current && waveState.current.queue.length > 0) {
      waveState.current.timeToNext -= dt;
      if (waveState.current.timeToNext <= 0) {
        const toSpawn = waveState.current.queue.shift()!;
        const start   = gameMap.path[0];
        const eDef    = ENEMY_DEFS[toSpawn.type];
        const waveIdx = waveIndexRef.current;
        const hpScale    = 1 + waveIdx * 0.3;
        const speedScale = 1 + waveIdx * 0.1;
        const scaledHp   = Math.round(eDef.hp * hpScale);
        const scaledDef  = { ...eDef, speed: eDef.speed * speedScale };
        enemiesRef.current.push({
          id: Math.random().toString(),
          x: start.x * gameMap.tileSize + gameMap.tileSize / 2,
          y: start.y * gameMap.tileSize + gameMap.tileSize / 2,
          def: scaledDef, hp: scaledHp, maxHp: scaledHp,
          pathIndex: 0, distanceToNext: 0,
        });
        if (waveState.current.queue.length > 0) {
          waveState.current.timeToNext = waveState.current.queue[0].time - toSpawn.time;
        }
      }
    }

    // ── Wave done: auto-start next wave without waiting for kill-clear ──────
    if (waveRunningRef.current && waveState.current.queue.length === 0) {
      const isLastWave = waveIndexRef.current >= phase.waves.length - 1;
      waveRunningRef.current = false;
      setWaveRunning(false);

      if (!isLastWave) {
        // Start prep for next wave even if enemies from this wave still alive
        prepTimeRef.current  = BETWEEN_WAVE_PREP;
        isPrepPhaseRef.current = true;
        setIsPrepPhase(true);
        setPrepTimeLeft(BETWEEN_WAVE_PREP);
      } else {
        // Last wave — mark done; victory fires when all enemies cleared
        lastWaveDoneRef.current = true;
      }
    }

    // Victory after last wave when all enemies finally die
    if (lastWaveDoneRef.current && enemiesRef.current.length === 0) {
      lastWaveDoneRef.current = false;
      victoryRef.current = true;
      setVictory(true);
    }

    // ── Move enemies ────────────────────────────────────────────────────────
    const path = gameMap.path;
    const nextEnemies: Enemy[] = [];
    let damageToPlayer = 0;
    enemiesRef.current.forEach(enemy => {
      const targetPt = path[enemy.pathIndex + 1];
      if (targetPt) {
        const tx = targetPt.x * gameMap.tileSize + gameMap.tileSize / 2;
        const ty = targetPt.y * gameMap.tileSize + gameMap.tileSize / 2;
        const dx = tx - enemy.x;
        const dy = ty - enemy.y;
        const dist  = Math.sqrt(dx * dx + dy * dy);
        const speed = enemy.def.speed * 30 * (dt / 1000);
        if (dist <= speed) {
          enemy.x = tx; enemy.y = ty; enemy.pathIndex++;
        } else {
          enemy.x += (dx / dist) * speed;
          enemy.y += (dy / dist) * speed;
        }
        nextEnemies.push(enemy);
      } else {
        damageToPlayer += 10;
      }
    });
    enemiesRef.current = nextEnemies;

    if (damageToPlayer > 0) {
      setHp(prev => {
        const n = prev - damageToPlayer;
        if (n <= 0) { gameOverRef.current = true; setGameOver(true); }
        return Math.max(0, n);
      });
    }

    // ── Towers: attack enemies + take damage from nearby enemies ───────────
    setTowers(prevTowers => {
      const dead = new Set<string>();
      const ts = prevTowers.map(tower => {
        // — Proximity damage from nearby enemies —
        let proximityDmg = 0;
        enemiesRef.current.forEach(e => {
          const dx = e.x - tower.x;
          const dy = e.y - tower.y;
          if (Math.sqrt(dx * dx + dy * dy) < 48) {
            proximityDmg += ENEMY_TOWER_DAMAGE * (dt / 1000);
          }
        });
        const newHp = Math.max(0, tower.hp - proximityDmg);
        if (newHp <= 0) { dead.add(tower.id); return tower; }

        // — Attack cooldown —
        if (tower.attackAnim && tower.attackAnim > 0) tower.attackAnim -= dt;
        if (tower.lastAttack > 0) tower.lastAttack -= dt;
        if (tower.lastAttack <= 0) {
          const target = enemiesRef.current.find(e => {
            const dx = e.x - tower.x;
            const dy = e.y - tower.y;
            return Math.sqrt(dx * dx + dy * dy) <= tower.def.range;
          });
          if (target) {
            let speedMult = 1;
            if (tower.def.type === "memoria" && vaccinesActiveRef.current.includes(target.def.type)) {
              speedMult = 3;
            }
            tower.lastAttack = (1000 / tower.def.attackSpeed) / speedMult;
            tower.attackAnim = 200;
            projectilesRef.current.push({
              id: Math.random().toString(),
              x: tower.x, y: tower.y,
              targetId: target.id,
              damage: tower.def.damage,
              speed: 300,
              type: tower.def.type === 'macrofago' ? 'aoe' : 'single',
            });
          }
        }
        return { ...tower, hp: newHp };
      });
      return ts.filter(t => !dead.has(t.id));
    });

    // ── Update projectiles ──────────────────────────────────────────────────
    const nextProj: Projectile[] = [];
    projectilesRef.current.forEach(p => {
      const target = enemiesRef.current.find(e => e.id === p.targetId);
      if (!target) return;
      const dx   = target.x - p.x;
      const dy   = target.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const move = p.speed * (dt / 1000);
      if (dist <= move) {
        if (p.type === 'aoe') {
          enemiesRef.current.forEach(e => {
            const edx = e.x - target.x;
            const edy = e.y - target.y;
            if (Math.sqrt(edx * edx + edy * edy) <= 80) e.hp -= p.damage;
          });
        } else {
          target.hp -= p.damage;
        }
      } else {
        p.x += (dx / dist) * move;
        p.y += (dy / dist) * move;
        nextProj.push(p);
      }
    });
    projectilesRef.current = nextProj;

    // ── Clear dead enemies ──────────────────────────────────────────────────
    let reward = 0;
    enemiesRef.current = enemiesRef.current.filter(e => {
      if (e.hp <= 0) {
        reward += e.def.reward;
        for (let i = 0; i < 5; i++) {
          particlesRef.current.push({
            id: Math.random().toString(), x: e.x, y: e.y,
            vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
            life: 500, color: e.def.color,
          });
        }
        return false;
      }
      return true;
    });
    if (reward > 0) setLeucocitos(l => l + reward);

    // ── Update particles ────────────────────────────────────────────────────
    particlesRef.current = particlesRef.current.filter(p => {
      p.life -= dt;
      p.x += p.vx * (dt / 1000);
      p.y += p.vy * (dt / 1000);
      return p.life > 0;
    });

    reqRef.current = requestAnimationFrame(loop);
  }, [phase, spawnWave]);

  useEffect(() => {
    if (!started) return;
    lastTimeRef.current = performance.now();
    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [loop, started]);

  const placeTower = (type: TowerType, gridX: number, gridY: number) => {
    const def = TOWER_DEFS[type];
    if (leucocitos >= def.cost) {
      setLeucocitos(l => l - def.cost);
      setTowers(t => [...t, {
        id: Math.random().toString(),
        x: gridX * gameMap.tileSize + gameMap.tileSize / 2,
        y: gridY * gameMap.tileSize + gameMap.tileSize / 2,
        def, lastAttack: 0,
        hp: TOWER_MAX_HP, maxHp: TOWER_MAX_HP,
      }]);
    }
  };

  const repairTowers = useCallback((cost: number) => {
    setLeucocitos(prev => {
      if (prev < cost) return prev;
      setTowers(ts => ts.map(t => ({ ...t, hp: t.maxHp })));
      return prev - cost;
    });
  }, []);

  return {
    leucocitos, hp, waveIndex, waveRunning, gameOver, victory,
    prepTimeLeft, isPrepPhase,
    towers, setTowers, placeTower, repairTowers,
    enemies: enemiesRef.current,
    projectiles: projectilesRef.current,
    particles: particlesRef.current,
    vaccinesActive, setVaccinesActive,
    citizens, setCitizens, setLeucocitos,
  };
}
