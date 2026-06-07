import React, { useEffect, useState } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PHASES, GAME_MAP, TOWER_DEFS, TowerType } from "./lib/constants";
import { useGameLoop } from "./hooks/useGameLoop";
import { motion, AnimatePresence } from "framer-motion";
import FaseBonusWhack from "./pages/FaseBonusWhack";
import { TutorialGuide } from "./components/TutorialGuide";

const queryClient = new QueryClient();

function MainMenu() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-background/90" />
      <div className="z-10 text-center max-w-3xl">
        <h1 className="text-6xl font-bold text-primary mb-4 bio-glow inline-block p-4 rounded-full">
          ImunoDefensores
        </h1>
        <p className="text-xl text-foreground/80 mb-8">
          Defenda o corpo humano contra invasores virais e bacterianos. Aprenda como as vacinas salvam vidas!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {Object.values(PHASES).map(p => (
            <Card
              key={p.id}
              className="p-4 bg-card/80 border-primary/20 hover:border-primary transition-colors cursor-pointer"
              onClick={() => setLocation(`/fase/${p.id}`)}
              data-testid={`card-fase-${p.id}`}
            >
              <h3 className="text-lg font-bold text-primary">Fase {p.id}: {p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.concept}</p>
            </Card>
          ))}
        </div>

        <Card
          className="p-4 mb-8 cursor-pointer transition-all border-2 hover:scale-[1.02]"
          style={{
            background: "rgba(80,0,0,0.4)",
            borderColor: "rgba(239,68,68,0.5)",
            boxShadow: "0 0 24px rgba(239,68,68,0.2)",
          }}
          onClick={() => setLocation("/fase/bonus")}
          data-testid="card-fase-bonus"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚡</div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "#f87171" }}>
                Fase Bônus: Ataque Relâmpago
              </h3>
              <p className="text-sm text-muted-foreground">
                Reflexos em ação! Destrua vírus antes que escapem — mas não ataque as células aliadas do corpo!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function VaccineMinigame({ targetType, onComplete }: { targetType: string; onComplete: () => void }) {
  const [pieces, setPieces] = useState([false, false, false]);
  const labels = ["Proteína Spike", "Fragmento RNA", "Capsídeo"];

  const clickPiece = (i: number) => {
    const next = [...pieces];
    next[i] = true;
    setPieces(next);
    if (next.every(x => x)) {
      setTimeout(onComplete, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center">
      <div
        className="p-8 rounded-2xl text-center max-w-md w-full mx-4"
        style={{
          background: "#0a0f1a",
          border: "2px solid rgba(0,200,255,0.4)",
          boxShadow: "0 0 40px rgba(0,150,255,0.2)",
        }}
      >
        <h2 className="text-2xl font-bold text-primary mb-2">Montando a Vacina</h2>
        <p className="text-sm text-gray-400 mb-2">
          Clique nos 3 fragmentos virais do <strong className="text-white">{targetType.toUpperCase()}</strong> para
          montar a vacina. São partes inofensivas do vírus!
        </p>
        <p className="text-xs text-cyan-500 mb-6">
          Na vida real, as vacinas funcionam exatamente assim — partes inativas do agente causador de doença.
        </p>
        <div className="flex gap-4 justify-center mb-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              onClick={() => !pieces[i] && clickPiece(i)}
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  pieces[i]
                    ? "bg-primary border-primary scale-110 shadow-lg"
                    : "bg-muted border-muted-foreground/30 hover:border-primary/50 hover:scale-105"
                }`}
                style={pieces[i] ? { boxShadow: "0 0 20px rgba(0,200,255,0.5)" } : {}}
              >
                {pieces[i] ? (
                  <span className="text-white text-xl font-bold">✓</span>
                ) : (
                  <span className="text-2xl">🧬</span>
                )}
              </div>
              <span className="text-xs text-gray-500">{labels[i]}</span>
            </div>
          ))}
        </div>
        {pieces.every(x => x) && (
          <div className="text-green-400 font-bold animate-pulse text-lg">
            Vacina Concluída! Memória Imunológica Ativada!
          </div>
        )}
      </div>
    </div>
  );
}

function PrepCountdown({ timeLeft, waveNumber, total, needsVaccine, onOpenVaccine }: {
  timeLeft: number;
  waveNumber: number;
  total: number;
  needsVaccine: boolean;
  onOpenVaccine: () => void;
}) {
  const seconds = Math.ceil(timeLeft / 1000);
  const isFirst = waveNumber === 1;
  const progress = isFirst ? timeLeft / 20000 : timeLeft / 8000;

  if (needsVaccine) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-yellow-400 font-bold text-sm animate-pulse">
          Desenvolva a vacina antes da primeira onda!
        </p>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/80 bio-glow"
          onClick={onOpenVaccine}
          data-testid="button-open-vaccine"
        >
          💉 Montar Vacina
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
      <p className="text-primary font-bold">
        {isFirst ? "Posicione suas defesas!" : `Próxima onda em...`}
      </p>
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
          <div
            className="h-full transition-none rounded"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
            }}
          />
        </div>
        <span className="text-2xl font-bold font-mono text-cyan-400 w-8 text-right">{seconds}</span>
      </div>
      <p className="text-xs text-gray-500">
        Onda {waveNumber} de {total}
      </p>
    </div>
  );
}

function GamePhase({ params }: { params: { id: string } }) {
  const phase = PHASES[params.id];
  const [, setLocation] = useLocation();
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [showMinigame, setShowMinigame] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [vaccineAssembled, setVaccineAssembled] = useState(false);

  const needsVaccineFirst = !!(
    phase?.vaccineTarget &&
    phase.id === "2" &&
    !vaccineAssembled
  );

  const game = useGameLoop(
    phase,
    !showTutorial,
    vaccineAssembled
  );

  useEffect(() => {
    if (phase?.id === "3" && !game.vaccinesActive.includes("influenza")) {
      game.setVaccinesActive(v => [...v, "influenza"]);
      setVaccineAssembled(true);
    }
  }, [phase?.id]);

  if (!phase) return <div className="text-white p-8">Fase não encontrada</div>;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTower) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gx = Math.floor(x / GAME_MAP.tileSize);
    const gy = Math.floor(y / GAME_MAP.tileSize);
    if (GAME_MAP.path.some(p => p.x === gx && p.y === gy)) return;
    if (phase.hasVIPs && game.citizens.some(c => c.x === gx && c.y === gy)) return;
    game.placeTower(selectedTower, gx, gy);
    setSelectedTower(null);
  };

  const handleVaccineComplete = () => {
    game.setVaccinesActive(prev => [...prev, phase.vaccineTarget!]);
    setVaccineAssembled(true);
    setShowMinigame(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden text-foreground">
      {/* Top HUD */}
      <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/')} data-testid="button-exit">← Sair</Button>
          <h2 className="text-xl font-bold text-primary">{phase.title}</h2>
        </div>
        <div className="flex items-center gap-8 font-mono text-lg">
          <div className="flex items-center gap-2">
            <div className="w-24 h-3 bg-red-950 rounded overflow-hidden border border-red-900/50">
              <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${game.hp}%` }} />
            </div>
            <span className="text-green-400 text-sm">{game.hp}%</span>
          </div>
          <div className="text-yellow-400">⚪ {game.leucocitos}</div>
          <div className="text-gray-400 text-sm">
            Onda {Math.max(0, game.waveIndex + 1)}/{phase.waves.length}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-border bg-card/30 p-4 overflow-y-auto flex flex-col gap-3">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Defesas Disponíveis</h3>
          {phase.allowedTowers.map(t => {
            const def = TOWER_DEFS[t];
            const canAfford = game.leucocitos >= def.cost;
            return (
              <div
                key={t}
                onClick={() => canAfford && setSelectedTower(t)}
                data-testid={`tower-${t}`}
                className={`p-3 rounded-lg border-2 transition-all
                  ${selectedTower === t ? 'border-primary bg-primary/20' : 'border-border bg-card'}
                  ${!canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border" style={{ borderColor: def.color, backgroundColor: `${def.color}30` }} />
                    <span className="font-bold text-sm" style={{ color: def.color }}>{def.name}</span>
                  </div>
                  <span className="text-yellow-400 text-xs">{def.cost}⚪</span>
                </div>
                <p className="text-xs text-muted-foreground">{def.description}</p>
              </div>
            );
          })}

          {(phase.id === "2" || phase.id === "4") && !game.vaccinesActive.includes(phase.vaccineTarget!) && (
            <Button
              className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/80 bio-glow"
              onClick={() => setShowMinigame(true)}
              data-testid="button-vaccine"
            >
              💉 Desenvolver Vacina
            </Button>
          )}

          {game.vaccinesActive.length > 0 && (
            <div className="mt-2 border-t border-border pt-3">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2">Vacinas Ativas</h3>
              {game.vaccinesActive.map(v => (
                <div key={v} className="text-green-400 text-xs flex items-center gap-2 py-1">
                  <span className="text-green-500">✓</span>
                  <span>{PHASES[phase.id]?.vaccineTarget === v
                    ? `${v.toUpperCase()} — 3× velocidade de memória`
                    : v.toUpperCase()
                  }</span>
                </div>
              ))}
            </div>
          )}

          {selectedTower && (
            <div className="mt-auto p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-xs text-cyan-400">
              Clique em um quadrado livre no mapa para construir o <strong>{TOWER_DEFS[selectedTower].name}</strong>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex-1 relative flex items-center justify-center bg-black/40">
          <div
            className="relative"
            style={{ width: GAME_MAP.width * GAME_MAP.tileSize, height: GAME_MAP.height * GAME_MAP.tileSize }}
            onClick={handleMapClick}
          >
            {/* Grid tiles */}
            {Array.from({ length: GAME_MAP.width }).map((_, x) =>
              Array.from({ length: GAME_MAP.height }).map((_, y) => {
                const isPath = GAME_MAP.path.some(p => p.x === x && p.y === y);
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`absolute border border-white/5 ${isPath ? 'bg-red-900/20' : 'bg-transparent hover:bg-white/5'}`}
                    style={{ width: GAME_MAP.tileSize, height: GAME_MAP.tileSize, left: x * GAME_MAP.tileSize, top: y * GAME_MAP.tileSize }}
                  />
                );
              })
            )}

            {/* Path highlight */}
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
              <polyline
                points={GAME_MAP.path.map(p => `${p.x * GAME_MAP.tileSize + 30},${p.y * GAME_MAP.tileSize + 30}`).join(' ')}
                fill="none" stroke="rgba(255,50,50,0.3)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>

            {/* Nucleus */}
            <div
              className="absolute w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center bio-glow"
              style={{
                left: GAME_MAP.path[GAME_MAP.path.length - 1].x * GAME_MAP.tileSize - 10,
                top: GAME_MAP.path[GAME_MAP.path.length - 1].y * GAME_MAP.tileSize - 10
              }}
            >
              <div className="w-10 h-10 bg-primary rounded-full animate-pulse" />
            </div>

            {/* Citizens (Phase 4) */}
            {phase.hasVIPs && game.citizens.map(c => (
              <div
                key={c.id}
                className={`absolute flex flex-col items-center justify-center cursor-pointer transition-all ${c.vaccinated ? 'text-green-400' : 'text-foreground'}`}
                style={{ width: GAME_MAP.tileSize, height: GAME_MAP.tileSize, left: c.x * GAME_MAP.tileSize, top: c.y * GAME_MAP.tileSize }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!c.vaccinated && game.leucocitos >= 30) {
                    game.setLeucocitos(l => l - 30);
                    game.setCitizens(cs => cs.map(cc => cc.id === c.id ? { ...cc, vaccinated: true } : cc));
                  }
                }}
              >
                <div className={`text-2xl ${c.vaccinated ? 'bio-glow rounded-full' : ''}`}>👤</div>
                {!c.vaccinated && <div className="text-[10px] bg-black/80 px-1 rounded">-30⚪</div>}
                {c.vaccinated && <div className="absolute w-32 h-32 border-2 border-green-500/30 rounded-full animate-spin-slow pointer-events-none" />}
              </div>
            ))}

            {/* Towers */}
            {game.towers.map(t => (
              <div
                key={t.id}
                className="absolute flex items-center justify-center"
                style={{ left: t.x - GAME_MAP.tileSize / 2, top: t.y - GAME_MAP.tileSize / 2, width: GAME_MAP.tileSize, height: GAME_MAP.tileSize }}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 bg-black flex items-center justify-center ${t.attackAnim && t.attackAnim > 0 ? 'attack-anim tower-glow' : ''}`}
                  style={{ borderColor: t.def.color }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.def.color }} />
                </div>
              </div>
            ))}

            {/* Enemies */}
            {game.enemies.map(e => (
              <div
                key={e.id}
                className="absolute flex flex-col items-center justify-center pointer-events-none"
                style={{ left: e.x - 15, top: e.y - 15, width: 30, height: 30 }}
              >
                <div className={`w-6 h-6 rounded-full bg-black border-[3px] ${e.def.glowClass}`} style={{ borderColor: e.def.color }} />
                <div className="absolute -top-3 w-8 h-1 bg-red-900 rounded overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
                </div>
              </div>
            ))}

            {/* Projectiles */}
            {game.projectiles.map(p => (
              <div key={p.id} className="absolute w-2 h-2 rounded-full bg-white projectile-glow" style={{ left: p.x - 1, top: p.y - 1 }} />
            ))}

            {/* Particles */}
            {game.particles.map(p => (
              <div key={p.id} className="absolute w-1 h-1 rounded-full" style={{ left: p.x, top: p.y, backgroundColor: p.color, opacity: p.life / 500 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar — auto-wave status */}
      <div className="h-20 border-t border-border bg-card/50 flex items-center justify-center px-6">
        {game.waveRunning && (
          <div className="flex items-center gap-3 text-primary animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-lg font-bold">
              Onda {game.waveIndex + 1} em andamento — {game.enemies.length} invasores restantes
            </span>
          </div>
        )}
        {!game.waveRunning && game.isPrepPhase && !game.victory && !game.gameOver && (
          <PrepCountdown
            timeLeft={game.prepTimeLeft}
            waveNumber={game.waveIndex + 2}
            total={phase.waves.length}
            needsVaccine={needsVaccineFirst}
            onOpenVaccine={() => setShowMinigame(true)}
          />
        )}
      </div>

      {/* Tutorial */}
      {showTutorial && (
        <TutorialGuide phase={phase} onComplete={() => setShowTutorial(false)} />
      )}

      {/* Vaccine Minigame */}
      {showMinigame && (
        <VaccineMinigame targetType={phase.vaccineTarget!} onComplete={handleVaccineComplete} />
      )}

      {/* Game Over */}
      {game.gameOver && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold text-destructive mb-4">Núcleo Comprometido!</h1>
          <p className="text-xl mb-8 text-gray-400">A infecção venceu desta vez. Tente uma estratégia diferente!</p>
          <div className="flex gap-4">
            <Button size="lg" onClick={() => window.location.reload()} data-testid="button-retry">Tentar Novamente</Button>
            <Button size="lg" variant="outline" onClick={() => setLocation('/')} data-testid="button-menu">Menu Principal</Button>
          </div>
        </div>
      )}

      {/* Victory */}
      {game.victory && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold text-green-400 mb-4 bio-glow">Vitória!</h1>
          <p className="text-xl mb-2 text-gray-300">O organismo está seguro!</p>
          <p className="text-sm text-gray-500 mb-8">{phase.concept}</p>
          <div className="flex gap-4">
            <Button onClick={() => setLocation('/')} data-testid="button-menu-victory">Menu Principal</Button>
            {parseInt(phase.id) < Object.keys(PHASES).length && (
              <Button
                className="bg-primary"
                onClick={() => setLocation(`/fase/${parseInt(phase.id) + 1}`)}
                data-testid="button-next-phase"
              >
                Próxima Fase →
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainMenu} />
      <Route path="/fase/bonus" component={FaseBonusWhack} />
      <Route path="/fase/:id">
        {(params) => params ? <GamePhase key={params.id} params={params} /> : null}
      </Route>
      <Route>404 Não Encontrado</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
