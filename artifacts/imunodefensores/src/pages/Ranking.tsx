import { useLocation } from "wouter";
import { getRanking } from "../lib/ranking";
import { Button } from "@/components/ui/button";

export default function RankingPage() {
  const [, setLocation] = useLocation();
  const ranking = getRanking();

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-8 bg-background text-foreground">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setLocation("/")} className="shrink-0">← Voltar</Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Ranking</h1>
            <p className="text-sm text-muted-foreground">Melhores defensores do organismo</p>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-lg">Nenhuma entrada ainda.</p>
            <p className="text-sm mt-2">Conclua uma fase para entrar no ranking!</p>
            <Button className="mt-6" onClick={() => setLocation("/")}>Jogar Agora</Button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="px-4 py-3 font-bold text-xs text-gray-400 uppercase tracking-wider grid grid-cols-[2rem_1fr_auto_auto] gap-2"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <span>#</span>
              <span>Nome</span>
              <span className="text-right">Fase</span>
              <span className="text-right pr-1">Pontos</span>
            </div>
            {ranking.map((entry, i) => (
              <div
                key={i}
                className="px-4 py-3 grid grid-cols-[2rem_1fr_auto_auto] gap-2 items-center text-sm border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}
              >
                <span className="font-bold text-gray-400">
                  {i < 3 ? medals[i] : <span className="text-gray-600">{i + 1}</span>}
                </span>
                <div>
                  <p className="font-bold text-white truncate">{entry.name}</p>
                  <p className="text-xs text-gray-500">{entry.date}</p>
                </div>
                <span className="text-xs text-gray-400 text-right">{entry.phaseTitle.split(":").pop()?.trim() ?? `Fase ${entry.phase}`}</span>
                <span className="font-mono font-bold text-cyan-400 text-right">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
