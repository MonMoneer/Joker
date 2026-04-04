"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Card as CardType } from "@joker/engine";
import { Card, CardBack } from "./Card";

interface PlayerHandProps {
  cards: CardType[];
  legalIndices: number[];
  onCardClick: (index: number) => void;
  selectedIndex?: number | null;
  isCurrentPlayer: boolean;
}

export function PlayerHand({
  cards,
  legalIndices,
  onCardClick,
  selectedIndex = null,
  isCurrentPlayer,
}: PlayerHandProps) {
  return (
    <div className="hand-fan">
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => {
          const isLegal = legalIndices.includes(index);
          const isPlayable = isCurrentPlayer && isLegal;
          const isDimmed = isCurrentPlayer && !isLegal;
          return (
            <motion.div
              key={`${card.type}-${card.type === "joker" ? card.id : `${card.suit}-${card.rank}`}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.02 }}
              style={{ zIndex: index }}
            >
              <Card
                card={card}
                isPlayable={isPlayable}
                isDimmed={isDimmed}
                isSelected={selectedIndex === index}
                onClick={() => onCardClick(index)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface OpponentHandProps {
  cardCount: number;
  position: "top" | "left" | "right";
}

export function OpponentHand({ cardCount, position }: OpponentHandProps) {
  const isHorizontal = position === "top";

  if (isHorizontal) {
    return (
      <div className="flex items-center justify-center">
        {Array.from({ length: cardCount }, (_, i) => (
          <div key={i} style={{ marginLeft: i > 0 ? "-10px" : 0, zIndex: i }}>
            <CardBack tiny />
          </div>
        ))}
      </div>
    );
  }

  // Vertical (left/right)
  const rotation = position === "left" ? 90 : -90;
  return (
    <div className="flex flex-col items-center">
      {Array.from({ length: cardCount }, (_, i) => (
        <div
          key={i}
          style={{
            marginTop: i > 0 ? "calc(var(--card-sm-h) * -0.7)" : 0,
            transform: `rotate(${rotation}deg)`,
            zIndex: i,
          }}
        >
          <CardBack tiny />
        </div>
      ))}
    </div>
  );
}
