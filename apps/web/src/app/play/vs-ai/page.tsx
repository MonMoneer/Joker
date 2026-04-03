"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocalGame } from "@/hooks/useLocalGame";
import { GameBoard } from "@/components/game/GameBoard";
import { GameHeader } from "@/components/ui/GameHeader";
import type { GameSettings } from "@joker/engine";
import { useRouter } from "next/navigation";

export default function VsAIPage() {
  const router = useRouter();
  const { gameState, error, initGame, placeBid, playCard, jokerChoice, nextHand } =
    useLocalGame();
  const [playerName, setPlayerName] = useState("");
  const [gameVariation, setGameVariation] = useState<"classic">("classic");
  const [gameLength, setGameLength] = useState<"full">("full");
  const [botLevel, setBotLevel] = useState<"easy" | "medium" | "hard">("medium");
  const [histPenalty, setHistPenalty] = useState(false);
  const [histAmount, setHistAmount] = useState<-200 | -500>(-200);

  if (gameState) {
    return (
      <GameBoard
        gameState={gameState}
        myPlayerIndex={0}
        onBid={placeBid}
        onPlayCard={playCard}
        onJokerChoice={jokerChoice}
        onNextHand={nextHand}
      />
    );
  }

  return (
    <div className="royal-bg flex flex-col min-h-screen">
      <div className="px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-gold-300/60 hover:text-gold-300 flex items-center gap-1 text-sm font-body"
        >
          <span className="text-lg">‹</span> Back
        </button>
        <div className="w-10 h-10 rounded-full bg-navy-800 border-2 border-gold-600/20 overflow-hidden flex items-center justify-center">
          <span>👤</span>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-6 pb-12">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Title */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gold-300 tracking-tight">
              Singleplayer
            </h1>
            <p className="text-gold-300/40 text-xs uppercase tracking-[0.25em] mt-1 font-body font-semibold">
              Configure your royal table
            </p>
          </div>

          {/* Config panel */}
          <div className="glass-panel p-6 md:p-8 space-y-8">
            {/* Player identity */}
            <div>
              <label className="block text-xs font-body font-bold text-gold-300/50 uppercase tracking-[0.2em] mb-2">
                Player Identity
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="input-royal"
                maxLength={20}
              />
            </div>

            {/* Game variation */}
            <div>
              <label className="block text-xs font-body font-bold text-gold-300/50 uppercase tracking-[0.2em] mb-3">
                Game Variation
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "classic" as const, title: "Classic", desc: "The standard Joker experience" },
                  { id: "full" as const, title: "Full Game", desc: "Complete 24-hand/4-set match" },
                ].map((v) => (
                  <button
                    key={v.id}
                    className={`p-4 rounded-xl text-left transition-all ${
                      (v.id === "classic" ? gameVariation === "classic" : gameLength === "full")
                        ? "border-2 border-gold-300 bg-navy-900"
                        : "border-2 border-transparent bg-navy-800/40 hover:border-gold-300/20"
                    }`}
                    onClick={() =>
                      v.id === "classic"
                        ? setGameVariation("classic")
                        : setGameLength("full")
                    }
                  >
                    <div className="font-body font-bold text-marble-100 text-sm">
                      {v.title}
                    </div>
                    <div className="font-body text-[11px] text-gold-300/40 mt-0.5">
                      {v.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent skill */}
            <div>
              <label className="block text-xs font-body font-bold text-gold-300/50 uppercase tracking-[0.2em] mb-3">
                Opponent Skill
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map((level) => {
                  const labels = { easy: "Newbie", medium: "Professional", hard: "Master" };
                  const isActive = botLevel === level;
                  return (
                    <button
                      key={level}
                      className={`py-3 rounded-xl font-body text-xs font-extrabold uppercase tracking-wider transition-all ${
                        isActive
                          ? "border-2 border-gold-300 bg-gold-300/10 text-gold-300 shadow-lg shadow-gold-300/5"
                          : "border border-gold-300/15 bg-navy-800/30 text-marble-400 hover:border-gold-300/30"
                      }`}
                      onClick={() => setBotLevel(level)}
                    >
                      {labels[level]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hist Penalty toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-body text-sm font-semibold text-marble-200">
                  Hist Penalty
                </div>
                <div className="font-body text-[10px] text-gold-300/30">
                  Penalty for winning 0 tricks
                </div>
              </div>
              <button
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  histPenalty ? "bg-gold-400" : "bg-navy-800 border border-gold-300/15"
                }`}
                onClick={() => setHistPenalty(!histPenalty)}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                    histPenalty ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {histPenalty && (
              <div className="flex gap-2">
                {([-200, -500] as const).map((amt) => (
                  <button
                    key={amt}
                    className={`flex-1 py-2.5 rounded-xl font-body text-sm font-bold transition-all ${
                      histAmount === amt
                        ? "bg-error-500/80 text-white"
                        : "bg-navy-800/40 text-marble-400 border border-gold-300/10"
                    }`}
                    onClick={() => setHistAmount(amt)}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            )}

            {/* Start button */}
            <button
              className="btn-gold w-full !mt-8"
              onClick={() => {
                const settings: GameSettings = {
                  histPenalty,
                  histPenaltyAmount: histAmount,
                  couplesMode: false,
                };
                initGame(playerName || "Player", settings, botLevel);
              }}
              disabled={!playerName.trim()}
            >
              Start Match
            </button>
          </div>

          {/* Tips */}
          <div className="mt-5 px-1">
            <p className="text-[10px] text-gold-300/25 uppercase tracking-[0.15em] mb-1 font-body font-bold">
              Tips & Hints
            </p>
            <p className="text-xs text-gold-300/30 font-body leading-relaxed">
              The Hist Penalty toggles a severe high-stakes rule. When
              active, a player who bids ≥1 but wins 0 tricks loses points.
              Recommended for experienced players.
            </p>
          </div>

          {error && (
            <div className="mt-4 glass-panel p-4 border-error-500/30 text-error-500 text-sm">
              {error}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
