"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BidAllWonAllEffectProps {
  playerName: string;
  score: number;
  isVisible: boolean;
  onComplete: () => void;
}

export function BidAllWonAllEffect({
  playerName,
  score,
  isVisible,
  onComplete,
}: BidAllWonAllEffectProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    // Auto-dismiss when video ends or after 8 seconds
    const timer = setTimeout(onComplete, 8000);

    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  const handleVideoEnd = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onComplete}
        >
          {/* Winner video */}
          <video
            ref={videoRef}
            src="/sounds/winner.mp4"
            autoPlay
            playsInline
            onEnded={handleVideoEnd}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Overlay text on top of video */}
          <motion.div
            className="relative z-10 text-center pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", damping: 15 }}
          >
            <motion.div
              className="text-5xl md:text-7xl font-display font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              +{score}
            </motion.div>
            <p className="text-xl md:text-2xl text-gold-400 font-bold mt-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {playerName}
            </p>
            <motion.p
              className="text-sm md:text-base text-white/80 mt-1 uppercase tracking-[0.3em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              Bid All — Won All!
            </motion.p>
          </motion.div>

          {/* Tap to skip hint */}
          <motion.p
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/30 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            Tap to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
