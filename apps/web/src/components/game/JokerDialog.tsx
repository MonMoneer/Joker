"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Suit, JokerMode } from "@joker/engine";

const SUITS: { suit: Suit; symbol: string; color: string }[] = [
  { suit: "spades", symbol: "♠", color: "text-navy-900" },
  { suit: "clubs", symbol: "♣", color: "text-navy-900" },
  { suit: "hearts", symbol: "♥", color: "text-error-500" },
  { suit: "diamonds", symbol: "♦", color: "text-error-500" },
];

interface JokerDialogProps {
  isLeading: boolean;
  onConfirm: (mode: JokerMode, suit?: Suit) => void;
  onCancel: () => void;
}

export function JokerDialog({ isLeading, onConfirm, onCancel }: JokerDialogProps) {
  const [mode, setMode] = useState<JokerMode | null>(null);
  const [suit, setSuit] = useState<Suit | null>(null);
  const canConfirm = mode !== null && (!isLeading || suit !== null);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-xl" onClick={onCancel} />

      <motion.div
        className="relative bg-marble-50 rounded-[2rem] max-w-sm w-full mx-4 overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
      >
        {/* Gold accent */}
        <div className="h-1.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-50" />

        {/* Header */}
        <div className="pt-6 px-6 pb-4 text-center">
          <div className="text-gold-600 text-4xl mb-2">🃏</div>
          <h3 className="font-display text-2xl font-bold text-navy-900 tracking-tight">
            Joker
          </h3>
          <p className="text-ink-600 font-body text-sm mt-1">
            Choose mode{isLeading ? " and suit" : ""}
          </p>
        </div>

        {/* Mode buttons */}
        <div className="px-6 grid grid-cols-2 gap-3">
          <button
            className={`py-5 px-4 rounded-2xl font-body font-bold text-sm tracking-[0.15em] uppercase transition-all ${
              mode === "high"
                ? "bg-navy-900 text-white"
                : "bg-navy-800 text-white/80 hover:bg-navy-900"
            }`}
            onClick={() => setMode("high")}
          >
            <span className="text-gold-300 text-xl block mb-1">↑</span>
            High
          </button>
          <button
            className={`py-5 px-4 rounded-2xl font-body font-bold text-sm tracking-[0.15em] uppercase transition-all ${
              mode === "low"
                ? "bg-navy-800 text-white ring-2 ring-gold-400"
                : "bg-navy-800 text-white/80 hover:bg-navy-900"
            }`}
            onClick={() => setMode("low")}
          >
            <span className="text-gold-300 text-xl block mb-1">↓</span>
            Low
          </button>
        </div>

        {/* Suit selection */}
        <AnimatePresence>
          {isLeading && mode !== null && (
            <motion.div
              className="px-6 mt-5"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <h4 className="text-[10px] font-body font-extrabold text-ink-600 uppercase tracking-[0.2em] mb-3">
                Select Suit
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {SUITS.map(({ suit: s, symbol, color }) => (
                  <button
                    key={s}
                    className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${
                      suit === s
                        ? "bg-marble-300 ring-2 ring-navy-900 scale-110"
                        : `bg-marble-200 hover:scale-110 ${color}`
                    }`}
                    onClick={() => setSuit(s)}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="p-5 mt-4 bg-marble-200/50 flex gap-3">
          <button
            className="flex-1 py-3.5 rounded-xl font-body font-bold text-ink-600 text-sm hover:bg-marble-300 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`flex-1 py-3.5 rounded-xl font-body font-bold text-sm uppercase tracking-[0.15em] transition-all ${
              canConfirm
                ? "bg-gold-600 text-white hover:bg-gold-500 shadow-[0_4px_12px_rgba(123,88,0,0.3)]"
                : "bg-marble-400 text-marble-600 cursor-not-allowed"
            }`}
            onClick={() => canConfirm && onConfirm(mode!, isLeading ? suit! : undefined)}
            disabled={!canConfirm}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
