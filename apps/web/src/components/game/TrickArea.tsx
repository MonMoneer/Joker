"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { TrickPlay } from "@joker/engine";
import { Card } from "../cards/Card";

interface TrickAreaProps {
  plays: TrickPlay[];
  playerPositions: Record<number, "bottom" | "top" | "left" | "right">;
}

const OFFSET: Record<string, { x: number; y: number; rotate: number }> = {
  bottom: { x: 0, y: 40, rotate: 1 },
  top: { x: 0, y: -40, rotate: -2 },
  left: { x: -50, y: 0, rotate: -5 },
  right: { x: 50, y: 0, rotate: 4 },
};

const FLY: Record<string, { x: number; y: number }> = {
  bottom: { x: 0, y: 180 },
  top: { x: 0, y: -180 },
  left: { x: -180, y: 0 },
  right: { x: 180, y: 0 },
};

export function TrickArea({ plays, playerPositions }: TrickAreaProps) {
  return (
    <div className="trick-zone relative flex items-center justify-center">
      {/* Watermark */}
      {plays.length === 0 && (
        <span className="font-display text-5xl font-bold text-gold-600/[0.06] select-none tracking-widest">
          JOKER
        </span>
      )}

      <AnimatePresence>
        {plays.map((play, i) => {
          const pos = playerPositions[play.playerIndex] || "bottom";
          const offset = OFFSET[pos];
          const fly = FLY[pos];

          return (
            <motion.div
              key={`${play.playerIndex}-${i}`}
              className="absolute"
              style={{ zIndex: i + 1 }}
              initial={{ x: fly.x, y: fly.y, opacity: 0, scale: 0.5 }}
              animate={{
                x: offset.x,
                y: offset.y,
                opacity: 1,
                scale: 1,
                rotate: offset.rotate,
              }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 350, damping: 24 }}
            >
              <Card card={play.card} small isPlayable={false} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
