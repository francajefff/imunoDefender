import React, { useEffect, useRef, useState } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PHASES, GAME_MAP, TOWER_DEFS, ENEMY_DEFS, TowerType } from "./lib/constants";
import { useGameLoop } from "./hooks/useGameLoop";
import { motion, AnimatePresence } from "framer-motion";
import FaseBonusWhack from "./pages/FaseBonusWhack";
import RankingPage from "./pages/Ranking";
import { TutorialGuide } from "./components/TutorialGuide";
import { VictoryScreen } from "./components/VictoryScreen";
import { getRanking } from "./lib/ranking";

const queryClient = new QueryClient();

// ─── Main Menu ───────────────────────────────────────────────────────────────
function MainMenu() {
  const [, setLocation] = useLocation();
  const ranking = getRanking().slice(0, 3);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-background/90" />
      <div className="z-10 text-center w-full max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-bold text-primary mb-2 bio-glow inline-block p-3 sm:p-4 rounded-full">
          ImunoDefensores
        </h1>
        <p className="text-base sm:text-xl text-foreground/80 mb-6 px-2">
          Defenda o corpo humano contra invasores. Aprenda como as vacinas salvam vidas!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {Object.values(PHASES).map(p => (
            <Card
              key={p.id}
              className="p-4 bg-card/80 border-primary/20 hover:border-primary transition-colors cursor-pointer text-left"
              onClick={() => setLocation(`/fase/${p.id}`)}
              data-testid={`card-fase-${p.id}`}
            >
              <h3 className="text-base font-bold text-primary">Fase {p.id}: {p.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.concept}</p>
            </Card>
          ))}
        </div>

        <Card
          className="p-4 mb-5 cursor-pointer transition-all border-2 hover:scale-[1.02]"
          style={{ background: "rgba(80,0,0,0.4)", borderColor: "rgba(239,68,68,0.5)", boxShadow: "0 0 24px rgba(239,68,68,0.2)" }}
          onClick={() => setLocation("/fase/bonus")}
          data-testid="card-fase-bonus"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚡</div>
            <div className="text-left">
              <h3 className="text-base font-bold" style={{ color: "#f87171" }}>Fase Bônus: Ataque Relâmpago</h3>
              <p className="text-xs text-muted-foreground">Reflexos em ação! Destrua vírus antes que escapem.</p>
            </div>
          </div>
        </Card>

        <Button variant="outline" onClick={() => setLocation("/ranking")} className="text-sm">
          🏆 Ver Ranking
        </Button>

        {ranking.length > 0 && (
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            {ranking.map((r, i) => (
              <div key={i} className="flex justify-center gap-3">
                <span>{["🥇","🥈","🥉"][i]}</span>
                <span className="text-gray-300">{r.name}</span>
                <span className="text-cyan-500 font-mono">{r.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vaccine Minigame ─────────────────────────────────────────────────────────
function VaccineMinigame({ targetType, onComplete }: { targetType: string; onComplete: () => void }) {
  const [pieces, setPieces] = useState([false, false, false]);
  const labels = ["Proteína Spike", "Fragmento RNA", "Capsídeo"];

  const clickPiece = (i: number) => {
    const next = [...pieces];
    next[i] = true;
    setPieces(next);
    if (next.every(x => x)) setTimeout(onComplete, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="p-6 sm:p-8 rounded-2xl text-center max-w-md w-full"
        style={{ background: "#0a0f1a", border: "2px solid rgba(0,200,255,0.4)", boxShadow: "0 0 40px rgba(0,150,255,0.2)" }}>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Montando a Vacina</h2>
        <p className="text-sm text-gray-400 mb-2">
          Clique nos 3 fragmentos do <strong className="text-white">{targetType.toUpperCase()}</strong> para montar a vacina.
        </p>
        <p className="text-xs text-cyan-500 mb-6">Na vida real, vacinas funcionam exatamente assim — partes inativas do patógeno.</p>
        <div className="flex gap-4 justify-center mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} onClick={() => !pieces[i] && clickPiece(i)} className="flex flex-col items-center gap-2 cursor-pointer">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                pieces[i] ? "bg-primary border-primary scale-110 shadow-lg" : "bg-muted border-muted-foreground/30 hover:border-primary/50 hover:scale-105"
              }`} style={pieces[i] ? { boxShadow: "0 0 20px rgba(0,200,255,0.5)" } : {}}>
                {pieces[i] ? <span className="text-white text-xl font-bold">✓</span> : <span className="text-2xl">🧬</span>}
              </div>
              <span className="text-xs text-gray-500">{labels[i]}</span>
            </div>
          ))}
        </div>
        {pieces.every(x => x) && (
          <div className="text-green-400 font-bold animate-pulse">Vacina Concluída! Memória Imunológica Ativada!</div>
        )}
      </div>
    </div>
  );
}

// ─── Prep Countdown ───────────────────────────────────────────────────────────
function PrepCountdown({ timeLeft, waveNumber, total, needsVaccine, onOpenVaccine }: {
  timeLeft: number; waveNumber: number; total: number; needsVaccine: boolean; onOpenVaccine: () => void;
}) {
  const seconds = Math.ceil(timeLeft / 1000);
  const isFirst = waveNumber === 1;
  const progress = isFirst ? timeLeft / 20000 : timeLeft / 8000;

  if (needsVaccine) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-yellow-400 font-bold text-sm animate-pulse text-center">Desenvolva a vacina antes da primeira onda!</p>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/80 bio-glow" onClick={onOpenVaccine} data-testid="button-open-vaccine">
          💉 Montar Vacina
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs px-4">
      <p className="text-primary font-bold text-sm">{isFirst ? "Posicione suas defesas!" : `Próxima onda em...`}</p>
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
          <div className="h-full transition-none rounded" style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg, #06b6d4, #3b82f6)" }} />
        </div>
        <span className="text-xl font-bold font-mono text-cyan-400 w-8 text-right">{seconds}</span>
      </div>
      <p className="text-xs text-gray-500">Onda {waveNumber} de {total}</p>
    </div>
  );
}

// ─── Game Phase ───────────────────────────────────────────────────────────────
function GamePhase({ params }: { params: { id: string } }) {
  const phase = PHASES[params.id];
  const [, setLocation] = useLocation();
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [showMinigame, setShowMinigame] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [scale, setScale] = useState(1);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Phase 3 auto-activates influenza vaccine — no mandatory assembly needed before wave 1
  const [vaccineAssembled, setVaccineAssembled] = useState(phase?.id === "3");

  const needsVaccineFirst = !!(phase?.vaccineTarget && phase.id === "2" && !vaccineAssembled);

  const game = useGameLoop(phase, !showTutorial, vaccineAssembled);

  // Phase 3: influenza vaccine is pre-active (carried over from phase 2's lesson)
  useEffect(() => {
    if (phase?.id === "3" && !game.vaccinesActive.includes("influenza")) {
      game.setVaccinesActive(v => [...v, "influenza"]);
    }
  }, [phase?.id]);

  // Responsive scale — watch game area container size
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;
    const mapW = GAME_MAP.width * GAME_MAP.tileSize;
    const mapH = GAME_MAP.height * GAME_MAP.tileSize;
    const update = (w: number, h: number) => {
      setScale(Math.min(w / mapW, h / mapH, 1));
    };
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      update(width, height);
    });
    obs.observe(el);
    update(el.clientWidth, el.clientHeight);
    return () => obs.disconnect();
  }, []);

  if (!phase) return <div className="text-white p-8">Fase não encontrada</div>;

  const mapW = GAME_MAP.width * GAME_MAP.tileSize;
  const mapH = GAME_MAP.height * GAME_MAP.tileSize;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTower) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Divide by scale because getBoundingClientRect returns visual (scaled) coords
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
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

  const isLastPhase = parseInt(phase.id) >= Object.keys(PHASES).length;

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Defesas</h3>
        <button className="sm:hidden text-gray-400 hover:text-white text-lg leading-none" onClick={() => setShowSidebar(false)}>✕</button>
      </div>

      {phase.allowedTowers.map(t => {
        const def = TOWER_DEFS[t];
        const canAfford = game.leucocitos >= def.cost;
        return (
          <div
            key={t}
            onClick={() => { if (canAfford) { setSelectedTower(t); setShowSidebar(false); } }}
            data-testid={`tower-${t}`}
            className={`p-3 rounded-lg border-2 transition-all
              ${selectedTower === t ? 'border-primary bg-primary/20' : 'border-border bg-card'}
              ${!canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border" style={{ borderColor: def.color, backgroundColor: `${def.color}30` }} />
                <span className="font-bold text-xs" style={{ color: def.color }}>{def.name}</span>
              </div>
              <span className="text-yellow-400 text-xs">{def.cost}⚪</span>
            </div>
            <p className="text-xs text-muted-foreground">{def.description}</p>
          </div>
        );
      })}

      {phase.vaccineTarget && !game.vaccinesActive.includes(phase.vaccineTarget) && (
        <div className="mt-2 flex flex-col gap-2">
          {phase.vaccineHint && (
            <div className="text-xs p-2 rounded-lg border border-yellow-900/40 bg-yellow-950/20 text-yellow-300">
              💡 {phase.vaccineHint}
            </div>
          )}
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/80 bio-glow text-xs"
            onClick={() => { setShowMinigame(true); setShowSidebar(false); }}
            data-testid="button-vaccine"
          >
            💉 Desenvolver Vacina
          </Button>
        </div>
      )}

      {game.vaccinesActive.length > 0 && (
        <div className="mt-2 border-t border-border pt-3">
          <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2">Vacinas Ativas</h3>
          {game.vaccinesActive.map(v => (
            <div key={v} className="text-green-400 text-xs flex items-center gap-2 py-1">
              <span className="text-green-500">✓</span>
              <span className="truncate">{ENEMY_DEFS[v as keyof typeof ENEMY_DEFS]?.name ?? v} — 3× memória</span>
            </div>
          ))}
        </div>
      )}

      {selectedTower && (
        <div className="mt-auto p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-xs text-cyan-400">
          Clique em um quadrado livre no mapa para construir o <strong>{TOWER_DEFS[selectedTower].name}</strong>
        </div>
      )}
    </>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden text-foreground">
      {/* ── Top HUD ── */}
      <div className="h-12 sm:h-14 border-b border-border bg-card/50 flex items-center justify-between px-3 sm:px-6 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')} data-testid="button-exit" className="shrink-0 text-xs sm:text-sm px-2">← Sair</Button>
          <h2 className="hidden sm:block text-base font-bold text-primary truncate">{phase.title}</h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-6 font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-16 sm:w-24 h-2.5 bg-red-950 rounded overflow-hidden border border-red-900/50">
              <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${game.hp}%` }} />
            </div>
            <span className="text-green-400 text-xs">{game.hp}%</span>
          </div>
          <div className="text-yellow-400 text-sm">⚪ {game.leucocitos}</div>
          <div className="text-gray-400 text-xs hidden sm:block">
            Onda {Math.max(0, game.waveIndex + 1)}/{phase.waves.length}
          </div>
          {/* Mobile sidebar toggle */}
          <button
            className="sm:hidden p-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-white active:scale-95 transition-all"
            onClick={() => setShowSidebar(s => !s)}
            aria-label="Abrir defesas"
          >
            ☰
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Sidebar — desktop fixed, mobile overlay ── */}
        {/* Mobile backdrop */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 sm:hidden bg-black/60"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar panel */}
        <div className={`
          sm:relative sm:translate-x-0 sm:w-56 lg:w-64
          fixed left-0 top-0 bottom-0 z-40 w-64
          border-r border-border bg-card/95 p-3 overflow-y-auto flex flex-col gap-2
          transition-transform duration-200 ease-in-out
          ${showSidebar ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
        `}>
          <SidebarContent />
        </div>

        {/* ── Game Area ── */}
        <div
          ref={gameAreaRef}
          className="flex-1 relative bg-black/40 overflow-hidden flex items-center justify-center min-w-0"
        >
          <div
            className="relative"
            style={{
              width: mapW,
              height: mapH,
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              flexShrink: 0,
            }}
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

      {/* ── Bottom Bar ── */}
      <div className="h-16 sm:h-20 border-t border-border bg-card/50 flex items-center justify-center px-4 shrink-0">
        {game.waveRunning && (
          <div className="flex items-center gap-2 sm:gap-3 text-primary animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-sm sm:text-lg font-bold text-center">
              Onda {game.waveIndex + 1} — {game.enemies.length} invasores
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

      {/* ── Tutorial ── */}
      {showTutorial && (
        <TutorialGuide phase={phase} onComplete={() => setShowTutorial(false)} skippable={phase.id !== "1"} />
      )}

      {/* ── Vaccine Minigame ── */}
      {showMinigame && (
        <VaccineMinigame targetType={phase.vaccineTarget!} onComplete={handleVaccineComplete} />
      )}

      {/* ── Game Over ── */}
      {game.gameOver && (
        <VictoryScreen
          hp={game.hp}
          leucocitos={game.leucocitos}
          phaseId={phase.id}
          phaseTitle={phase.title}
          isGameOver
          onMenu={() => setLocation("/")}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* ── Victory ── */}
      {game.victory && (
        <VictoryScreen
          hp={game.hp}
          leucocitos={game.leucocitos}
          phaseId={phase.id}
          phaseTitle={phase.title}
          onMenu={() => setLocation("/")}
          onNextPhase={!isLastPhase ? () => setLocation(`/fase/${parseInt(phase.id) + 1}`) : undefined}
        />
      )}
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/" component={MainMenu} />
      <Route path="/ranking" component={RankingPage} />
      <Route path="/fase/bonus" component={FaseBonusWhack} />
      <Route path="/fase/:id">
        {(params) => params ? <GamePhase key={params.id} params={params} /> : null}
      </Route>
      <Route>404 Não Encontrado</Route>
    </Switch>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
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
