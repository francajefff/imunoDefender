export type EnemyType = "sarampo" | "pneumococo" | "influenza" | "rotavirus";

export interface EnemyDef {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  color: string;
  glowClass: string;
}

export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  sarampo:    { type: "sarampo",    name: "Vírus do Sarampo", hp: 40,  speed: 2.2, reward: 10, color: "#ff4d4d", glowClass: "enemy-glow-red" },
  pneumococo: { type: "pneumococo", name: "Pneumococo",       hp: 180, speed: 0.7, reward: 30, color: "#8899aa", glowClass: "enemy-glow-blue" },
  influenza:  { type: "influenza",  name: "Vírus Influenza",  hp: 90,  speed: 1.6, reward: 15, color: "#b84dff", glowClass: "enemy-glow-purple" },
  rotavirus:  { type: "rotavirus",  name: "Rotavírus",        hp: 28,  speed: 3.5, reward: 8,  color: "#ffcc00", glowClass: "enemy-glow-yellow" },
};

export type TowerType = "neutrofilo" | "anticorpo" | "macrofago" | "memoria";

export interface TowerDef {
  type: TowerType;
  name: string;
  cost: number;
  damage: number;
  attackSpeed: number;
  range: number;
  color: string;
  description: string;
}

export const TOWER_DEFS: Record<TowerType, TowerDef> = {
  neutrofilo: { type: "neutrofilo", name: "Neutrófilo",        cost: 50,  damage: 15, attackSpeed: 2,   range: 100, color: "#ffffff", description: "Ataque rápido, curto alcance" },
  anticorpo:  { type: "anticorpo",  name: "Anticorpo",         cost: 100, damage: 55, attackSpeed: 0.5, range: 260, color: "#00ffff", description: "Dano alto, longo alcance, lento" },
  macrofago:  { type: "macrofago",  name: "Macrófago",         cost: 75,  damage: 12, attackSpeed: 0.8, range: 130, color: "#00ff88", description: "Dano em área — atinge todos perto" },
  memoria:    { type: "memoria",    name: "Célula de Memória", cost: 150, damage: 22, attackSpeed: 1,   range: 160, color: "#ffff00", description: "3× mais rápida contra inimigos vacinados" },
};

export interface MapData {
  width: number;
  height: number;
  tileSize: number;
  path: { x: number; y: number }[];
}

// ─── Per-phase maps — each with a unique, longer path ────────────────────────
//
//  All maps are 13 × 10 tiles (tileSize = 60 → 780 × 600 px logical).
//  Path waypoints are corners; segments between them are straight H or V lines.
//
//  Phase 1 — S-curve (beginner)
//    Entry (0,4) ─right→ (4,4) ─up→ (4,1) ─right→ (8,1) ─down→ (8,8) ─right→ (12,8)
//
//  Phase 2 — Z-zigzag (intermediate)
//    Entry (0,1) ─right→ (5,1) ─down→ (5,5) ─left→ (1,5) ─down→ (1,8) ─right→ (10,8) ─up→ (10,3) ─right→ (12,3)
//
//  Phase 3 — Comb/spiral (advanced)
//    Entry (0,7) ─right→ (1,7) ─up→ (1,2) ─right→ (4,2) ─down→ (4,8) ─right→ (8,8) ─up→ (8,3) ─right→ (12,3)
//
//  Phase 4 — Double-back (expert)
//    Entry (0,3) ─right→ (3,3) ─down→ (3,7) ─right→ (7,7) ─up→ (7,2) ─right→ (10,2) ─down→ (10,7) ─right→ (12,7)

export const PHASE_MAPS: Record<string, MapData> = {
  "1": {
    width: 13, height: 10, tileSize: 60,
    path: [
      { x: 0, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 1 },
      { x: 8, y: 1 }, { x: 8, y: 8 }, { x: 12, y: 8 },
    ],
  },
  "2": {
    width: 13, height: 10, tileSize: 60,
    path: [
      { x: 0, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 5 },
      { x: 1, y: 5 }, { x: 1, y: 8 }, { x: 10, y: 8 },
      { x: 10, y: 3 }, { x: 12, y: 3 },
    ],
  },
  "3": {
    width: 13, height: 10, tileSize: 60,
    path: [
      { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 1, y: 2 },
      { x: 4, y: 2 }, { x: 4, y: 8 }, { x: 8, y: 8 },
      { x: 8, y: 3 }, { x: 12, y: 3 },
    ],
  },
  "4": {
    width: 13, height: 10, tileSize: 60,
    path: [
      { x: 0, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 7 },
      { x: 7, y: 7 }, { x: 7, y: 2 }, { x: 10, y: 2 },
      { x: 10, y: 7 }, { x: 12, y: 7 },
    ],
  },
};

// Fallback (used wherever no phase id is available)
export const GAME_MAP: MapData = PHASE_MAPS["1"];

// ─── Path helpers ─────────────────────────────────────────────────────────────

/** Expand waypoint path into the full set of tile coordinates along every segment. */
export function getPathTiles(path: { x: number; y: number }[]): Set<string> {
  const tiles = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to   = path[i + 1];
    if (from.x === to.x) {
      const minY = Math.min(from.y, to.y);
      const maxY = Math.max(from.y, to.y);
      for (let y = minY; y <= maxY; y++) tiles.add(`${from.x},${y}`);
    } else {
      const minX = Math.min(from.x, to.x);
      const maxX = Math.max(from.x, to.x);
      for (let x = minX; x <= maxX; x++) tiles.add(`${x},${from.y}`);
    }
  }
  return tiles;
}

