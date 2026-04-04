"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { BottomNav } from "@/components/ui/BottomNav";
import {
  getMyGroups,
  getGroupMembers,
  leaveGroup,
  type Group,
  type GroupMember,
} from "@/lib/groups";
import { getSession, type AuthUser } from "@/lib/auth";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();

  const [session, setSession] = useState<AuthUser | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.push("/auth");
      return;
    }
    setSession(currentSession);
    loadGroupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function loadGroupData() {
    setLoading(true);

    // Find the group from my groups by code
    const myGroups = await getMyGroups();
    const found = myGroups.find((g) => g.code === code);

    if (!found) {
      // Not a member or group doesn't exist
      setLoading(false);
      return;
    }

    setGroup(found);

    // Load members
    const memberList = await getGroupMembers(found.id);
    setMembers(memberList);
    setLoading(false);
  }

  async function handleCopyCode() {
    const shareUrl = `${window.location.origin}/groups/${code}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy just the code
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard not available
      }
    }
  }

  async function handleLeave() {
    if (!group || leaving) return;
    setLeaving(true);

    const { error } = await leaveGroup(group.id);

    if (error) {
      setLeaving(false);
      setShowLeaveConfirm(false);
      return;
    }

    router.push("/groups");
  }

  const isOwner = (memberId: string) => group?.created_by === memberId;

  function handleCreateOnlineTable() {
    router.push(`/play/online?autocreate=1`);
  }

  function handlePlayVsAI() {
    router.push(`/play/vs-ai`);
  }

  if (loading) {
    return (
      <div className="royal-bg flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="text-gold-300/40 text-sm font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Loading group...
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="royal-bg flex flex-col min-h-screen">
        <header className="w-full px-6 py-4 flex items-center gap-3 z-50">
          <button
            onClick={() => router.push("/groups")}
            className="text-gold-300/60 hover:text-gold-300 text-2xl"
          >
            ‹
          </button>
          <h1 className="font-display text-lg font-bold text-gold-300 uppercase tracking-[0.1em]">
            Group Not Found
          </h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-navy-800 border border-gold-400/10 flex items-center justify-center mb-4">
            <span className="text-4xl opacity-40">🔍</span>
          </div>
          <h2 className="font-display text-xl font-bold text-gold-300 mb-2">
            Group Not Found
          </h2>
          <p className="text-sm text-gold-300/40 font-body max-w-xs mb-6">
            This group does not exist or you are not a member. Ask for an invite
            code to join.
          </p>
          <button
            className="btn-gold px-8 py-3 text-sm"
            onClick={() => router.push("/groups")}
          >
            BACK TO GROUPS
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="royal-bg flex flex-col min-h-screen">
      {/* Header with back button */}
      <header className="w-full px-6 py-4 flex items-center gap-3 z-50">
        <button
          onClick={() => router.push("/groups")}
          className="text-gold-300/60 hover:text-gold-300 text-2xl transition-colors"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-bold text-gold-300 truncate">
            {group.name}
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5 pb-28 max-w-lg mx-auto w-full">
        {/* Group Code Display */}
        <motion.div
          className="glass-panel p-6 mb-5 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs text-gold-400/50 uppercase tracking-wider font-bold mb-3">
            Invite Code
          </p>
          <div className="font-mono text-4xl font-bold text-gold-300 tracking-[0.35em] gold-shimmer mb-4">
            {code}
          </div>
          <button
            className="btn-glass px-6 py-2.5 text-sm inline-flex items-center gap-2"
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <span className="text-green-400">&#10003;</span>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Copy Link
              </>
            )}
          </button>
        </motion.div>

        {/* Create Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mb-5"
        >
          <div className="glass-panel p-5 space-y-3">
            <h3 className="font-display text-lg font-bold text-gold-300 text-center mb-1">Create Table</h3>
            <button className="btn-gold w-full py-3.5 text-sm font-bold tracking-wider flex items-center justify-center gap-2"
              onClick={handleCreateOnlineTable}>
              <span>🔗</span> PLAY ONLINE (SHARE LINK)
            </button>
            <button className="btn-glass w-full py-3.5 text-sm font-bold tracking-wider"
              onClick={handlePlayVsAI}>
              PLAY VS AI
            </button>
          </div>
        </motion.div>

        {/* Members List */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-bold text-gold-300">
              Members
            </h2>
            <span className="text-xs text-gold-400/40 font-body">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>

          <div className="space-y-2">
            {members.map((member, i) => (
              <motion.div
                key={member.id}
                className="glass-panel p-3.5 flex items-center gap-3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-navy-700 border border-gold-400/15 flex items-center justify-center text-xl shrink-0">
                  {member.avatar || "👤"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gold-300 truncate">
                      {member.name}
                    </span>
                    {isOwner(member.id) && (
                      <span className="text-[10px] font-bold text-amber-900 bg-gold-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Owner
                      </span>
                    )}
                    {session?.id === member.id && !isOwner(member.id) && (
                      <span className="text-[10px] font-bold text-gold-400/60 border border-gold-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gold-400/40 truncate">
                    @{member.nickname}
                  </p>
                </div>

              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Leaderboard Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-5"
        >
          <h2 className="font-display text-xl font-bold text-gold-300 mb-3">
            Leaderboard
          </h2>
          <div className="glass-panel p-6 text-center">
            <div className="flex justify-center gap-6 mb-3">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-navy-700 mx-auto mb-2 flex items-center justify-center text-gold-400/30">
                  2
                </div>
                <div className="text-xs text-gold-400/30">--</div>
              </div>
              <div className="text-center -mt-3">
                <div className="w-14 h-14 rounded-full bg-gold-700/20 border-2 border-gold-400/30 mx-auto mb-2 flex items-center justify-center text-gold-400 font-bold text-lg">
                  1
                </div>
                <div className="text-xs text-gold-400/50">--</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-navy-700 mx-auto mb-2 flex items-center justify-center text-gold-400/30">
                  3
                </div>
                <div className="text-xs text-gold-400/30">--</div>
              </div>
            </div>
            <p className="text-xs text-gold-300/30 mt-2 font-body">
              Play more games to see rankings
            </p>
          </div>
        </motion.div>

        {/* Leave Group Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-auto pt-4"
        >
          <AnimatePresence mode="wait">
            {!showLeaveConfirm ? (
              <motion.button
                key="leave-btn"
                className="w-full py-3.5 rounded-xl border border-red-500/20 text-red-400/70 text-sm font-bold
                           hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                onClick={() => setShowLeaveConfirm(true)}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                Leave Group
              </motion.button>
            ) : (
              <motion.div
                key="leave-confirm"
                className="glass-panel p-5 border-red-500/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-gold-300 text-center mb-1 font-semibold">
                  Leave &ldquo;{group.name}&rdquo;?
                </p>
                <p className="text-xs text-gold-300/40 text-center mb-4 font-body">
                  You can rejoin later with the group code.
                </p>
                <div className="flex gap-3">
                  <button
                    className="flex-1 btn-glass py-3 text-sm"
                    onClick={() => setShowLeaveConfirm(false)}
                    disabled={leaving}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-3 rounded-xl bg-red-600/80 text-white text-sm font-bold
                               hover:bg-red-600 transition-colors disabled:opacity-50"
                    onClick={handleLeave}
                    disabled={leaving}
                  >
                    {leaving ? "Leaving..." : "Leave"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
