"use client";

import { motion } from "framer-motion";
import type { HandScore, Player } from "@joker/engine";

interface HandResultOverlayProps {
  handNumber: number;
  handScores: HandScore[];
  players: Player[];
  cumulativeScores: number[];
  onNext: () => void;
  isSetEnd?: boolean;
  kings?: { playerIndex: number; isSoleKing: boolean }[];
}

export function HandResultOverlay({
  handNumber,
  handScores,
  players,
  cumulativeScores,
  onNext,
  isSetEnd = false,
  kings = [],
}: HandResultOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-navy-900/70 backdrop-blur-md" />

      <motion.div
        className="relative glass-panel p-6 max-w-sm w-full mx-4"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        {/* Title */}
        <div className="text-center mb-5">
          <h2 className="font-display text-xl font-bold text-gold-300">
            {isSetEnd ? "Set Complete!" : `Hand ${handNumber}`}
          </h2>
          {isSetEnd && kings.length > 0 && (
            <div className="mt-2">
              {kings.map((k) => (
                <motion.div
                  key={k.playerIndex}
                  className="flex items-center justify-center gap-2 text-gold-400 text-sm font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <span className="text-xl">👑</span>
                  <span>{players[k.playerIndex]?.name} is King!</span>
                  {k.isSoleKing && (
                    <span className="text-[10px] text-gold-300/60">(Sole)</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="space-y-2 mb-5">
          {handScores.map((hs, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-navy-800/60"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-sm font-bold text-marble-300">
                {players[i]?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="text-sm text-marble-200 font-semibold">
                  {players[i]?.name}
                </span>
                <div className="text-[10px] text-marble-400/40">
                  Bid: {hs.bid} · Won: {hs.tricksWon}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-bold text-lg ${
                    hs.isSuccess ? "text-gold-400" : "text-error-500"
                  }`}
                >
                  {hs.score > 0 ? "+" : ""}
                  {hs.score}
                </span>
                <div className="text-[10px] font-mono text-marble-400/40">
                  {cumulativeScores[i]}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          className="btn-gold w-full py-3 text-sm"
          onClick={onNext}
        >
          {isSetEnd ? "Next Set" : "Next Hand"}
        </button>
      </motion.div>
    </motion.div>
  );
}
