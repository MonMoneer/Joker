"use client";

import { motion } from "framer-motion";
import type { Card as CardType } from "@joker/engine";
import { getCardImagePath, getCardBackPath } from "@/lib/card-assets";

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isDimmed?: boolean; // true = illegal card during your turn (reduced opacity)
  isSelected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
}

export function Card({
  card,
  isPlayable = true,
  isDimmed = false,
  isSelected = false,
  onClick,
  faceDown = false,
  small = false,
}: CardProps) {
  if (faceDown) return <CardBack small={small} />;

  const imagePath = getCardImagePath(card);

  const cls = [
    "card-base card-face",
    isPlayable ? "card-face-playable" : "",
    isDimmed ? "card-dimmed" : "",
    !isPlayable && !isDimmed ? "card-waiting" : "",
    isSelected ? "card-face-selected" : "",
    small ? "!w-[52px] !h-[73px] !rounded-[6px]" : "",
  ].filter(Boolean).join(" ");

  return (
    <motion.div
      className={cls}
      onClick={isPlayable ? onClick : undefined}
      whileTap={isPlayable ? { scale: 0.96 } : undefined}
      layout
    >
      <img
        src={imagePath}
        alt=""
        draggable={false}
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
}

export function CardBack({
  small = false,
  onClick,
}: {
  small?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={[
        "card-base card-back-img",
        small ? "!w-[52px] !h-[73px] !rounded-[6px]" : "",
        onClick ? "cursor-pointer" : "",
      ].join(" ")}
      onClick={onClick}
    >
      <img
        src={getCardBackPath()}
        alt=""
        draggable={false}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