/** Return tiles immediately adjacent (N/S/E/W) to the path — the only valid build zones. */
export function getAdjacentTiles(
  pathTiles: Set<string>,
  width: number,
  height: number,
): Set<string> {
  const adjacent = new Set<string>();
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  pathTiles.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !pathTiles.has(`${nx},${ny}`)) {
        adjacent.add(`${nx},${ny}`);
      }
    }
  });
  return adjacent;
}

// ─── Wave / Phase definitions ─────────────────────────────────────────────────

export interface Wave {
  enemies: { type: EnemyType; count: number }[];
  interval: number;
}

export interface PhaseDef {
  id: string;
  title: string;
  concept: string;
  narration: string;
  waves: Wave[];
  startCurrency: number;
  allowedTowers: TowerType[];
  vaccineTarget?: EnemyType;
  vaccineHint?: string;
  hasVIPs?: boolean;
}

export const PHASES: Record<string, PhaseDef> = {
  "1": {
    id: "1",
    title: "A Invasão Surpresa",
    concept: "Sem vacina, o sistema imunológico não conhece o inimigo e precisa aprender lutando — lento e à custa de saúde.",
    narration: "Um patógeno desconhecido invadiu o organismo! Sem imunidade prévia, suas defesas precisam reagir do zero. Posicione-as bem — cada segundo conta.",
    startCurrency: 200,
    allowedTowers: ["neutrofilo", "macrofago"],
    waves: [
      { enemies: [{ type: "sarampo", count: 8  }], interval: 900 },
      { enemies: [{ type: "sarampo", count: 13 }], interval: 750 },
      { enemies: [{ type: "sarampo", count: 20 }], interval: 600 },
    ],
  },
  "2": {
    id: "2",
    title: "O Laboratório",
    concept: "A vacina contém partes inofensivas do vírus — o suficiente para treinar as células de memória sem causar doença.",
    narration: "O Influenza está invadindo em ondas! Mas desta vez você tem um superpoder: a vacina. Monte-a agora e veja suas Células de Memória atacarem 3× mais rápido!",
    startCurrency: 300,
    allowedTowers: ["neutrofilo", "macrofago", "anticorpo", "memoria"],
    vaccineTarget: "influenza",
    vaccineHint: "Sem a vacina do Influenza, suas Células de Memória não o reconhecem. COM a vacina, elas atacam 3× mais rápido — a diferença é brutal!",
    waves: [
      { enemies: [{ type: "influenza", count: 10 }], interval: 900 },
      { enemies: [{ type: "influenza", count: 14 }], interval: 750 },
      { enemies: [{ type: "influenza", count: 8 }, { type: "sarampo", count: 6 }], interval: 700 },
      { enemies: [{ type: "influenza", count: 20 }], interval: 600 },
    ],
  },
  "3": {
    id: "3",
    title: "A Memória Imunológica",
    concept: "O Influenza já está treinado — mas o Pneumococo é novo. Desenvolva a vacina e veja a memória imunológica em ação pela segunda vez!",
    narration: "Suas células lembram do Influenza — e o destroem rapidamente! Mas o Pneumococo é um invasor novo, resistente e desconhecido. Desenvolva a vacina e veja a diferença!",
    startCurrency: 350,
    allowedTowers: ["neutrofilo", "macrofago", "anticorpo", "memoria"],
    vaccineTarget: "pneumococo",
    vaccineHint: "O Pneumococo é lento mas tem muito HP. COM a vacina, suas Células de Memória atacam-no 3× mais rápido. SEM ela, você vai precisar de muita munição!",
    waves: [
      { enemies: [{ type: "influenza",  count: 14 }], interval: 800 },
      { enemies: [{ type: "pneumococo", count: 7  }], interval: 1800 },
      { enemies: [{ type: "influenza",  count: 12 }, { type: "pneumococo", count: 5  }], interval: 900 },
      { enemies: [{ type: "pneumococo", count: 10 }, { type: "sarampo",    count: 10 }], interval: 750 },
    ],
  },
  "4": {
    id: "4",
    title: "Imunidade de Rebanho",
    concept: "Bebês e idosos não podem se vacinar. A única forma de protegê-los é vacinando todos ao redor — criando um escudo coletivo.",
    narration: "Os VIPs estão em perigo! Vacine os cidadãos ao redor deles para criar bolhas de proteção. E o Rotavírus está chegando em grande velocidade — a vacina é essencial!",
    startCurrency: 450,
    allowedTowers: ["neutrofilo", "macrofago", "anticorpo", "memoria"],
    vaccineTarget: "rotavirus",
    vaccineHint: "O Rotavírus é ultra-rápido e vem em enxames. COM a vacina, suas Células de Memória o destroem antes de chegar aos VIPs. Você vai precisar dela na onda 3!",
    hasVIPs: true,
    waves: [
      { enemies: [{ type: "sarampo",    count: 10 }, { type: "influenza",  count: 10 }], interval: 750 },
      { enemies: [{ type: "pneumococo", count: 10 }],                                   interval: 1500 },
      { enemies: [{ type: "rotavirus",  count: 30 }],                                   interval: 320 },
      { enemies: [{ type: "sarampo",    count: 12 }, { type: "influenza",  count: 12 },
                  { type: "rotavirus",  count: 20 }],                                   interval: 550 },
    ],
  },
};
