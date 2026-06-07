import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EnemyDef, ENEMY_DEFS, TowerDef, TOWER_DEFS, GAME_MAP, PhaseDef, Wave, EnemyType, TowerType } from '../lib/constants';

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
  frozen?: number;
}

export interface Tower extends Entity {
  def: TowerDef;
  lastAttack: number;
  targetId?: string;
  attackAnim?: number;
}

export interface Projectile extends Entity {
  targetId: string;
  damage: number;
  speed: number;
  x: number;
  y: number;
  type: "single" | "aoe";
}

export interface Particle extends Entity {
  life: number;
  color: string;
  vx: number;
  vy: number;
}

export function useGameLoop(phase: PhaseDef) {
  const [leucocitos, setLeucocitos] = useState(phase.startCurrency);
  const [hp, setHp] = useState(100);
  const [waveIndex, setWaveIndex] = useState(-1);
  const [waveRunning, setWaveRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [vaccinesActive, setVaccinesActive] = useState<EnemyType[]>([]);
  const [citizens, setCitizens] = useState<{x: number, y: number, id: string, vaccinated: boolean}[]>(
    phase.hasVIPs ? [
      {x: 2, y: 1, id: 'c1', vaccinated: false}, {x: 5, y: 3, id: 'c2', vaccinated: false},
      {x: 8, y: 2, id: 'c3', vaccinated: false}, {x: 1, y: 6, id: 'c4', vaccinated: false},
      {x: 6, y: 7, id: 'c5', vaccinated: false}, {x: 9, y: 6, id: 'c6', vaccinated: false}
    ] : []
  );

  const [towers, setTowers] = useState<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef(performance.now());
  const reqRef = useRef<number>(0);
  
  const waveState = useRef<{
    queue: {type: EnemyType, time: number}[];
    timeToNext: number;
  }>({ queue: [], timeToNext: 0 });

  const spawnWave = useCallback((index: number) => {
    const wave = phase.waves[index];
    if (!wave) return;
    
    let queue: {type: EnemyType, time: number}[] = [];
    wave.enemies.forEach(we => {
      for(let i=0; i<we.count; i++){
        queue.push({ type: we.type, time: i * wave.interval });
      }
    });
    // sort by time
    queue.sort((a,b) => a.time - b.time);
    
    waveState.current = {
      queue,
      timeToNext: queue.length > 0 ? queue[0].time : 0
    };
    setWaveIndex(index);
    setWaveRunning(true);
  }, [phase]);

  const loop = useCallback((time: number) => {
    if (gameOver || victory) return;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // spawn enemies
    if (waveRunning && waveState.current.queue.length > 0) {
      waveState.current.timeToNext -= dt;
      if (waveState.current.timeToNext <= 0) {
        const toSpawn = waveState.current.queue.shift()!;
        const start = GAME_MAP.path[0];
        const eDef = ENEMY_DEFS[toSpawn.type];
        enemiesRef.current.push({
          id: Math.random().toString(),
          x: start.x * GAME_MAP.tileSize + GAME_MAP.tileSize/2,
          y: start.y * GAME_MAP.tileSize + GAME_MAP.tileSize/2,
          def: eDef,
          hp: eDef.hp,
          maxHp: eDef.hp,
          pathIndex: 0,
          distanceToNext: 0
        });
        if (waveState.current.queue.length > 0) {
          waveState.current.timeToNext = waveState.current.queue[0].time - toSpawn.time;
        } else {
          setWaveRunning(false);
        }
      }
    } else if (waveRunning && waveState.current.queue.length === 0 && enemiesRef.current.length === 0) {
      setWaveRunning(false);
      if (waveIndex >= phase.waves.length - 1) {
        setVictory(true);
      }
    }

    // move enemies
    const path = GAME_MAP.path;
    const nextEnemies: Enemy[] = [];
    let damageToPlayer = 0;

    enemiesRef.current.forEach(enemy => {
      let moved = false;
      const targetPt = path[enemy.pathIndex + 1];
      if (targetPt) {
        const tx = targetPt.x * GAME_MAP.tileSize + GAME_MAP.tileSize/2;
        const ty = targetPt.y * GAME_MAP.tileSize + GAME_MAP.tileSize/2;
        const dx = tx - enemy.x;
        const dy = ty - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const speed = enemy.def.speed * 30 * (dt / 1000);
        
        if (dist <= speed) {
          enemy.x = tx;
          enemy.y = ty;
          enemy.pathIndex++;
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
        if (n <= 0) setGameOver(true);
        return Math.max(0, n);
      });
    }

    // Towers attack
    setTowers(prevTowers => {
      const ts = [...prevTowers];
      ts.forEach(tower => {
        if (tower.attackAnim && tower.attackAnim > 0) tower.attackAnim -= dt;
        
        let speedMult = 1;
        
        if (tower.lastAttack > 0) tower.lastAttack -= dt;
        if (tower.lastAttack <= 0) {
          // find target
          const target = enemiesRef.current.find(e => {
            const dx = e.x - tower.x;
            const dy = e.y - tower.y;
            return Math.sqrt(dx*dx + dy*dy) <= tower.def.range;
          });

          if (target) {
            if (tower.def.type === "memoria" && vaccinesActive.includes(target.def.type)) {
              speedMult = 3;
            }
            const cooldown = (1000 / tower.def.attackSpeed) / speedMult;
            tower.lastAttack = cooldown;
            tower.attackAnim = 200;
            
            projectilesRef.current.push({
              id: Math.random().toString(),
              x: tower.x, y: tower.y,
              targetId: target.id,
              damage: tower.def.damage,
              speed: 300,
              type: tower.def.type === 'macrofago' ? 'aoe' : 'single'
            });
          }
        }
      });
      return ts;
    });

    // Update projectiles
    const nextProj: Projectile[] = [];
    projectilesRef.current.forEach(p => {
      const target = enemiesRef.current.find(e => e.id === p.targetId);
      if (!target) return; // target died
      
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const move = p.speed * (dt / 1000);
      
      if (dist <= move) {
        if (p.type === 'aoe') {
          enemiesRef.current.forEach(e => {
            const edx = e.x - target.x;
            const edy = e.y - target.y;
            if (Math.sqrt(edx*edx + edy*edy) <= 80) e.hp -= p.damage;
          });
        } else {
          target.hp -= p.damage;
        }
      } else {
        p.x += (dx/dist) * move;
        p.y += (dy/dist) * move;
        nextProj.push(p);
      }
    });
    projectilesRef.current = nextProj;

    // clear dead enemies
    let reward = 0;
    enemiesRef.current = enemiesRef.current.filter(e => {
      if (e.hp <= 0) {
        reward += e.def.reward;
        // spawn particles
        for(let i=0;i<5;i++){
          particlesRef.current.push({
            id: Math.random().toString(),
            x: e.x, y: e.y,
            vx: (Math.random()-0.5)*100, vy: (Math.random()-0.5)*100,
            life: 500, color: e.def.color
          });
        }
        return false;
      }
      return true;
    });

    if (reward > 0) setLeucocitos(l => l + reward);

    // particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.life -= dt;
      p.x += p.vx * (dt/1000);
      p.y += p.vy * (dt/1000);
      return p.life > 0;
    });

    reqRef.current = requestAnimationFrame(loop);
  }, [gameOver, victory, waveRunning, phase, vaccinesActive]);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [loop]);

  const placeTower = (type: TowerType, gridX: number, gridY: number) => {
    const def = TOWER_DEFS[type];
    if (leucocitos >= def.cost) {
      setLeucocitos(l => l - def.cost);
      setTowers(t => [...t, {
        id: Math.random().toString(),
        x: gridX * GAME_MAP.tileSize + GAME_MAP.tileSize/2,
        y: gridY * GAME_MAP.tileSize + GAME_MAP.tileSize/2,
        def,
        lastAttack: 0
      }]);
    }
  };

  return {
    leucocitos, hp, waveIndex, waveRunning, gameOver, victory,
    spawnWave, towers, placeTower,
    enemies: enemiesRef.current, projectiles: projectilesRef.current, particles: particlesRef.current,
    vaccinesActive, setVaccinesActive,
    citizens, setCitizens, setLeucocitos
  };
}
