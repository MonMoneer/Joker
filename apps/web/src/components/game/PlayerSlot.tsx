"use client";

interface PlayerSlotProps {
  name: string;
  nickname?: string;
  avatar?: string;
  bid: number | null;
  tricksWon: number;
  score: number;
  isDealer: boolean;
  isCurrentTurn: boolean;
  isConnected: boolean;
  isAI: boolean;
  position: "top" | "bottom" | "left" | "right";
  compact?: boolean; // For left/right columns
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
  compact = false,
}: PlayerSlotProps) {
  const displayName = nickname || name;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative">
        <div className={`avatar-ring ${isCurrentTurn ? "avatar-ring-active" : ""}`}>
          {avatar ? (
            <span className="text-sm md:text-base">{avatar}</span>
          ) : (
            <span className="text-[10px] md:text-sm font-bold text-gold-200/60">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {isDealer && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-gold-400 rounded-full flex items-center justify-center text-[7px] md:text-[9px] font-black text-navy-900 shadow">D</div>
        )}
        {isAI && (
          <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-navy-700 rounded-full flex items-center justify-center text-[6px] text-gold-300">AI</div>
        )}
        {!isConnected && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
            <span className="text-[8px] text-error-500">⚡</span>
          </div>
        )}
      </div>

      <span className={`font-body font-semibold text-center truncate ${compact ? "text-[7px] max-w-[48px] md:text-[9px] md:max-w-[70px]" : "text-[9px] max-w-[70px] md:text-xs md:max-w-[90px]"}`}>
        {nickname ? <span className="text-gold-300">@{nickname}</span> : <span className="text-marble-100">{displayName}</span>}
      </span>

      {bid !== null && (
        <div className={`font-body font-bold ${compact ? "text-[8px] md:text-[10px]" : "text-[10px] md:text-xs"}`}>
          <span className="text-marble-400/50">b:</span>
          <span className="text-gold-300">{bid}</span>
          <span className="text-marble-400/30 mx-0.5">·</span>
          <span className="text-marble-400/50">w:</span>
          <span className="text-gold-300">{tricksWon}</span>
        </div>
      )}
    </div>
  );
}
