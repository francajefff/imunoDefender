export interface RankEntry {
  name: string;
  score: number;
  hp: number;
  leucocitos: number;
  phase: string;
  phaseTitle: string;
  date: string;
}

const KEY = "imunodefensores_ranking";

export function getRanking(): RankEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRankEntry(entry: RankEntry): RankEntry[] {
  const ranking = getRanking();
  ranking.push(entry);
  ranking.sort((a, b) => b.score - a.score);
  const top = ranking.slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(top));
  return top;
}

export function calcScore(hp: number, leucocitos: number, phaseId: string): number {
  const phaseBase = parseInt(phaseId) * 600;
  return phaseBase + hp * 15 + leucocitos * 3;
}
