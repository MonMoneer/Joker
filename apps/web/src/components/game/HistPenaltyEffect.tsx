"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HistPenaltyEffectProps {
  playerName: string;
  amount: number; // -200 or -500
  isVisible: boolean;
  onComplete: () => void;
}

const SAD_EMOJIS = ["😢", "😭", "💔", "😿", "🥺", "😞", "😔", "😩", "😫", "🤦"];

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number; // % from left
  delay: number;
  duration: number;
}

export function HistPenaltyEffect({
  playerName,
  amount,
  isVisible,
  onComplete,
}: HistPenaltyEffectProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    if (!isVisible) return;

    // Generate floating emojis
    const newEmojis: FloatingEmoji[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      emoji: SAD_EMOJIS[Math.floor(Math.random() * SAD_EMOJIS.length)],
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }));
    setEmojis(newEmojis);

    // Play sound
    try {
      const audio = new Audio("/sounds/hist-penalty.mp3");
      audio.volume = 0.7;
      audio.play().catch(() => {});
      audioRef.current = audio;
    } catch {}

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-navy-900/40" />

          {/* Floating sad emojis rising up */}
          {emojis.map((e) => (
            <motion.div
              key={e.id}
              className="absolute text-3xl md:text-4xl select-none"
              style={{ left: `${e.x}%` }}
              initial={{ bottom: -50, opacity: 0, scale: 0.5 }}
              animate={{
                bottom: "110%",
                opacity: [0, 1, 1, 0.5, 0],
                scale: [0.5, 1.2, 1, 0.8, 0.6],
                rotate: [0, -10, 10, -5, 0],
              }}
              transition={{
                duration: e.duration,
                delay: e.delay,
                ease: "easeOut",
              }}
            >
              {e.emoji}
            </motion.div>
          ))}

          {/* Center penalty text */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ delay: 0.3, type: "spring", damping: 12 }}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl md:text-8xl font-display font-black text-error-500"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: 3, duration: 0.4 }}
              >
                {amount}
              </motion.div>
              <p className="text-lg md:text-xl text-marble-100 font-bold mt-2">
                {playerName}
              </p>
              <p className="text-sm text-error-500/60 mt-1 uppercase tracking-wider">
                Hist Penalty
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
