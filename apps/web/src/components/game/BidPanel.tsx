"use client";

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
  const allOptions = Array.from({ length: cardsPerPlayer + 1 }, (_, i) => i);
  const validOptions = allOptions.filter(
    (n) => !(isDealer && n === restrictedBid)
  );

  return (
    <div className="flex flex-wrap justify-center gap-2 px-3 py-2 max-w-[320px] mx-auto">
      {validOptions.map((n) => (
        <button
          key={n}
          onClick={() => onBid(n)}
          className="w-11 h-11 rounded-xl bg-white/90 text-navy-900 font-bold text-base flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          {n === 0 ? "—" : n}
        </button>
      ))}
    </div>
  );
}
