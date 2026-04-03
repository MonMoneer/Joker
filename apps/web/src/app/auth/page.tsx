"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { signup, login } from "@/lib/auth";
import { preloadAllCards } from "@/lib/card-assets";

const AVATARS = [
  "🐔", "🍌", "🎭", "🃏", "👑", "⭐",
  "🎯", "🔥", "💎", "🦊", "🐺", "🦁",
  "🏆", "🎲", "🍀", "🦅", "🐻", "🎪",
  "🌟", "🗡️", "🛡️", "🧙", "🤴", "👸",
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [nameKa, setNameKa] = useState("");
  const [pin, setPin] = useState("");
  const [avatar, setAvatar] = useState("🐔");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nickname.trim() || pin.length !== 4) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        const result = await signup(nickname.trim(), name.trim(), pin, avatar, nameKa.trim() || undefined);
        if (result.error) { setError(result.error); setLoading(false); return; }
      } else {
        const result = await login(nickname.trim(), pin);
        if (result.error) { setError(result.error); setLoading(false); return; }
      }

      // Preload cards while redirecting
      preloadAllCards();
      router.push("/");
    } catch (e) {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="royal-bg font-body flex flex-col min-h-screen items-center justify-center px-5">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-bold gold-shimmer tracking-tight mb-1">
            JOKER
          </h1>
          <p className="font-georgian text-lg text-gold-300/70 tracking-[0.2em]">
            ჯოკერი
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex mb-6 bg-navy-800/60 rounded-full p-1">
          <button
            className={`flex-1 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
              mode === "login"
                ? "bg-gold-400 text-navy-900"
                : "text-marble-400/50 hover:text-marble-400"
            }`}
            onClick={() => { setMode("login"); setError(null); }}
          >
            Log In
          </button>
          <button
            className={`flex-1 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
              mode === "signup"
                ? "bg-gold-400 text-navy-900"
                : "text-marble-400/50 hover:text-marble-400"
            }`}
            onClick={() => { setMode("signup"); setError(null); }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div className="glass-panel p-6 space-y-4">
          {/* Avatar (signup only) */}
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
                  Avatar
                </label>
                <div className="grid grid-cols-8 gap-1.5 mb-4">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      className={`aspect-square rounded-lg text-lg flex items-center justify-center transition-all ${
                        avatar === a
                          ? "bg-gold-700/40 ring-2 ring-gold-400 scale-110"
                          : "bg-navy-700/60 hover:bg-navy-700"
                      }`}
                      onClick={() => setAvatar(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nickname */}
          <div>
            <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-1.5">
              Nickname
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400/30 text-sm">@</span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.replace(/\s/g, ""))}
                placeholder="your_nickname"
                className="input-royal !pl-8"
                maxLength={15}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>

          {/* Name (signup only) */}
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div>
                  <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input-royal"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-1.5">
                    Georgian Name <span className="text-marble-400/20 normal-case tracking-normal">(optional)</span>
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* PIN */}
          <div>
            <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-1.5">
              4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className="input-royal text-center text-2xl tracking-[0.5em]"
              maxLength={4}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Error */}
          {error && (
            <motion.p
              className="text-error-500 text-sm text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <button
            className="btn-gold w-full py-4 text-sm disabled:opacity-40"
            onClick={handleSubmit}
            disabled={loading || !nickname.trim() || pin.length !== 4 || (mode === "signup" && !name.trim())}
          >
            {loading ? "..." : mode === "signup" ? "CREATE ACCOUNT" : "LOG IN"}
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-marble-400/20 mt-6">
          {mode === "login"
            ? "Don't have an account? Tap Sign Up above"
            : "Already have an account? Tap Log In above"}
        </p>
      </motion.div>
    </div>
  );
}
