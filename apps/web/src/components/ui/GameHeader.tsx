"use client";

import Link from "next/link";

interface GameHeaderProps {
  variant?: "default" | "gameplay";
  showBackButton?: boolean;
  onBack?: () => void;
}

export function GameHeader({
  variant = "default",
  showBackButton = false,
  onBack,
}: GameHeaderProps) {
  if (variant === "gameplay") {
    return (
      <header className="w-full px-6 py-3 flex items-center justify-between bg-ink-900/80 backdrop-blur-md z-50">
        <span className="text-xs text-gold-300/60 font-body font-bold uppercase tracking-[0.2em]">
          ☰
        </span>
        <h1 className="text-sm font-display font-bold text-gold-300 uppercase tracking-[0.25em]">
          The Sovereign Table
        </h1>
        <div className="w-8 h-8 rounded-full bg-navy-800 border-2 border-gold-600/30 overflow-hidden flex items-center justify-center text-sm">
          👤
        </div>
      </header>
    );
  }

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={onBack}
            className="text-gold-300/60 hover:text-gold-300 text-lg"
          >
            ‹
          </button>
        )}
        <Link href="/">
          <h1 className="font-display text-lg font-bold italic text-gold-300 uppercase tracking-[0.15em]">
            Royal Joker
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gold-300/40 text-xl cursor-pointer hover:text-gold-300/70">☰</span>
        <div className="w-10 h-10 rounded-full bg-navy-800 border-2 border-gold-600/20 overflow-hidden flex items-center justify-center">
          <span className="text-lg">👤</span>
        </div>
      </div>
    </header>
  );
}
