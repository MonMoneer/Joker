"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function JoinRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();

  useEffect(() => {
    if (code) router.replace(`/play/online?join=${code}`);
  }, [code, router]);

  return (
    <div className="royal-bg flex items-center justify-center min-h-screen">
      <p className="text-gold-300/50 font-body animate-pulse">Joining game...</p>
    </div>
  );
}
