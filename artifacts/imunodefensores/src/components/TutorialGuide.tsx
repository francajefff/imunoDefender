import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhaseDef, TOWER_DEFS, ENEMY_DEFS } from "../lib/constants";

interface Props {
  phase: PhaseDef;
  onComplete: () => void;
  skippable?: boolean;
}

interface Step {
  title: string;
  content: React.ReactNode;
}

function TowerCard({ type, color, name, cost, description }: { type: string; color: string; name: string; cost: number; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-black/30">
      <div className="w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center bg-black"
           style={{ borderColor: color, boxShadow: `0 0 12px ${color}60` }}>
        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div>
        <div className="font-bold text-sm" style={{ color }}>{name}</div>
        <div className="text-xs text-yellow-400 mb-0.5">{cost} leucócitos</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
    </div>
  );
}

function EnemyCard({ color, name, description }: { color: string; name: string; description: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/30">
      <div className="w-8 h-8 rounded-full border-2 flex-shrink-0"
           style={{ borderColor: color, backgroundColor: `${color}30`, boxShadow: `0 0 10px ${color}60` }} />
      <div>
        <div className="font-bold text-sm text-white">{name}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
    </div>
  );
}

export function TutorialGuide({ phase, onComplete, skippable = false }: Props) {
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    {
      title: "Bem-vindo ao ImunoDefensores!",
      content: (
        <div className="space-y-4 text-center">
          <div className="text-5xl mb-4">🦠</div>
          <p className="text-gray-200 leading-relaxed">
            Você é o <strong className="text-cyan-400">sistema imunológico</strong> de um organismo humano.
            Vírus e bactérias estão invadindo o corpo — sua missão é proteger o{" "}
            <strong className="text-cyan-400">Núcleo Celular</strong>!
          </p>
          <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/30">
            <p className="text-sm text-cyan-300">
              <strong>Fase atual:</strong> {phase.id === "bonus" ? "Bônus" : phase.id} — {phase.title}
            </p>
            <p className="text-sm text-gray-400 mt-1">{phase.concept}</p>
          </div>
        </div>
      ),
    },
    {
      title: "O Campo de Batalha",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            O mapa representa o interior do organismo. Os inimigos entram pela <strong className="text-red-400">esquerda</strong> e
            caminham pelo <span className="text-red-400 font-bold">caminho vermelho</span> até o{" "}
            <span className="text-cyan-400 font-bold">Núcleo</span> (círculo azul pulsante).
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50">
              <div className="w-full h-2 bg-red-900/60 rounded mb-2" />
              <div className="text-red-400 font-bold text-xs">Caminho dos invasores</div>
              <div className="text-gray-500 text-xs mt-1">Não pode construir aqui</div>
            </div>
            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-900/50">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 mx-auto mb-2 animate-pulse" />
              <div className="text-cyan-400 font-bold text-xs">Núcleo Celular</div>
              <div className="text-gray-500 text-xs mt-1">Proteja a todo custo!</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 col-span-2">
              <div className="grid grid-cols-4 gap-1 mb-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-5 rounded-sm bg-white/10 border border-white/5" />
                ))}
              </div>
              <div className="text-white/60 font-bold text-xs">Quadrados livres</div>
              <div className="text-gray-500 text-xs mt-1">Clique para construir suas defesas aqui</div>
            </div>
          </div>
          <p className="text-xs text-yellow-400 bg-yellow-950/30 p-2 rounded-lg border border-yellow-900/30">
            ⚠️ Se um invasor chegar ao Núcleo, você perde pontos de saúde. Se a saúde chegar a zero, é Game Over!
          </p>
        </div>
      ),
    },
    {
      title: "Leucócitos — Sua Moeda",
      content: (
        <div className="space-y-4 text-center">
          <div className="text-4xl mb-2">⚪</div>
          <p className="text-gray-200 leading-relaxed">
            <strong className="text-yellow-400">Leucócitos</strong> são os glóbulos brancos do sangue —
            e também a moeda do jogo!
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-black/30 border border-white/10 text-center">
              <div className="text-yellow-400 text-lg font-bold mb-1">{phase.startCurrency}</div>
              <div className="text-gray-400 text-xs">Leucócitos iniciais</div>
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/10 text-center">
              <div className="text-green-400 text-lg font-bold mb-1">+8 a +25</div>
              <div className="text-gray-400 text-xs">Por invasor destruído</div>
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/10 text-center">
              <div className="text-blue-400 text-lg font-bold mb-1">Gaste</div>
              <div className="text-gray-400 text-xs">Para construir defesas</div>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Gerencie bem seus leucócitos! Construa as defesas mais importantes primeiro.
          </p>
        </div>
      ),
    },
    {
      title: "Suas Defesas",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-3">
            Estas são as defesas disponíveis nesta fase. <strong className="text-white">Selecione uma</strong> no
            painel esquerdo e <strong className="text-white">clique em um quadrado livre</strong> no mapa para construí-la.
          </p>
          <div className="space-y-2">
            {phase.allowedTowers.map(t => {
              const def = TOWER_DEFS[t];
              return <TowerCard key={t} type={t} color={def.color} name={def.name} cost={def.cost} description={def.description} />;
            })}
          </div>
          {phase.allowedTowers.includes("memoria") && (
            <p className="text-xs text-yellow-400 bg-yellow-950/30 p-2 rounded-lg border border-yellow-900/30">
              ⭐ A <strong>Célula de Memória</strong> é desbloqueada pela vacina e ataca 3× mais rápido inimigos vacinados!
            </p>
          )}
        </div>
      ),
    },
    {
      title: "📱 Onde Ficam as Defesas?",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center">
              <div className="text-3xl mb-2">🖥️</div>
              <p className="text-xs text-gray-300 font-bold">Computador</p>
              <p className="text-xs text-gray-500 mt-1">O painel de defesas fica visível na coluna <strong className="text-white">esquerda</strong> da tela — sempre acessível.</p>
            </div>
            <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-center">
              <div className="text-3xl mb-2">📱</div>
              <p className="text-xs text-cyan-300 font-bold">Celular / Tablet</p>
              <p className="text-xs text-gray-500 mt-1">O painel fica <strong className="text-white">oculto</strong> para não cobrir o mapa. Toque no ícone para abri-lo!</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-black/40 border border-cyan-500/40 rounded-xl p-4">
            <div className="w-12 h-12 rounded-lg border-2 border-white/20 bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
              ☰
            </div>
            <div>
              <p className="text-cyan-400 font-bold text-sm">Botão ☰ — canto superior direito</p>
              <p className="text-xs text-gray-400 mt-1">Toque nele para abrir o painel de defesas. Selecione uma defesa e toque em um quadrado livre no mapa.</p>
            </div>
          </div>
          <p className="text-xs text-yellow-300 bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-2">
            ⚠️ As defesas têm <strong>pontos de vida</strong>! Vírus próximos a elas causam dano. Use o botão <strong>"Reparar Torres"</strong> para restaurá-las.
          </p>
        </div>
      ),
    },
    {
      title: "Os Invasores",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-3">
            Conheça os inimigos que você enfrentará nesta fase:
          </p>
          <div className="space-y-2">
            {Array.from(new Set(phase.waves.flatMap(w => w.enemies.map(e => e.type)))).map(type => {
              const def = ENEMY_DEFS[type];
              const descs: Record<string, string> = {
                sarampo: `Velocista — rápido e numeroso. HP: ${def.hp} | Velocidade: Alta`,
                pneumococo: `Tanque — lento mas resistente. HP: ${def.hp} | Velocidade: Baixa`,
                influenza: `Agressor em grupo — velocidade média. HP: ${def.hp} | Velocidade: Média`,
                rotavirus: `Ultra-rápido — muito difícil de acertar. HP: ${def.hp} | Velocidade: Muito Alta`,
              };
              return (
                <EnemyCard key={type} color={def.color} name={def.name} description={descs[type] || ""} />
              );
            })}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Cada inimigo tem uma barra de saúde verde acima dele. Quando chega a zero, ele é derrotado e você ganha leucócitos.
          </div>
        </div>
      ),
    },
    ...(phase.vaccineTarget
      ? [
          {
            title: "A Vacina — O Superpoder",
            content: (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-3">💉</div>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">
                  Na vida real, a vacina contém <strong className="text-cyan-400">partes inofensivas</strong> do
                  vírus — o suficiente para treinar o sistema imunológico sem causar doença.
                  No jogo, funciona da mesma forma!
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-cyan-400 font-bold">1.</span>
                    <span className="text-gray-300">Clique em <strong>"Desenvolver Vacina"</strong> no painel esquerdo</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <span className="text-gray-300">Monte a vacina clicando nos <strong>3 fragmentos virais</strong></span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-cyan-400 font-bold">3.</span>
                    <span className="text-gray-300">Suas <strong className="text-yellow-400">Células de Memória</strong> passam a atacar aquele vírus <strong className="text-green-400">3× mais rápido!</strong></span>
                  </div>
                </div>
                <p className="text-xs text-green-400 bg-green-950/30 p-2 rounded-lg border border-green-900/30">
                  ✅ É assim que a memória imunológica funciona no corpo humano: após a vacinação, o organismo reconhece o invasor e responde muito mais rápido numa segunda exposição.
                </p>
              </div>
            ),
          },
        ]
      : []),
    {
      title: "Como as Ondas Funcionam",
      content: (
        <div className="space-y-4 text-center">
          <div className="text-4xl mb-2">⚔️</div>
          <p className="text-gray-200 leading-relaxed text-sm">
            As ondas de invasores chegam <strong className="text-cyan-400">automaticamente</strong>.
            Você tem um tempo de preparo entre cada onda para construir defesas.
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm mt-4">
            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/50 text-center">
              <div className="text-blue-400 text-2xl font-bold mb-1">12s</div>
              <div className="text-gray-400 text-xs">Antes da primeira onda — posicione suas defesas!</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/50 text-center">
              <div className="text-blue-400 text-2xl font-bold mb-1">4s</div>
              <div className="text-gray-400 text-xs">Entre ondas — a próxima já começa automaticamente!</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/50 text-center">
              <div className="text-cyan-400 text-2xl font-bold mb-1">{phase.waves.length}</div>
              <div className="text-gray-400 text-xs">Ondas nesta fase — sobreviva a todas!</div>
            </div>
          </div>
          <p className="text-xs text-yellow-400 bg-yellow-950/30 p-2 rounded-lg border border-yellow-900/30 mt-2">
            💡 Dica: Posicione torres perto das curvas do caminho — onde os inimigos ficam mais tempo em alcance!
          </p>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
          style={{
            background: "#0a0f1a",
            border: "2px solid rgba(0,200,255,0.3)",
            boxShadow: "0 0 60px rgba(0,150,255,0.15)",
          }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-white/10">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
                background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
              }}
            />
          </div>

          {/* Header */}
          <div className="px-6 pt-5 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">
                GUIA {step + 1}/{steps.length}
              </span>
              <span className="text-xs text-gray-500">Fase {phase.id === "bonus" ? "Bônus" : phase.id}: {phase.title}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{steps[step].title}</h2>
          </div>

          {/* Content */}
          <div className="px-6 py-5 min-h-[280px] flex flex-col justify-center overflow-y-auto max-h-[360px]">
            {steps[step].content}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="text-sm px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      background: i === step ? "#06b6d4" : i < step ? "#ffffff50" : "#ffffff20",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  if (isLast) {
                    onComplete();
                  } else {
                    setStep(s => s + 1);
                  }
                }}
                className="text-sm px-5 py-2 rounded-lg font-bold transition-all"
                style={{
                  background: isLast
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                  color: "white",
                  boxShadow: isLast ? "0 0 20px rgba(34,197,94,0.4)" : "0 0 20px rgba(6,182,212,0.4)",
                }}
              >
                {isLast ? "🎮 Jogar!" : "Próximo →"}
              </button>
            </div>

            {skippable && (
              <div className="flex justify-center">
                <button
                  onClick={onComplete}
                  className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
                >
                  Pular Guia →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
