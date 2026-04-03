"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/ui/BottomNav";
import { useUserStore } from "@/stores/game-store";
import { searchUsers } from "@/lib/user-system";
import type { UserProfile } from "@/lib/user-system";

export default function OnlineLobbyPage() {
  const { profile, isLoggedIn, loadUser } = useUserStore();
  const [view, setView] = useState<"setup" | "lobby">("setup");
  const [joinMode, setJoinMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<UserProfile[]>([]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Pre-fill name from profile
  useEffect(() => {
    if (isLoggedIn && profile) {
      setPlayerName(profile.nickname || profile.name);
    }
  }, [isLoggedIn, profile]);
  const [roomCode, setRoomCode] = useState("");
  const [histPenalty, setHistPenalty] = useState(false);
  const [histAmount, setHistAmount] = useState<-200 | -500>(-200);
  const [couplesMode, setCouplesMode] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [players, setPlayers] = useState<
    { name: string; isHost: boolean; isAI: boolean }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    if (!playerName.trim()) return;
    const code = Array.from({ length: 4 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 28)]
    ).join("");
    setCreatedCode(code);
    setPlayers([{ name: playerName, isHost: true, isAI: false }]);
    setView("lobby");
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    setError(
      "Server not connected yet. Start the server with: pnpm --filter @joker/server dev"
    );
  };

  const addAI = () => {
    const aiNames = ["Bot Alpha", "Bot Beta", "Bot Gamma"];
    if (players.length < 4) {
      setPlayers([
        ...players,
        { name: aiNames[players.length - 1], isHost: false, isAI: true },
      ]);
    }
  };

  const copyInvite = () => {
    const url = `${window.location.origin}/play/online?join=${createdCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Lobby View ──
  if (view === "lobby") {
    return (
      <div className="royal-bg font-body flex flex-col">
        <main className="flex-1 flex flex-col items-center px-5 pt-10 pb-28">
          <motion.div
            className="max-w-md w-full"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-gold-300 mb-1">
                Game Lobby
              </h1>
              <motion.p
                className="text-sm text-marble-400/50 uppercase tracking-[0.2em] font-body font-semibold"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                Waiting for contenders...
              </motion.p>
            </div>

            {/* Room Code */}
            <div className="glass-panel p-6 mb-6 text-center">
              <p className="text-xs text-gold-400/60 uppercase tracking-[0.25em] font-bold mb-3">
                Secret Room Code
              </p>
              <p className="text-5xl font-mono font-black text-gold-400 tracking-[0.3em] mb-4">
                {createdCode}
              </p>
              <button
                onClick={copyInvite}
                className="btn-glass text-sm px-6 py-3"
              >
                {copied ? "LINK COPIED!" : "COPY INVITE LINK"}
              </button>
            </div>

            {/* Player List */}
            <div className="space-y-3 mb-6">
              <p className="text-xs text-marble-400/40 uppercase tracking-[0.15em] font-bold">
                Players ({players.length}/4)
              </p>

              {players.map((player, i) => (
                <motion.div
                  key={i}
                  className={`glass-panel flex items-center gap-3 p-4 ${
                    player.isHost ? "border-l-4 border-l-gold-400" : ""
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-lg">
                    {player.isAI ? "🤖" : player.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <span className="text-marble-100 font-semibold">
                      {player.name}
                    </span>
                    {player.isAI && (
                      <span className="ml-2 text-xs text-ink-600 bg-navy-700 px-2 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  {player.isHost && (
                    <span className="text-xs font-bold text-gold-400 bg-gold-700/30 px-3 py-1 rounded-full uppercase tracking-wider">
                      Host
                    </span>
                  )}
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      player.isHost
                        ? "bg-success-500"
                        : player.isAI
                          ? "bg-gold-400"
                          : "bg-success-500"
                    }`}
                  />
                </motion.div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: 4 - players.length }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-4 rounded-3xl border-2 border-dashed border-navy-700/60"
                >
                  <div className="w-10 h-10 rounded-full bg-navy-800/50 flex items-center justify-center text-ink-600">
                    ?
                  </div>
                  <span className="text-ink-600 text-sm">
                    Waiting for player...
                  </span>
                </div>
              ))}
            </div>

            {/* Invite by Nickname */}
            {players.length < 4 && (
              <div className="glass-panel p-4 mb-4">
                <p className="text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
                  Invite by Nickname
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400/30 text-sm">@</span>
                    <input
                      type="text"
                      value={inviteQuery}
                      onChange={(e) => {
                        const q = e.target.value.replace(/\s/g, "");
                        setInviteQuery(q);
                        setInviteResults(q.length >= 2 ? searchUsers(q) : []);
                      }}
                      placeholder="Search nickname..."
                      className="input-royal !pl-8 !py-2.5 text-sm"
                      maxLength={15}
                    />
                  </div>
                </div>
                {inviteResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {inviteResults.slice(0, 4).map((user) => (
                      <button
                        key={user.id}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                        onClick={() => {
                          if (players.length < 4) {
                            setPlayers([
                              ...players,
                              { name: user.nickname, isHost: false, isAI: false },
                            ]);
                            setInviteQuery("");
                            setInviteResults([]);
                          }
                        }}
                      >
                        <span className="text-lg">{user.avatar}</span>
                        <div className="flex-1">
                          <span className="text-sm text-marble-100">{user.name}</span>
                          <span className="text-xs text-gold-400/60 ml-1">@{user.nickname}</span>
                        </div>
                        <span className="text-[9px] text-gold-400 uppercase font-bold">Invite</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Summary */}
            <div className="glass-panel p-4 mb-6 text-center">
              <p className="text-xs text-marble-400/40 uppercase tracking-wider mb-1 font-bold">
                Game Rules
              </p>
              <p className="text-sm text-marble-400/60">
                {histPenalty ? `Hist Penalty: ${histAmount}` : "No Hist Penalty"}{" "}
                &middot; {couplesMode ? "Couples Mode" : "Solo Mode"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={addAI} className="btn-glass flex-1 py-4 text-sm">
                + ADD AI
              </button>
              <button
                className="btn-gold flex-1 py-4 text-sm"
                disabled={players.length !== 4}
              >
                START GAME
              </button>
            </div>
          </motion.div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── Join/Create View ──
  return (
    <div className="royal-bg font-body flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-28">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-gold-300 mb-2">
              Multiplayer
            </h1>
            <p className="text-sm text-marble-400/40 uppercase tracking-[0.2em] font-body">
              Challenge your rivals
            </p>
          </div>

          {/* Main Panel */}
          <div className="glass-panel p-6 space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="input-royal"
                maxLength={20}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className="btn-gold flex-1 py-4 text-sm"
                onClick={handleCreate}
                disabled={!playerName.trim()}
              >
                CREATE ROOM
              </button>
              <button
                className="btn-glass flex-1 py-4 text-sm"
                onClick={() => setJoinMode(!joinMode)}
              >
                JOIN ROOM
              </button>
            </div>

            {/* Join Mode: Room Code Input */}
            <AnimatePresence>
              {joinMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
                    Room Code
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) =>
                        setRoomCode(e.target.value.toUpperCase())
                      }
                      placeholder="ABCD"
                      className="input-royal flex-1 text-center text-3xl font-mono tracking-[0.4em] uppercase"
                      maxLength={4}
                    />
                    <button
                      className="btn-gold px-6 text-sm"
                      onClick={handleJoin}
                      disabled={
                        !playerName.trim() || roomCode.length !== 4
                      }
                    >
                      JOIN
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div className="h-px bg-gold-400/10" />

            {/* Settings */}
            <div className="space-y-4">
              <p className="text-xs text-gold-400/60 uppercase tracking-wider font-bold">
                Game Settings
              </p>

              {/* Hist Penalty Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-marble-300 font-body">
                  Hist Penalty
                </span>
                <button
                  onClick={() => setHistPenalty(!histPenalty)}
                  className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                    histPenalty
                      ? "bg-amber-500 shadow-[0_0_12px_rgba(253,195,77,0.3)]"
                      : "bg-navy-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-200 ${
                      histPenalty ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {histPenalty && (
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <button
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      histAmount === -200
                        ? "bg-amber-500 text-navy-900"
                        : "bg-navy-700 text-marble-400/60"
                    }`}
                    onClick={() => setHistAmount(-200)}
                  >
                    -200
                  </button>
                  <button
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      histAmount === -500
                        ? "bg-amber-500 text-navy-900"
                        : "bg-navy-700 text-marble-400/60"
                    }`}
                    onClick={() => setHistAmount(-500)}
                  >
                    -500
                  </button>
                </motion.div>
              )}

              {/* Couples Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-marble-300 font-body">
                  Couples Mode
                </span>
                <button
                  onClick={() => setCouplesMode(!couplesMode)}
                  className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                    couplesMode
                      ? "bg-amber-500 shadow-[0_0_12px_rgba(253,195,77,0.3)]"
                      : "bg-navy-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-200 ${
                      couplesMode ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="p-4 bg-error-500/20 rounded-xl text-error-100 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
