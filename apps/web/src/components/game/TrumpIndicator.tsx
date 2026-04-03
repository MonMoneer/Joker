"use client";

import type { TrumpInfo } from "@joker/engine";

const SUIT_INFO: Record<string, { symbol: string; color: string }> = {
  hearts: { symbol: "♥", color: "text-error-500" },
  diamonds: { symbol: "♦", color: "text-error-500" },
  clubs: { symbol: "♣", color: "text-marble-100" },
  spades: { symbol: "♠", color: "text-marble-100" },
};

interface TrumpIndicatorProps {
  trump: TrumpInfo;
  handNumber: number;
  setNumber: number;
  cardsPerPlayer: number;
}

export function TrumpIndicator({
  trump,
  cardsPerPlayer,
}: TrumpIndicatorProps) {
  return (
    <div className="px-4 py-2 rounded-full bg-navy-800/80 backdrop-blur-sm flex items-center gap-2 text-xs font-body">
      <span className="text-marble-400/60">distribution by:</span>
      <span className="text-gold-300 font-bold">{cardsPerPlayer}</span>

      {!trump.isNoTrump && trump.suit && (
        <>
          <span className="text-marble-500/30">|</span>
          <span className="text-marble-400/60">stuffing:</span>
          <span className={`text-lg ${SUIT_INFO[trump.suit].color}`}>
            {SUIT_INFO[trump.suit].symbol}
          </span>
        </>
      )}

      {trump.isNoTrump && (
        <>
          <span className="text-marble-500/30">|</span>
          <span className="text-marble-400/40 italic">no trump</span>
        </>
      )}
    </div>
  );
}
