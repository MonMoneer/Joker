"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TrickPlay, PlayerIndex } from "@joker/engine";
import { Card, CardBack } from "../cards/Card";

interface TrickAreaProps {
  plays: TrickPlay[];
  playerPositions: Record<number, "bottom" | "top" | "left" | "right">;
  trumpCard?: any;
  trickWinner?: PlayerIndex | null; // When set, cards animate toward this player
  phase?: string;
}

const PLAY_OFFSET: Record<string, { x: number; y: number; rotate: number }> = {
  bottom: { x: 0, y: 20, rotate: 1 },
  top: { x: 0, y: -20, rotate: -2 },
  left: { x: -25, y: 0, rotate: -4 },
  right: { x: 25, y: 0, rotate: 3 },
};

const FLY_FROM: Record<string, { x: number; y: number }> = {
  bottom: { x: 0, y: 120 },
  top: { x: 0, y: -120 },
  left: { x: -120, y: 0 },
  right: { x: 120, y: 0 },
};

// Where cards fly TO when winner takes the trick
const WIN_FLY_TO: Record<string, { x: number; y: number }> = {
  bottom: { x: 0, y: 150 },
  top: { x: 0, y: -150 },
  left: { x: -150, y: 0 },
  right: { x: 150, y: 0 },
};

export function TrickArea({ plays, playerPositions, trumpCard, trickWinner, phase }: TrickAreaProps) {
  // Gate: show all 4 cards on the table for 1 second before flying to winner
  const [showingTrick, setShowingTrick] = useState(false);

  useEffect(() => {
    if (phase === "trick-result" && trickWinner !== null && trickWinner !== undefined) {
      setShowingTrick(true);
      const timer = setTimeout(() => setShowingTrick(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowingTrick(false);
    }
  }, [phase, trickWinner]);

  const isWinning = phase === "trick-result" && trickWinner !== null && trickWinner !== undefined && !showingTrick;
  const winnerPos = isWinning ? playerPositions[trickWinner] || "bottom" : "bottom";
  const winTarget = WIN_FLY_TO[winnerPos];

  return (
    <div className="trick-zone gap-4 md:gap-7">
      {/* Deck pile: card backs + trump face-up on top */}
      {trumpCard && (
        <div className="relative flex-shrink-0" style={{ width: "var(--card-w)", height: "var(--card-h)" }}>
          {/* Stacked backs */}
          <div className="absolute" style={{ top: 6, left: 0, width: "var(--card-w)", height: "var(--card-h)" }}>
            <CardBack />
          </div>
          <div className="absolute" style={{ top: 3, left: 2, width: "var(--card-w)", height: "var(--card-h)" }}>
            <CardBack />
          </div>
          {/* Trump face-up on top */}
          <div className="absolute" style={{ top: 0, left: 4 }}>
            <Card card={trumpCard} isPlayable={false} />
          </div>
        </div>
      )}

      {/* Played trick cards */}
      <div className="relative flex items-center justify-center" style={{ minWidth: 60, minHeight: 50 }}>
        <AnimatePresence>
          {plays.map((play, i) => {
            const pos = playerPositions[play.playerIndex] || "bottom";
            const offset = PLAY_OFFSET[pos];
            const from = FLY_FROM[pos];

            return (
              <motion.div
                key={`${play.playerIndex}-${i}`}
                className="absolute"
                style={{ zIndex: i + 1 }}
                initial={{ x: from.x, y: from.y, opacity: 0, scale: 0.5 }}
                animate={
                  isWinning
                    ? { x: winTarget.x, y: winTarget.y, opacity: 0, scale: 0.6 }
                    : { x: offset.x, y: offset.y, opacity: 1, scale: 1, rotate: offset.rotate }
                }
                exit={{ opacity: 0, scale: 0.3 }}
                transition={
                  isWinning
                    ? { duration: 0.4, ease: "easeIn", delay: i * 0.05 }
                    : { type: "spring", stiffness: 350, damping: 24 }
                }
              >
                <Card card={play.card} small isPlayable={false} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {plays.length === 0 && !trumpCard && (
          <span className="font-display text-xl md:text-3xl font-bold text-gold-600/[0.06] select-none tracking-widest">
            JOKER
          </span>
        )}
      </div>
    </div>
  );
}
