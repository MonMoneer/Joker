"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { preloadAllCards } from "@/lib/card-assets";

const PUBLIC_ROUTES = ["/auth"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const session = getSession();
    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

    if (!session && !isPublic) {
      router.replace("/auth");
      return;
    }

    if (session && pathname === "/auth") {
      router.replace("/");
      return;
    }

    if (session) {
      preloadAllCards();
    }

    setAuthed(!!session || isPublic);
    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    // Brief loading screen while checking auth
    return (
      <div className="royal-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold gold-shimmer mb-2">JOKER</h1>
          <p className="text-marble-400/30 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
}
