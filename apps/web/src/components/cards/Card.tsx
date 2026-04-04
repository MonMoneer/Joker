"use client";

import { motion } from "framer-motion";
import type { Card as CardType } from "@joker/engine";
import { getCardImagePath, getCardBackPath } from "@/lib/card-assets";

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isDimmed?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
  tiny?: boolean; // Opponent card backs — smallest size
}

export function Card({
  card,
  isPlayable = true,
  isDimmed = false,
  isSelected = false,
  onClick,
  faceDown = false,
  small = false,
  tiny = false,
}: CardProps) {
  if (faceDown) return <CardBack small={small} tiny={tiny} />;

  const imagePath = getCardImagePath(card);
  const sizeClass = tiny
    ? "!w-[var(--card-sm-w)] !h-[var(--card-sm-h)] !rounded-[var(--card-sm-r)]"
    : small
      ? "!w-[40px] !h-[56px] !rounded-[4px]"
      : "";

  return (
    <motion.div
      className={[
        "card-base card-face",
        isPlayable ? "card-face-playable" : "",
        isDimmed ? "card-dimmed" : "",
        !isPlayable && !isDimmed ? "card-waiting" : "",
        isSelected ? "card-face-selected" : "",
        sizeClass,
      ].filter(Boolean).join(" ")}
      onClick={isPlayable ? onClick : undefined}
      whileTap={isPlayable ? { scale: 0.96 } : undefined}
      layout
    >
      <img src={imagePath} alt="" draggable={false} className="w-full h-full object-contain" />
    </motion.div>
  );
}

export function CardBack({
  small = false,
  tiny = false,
  onClick,
}: {
  small?: boolean;
  tiny?: boolean;
  onClick?: () => void;
}) {
  const sizeClass = tiny
    ? "!w-[var(--card-sm-w)] !h-[var(--card-sm-h)] !rounded-[var(--card-sm-r)]"
    : small
      ? "!w-[40px] !h-[56px] !rounded-[4px]"
      : "";

  return (
    <div
      className={["card-base card-back-img", sizeClass, onClick ? "cursor-pointer" : ""].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      <img src={getCardBackPath()} alt="" draggable={false} className="w-full h-full object-cover" />
    </div>
  );
}
