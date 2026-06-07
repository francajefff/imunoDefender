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
  sarampo: { type: "sarampo", name: "Vírus do Sarampo", hp: 40, speed: 2, reward: 10, color: "#ff4d4d", glowClass: "enemy-glow-red" },
  pneumococo: { type: "pneumococo", name: "Pneumococo", hp: 150, speed: 0.8, reward: 25, color: "#8899aa", glowClass: "enemy-glow-blue" },
  influenza: { type: "influenza", name: "Vírus Influenza", hp: 80, speed: 1.5, reward: 15, color: "#b84dff", glowClass: "enemy-glow-purple" },
  rotavirus: { type: "rotavirus", name: "Rotavírus", hp: 30, speed: 3, reward: 8, color: "#ffcc00", glowClass: "enemy-glow-yellow" },
};

export type TowerType = "neutrofilo" | "anticorpo" | "macrofago" | "memoria";

export interface TowerDef {
  type: TowerType;
  name: string;
  cost: number;
  damage: number;
  attackSpeed: number; // attacks per second
  range: number;
  color: string;
  description: string;
}

export const TOWER_DEFS: Record<TowerType, TowerDef> = {
  neutrofilo: { type: "neutrofilo", name: "Neutrófilo", cost: 50, damage: 15, attackSpeed: 2, range: 100, color: "#ffffff", description: "Ataque rápido, curto alcance" },
  anticorpo: { type: "anticorpo", name: "Anticorpo", cost: 100, damage: 50, attackSpeed: 0.5, range: 250, color: "#00ffff", description: "Dano alto, longo alcance, lento" },
  macrofago: { type: "macrofago", name: "Macrófago", cost: 75, damage: 10, attackSpeed: 0.8, range: 120, color: "#00ff88", description: "Dano em área" },
  memoria: { type: "memoria", name: "Célula de Memória", cost: 150, damage: 20, attackSpeed: 1, range: 150, color: "#ffff00", description: "3x mais rápida contra inimigos vacinados" },
};

export interface MapData {
  width: number;
  height: number;
  tileSize: number;
  path: { x: number, y: number }[];
  vips?: { x: number, y: number, type: "baby" | "elder" | "sick" }[];
  citizens?: { x: number, y: number, vaccinated: boolean }[];
}

export const GAME_MAP: MapData = {
  width: 12,
  height: 9,
  tileSize: 60,
  path: [
    {x: 0, y: 2}, {x: 3, y: 2}, {x: 3, y: 5}, {x: 7, y: 5}, {x: 7, y: 1}, {x: 10, y: 1}, {x: 10, y: 7}, {x: 11, y: 7}
  ]
};

export interface Wave {
  enemies: { type: EnemyType, count: number }[];
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
  hasVIPs?: boolean;
}

export const PHASES: Record<string, PhaseDef> = {
  "1": {
    id: "1",
    title: "A Invasão Surpresa",
    concept: "Sem vacina, seus defensores não conhecem o inimigo. A batalha será difícil...",
    narration: "Atenção! Um patógeno desconhecido invadiu o organismo. Sem imunidade prévia, nossas células de defesa precisam lutar com força total para proteger o núcleo.",
    startCurrency: 200,
    allowedTowers: ["neutrofilo", "macrofago"],
    waves: [
      { enemies: [{ type: "sarampo", count: 5 }], interval: 1000 },
      { enemies: [{ type: "sarampo", count: 8 }], interval: 800 },
      { enemies: [{ type: "sarampo", count: 12 }], interval: 600 }
    ]
  },
  "2": {
    id: "2",
    title: "O Laboratório",
    concept: "A vacina contém partes inofensivas do vírus — o suficiente para treinar suas defesas sem causar doença.",
    narration: "O cientista está trabalhando! Monte a vacina com os fragmentos virais para treinar suas células de memória antes da próxima invasão.",
    startCurrency: 300,
    allowedTowers: ["neutrofilo", "macrofago", "anticorpo", "memoria"],
    vaccineTarget: "influenza",
    waves: [
      { enemies: [{ type: "influenza", count: 6 }], interval: 1200 },
      { enemies: [{ type: "influenza", count: 8 }], interval: 1000 },
      { enemies: [{ type: "influenza", count: 10 }], interval: 800 }
    ]
  },
  "3": {
    id: "3",
    title: "A Memória Imunológica",
    concept: "Veja como suas células lembram do Influenza! Mas o Pneumococo ainda é um novo desafio...",
    narration: "Graças à vacina, a Célula de Memória ataca o Influenza três vezes mais rápido! Cuidado com os novos invasores.",
    startCurrency: 300,
    allowedTowers: ["neutrofilo", "macrofago", "anticorpo", "memoria"],
    vaccineTarget: "influenza", // starts activated implicitly
    waves: [
      { enemies: [{ type: "influenza", count: 10 }], interval: 1000 },
      { enemies: [{ type: "pneumococo", count: 5 }], interval: 2000 },
      { enemies: [{ type: "influenza", count: 8 }, { type: "pneumococo", count: 4 }], interval: 1200 }
    ]
  },
  "4": {
    id: "4",
    title: "Imunidade de Rebanho",
    concept: "Bebês e idosos não podem se vacinar. A única forma de protegê-los é vacinando todos ao redor.",
    narration: "Proteja os mais vulneráveis! Vacine os cidadãos para criar escudos de proteção no mapa.",
    startCurrency: 400,
    allowedTowers: ["neutrofilo", "macrofago", "anticorpo", "memoria"],
    vaccineTarget: "rotavirus",
    hasVIPs: true,
    waves: [
      { enemies: [{ type: "sarampo", count: 5 }, { type: "influenza", count: 5 }], interval: 1000 },
      { enemies: [{ type: "pneumococo", count: 6 }], interval: 1500 },
      { enemies: [{ type: "rotavirus", count: 15 }], interval: 500 },
      { enemies: [{ type: "sarampo", count: 10 }, { type: "influenza", count: 10 }, { type: "rotavirus", count: 10 }], interval: 800 }
    ]
  }
};
