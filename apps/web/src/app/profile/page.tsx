"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/ui/GameHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { useUserStore } from "@/stores/game-store";
import { isNicknameValid, isNicknameTaken } from "@/lib/user-system";

const AVATARS = [
  "🐔", "🍌", "🎭", "🃏", "👑", "⭐",
  "🎯", "🔥", "💎", "🦊", "🐺", "🦁",
  "🏆", "🎲", "🍀", "🦅", "🐻", "🎪",
  "🌟", "🗡️", "🛡️", "🧙", "🤴", "👸",
];

const STATS = [
  { label: "Games Played", value: "0", icon: "🎮" },
  { label: "Win Rate", value: "--", icon: "🏆" },
  { label: "Best Score", value: "--", icon: "⭐" },
  { label: "Kings Earned", value: "0", icon: "👑" },
  { label: "Bid Accuracy", value: "--", icon: "🎯" },
  { label: "Win Streak", value: "0", icon: "🔥" },
];

export default function ProfilePage() {
  const { profile, friends, isLoggedIn, loadUser, createUser, saveUser, addFriend, removeFriend, loadFriends } =
    useUserStore();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [nameKa, setNameKa] = useState("");
  const [avatar, setAvatar] = useState("🐔");
  const [saved, setSaved] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // Friends
  const [friendNickname, setFriendNickname] = useState("");
  const [friendError, setFriendError] = useState<string | null>(null);
  const [friendSuccess, setFriendSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
    loadFriends();
  }, [loadUser, loadFriends]);

  // Pre-fill form from existing profile
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setNickname(profile.nickname);
      setNameKa(profile.nameKa || "");
      setAvatar(profile.avatar);
    }
  }, [profile]);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (value.length > 0) {
      const validation = isNicknameValid(value);
      if (!validation.valid) {
        setNicknameError(validation.error || null);
      } else if (isNicknameTaken(value, profile?.id)) {
        setNicknameError("This nickname is already taken");
      } else {
        setNicknameError(null);
      }
    } else {
      setNicknameError(null);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !nickname.trim()) return;
    const validation = isNicknameValid(nickname);
    if (!validation.valid) return;
    if (isNicknameTaken(nickname, profile?.id)) return;

    if (isLoggedIn && profile) {
      saveUser({ name, nickname, nameKa, avatar });
    } else {
      createUser(name, nickname, avatar, nameKa);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddFriend = () => {
    if (!friendNickname.trim()) return;
    const result = addFriend(friendNickname.trim());
    if (result.success) {
      setFriendSuccess(`Added ${friendNickname}!`);
      setFriendError(null);
      setFriendNickname("");
      setTimeout(() => setFriendSuccess(null), 2000);
    } else {
      setFriendError(result.error || "Failed to add friend");
      setFriendSuccess(null);
    }
  };

  const canSave =
    name.trim().length > 0 &&
    nickname.trim().length >= 3 &&
    !nicknameError;

  return (
    <div className="marble-bg font-body flex flex-col min-h-screen">
      <GameHeader />

      <main className="flex-1 flex flex-col px-5 pt-4 pb-28 max-w-lg mx-auto w-full">
        {/* Page Title */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-3xl font-bold text-ink-900">
              Profile
            </h1>
            {isLoggedIn && (
              <span className="text-[10px] font-bold text-gold-600 bg-gold-100 px-3 py-1 rounded-full uppercase tracking-[0.15em]">
                @{profile?.nickname}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-600">
            {isLoggedIn
              ? "Manage your identity and friends"
              : "Create your player identity"}
          </p>
        </motion.div>

        {/* Profile Panel */}
        <motion.div
          className="glass-panel p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Avatar Grid */}
          <div className="mb-5">
            <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-3">
              Choose Your Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  className={`w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                    avatar === a
                      ? "bg-gold-700/40 ring-2 ring-gold-400 scale-110 shadow-[0_0_12px_rgba(253,195,77,0.3)]"
                      : "bg-navy-700/60 hover:bg-navy-700"
                  }`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gold-400/10 mb-5" />

          {/* Nickname (unique identifier) */}
          <div className="mb-4">
            <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
              Nickname
              <span className="text-gold-300/30 ml-1 normal-case tracking-normal">
                (unique, shown on table)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400/40 text-sm">@</span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value.replace(/\s/g, ""))}
                placeholder="your_nickname"
                className="input-royal !pl-8"
                maxLength={15}
                disabled={isLoggedIn && !!profile?.nickname}
              />
            </div>
            {nicknameError && (
              <p className="text-xs text-error-500 mt-1">{nicknameError}</p>
            )}
            {isLoggedIn && profile?.nickname && (
              <p className="text-[10px] text-gold-400/30 mt-1">
                Nickname cannot be changed after creation
              </p>
            )}
          </div>

          {/* Display Name */}
          <div className="mb-4">
            <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="input-royal"
              maxLength={20}
            />
          </div>

          {/* Georgian Name */}
          <div className="mb-5">
            <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
              Georgian Name
              <span className="text-marble-400/30 ml-1 normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={nameKa}
              onChange={(e) => setNameKa(e.target.value)}
              placeholder="სახელი"
              className="input-royal font-georgian"
              maxLength={20}
            />
          </div>

          {/* Save Button */}
          <button
            className="btn-gold w-full py-4 text-sm"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saved ? "PROFILE SAVED!" : isLoggedIn ? "UPDATE PROFILE" : "CREATE PROFILE"}
          </button>
        </motion.div>

        {/* Friends Section */}
        {isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-xl font-bold text-ink-900 mb-3">
              Friends
            </h2>

            {/* Add friend */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/30 text-sm">@</span>
                  <input
                    type="text"
                    value={friendNickname}
                    onChange={(e) => {
                      setFriendNickname(e.target.value.replace(/\s/g, ""));
                      setFriendError(null);
                    }}
                    placeholder="Enter nickname"
                    className="w-full pl-8 pr-3 py-2.5 bg-marble-200 rounded-xl text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30"
                    maxLength={15}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                  />
                </div>
                <button
                  className="px-4 py-2.5 bg-navy-900 text-gold-300 rounded-xl text-sm font-bold hover:bg-navy-800 transition-colors disabled:opacity-40"
                  onClick={handleAddFriend}
                  disabled={!friendNickname.trim()}
                >
                  Add
                </button>
              </div>
              {friendError && (
                <p className="text-xs text-error-500 mt-2">{friendError}</p>
              )}
              {friendSuccess && (
                <p className="text-xs text-success-600 mt-2">{friendSuccess}</p>
              )}
            </div>

            {/* Friend list */}
            {friends.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <p className="text-ink-600 text-sm">No friends yet</p>
                <p className="text-ink-600/50 text-xs mt-1">
                  Add friends by their nickname to invite them to games
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.nickname}
                    className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-marble-200 flex items-center justify-center text-xl">
                      {friend.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink-900 truncate">
                        {friend.name}
                      </div>
                      <div className="text-xs text-ink-600">@{friend.nickname}</div>
                    </div>
                    <button
                      className="text-xs text-error-500/60 hover:text-error-500 px-2 py-1"
                      onClick={() => removeFriend(friend.nickname)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Player Stats */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-xl font-bold text-ink-900 mb-3">
            Your Stats
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-4 shadow-sm text-center"
              >
                <div className="text-2xl mb-1.5 opacity-70">{stat.icon}</div>
                <div className="text-2xl font-black font-mono text-ink-900">
                  {stat.value}
                </div>
                <div className="text-[11px] text-ink-600 font-semibold uppercase tracking-wider mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monarch Suite CTA */}
        <motion.div
          className="mt-6 rounded-3xl bg-navy-900 p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-3xl mb-2">👑</div>
          <h3 className="font-display text-lg font-bold text-gold-300 mb-1">
            Monarch Suite Access
          </h3>
          <p className="text-xs text-marble-400/40 mb-4 max-w-xs mx-auto">
            Unlock premium features: exclusive avatars, detailed analytics,
            custom themes, and priority matchmaking.
          </p>
          <button className="btn-glass text-sm px-6 py-3">COMING SOON</button>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
