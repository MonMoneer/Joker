"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Play", icon: "🃏" },
  { href: "/history", label: "History", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide during active gameplay
  if (pathname.startsWith("/play/vs-ai") || pathname.startsWith("/play/online/")) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/play");
    return pathname.startsWith(href);
  };

  return (
    <nav className="bottom-nav glass-nav flex justify-around items-center">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`bottom-nav-item ${
            isActive(tab.href) ? "bottom-nav-item-active" : ""
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
