"use client";

import { motion } from "framer-motion";
import type { Player } from "@joker/engine";
import Link from "next/link";

interface GameOverOverlayProps {
  players: Player[];
  scores: number[];
}

export function GameOverOverlay({ players, scores }: GameOverOverlayProps) {
  // Sort by score descending
  const ranked = players
    .map((p, i) => ({ player: p, score: scores[i], index: i }))
    .sort((a, b) => b.score - a.score);

  const winner = ranked[0];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-navy-900/85 backdrop-blur-lg" />

      <motion.div
        className="relative glass-panel p-8 max-w-sm w-full mx-4 text-center"
        initial={{ scale: 0.85, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 18, delay: 0.2 }}
      >
        {/* Crown */}
        <motion.div
          className="text-6xl mb-3"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          👑
        </motion.div>

        <h2 className="font-display text-2xl font-bold text-gold-300 mb-1">
          Game Over!
        </h2>
        <p className="text-gold-300/50 text-sm mb-6">
          {winner.player.name} wins with {winner.score} points
        </p>

        {/* Leaderboard */}
        <div className="space-y-2 mb-6">
          {ranked.map((r, rank) => (
            <motion.div
              key={r.index}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                rank === 0
                  ? "bg-gold-700/30 border border-gold-400/20"
                  : "bg-navy-800/60"
              }`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + rank * 0.1 }}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                  rank === 0
                    ? "bg-gold-400 text-navy-900"
                    : rank === 1
                      ? "bg-marble-400 text-navy-900"
                      : rank === 2
                        ? "bg-amber-700 text-marble-100"
                        : "bg-navy-700 text-marble-400"
                }`}
              >
                {rank + 1}
              </div>
              <span
                className={`flex-1 text-left text-sm font-semibold ${
                  rank === 0 ? "text-gold-300" : "text-marble-200"
                }`}
              >
                {r.player.name}
                {r.player.isAI && (
                  <span className="text-[10px] text-marble-400/30 ml-1">AI</span>
                )}
              </span>
              <span
                className={`font-mono font-bold text-lg ${
                  rank === 0 ? "text-gold-400" : "text-marble-300"
                }`}
              >
                {r.score}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link href="/" className="flex-1">
            <button className="btn-glass w-full py-3 text-sm">Home</button>
          </Link>
          <button
            className="btn-gold flex-1 py-3 text-sm"
            onClick={() => window.location.reload()}
          >
            Play Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
