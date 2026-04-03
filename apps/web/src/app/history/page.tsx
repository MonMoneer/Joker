"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GameHeader } from "@/components/ui/GameHeader";
import { BottomNav } from "@/components/ui/BottomNav";

const ACHIEVEMENTS = [
  { name: "First Game", icon: "🎮", desc: "Complete your first game", locked: true },
  { name: "King!", icon: "👑", desc: "Earn the King title in a set", locked: true },
  { name: "Perfect Set", icon: "⭐", desc: "Succeed all bids in a set", locked: true },
  { name: "Sharpshooter", icon: "🎯", desc: "90%+ bid accuracy over 5 games", locked: true },
  { name: "Grand Slam", icon: "💥", desc: "Bid all and win all in a 9-card hand", locked: true },
  { name: "Century", icon: "💯", desc: "Play 100 games", locked: true },
];

export default function HistoryPage() {
  const games: any[] = [];

  return (
    <div className="marble-bg font-body flex flex-col min-h-screen">
      <GameHeader />

      <main className="flex-1 flex flex-col px-5 pt-4 pb-28 max-w-2xl mx-auto w-full">
        {/* Page Title */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl font-bold text-ink-900 mb-1">
            Game History
          </h1>
          <p className="text-sm text-ink-600 font-body">
            Your complete record of victories and defeats
          </p>
        </motion.div>

        {/* Game List or Empty State */}
        {games.length === 0 ? (
          <motion.div
            className="flex-1 flex flex-col items-center justify-center text-center py-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <div className="w-24 h-24 rounded-3xl bg-marble-200 flex items-center justify-center mb-5">
              <svg
                className="w-12 h-12 text-marble-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-ink-900 mb-2">
              No Games Yet
            </h2>
            <p className="text-sm text-ink-600 max-w-xs mb-6">
              Play some games and your complete scoring history, rankings, and
              achievements will be tracked here.
            </p>
            <Link href="/play/vs-ai">
              <button className="btn-gold px-8 py-4 text-sm">
                PLAY YOUR FIRST GAME
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Game entries will render here */}
          </div>
        )}

        {/* Rankings Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="font-display text-xl font-bold text-ink-900 mb-3">
            Rankings
          </h2>
          <div className="rounded-3xl bg-navy-900 p-6 text-center">
            <div className="flex justify-center gap-6 mb-3">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-navy-700 mx-auto mb-2 flex items-center justify-center text-marble-400/40">
                  2
                </div>
                <div className="text-xs text-marble-400/40">--</div>
              </div>
              <div className="text-center -mt-3">
                <div className="w-14 h-14 rounded-full bg-gold-700/30 border-2 border-gold-400/40 mx-auto mb-2 flex items-center justify-center text-gold-400 font-bold text-lg">
                  1
                </div>
                <div className="text-xs text-gold-400">--</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-navy-700 mx-auto mb-2 flex items-center justify-center text-marble-400/40">
                  3
                </div>
                <div className="text-xs text-marble-400/40">--</div>
              </div>
            </div>
            <p className="text-xs text-marble-400/30 mt-2">
              Play more games to see rankings and leaderboards
            </p>
          </div>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="font-display text-xl font-bold text-ink-900 mb-3">
            Achievements
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((a) => (
              <div
                key={a.name}
                className={`bg-white rounded-2xl p-4 shadow-sm transition-all ${
                  a.locked ? "opacity-50" : "shadow-md"
                }`}
              >
                <div className="text-3xl mb-2">{a.icon}</div>
                <div className="text-sm font-bold text-ink-900 mb-0.5">
                  {a.name}
                </div>
                <div className="text-xs text-ink-600">{a.desc}</div>
                {a.locked && (
                  <div className="flex items-center gap-1 mt-2">
                    <svg
                      className="w-3 h-3 text-ink-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs text-ink-600">Locked</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
