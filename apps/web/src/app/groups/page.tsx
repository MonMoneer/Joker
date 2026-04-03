"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GameHeader } from "@/components/ui/GameHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { createGroup, joinGroup, getMyGroups, type Group } from "@/lib/groups";
import { getSession } from "@/lib/auth";

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join form
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push("/auth");
      return;
    }
    loadGroups();
  }, [router]);

  async function loadGroups() {
    setLoading(true);
    const data = await getMyGroups();
    setGroups(data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newGroupName.trim() || creating) return;
    setCreating(true);
    setCreateError(null);

    const { group, error } = await createGroup(newGroupName.trim());

    if (error) {
      setCreateError(error);
      setCreating(false);
      return;
    }

    setNewGroupName("");
    setShowCreate(false);
    setCreating(false);
    await loadGroups();

    if (group) {
      router.push(`/groups/${group.code}`);
    }
  }

  async function handleJoin() {
    if (joinCode.length !== 6 || joining) return;
    setJoining(true);
    setJoinError(null);

    const { group, error } = await joinGroup(joinCode.trim());

    if (error) {
      setJoinError(error);
      setJoining(false);
      return;
    }

    setJoinCode("");
    setShowJoin(false);
    setJoining(false);
    await loadGroups();

    if (group) {
      router.push(`/groups/${group.code}`);
    }
  }

  return (
    <div className="royal-bg flex flex-col min-h-screen">
      <GameHeader />

      <main className="flex-1 flex flex-col px-5 pt-4 pb-28 max-w-lg mx-auto w-full">
        {/* Page Title */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl font-bold text-gold-300 mb-1">
            My Groups
          </h1>
          <p className="text-sm text-gold-300/40 font-body">
            Create or join groups to play with friends
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex gap-3 mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <button
            className={`flex-1 btn-gold py-3 text-sm ${showCreate ? "ring-2 ring-gold-400/50" : ""}`}
            onClick={() => {
              setShowCreate(!showCreate);
              setShowJoin(false);
              setCreateError(null);
            }}
          >
            + Create Group
          </button>
          <button
            className={`flex-1 btn-glass py-3 text-sm ${showJoin ? "ring-2 ring-gold-400/50" : ""}`}
            onClick={() => {
              setShowJoin(!showJoin);
              setShowCreate(false);
              setJoinError(null);
            }}
          >
            Join Group
          </button>
        </motion.div>

        {/* Create Group Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              className="glass-panel p-5 mb-5"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
            >
              <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  setCreateError(null);
                }}
                placeholder="e.g. Friday Night Joker"
                className="input-royal mb-3"
                maxLength={30}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              {createError && (
                <p className="text-xs text-red-400 mb-3">{createError}</p>
              )}
              <button
                className="btn-gold w-full py-3 text-sm"
                onClick={handleCreate}
                disabled={!newGroupName.trim() || creating}
              >
                {creating ? "CREATING..." : "CREATE"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join Group Form */}
        <AnimatePresence>
          {showJoin && (
            <motion.div
              className="glass-panel p-5 mb-5"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
            >
              <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
                Group Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                  setJoinError(null);
                }}
                placeholder="XXXXXX"
                className="input-royal mb-3 text-center font-mono text-lg tracking-[0.3em]"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                autoFocus
              />
              {joinError && (
                <p className="text-xs text-red-400 mb-3">{joinError}</p>
              )}
              <button
                className="btn-gold w-full py-3 text-sm"
                onClick={handleJoin}
                disabled={joinCode.length !== 6 || joining}
              >
                {joining ? "JOINING..." : "JOIN"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Groups List */}
        {loading ? (
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-gold-300/40 text-sm font-body">Loading groups...</div>
          </motion.div>
        ) : groups.length === 0 ? (
          /* Empty State */
          <motion.div
            className="flex-1 flex flex-col items-center justify-center text-center py-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <div className="w-24 h-24 rounded-3xl bg-navy-800 border border-gold-400/10 flex items-center justify-center mb-5">
              <span className="text-5xl opacity-40">👥</span>
            </div>
            <h2 className="font-display text-xl font-bold text-gold-300 mb-2">
              No Groups Yet
            </h2>
            <p className="text-sm text-gold-300/40 max-w-xs mb-6 font-body">
              Create a group to invite friends, or join an existing group with a
              6-character code.
            </p>
            <button
              className="btn-gold px-8 py-4 text-sm"
              onClick={() => {
                setShowCreate(true);
                setShowJoin(false);
              }}
            >
              CREATE YOUR FIRST GROUP
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                className="glass-panel p-4 cursor-pointer hover:border-gold-400/30 transition-all active:scale-[0.98]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                onClick={() => router.push(`/groups/${group.code}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Group Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-navy-700 border border-gold-400/15 flex items-center justify-center shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-bold text-gold-300 truncate">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gold-400/40 font-mono tracking-wider">
                        {group.code}
                      </span>
                      {group.member_count !== undefined && (
                        <span className="text-xs text-gold-400/40">
                          {group.member_count} {group.member_count === 1 ? "member" : "members"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <span className="text-gold-400/30 text-lg">›</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
