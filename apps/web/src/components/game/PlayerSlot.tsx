"use client";

interface PlayerSlotProps {
  name: string;
  nickname?: string; // If registered user, show @nickname
  avatar?: string;
  bid: number | null;
  tricksWon: number;
  score: number;
  isDealer: boolean;
  isCurrentTurn: boolean;
  isConnected: boolean;
  isAI: boolean;
  position: "top" | "bottom" | "left" | "right";
}

export function PlayerSlot({
  name,
  nickname,
  avatar,
  bid,
  tricksWon,
  isDealer,
  isCurrentTurn,
  isConnected,
  isAI,
}: PlayerSlotProps) {
  // Always show nickname on the table if available
  const displayName = nickname || name;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Avatar */}
      <div className="relative">
        <div
          className={`avatar-ring ${isCurrentTurn ? "avatar-ring-active" : ""}`}
        >
          {avatar ? (
            <span className="text-2xl">{avatar}</span>
          ) : (
            <span className="text-lg font-bold text-gold-200/60">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {isDealer && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gold-400 rounded-full flex items-center justify-center text-[9px] font-black text-navy-900 shadow">
            D
          </div>
        )}

        {isAI && (
          <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 bg-navy-700 rounded-full flex items-center justify-center text-[8px] text-gold-300">
            AI
          </div>
        )}

        {!isConnected && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
            <span className="text-xs text-error-500">⚡</span>
          </div>
        )}
      </div>

      {/* Nickname always shown on table */}
      <span className="text-xs font-body font-semibold text-marble-100 max-w-[80px] truncate text-center">
        {nickname ? (
          <span className="text-gold-300">@{nickname}</span>
        ) : (
          displayName
        )}
      </span>

      {/* Bid & tricks compact */}
      {bid !== null && (
        <div className="flex items-center gap-1.5 text-[10px] font-body">
          <span className="text-gold-300 font-bold">{bid}</span>
          <span className="text-marble-400/30">·</span>
          <span className="text-marble-400/60">{tricksWon}</span>
        </div>
      )}
    </div>
  );
}
