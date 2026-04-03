"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocalGame } from "@/hooks/useLocalGame";
import { GameBoard } from "@/components/game/GameBoard";
import type { GameSettings } from "@joker/engine";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllGroupFriends, type GroupMember } from "@/lib/groups";

export default function VsAIPage() {
  const router = useRouter();
  const { gameState, error, initGame, placeBid, playCard, jokerChoice, nextHand } =
    useLocalGame();

  const [nickname, setNickname] = useState("");
  const [botLevel, setBotLevel] = useState<"easy" | "medium" | "hard">("medium");
  const [histPenalty, setHistPenalty] = useState(false);
  const [histAmount, setHistAmount] = useState<-200 | -500>(-200);

  // Friends from groups
  const [friends, setFriends] = useState<GroupMember[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<GroupMember[]>([]);

  useEffect(() => {
    const session = getSession();
    if (session) setNickname(session.nickname);
    getAllGroupFriends().then(setFriends).catch(() => {});
  }, []);

  const toggleInvite = (friend: GroupMember) => {
    if (invitedFriends.some((f) => f.id === friend.id)) {
      setInvitedFriends(invitedFriends.filter((f) => f.id !== friend.id));
    } else if (invitedFriends.length < 3) {
      setInvitedFriends([...invitedFriends, friend]);
    }
  };

  const startGame = () => {
    if (!nickname) return;
    const settings: GameSettings = {
      histPenalty,
      histPenaltyAmount: histAmount,
      couplesMode: false,
    };
    initGame(nickname, settings, botLevel);
  };

  if (gameState) {
    return (
      <GameBoard
        gameState={gameState}
        myPlayerIndex={0}
        onBid={placeBid}
        onPlayCard={playCard}
        onJokerChoice={jokerChoice}
        onNextHand={nextHand}
      />
    );
  }

  return (
    <div className="royal-bg flex flex-col min-h-screen">
      <div className="px-5 py-4 flex items-center justify-between safe-top">
        <button
          onClick={() => router.push("/")}
          className="text-gold-300/60 hover:text-gold-300 flex items-center gap-1 text-sm"
        >
          <span className="text-lg">‹</span> Back
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center px-5 pb-28 overflow-y-auto">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-gold-300">
              Singleplayer
            </h1>
            <p className="text-xs text-gold-300/40 uppercase tracking-[0.2em] mt-1">
              Playing as <strong className="text-gold-400">@{nickname}</strong>
            </p>
          </div>

          <div className="glass-panel p-5 space-y-6">
            {/* Invite Friends from Groups */}
            {friends.length > 0 && (
              <div>
                <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
                  Invite Friends ({invitedFriends.length}/3)
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {friends.map((f) => {
                    const isInvited = invitedFriends.some((inv) => inv.id === f.id);
                    return (
                      <button
                        key={f.id}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left ${
                          isInvited
                            ? "bg-gold-700/30 border border-gold-400/30"
                            : "bg-navy-800/40 hover:bg-navy-800/60"
                        }`}
                        onClick={() => toggleInvite(f)}
                      >
                        <span className="text-lg">{f.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-marble-100 truncate block">{f.name}</span>
                          <span className="text-[10px] text-gold-400/50">@{f.nickname}</span>
                        </div>
                        <span className="text-xs text-gold-400">
                          {isInvited ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {invitedFriends.length > 0 && (
                  <p className="text-[10px] text-gold-400/30 mt-1.5">
                    {3 - invitedFriends.length} AI bot{3 - invitedFriends.length !== 1 ? "s" : ""} will fill remaining seats
                  </p>
                )}
              </div>
            )}

            {/* Bot Level */}
            <div>
              <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
                AI Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map((level) => {
                  const labels = { easy: "Newbie", medium: "Pro", hard: "Master" };
                  return (
                    <button
                      key={level}
                      className={`py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                        botLevel === level
                          ? "border-2 border-gold-300 bg-gold-300/10 text-gold-300"
                          : "border border-gold-300/15 bg-navy-800/30 text-marble-400"
                      }`}
                      onClick={() => setBotLevel(level)}
                    >
                      {labels[level]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hist Penalty */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-marble-200">Hist Penalty</span>
              <button
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  histPenalty ? "bg-gold-400" : "bg-navy-800 border border-gold-300/15"
                }`}
                onClick={() => setHistPenalty(!histPenalty)}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                    histPenalty ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {histPenalty && (
              <div className="flex gap-2">
                {([-200, -500] as const).map((amt) => (
                  <button
                    key={amt}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      histAmount === amt
                        ? "bg-error-500/80 text-white"
                        : "bg-navy-800/40 text-marble-400 border border-gold-300/10"
                    }`}
                    onClick={() => setHistAmount(amt)}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            )}

            {/* Start */}
            <button className="btn-gold w-full !mt-6" onClick={startGame}>
              START MATCH
            </button>
          </div>

          {error && (
            <div className="mt-4 glass-panel p-3 text-error-500 text-sm">{error}</div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
