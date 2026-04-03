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
          // Only dim cards that are illegal during your active turn
          const isDimmed = isCurrentPlayer && !isLegal;
          return (
            <motion.div
              key={`${card.type}-${card.type === "joker" ? card.id : `${card.suit}-${card.rank}`}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.03 }}
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
  const isVertical = position === "left" || position === "right";
  const overlap = isVertical ? -48 : -14;

  return (
    <div className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center`}>
      {Array.from({ length: cardCount }, (_, i) => (
        <div
          key={i}
          style={{
            marginLeft: !isVertical && i > 0 ? `${overlap}px` : undefined,
            marginTop: isVertical && i > 0 ? `${overlap}px` : undefined,
            transform: isVertical
              ? `rotate(${position === "left" ? 90 : -90}deg)`
              : `rotate(${(i - cardCount / 2) * 2}deg)`,
            zIndex: i,
          }}
        >
          <CardBack small />
        </div>
      ))}
    </div>
  );
}
