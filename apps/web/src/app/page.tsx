"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameHeader } from "@/components/ui/GameHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

export default function Home() {
  return (
    <div className="royal-bg flex flex-col">
      <GameHeader variant="default" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-7xl md:text-9xl font-bold gold-shimmer tracking-tight">
            JOKER
          </h1>
          <p className="font-georgian text-2xl md:text-3xl text-gold-300 mt-1 tracking-[0.3em]">
            ჯოკერი
          </p>
        </motion.div>

        {/* Floating card shapes */}
        <motion.div
          className="flex items-end gap-3 mb-10"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {[
            { icon: "♠", rotate: -12, y: 0 },
            { icon: "★", rotate: 0, y: -8 },
            { icon: "♥", rotate: 12, y: 0 },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="w-24 h-36 md:w-28 md:h-40 rounded-xl bg-navy-800 flex items-center justify-center"
              style={{
                transform: `rotate(${card.rotate}deg)`,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                border: "1px solid rgba(247,189,72,0.15)",
              }}
              animate={{ y: [card.y, card.y - 6, card.y] }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            >
              <span className="text-gold-400 text-4xl md:text-5xl opacity-60">
                {card.icon}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <Link href="/play/vs-ai">
            <button className="btn-gold w-full">Singleplayer</button>
          </Link>
          <Link href="/play/online">
            <button className="btn-glass w-full">Multiplayer</button>
          </Link>
          <Link href="/play/calculator">
            <button className="btn-glass w-full">Score Calculator</button>
          </Link>
          <Link href="/groups">
            <button className="btn-glass w-full">My Groups</button>
          </Link>
          <div className="flex gap-3 mt-1">
            <Link href="/history" className="flex-1">
              <button className="btn-glass w-full !py-3 !text-sm opacity-60">
                History
              </button>
            </Link>
            <Link href="/profile" className="flex-1">
              <button className="btn-glass w-full !py-3 !text-sm opacity-60">
                Profile
              </button>
            </Link>
          </div>
        </motion.div>
      </main>

      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
