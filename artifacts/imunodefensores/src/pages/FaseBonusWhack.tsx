import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { VictoryScreen } from "../components/VictoryScreen";

type CellType = "empty" | "comum" | "bacteria" | "aliada";

interface Cell {
  id: number;
  type: CellType;
  hp: number;
  timeLeft: number;
  maxTime: number;
}

const BASE_CELL_DURATION = 2000;
const GRID_SIZE = 16;
const VACCINE_CLICKS_NEEDED = 10;
const IMMUNITY_DURATION = 10000;
const GAME_DURATION = 90000;

function getSpawnInterval(elapsed: number): number {
  return Math.max(600, 1200 - Math.floor(elapsed / 15000) * 100);
}

export default function FaseBonusWhack() {
  const [, setLocation] = useLocation();
  const [cells, setCells] = useState<Cell[]>(
    Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      type: "empty" as CellType,
      hp: 1,
      timeLeft: 0,
      maxTime: BASE_CELL_DURATION,
    }))
  );
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [vaccineCharge, setVaccineCharge] = useState(0);
  const [vaccineClicks, setVaccineClicks] = useState(0);
  const [immunityActive, setImmunityActive] = useState(false);
  const [immunityTimeLeft, setImmunityTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [showNarration, setShowNarration] = useState(true);

  const gameOverRef = useRef(false);
  const immunityActiveRef = useRef(false);
  const lastTickRef = useRef(performance.now());
  const gameElapsedRef = useRef(0);
  const reqRef = useRef<number>(0);
  const spawnTimerRef = useRef(0);
  const scoreRef = useRef(0);
  const vaccineClicksRef = useRef(0);

  const spawnCell = useCallback(() => {
    setCells((prev) => {
      const emptyIds = prev.filter((c) => c.type === "empty").map((c) => c.id);
      if (emptyIds.length === 0) return prev;
      const targetId = emptyIds[Math.floor(Math.random() * emptyIds.length)];
      const roll = Math.random();
      let type: CellType;
      let hp: number;
      if (roll < 0.15) {
        type = "aliada";
        hp = 1;
      } else if (roll < 0.35) {
        type = "bacteria";
        hp = 2;
      } else {
        type = "comum";
        hp = 1;
      }
      const duration = immunityActiveRef.current
        ? BASE_CELL_DURATION * 1.8
        : BASE_CELL_DURATION;
      return prev.map((c) =>
        c.id === targetId
          ? { ...c, type, hp, timeLeft: duration, maxTime: duration }
          : c
      );
    });
  }, []);

  const loop = useCallback(
    (time: number) => {
      if (gameOverRef.current) return;
      const dt = Math.min(time - lastTickRef.current, 100);
      lastTickRef.current = time;
      gameElapsedRef.current += dt;

      setTimeLeft((prev) => {
        const next = prev - dt;
        if (next <= 0 && !gameOverRef.current) {
          gameOverRef.current = true;
          setVictory(true);
          return 0;
        }
        return Math.max(0, next);
      });

      spawnTimerRef.current += dt;
      const spawnInterval = getSpawnInterval(gameElapsedRef.current);
      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current = 0;
        spawnCell();
      }

      let escaped = 0;
      setCells((prev) => {
        return prev.map((c) => {
          if (c.type === "empty") return c;
          const newTimeLeft = c.timeLeft - dt;
          if (newTimeLeft <= 0) {
            if (c.type !== "aliada") escaped++;
            return { ...c, type: "empty" as CellType, hp: 1, timeLeft: 0, maxTime: BASE_CELL_DURATION };
          }
          return { ...c, timeLeft: newTimeLeft };
        });
      });

      if (escaped > 0) {
        setHp((prev) => {
          const next = Math.max(0, prev - escaped * 10);
          if (next <= 0 && !gameOverRef.current) {
            gameOverRef.current = true;
            setGameOver(true);
          }
          return next;
        });
      }

      if (immunityActiveRef.current) {
        setImmunityTimeLeft((prev) => {
          const next = prev - dt;
          if (next <= 0) {
            immunityActiveRef.current = false;
            setImmunityActive(false);
            return 0;
          }
          return next;
        });
      }

      reqRef.current = requestAnimationFrame(loop);
    },
    [spawnCell]
  );

  useEffect(() => {
    if (!showNarration) {
      lastTickRef.current = performance.now();
      reqRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [loop, showNarration]);

  const handleCellClick = (cellId: number) => {
    if (gameOverRef.current || showNarration) return;
    setCells((prev) => {
      const cell = prev.find((c) => c.id === cellId);
      if (!cell || cell.type === "empty") return prev;

      if (cell.type === "aliada") {
        scoreRef.current = Math.max(0, scoreRef.current - 20);
        setScore(scoreRef.current);
        return prev.map((c) =>
          c.id === cellId
            ? { ...c, type: "empty" as CellType, hp: 1, timeLeft: 0 }
            : c
        );
      }

      const newHp = cell.hp - 1;
      if (newHp <= 0) {
        const multiplier = immunityActiveRef.current ? 2 : 1;
        const points = cell.type === "bacteria" ? 20 * multiplier : 10 * multiplier;
        scoreRef.current += points;
        setScore(scoreRef.current);

        vaccineClicksRef.current += 1;
        const newCharge = Math.min(
          100,
          (vaccineClicksRef.current / VACCINE_CLICKS_NEEDED) * 100
        );
        setVaccineClicks(vaccineClicksRef.current);
        setVaccineCharge(newCharge);

        return prev.map((c) =>
          c.id === cellId
            ? { ...c, type: "empty" as CellType, hp: 1, timeLeft: 0 }
            : c
        );
      } else {
        return prev.map((c) =>
          c.id === cellId ? { ...c, hp: newHp } : c
        );
      }
    });
  };

  const activateVaccine = () => {
    if (vaccineCharge < 100 || immunityActiveRef.current) return;
    immunityActiveRef.current = true;
    setImmunityActive(true);
    setImmunityTimeLeft(IMMUNITY_DURATION);
    setVaccineCharge(0);
    setVaccineClicks(0);
    vaccineClicksRef.current = 0;
    setCells((prev) =>
      prev.map((c) =>
        c.type !== "empty"
          ? { ...c, maxTime: BASE_CELL_DURATION * 1.8, timeLeft: Math.min(c.timeLeft * 1.5, BASE_CELL_DURATION * 1.8) }
          : c
      )
    );
  };

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const getCellStyle = (cell: Cell) => {
    if (cell.type === "empty") {
      return {
        background: "rgba(60,0,0,0.4)",
        border: "2px solid rgba(150,0,0,0.3)",
        boxShadow: "none",
        cursor: "default",
      };
    }
    if (immunityActive) {
      if (cell.type === "aliada") {
        return {
          background: "rgba(52,211,153,0.85)",
          border: "2px solid #6ee7b7",
          boxShadow: "0 0 24px rgba(52,211,153,0.8)",
          cursor: "pointer",
        };
      }
      return {
        background: "rgba(96,165,250,0.85)",
        border: "2px solid #93c5fd",
        boxShadow: "0 0 24px rgba(96,165,250,0.9)",
        cursor: "pointer",
      };
    }
    if (cell.type === "aliada") {
      return {
        background: "rgba(52,211,153,0.85)",
        border: "2px solid #6ee7b7",
        boxShadow: "0 0 20px rgba(52,211,153,0.7)",
        cursor: "pointer",
      };
    }
    if (cell.type === "bacteria") {
      return {
        background: "rgba(100,116,139,0.9)",
        border: "2px solid #94a3b8",
        boxShadow: "0 0 20px rgba(100,116,139,0.8)",
        cursor: "pointer",
      };
    }
    return {
      background: "rgba(239,68,68,0.85)",
      border: "2px solid #f87171",
      boxShadow: "0 0 20px rgba(239,68,68,0.8)",
      cursor: "pointer",
    };
  };

  const getCellLabel = (cell: Cell) => {
    if (cell.type === "empty") return null;
    if (cell.type === "aliada") return { icon: "⬟", sub: "ALIADA", color: "#059669" };
    if (cell.type === "bacteria") return { icon: cell.hp === 2 ? "●●" : "●", sub: "BACTÉRIA", color: "#94a3b8" };
    return { icon: "◉", sub: "VÍRUS", color: "#fca5a5" };
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col text-white overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #1a0000 0%, #050000 100%)" }}
    >
      <div
        className="h-16 flex items-center justify-between px-6 border-b"
        style={{ borderColor: "rgba(150,0,0,0.4)", background: "rgba(0,0,0,0.6)" }}
      >
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300"
          onClick={() => setLocation("/")}
          data-testid="button-exit"
        >
          ← Sair
        </Button>
        <h2 className="text-xl font-bold" style={{ color: "#f87171" }}>
          Fase Bônus: Ataque Relâmpago
        </h2>
        <div className="flex items-center gap-6 font-mono text-sm">
          <span style={{ color: "#60a5fa" }}>⏱ {formatTime(timeLeft)}</span>
          <span style={{ color: "#facc15" }}>✦ {score} pts</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-10 p-6">
        <div className="flex flex-col gap-5 w-52">
          <div>
            <div className="text-xs text-gray-400 mb-1">SAÚDE DO ORGANISMO</div>
            <div
              className="h-5 rounded overflow-hidden border"
              style={{ borderColor: "rgba(100,0,0,0.5)", background: "rgba(0,0,0,0.5)" }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${hp}%`,
                  background: hp > 50 ? "#22c55e" : hp > 25 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <div className="text-xs text-right mt-0.5" style={{ color: "#4ade80" }}>
              {hp}%
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">
              CARGA DA VACINA ({vaccineClicks}/{VACCINE_CLICKS_NEEDED})
            </div>
            <div
              className="h-5 rounded overflow-hidden border"
              style={{ borderColor: "rgba(0,150,255,0.3)", background: "rgba(0,0,0,0.5)" }}
            >
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${vaccineCharge}%`,
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                }}
              />
            </div>
            <button
              onClick={activateVaccine}
              disabled={vaccineCharge < 100 || immunityActive}
              data-testid="button-activate-vaccine"
              className="w-full mt-2 py-2 px-3 rounded-lg text-sm font-bold transition-all"
              style={{
                background:
                  vaccineCharge >= 100 && !immunityActive
                    ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                    : "rgba(50,50,80,0.4)",
                color: vaccineCharge >= 100 && !immunityActive ? "white" : "#6b7280",
                border:
                  vaccineCharge >= 100 && !immunityActive
                    ? "1px solid #8b5cf6"
                    : "1px solid #374151",
                cursor:
                  vaccineCharge >= 100 && !immunityActive ? "pointer" : "not-allowed",
                boxShadow:
                  vaccineCharge >= 100 && !immunityActive
                    ? "0 0 20px rgba(139,92,246,0.6)"
                    : "none",
                animation:
                  vaccineCharge >= 100 && !immunityActive ? "pulse 1s infinite" : "none",
              }}
            >
              💉 Aplicar Vacina
            </button>
          </div>

          {immunityActive && (
            <div
              className="text-center text-sm py-3 rounded-lg border"
              style={{
                background: "rgba(96,165,250,0.1)",
                borderColor: "rgba(96,165,250,0.4)",
                color: "#93c5fd",
              }}
            >
              <div className="font-bold mb-1">MEMÓRIA IMUNOLÓGICA</div>
              <div className="font-bold" style={{ color: "#60a5fa" }}>
                ATIVA!
              </div>
              <div className="text-2xl font-bold mt-1" style={{ color: "#60a5fa" }}>
                {Math.ceil(immunityTimeLeft / 1000)}s
              </div>
              <div className="text-xs mt-1 text-gray-400">pontos em dobro</div>
            </div>
          )}

          <div className="text-xs space-y-2 mt-2" style={{ color: "#9ca3af" }}>
            <div className="font-semibold text-gray-300 mb-1">Legenda:</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: "rgba(239,68,68,0.85)" }} />
              <span>Vírus Comum <span style={{color:"#fbbf24"}}>+10</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: "rgba(100,116,139,0.9)" }} />
              <span>Superbactéria <span style={{color:"#fbbf24"}}>+20</span> (2 cliques)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: "rgba(52,211,153,0.85)" }} />
              <span>Célula Aliada <span style={{color:"#f87171"}}>-20!</span></span>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-4 gap-3 p-5 rounded-2xl"
          style={{
            background: "rgba(80,0,0,0.25)",
            border: "2px solid rgba(180,0,0,0.3)",
            boxShadow: "inset 0 0 60px rgba(100,0,0,0.3), 0 0 40px rgba(100,0,0,0.2)",
          }}
        >
          {cells.map((cell) => {
            const label = getCellLabel(cell);
            const style = getCellStyle(cell);
            const urgency = cell.type !== "empty" ? cell.timeLeft / cell.maxTime : 1;
            return (
              <div
                key={cell.id}
                data-testid={`cell-${cell.id}`}
                onClick={() => handleCellClick(cell.id)}
                className="relative w-28 h-28 rounded-xl flex flex-col items-center justify-center select-none transition-transform duration-75 active:scale-90"
                style={{
                  ...style,
                  transform: cell.type !== "empty" ? "scale(1)" : "scale(0.95)",
                }}
              >
                {cell.type !== "empty" && label && (
                  <>
                    <div
                      className="text-3xl font-bold mb-1"
                      style={{ color: label.color, lineHeight: 1 }}
                    >
                      {label.icon}
                    </div>
                    <div
                      className="text-[9px] font-bold tracking-wider"
                      style={{ color: label.color, opacity: 0.8 }}
                    >
                      {label.sub}
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-xl overflow-hidden"
                      style={{ background: "rgba(0,0,0,0.4)" }}
                    >
                      <div
                        className="h-full rounded-b-xl"
                        style={{
                          width: `${urgency * 100}%`,
                          background: urgency > 0.5 ? "#ffffff80" : urgency > 0.25 ? "#f59e0b80" : "#ef444480",
                          transition: "width 0.05s linear",
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showNarration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)" }}
          >
            <div
              className="p-8 rounded-2xl text-center max-w-lg"
              style={{
                background: "#0a0000",
                border: "2px solid rgba(239,68,68,0.5)",
                boxShadow: "0 0 40px rgba(239,68,68,0.2)",
              }}
            >
              <h2 className="text-3xl font-bold mb-4" style={{ color: "#f87171" }}>
                Fase Bônus: Ataque Relâmpago!
              </h2>
              <p className="mb-4 text-gray-300">
                O organismo está sob ataque contínuo! Vírus aparecem e desaparecem
                rapidamente na corrente sanguínea. Clique neles antes que escapem!
              </p>
              <p className="mb-4 text-gray-300">
                Cuidado:{" "}
                <span style={{ color: "#6ee7b7", fontWeight: "bold" }}>
                  Células Aliadas (verdes)
                </span>{" "}
                ajudam o corpo — atacá-las tira pontos.
              </p>
              <p className="mb-6 text-sm" style={{ color: "#93c5fd" }}>
                Destrua vírus para carregar a vacina. Quando carregada, ative o{" "}
                <strong>Modo Imunidade</strong>: câmera lenta por 10 segundos e
                pontos em dobro!
              </p>
              <Button
                onClick={() => setShowNarration(false)}
                data-testid="button-start-bonus"
                className="px-8 py-3 text-lg"
                style={{
                  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                  color: "white",
                }}
              >
                Começar!
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gameOver && (
        <VictoryScreen
          hp={hp}
          leucocitos={0}
          phaseId="bonus"
          phaseTitle="Fase Bônus: Ataque Relâmpago"
          isGameOver
          bonusScore={score}
          onMenu={() => setLocation("/")}
          onRetry={() => window.location.reload()}
        />
      )}

      {victory && (
        <VictoryScreen
          hp={hp}
          leucocitos={0}
          phaseId="bonus"
          phaseTitle="Fase Bônus: Ataque Relâmpago"
          bonusScore={score}
          onMenu={() => setLocation("/")}
        />
      )}
    </div>
  );
}
