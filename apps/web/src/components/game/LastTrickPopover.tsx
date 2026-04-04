"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { TrickPlay, Player } from "@joker/engine";
import { Card } from "@/components/cards/Card";

interface LastTrickPopoverProps {
  lastTrick: TrickPlay[] | null;
  winnerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LastTrickPopover({
  lastTrick,
  winnerName,
  isOpen,
  onClose,
}: LastTrickPopoverProps) {
  if (!lastTrick || lastTrick.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-16 right-3 z-30 glass-panel p-5 max-w-xs"
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-marble-400/60 uppercase tracking-[0.15em]">
              Last Trick
            </h3>
            <button
              onClick={onClose}
              className="text-marble-400/30 hover:text-marble-400 text-sm"
            >
              ✕
            </button>
          </div>

          <div className="flex justify-center -space-x-6 mb-3">
            {lastTrick.map((play, i) => (
              <div
                key={i}
                style={{
                  transform: `rotate(${(i - 1.5) * 8}deg)`,
                  zIndex: i,
                }}
              >
                <Card card={play.card} small isPlayable={false} />
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] text-marble-400/50 uppercase tracking-wider font-bold border-t border-white/5 pt-2">
            Winner: <span className="text-gold-300">{winnerName}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
