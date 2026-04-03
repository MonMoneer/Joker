"use client";

import { useMemo } from "react";
import { getTranslations } from "@joker/i18n";
import { useUIStore } from "@/stores/game-store";

export function useI18n() {
  const language = useUIStore((s) => s.language);
  const t = useMemo(() => getTranslations(language), [language]);
  return { t, language };
}
