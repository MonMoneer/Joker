"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem("joker_install_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return; // 24h cooldown
    }

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show instructions after 3 seconds
    if (ios) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("joker_install_dismissed", Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-20 left-4 right-4 z-50 glass-panel p-4 flex items-center gap-3 shadow-2xl"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
      >
        <div className="w-12 h-12 rounded-xl bg-navy-700 flex items-center justify-center text-2xl shrink-0">
          🃏
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gold-300">Install Royal Joker</p>
          <p className="text-[10px] text-marble-400/50 mt-0.5">
            {isIOS
              ? "Tap Share ↗ then 'Add to Home Screen'"
              : "Play fullscreen, no browser bar"}
          </p>
        </div>
        {isIOS ? (
          <button
            className="text-xs text-marble-400/40 px-2 py-1"
            onClick={handleDismiss}
          >
            ✕
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="text-xs text-marble-400/30 px-2"
              onClick={handleDismiss}
            >
              Later
            </button>
            <button
              className="px-4 py-2 bg-gold-400 text-navy-900 rounded-lg text-xs font-bold"
              onClick={handleInstall}
            >
              Install
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
