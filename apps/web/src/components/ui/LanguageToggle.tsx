"use client";

import { useUIStore } from "@/stores/game-store";

export function LanguageToggle() {
  const { language, setLanguage } = useUIStore();

  return (
    <button
      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 rounded-lg text-sm font-semibold transition-colors"
      onClick={() => setLanguage(language === "en" ? "ka" : "en")}
      title={language === "en" ? "Switch to Georgian" : "Switch to English"}
    >
      {language === "en" ? "🇬🇪 ქარ" : "🇬🇧 EN"}
    </button>
  );
}
