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
  playerName,
  cardsPerPlayer,
  restrictedBid,
  isDealer,
  onBid,
}: BidPanelProps) {
  const numbers = Array.from({ length: cardsPerPlayer }, (_, i) => i + 1);

  return (
    <motion.div
      className="bid-modal mx-auto"
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 300 }}
    >
      {/* Gold accent bar */}
      <div className="bid-modal-accent" />

      <div className="p-6 md:p-8">
        <h3 className="text-center font-display text-xl font-bold text-navy-900 mb-1">
          Pick your order:
        </h3>
        <p className="text-center text-xs font-body font-semibold text-ink-600 uppercase tracking-[0.15em] mb-6">
          Select your bid for this round
        </p>

        {/* Number grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {numbers.map((n) => {
            const isRestricted = isDealer && n === restrictedBid;
            return (
              <button
                key={n}
                className={[
                  "bid-number",
                  isRestricted ? "bid-number-restricted" : "",
                ].join(" ")}
                onClick={() => !isRestricted && onBid(n)}
                disabled={isRestricted}
              >
                {n}
                {isRestricted && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-error-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pass button */}
        <button className="bid-pass-btn w-full flex items-center justify-center gap-2" onClick={() => onBid(0)}>
          <span className="text-lg">✓</span>
          0 — Pass
        </button>

        {/* Restriction info */}
        {isDealer && restrictedBid !== null && (
          <div className="mt-5 flex items-start gap-2 p-3 bg-marble-200 rounded-xl">
            <span className="text-gold-600 text-sm mt-0.5">ℹ</span>
            <p className="text-xs font-body text-ink-700 leading-relaxed">
              Bid &apos;{restrictedBid}&apos; is currently restricted because the total sum of
              bids must not equal the number of cards in play.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
