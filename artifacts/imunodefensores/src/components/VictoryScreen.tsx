import { useState } from "react";
import { motion } from "framer-motion";
import { getRanking, addRankEntry, calcScore, RankEntry } from "../lib/ranking";

interface Props {
  hp: number;
  leucocitos: number;
  phaseId: string;
  phaseTitle: string;
  onMenu: () => void;
  onNextPhase?: () => void;
  onRetry?: () => void;
  isGameOver?: boolean;
  bonusScore?: number;
}

export function VictoryScreen({ hp, leucocitos, phaseId, phaseTitle, onMenu, onNextPhase, onRetry, isGameOver = false, bonusScore }: Props) {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ranking, setRanking] = useState<RankEntry[]>(getRanking);

  const score = bonusScore !== undefined ? bonusScore : calcScore(hp, leucocitos, phaseId);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const entry: RankEntry = {
      name: name.trim(),
      score,
      hp,
      leucocitos,
      phase: phaseId,
      phaseTitle,
      date: new Date().toLocaleDateString("pt-BR"),
    };
    const updated = addRankEntry(entry);
    setRanking(updated);
    setSubmitted(true);
  };

  const myRank = submitted
    ? ranking.findIndex(r => r.name === name.trim() && r.score === score) + 1
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.92)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "#080e1a",
          border: `2px solid ${isGameOver ? "rgba(239,68,68,0.5)" : "rgba(34,197,94,0.5)"}`,
          boxShadow: `0 0 40px ${isGameOver ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}`,
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          {isGameOver ? (
            <>
              <div className="text-5xl mb-2">💀</div>
              <h1 className="text-3xl font-bold text-red-400 mb-1">Núcleo Comprometido!</h1>
              <p className="text-sm text-gray-400">A infecção venceu desta vez.</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-2">🎉</div>
              <h1 className="text-3xl font-bold text-green-400 mb-1">Vitória!</h1>
              <p className="text-sm text-gray-400">{phaseTitle} — Organismo protegido!</p>
            </>
          )}
        </div>

        {/* Score breakdown */}
        <div className="mx-4 mb-4 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {bonusScore === undefined ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Base (Fase {phaseId})</span>
                <span className="text-white font-mono">+{parseInt(phaseId) * 600}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Vida restante ({hp}%)</span>
                <span className="text-green-400 font-mono">+{hp * 15}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Leucócitos restantes ({leucocitos}⚪)</span>
                <span className="text-yellow-400 font-mono">+{leucocitos * 3}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base">
                <span className="text-white">Pontuação Total</span>
                <span className="text-cyan-400 font-mono text-xl">{score}</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Pontuação Final</p>
              <p className="text-4xl font-bold text-yellow-400 font-mono">{score}</p>
            </div>
          )}
        </div>

        {/* Name entry / ranking */}
        <div className="px-4 pb-4">
          {!submitted ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-300 text-center">Entre no ranking! Qual é o seu nome?</p>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="Seu nome ou nick..."
                  maxLength={20}
                  className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                    color: "white",
                    boxShadow: name.trim() ? "0 0 16px rgba(6,182,212,0.3)" : "none",
                  }}
                >
                  Salvar
                </button>
              </div>
              <button
                onClick={() => setSubmitted(true)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors w-full text-center underline underline-offset-2"
              >
                Pular ranking
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {myRank && myRank <= 5 && (
                <p className="text-center text-yellow-400 font-bold text-sm">
                  🏆 Você ficou em {myRank}º lugar!
                </p>
              )}
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.04)" }}>
                  Top Ranking
                </div>
                {ranking.slice(0, 5).map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                    style={{
                      background: entry.name === name.trim() && entry.score === score
                        ? "rgba(6,182,212,0.1)"
                        : i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                      borderLeft: entry.name === name.trim() && entry.score === score ? "2px solid #06b6d4" : "2px solid transparent",
                    }}
                  >
                    <span className="text-gray-500 w-4 text-right font-mono">{i + 1}</span>
                    <span className="flex-1 text-white truncate">{entry.name}</span>
                    <span className="text-xs text-gray-500">{entry.phaseTitle.split(":")[0] ?? `Fase ${entry.phase}`}</span>
                    <span className="text-cyan-400 font-mono font-bold">{entry.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-6 flex gap-2 flex-wrap justify-center">
          {isGameOver && onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}
            >
              Tentar Novamente
            </button>
          )}
          <button
            onClick={onMenu}
            className="px-4 py-2 rounded-lg text-sm border border-white/15 text-gray-300 hover:text-white transition-colors"
          >
            Menu Principal
          </button>
          {!isGameOver && onNextPhase && (
            <button
              onClick={onNextPhase}
              className="px-5 py-2 rounded-lg text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "white",
                boxShadow: "0 0 16px rgba(34,197,94,0.3)",
              }}
            >
              Próxima Fase →
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
