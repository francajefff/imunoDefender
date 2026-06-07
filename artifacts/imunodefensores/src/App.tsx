import React, { useEffect, useState } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PHASES, GAME_MAP, TOWER_DEFS, TowerType } from "./lib/constants";
import { useGameLoop } from "./hooks/useGameLoop";
import { motion, AnimatePresence } from "framer-motion";

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.values(PHASES).map(p => (
            <Card key={p.id} className="p-4 bg-card/80 border-primary/20 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => setLocation(`/fase/${p.id}`)}>
              <h3 className="text-lg font-bold text-primary">Fase {p.id}: {p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.concept}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function VaccineMinigame({ targetType, onComplete }: { targetType: string, onComplete: () => void }) {
  const [pieces, setPieces] = useState([false, false, false]);
  
  const clickPiece = (i: number) => {
    const next = [...pieces];
    next[i] = true;
    setPieces(next);
    if (next.every(x => x)) {
      setTimeout(onComplete, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-card p-8 rounded-xl border border-primary text-center max-w-md">
        <h2 className="text-2xl font-bold text-primary mb-4">Desenvolvendo Vacina</h2>
        <p className="mb-6">Clique nos 3 fragmentos virais para montar a vacina!</p>
        <div className="flex gap-4 justify-center mb-8">
          {[0,1,2].map(i => (
            <div key={i} onClick={() => clickPiece(i)}
                 className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all ${pieces[i] ? 'bg-primary scale-110' : 'bg-muted hover:bg-muted/80'}`}>
              {!pieces[i] && <span className="text-2xl">🧬</span>}
              {pieces[i] && <span className="text-white text-xl">✓</span>}
            </div>
          ))}
        </div>
        {pieces.every(x => x) && <div className="text-green-400 font-bold animate-pulse">Vacina Concluída!</div>}
      </div>
    </div>
  );
}

function GamePhase({ params }: { params: { id: string } }) {
  const phase = PHASES[params.id];
  const [, setLocation] = useLocation();
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [showMinigame, setShowMinigame] = useState(false);
  const [showNarration, setShowNarration] = useState(true);
  
  const game = useGameLoop(phase);

  // If we just loaded phase 3, auto-activate influenza vaccine
  useEffect(() => {
    if (phase.id === "3" && !game.vaccinesActive.includes("influenza")) {
      game.setVaccinesActive(v => [...v, "influenza"]);
    }
  }, [phase.id]);

  if (!phase) return <div>Phase not found</div>;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTower) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gx = Math.floor(x / GAME_MAP.tileSize);
    const gy = Math.floor(y / GAME_MAP.tileSize);
    
    // check path collision
    if (GAME_MAP.path.some(p => p.x === gx && p.y === gy)) return;
    // check VIP collision
    if (phase.hasVIPs && game.citizens.some(c => c.x === gx && c.y === gy)) return;
    
    game.placeTower(selectedTower, gx, gy);
    setSelectedTower(null);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden text-foreground">
      {/* Top HUD */}
      <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/')}>← Sair</Button>
          <h2 className="text-xl font-bold text-primary">{phase.title}</h2>
        </div>
        <div className="flex items-center gap-8 font-mono text-lg">
          <div className="text-green-400">♥ HP: {game.hp}</div>
          <div className="text-yellow-400">⚪ Leucócitos: {game.leucocitos}</div>
          <div>Onda: {game.waveIndex + 1}/{phase.waves.length}</div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Towers */}
        <div className="w-64 border-r border-border bg-card/30 p-4 overflow-y-auto">
          <h3 className="font-bold mb-4 text-muted-foreground">Defesas</h3>
          <div className="flex flex-col gap-4">
            {phase.allowedTowers.map(t => {
              const def = TOWER_DEFS[t];
              return (
                <div key={t} 
                     onClick={() => game.leucocitos >= def.cost && setSelectedTower(t)}
                     className={`p-3 rounded-lg border-2 cursor-pointer transition-all
                       ${selectedTower === t ? 'border-primary bg-primary/20' : 'border-border bg-card'}
                       ${game.leucocitos < def.cost ? 'opacity-50 grayscale' : 'hover:border-primary/50'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold" style={{color: def.color}}>{def.name}</span>
                    <span className="text-yellow-400 text-sm">{def.cost} ⚪</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{def.description}</p>
                </div>
              );
            })}
          </div>

          {(phase.id === "2" || phase.id === "4") && !game.vaccinesActive.includes(phase.vaccineTarget!) && (
            <Button className="w-full mt-8 bg-primary text-primary-foreground hover:bg-primary/80" 
                    onClick={() => setShowMinigame(true)}>
              💉 Desenvolver Vacina
            </Button>
          )}

          {game.vaccinesActive.length > 0 && (
            <div className="mt-8 border-t border-border pt-4">
              <h3 className="font-bold text-sm text-muted-foreground mb-2">Vacinas Ativas</h3>
              {game.vaccinesActive.map(v => (
                <div key={v} className="text-green-400 text-sm flex items-center gap-2">
                  <span>✓</span> {v.toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative flex items-center justify-center bg-black/40">
          
          <div className="relative" 
               style={{width: GAME_MAP.width * GAME_MAP.tileSize, height: GAME_MAP.height * GAME_MAP.tileSize}}
               onClick={handleMapClick}>
            
            {/* Grid & Path rendering */}
            {Array.from({length: GAME_MAP.width}).map((_, x) => 
              Array.from({length: GAME_MAP.height}).map((_, y) => {
                const isPath = GAME_MAP.path.some(p => p.x === x && p.y === y);
                return (
                  <div key={`${x}-${y}`} 
                       className={`absolute border border-white/5 ${isPath ? 'bg-red-900/20' : 'bg-transparent'}`}
                       style={{
                         width: GAME_MAP.tileSize, height: GAME_MAP.tileSize,
                         left: x * GAME_MAP.tileSize, top: y * GAME_MAP.tileSize
                       }} 
                  />
                );
              })
            )}

            {/* Path line highlight */}
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
              <polyline 
                points={GAME_MAP.path.map(p => `${p.x * GAME_MAP.tileSize + 30},${p.y * GAME_MAP.tileSize + 30}`).join(' ')} 
                fill="none" stroke="rgba(255,50,50,0.3)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" 
              />
            </svg>

            {/* Nucleus Base */}
            <div className="absolute w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center bio-glow"
                 style={{
                   left: GAME_MAP.path[GAME_MAP.path.length-1].x * GAME_MAP.tileSize - 10,
                   top: GAME_MAP.path[GAME_MAP.path.length-1].y * GAME_MAP.tileSize - 10
                 }}>
              <div className="w-10 h-10 bg-primary rounded-full animate-pulse" />
            </div>

            {/* Citizens/VIPs (Phase 4) */}
            {phase.hasVIPs && game.citizens.map(c => (
              <div key={c.id} 
                   className={`absolute flex flex-col items-center justify-center cursor-pointer transition-all
                     ${c.vaccinated ? 'text-green-400' : 'text-foreground'}`}
                   style={{
                     width: GAME_MAP.tileSize, height: GAME_MAP.tileSize,
                     left: c.x * GAME_MAP.tileSize, top: c.y * GAME_MAP.tileSize
                   }}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (!c.vaccinated && game.leucocitos >= 30) {
                       game.setLeucocitos(l => l - 30);
                       game.setCitizens(cs => cs.map(cc => cc.id === c.id ? {...cc, vaccinated: true} : cc));
                     }
                   }}>
                <div className={`text-2xl ${c.vaccinated ? 'bio-glow rounded-full' : ''}`}>👤</div>
                {!c.vaccinated && <div className="text-[10px] bg-black/80 px-1 rounded">-30⚪</div>}
                {c.vaccinated && <div className="absolute w-32 h-32 border-2 border-green-500/30 rounded-full animate-spin-slow pointer-events-none" />}
              </div>
            ))}

            {/* Render Towers */}
            {game.towers.map(t => (
              <div key={t.id} className="absolute flex items-center justify-center"
                   style={{
                     left: t.x - GAME_MAP.tileSize/2, top: t.y - GAME_MAP.tileSize/2,
                     width: GAME_MAP.tileSize, height: GAME_MAP.tileSize
                   }}>
                <div className={`w-8 h-8 rounded-full border-2 bg-black flex items-center justify-center ${t.attackAnim && t.attackAnim > 0 ? 'attack-anim tower-glow' : ''}`}
                     style={{ borderColor: t.def.color }}>
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: t.def.color}} />
                </div>
                {/* Range indicator on hover could go here */}
              </div>
            ))}

            {/* Render Enemies */}
            {game.enemies.map(e => (
              <div key={e.id} className="absolute flex flex-col items-center justify-center pointer-events-none"
                   style={{
                     left: e.x - 15, top: e.y - 15, width: 30, height: 30
                   }}>
                <div className={`w-6 h-6 rounded-full bg-black border-[3px] ${e.def.glowClass}`}
                     style={{ borderColor: e.def.color }} />
                {/* HP bar */}
                <div className="absolute -top-3 w-8 h-1 bg-red-900 rounded overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-75" style={{width: `${(e.hp / e.maxHp)*100}%`}} />
                </div>
              </div>
            ))}

            {/* Render Projectiles */}
            {game.projectiles.map(p => (
              <div key={p.id} className="absolute w-2 h-2 rounded-full bg-white projectile-glow"
                   style={{ left: p.x-1, top: p.y-1 }} />
            ))}

            {/* Render Particles */}
            {game.particles.map(p => (
              <div key={p.id} className="absolute w-1 h-1 rounded-full"
                   style={{ left: p.x, top: p.y, backgroundColor: p.color, opacity: p.life/500 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 border-t border-border bg-card/50 flex items-center justify-center px-6 gap-8">
        {!game.waveRunning && game.waveIndex < phase.waves.length - 1 && (
          <Button size="lg" className="bg-primary text-primary-foreground text-lg px-8 hover:bg-primary/80 bio-glow"
                  onClick={() => {
                    if (phase.id === "2" && game.waveIndex === -1 && !game.vaccinesActive.includes(phase.vaccineTarget!)) {
                      alert("Desenvolva a vacina primeiro!");
                      return;
                    }
                    game.spawnWave(game.waveIndex + 1);
                  }}>
            Iniciar Onda {game.waveIndex + 2}
          </Button>
        )}
        {game.waveRunning && <div className="text-xl text-primary animate-pulse">Onda em progresso...</div>}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showNarration && (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}}
                      className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/90 border border-primary p-6 rounded-xl max-w-2xl text-center shadow-2xl">
            <p className="text-lg text-foreground/90 mb-4">{phase.narration}</p>
            <Button onClick={() => setShowNarration(false)}>Entendido</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {showMinigame && (
        <VaccineMinigame targetType={phase.vaccineTarget!} onComplete={() => {
          game.setVaccinesActive(prev => [...prev, phase.vaccineTarget!]);
          setShowMinigame(false);
        }} />
      )}

      {game.gameOver && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold text-destructive mb-4">Núcleo Comprometido</h1>
          <p className="text-xl mb-8">A infecção venceu desta vez.</p>
          <Button size="lg" onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      )}

      {game.victory && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold text-green-400 mb-4 bio-glow">Vitória!</h1>
          <p className="text-xl mb-8">O organismo está seguro.</p>
          <div className="flex gap-4">
            <Button onClick={() => setLocation('/')}>Menu Principal</Button>
            {parseInt(phase.id) < Object.keys(PHASES).length && (
              <Button onClick={() => setLocation(`/fase/${parseInt(phase.id)+1}`)}>Próxima Fase</Button>
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
      <Route path="/fase/:id" component={GamePhase} />
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
