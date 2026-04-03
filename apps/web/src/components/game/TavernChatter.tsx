"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "@joker/engine";

const CHATTER = {
  bidding: [
    "The tension builds...",
    "Who dares bid high?",
    "Bold bets at the table.",
    "Calculating the odds...",
  ],
  trickWon: [
    "A bold move indeed!",
    "Masterfully played.",
    "The table speaks!",
    "Well captured!",
  ],
  jokerPlayed: [
    "The Joker enters!",
    "Wild card on the table!",
    "A daring Joker play!",
  ],
  handComplete: [
    "The hand concludes.",
    "Scores tallied.",
    "On to the next round.",
  ],
  kingEarned: [
    "A King rises!",
    "The crown has been earned!",
    "Royal dominance!",
  ],
};

interface TavernChatterProps {
  gameState: GameState;
}

export function TavernChatter({ gameState }: TavernChatterProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [prevPhase, setPrevPhase] = useState(gameState.phase);

  useEffect(() => {
    if (gameState.phase !== prevPhase) {
      let pool: string[] = [];

      if (gameState.phase === "bidding") pool = CHATTER.bidding;
      else if (gameState.phase === "hand-result") pool = CHATTER.handComplete;
      else if (gameState.phase === "trick-result") pool = CHATTER.trickWon;

      if (pool.length > 0) {
        setMessage(pool[Math.floor(Math.random() * pool.length)]);
        setTimeout(() => setMessage(null), 3000);
      }

      setPrevPhase(gameState.phase);
    }
  }, [gameState.phase, prevPhase]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-20 max-w-xs"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.95 }}
        >
          <div className="bg-marble-50/95 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center">
              <span className="text-gold-400 text-xs">💬</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gold-600 uppercase tracking-wider">
                Tavern Chatter
              </p>
              <p className="text-sm text-ink-800 italic">{message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
