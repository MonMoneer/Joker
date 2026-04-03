"use client";

import { motion } from "framer-motion";

interface BidPanelProps {
  playerName: string;
  cardsPerPlayer: number;
  restrictedBid: number | null;
  isDealer: boolean;
  existingBids: (number | null)[];
  playerNames: string[];
  onBid: (bid: number) => void;
}

export function BidPanel({
  cardsPerPlayer,
  restrictedBid,
  isDealer,
  onBid,
}: BidPanelProps) {
  // Only show VALID bid options — hide restricted bid entirely
  const allNumbers = Array.from({ length: cardsPerPlayer }, (_, i) => i + 1);
  const validNumbers = allNumbers.filter(
    (n) => !(isDealer && n === restrictedBid)
  );
  const passRestricted = isDealer && restrictedBid === 0;

  const cols = validNumbers.length <= 3 ? validNumbers.length : validNumbers.length <= 6 ? 3 : 4;

  return (
    <motion.div
      className="bid-modal mx-auto"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 300 }}
    >
      <div className="bid-modal-accent" />

      <div className="p-5">
        <h3 className="text-center font-display text-lg font-bold text-navy-900 mb-4">
          Pick your order:
        </h3>

        {/* Only valid bid numbers */}
        <div
          className="grid gap-2.5 mb-4"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {validNumbers.map((n) => (
            <button
              key={n}
              className="bid-number"
              onClick={() => onBid(n)}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Pass button (only if 0 is not restricted) */}
        {!passRestricted && (
          <button
            className="bid-pass-btn w-full"
            onClick={() => onBid(0)}
          >
            0 — PASS
          </button>
        )}
      </div>
    </motion.div>
  );
}
