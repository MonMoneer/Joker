"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchGroupFriends, getAllGroupFriends } from "@/lib/groups";
import type { GroupMember } from "@/lib/groups";

interface PlayerPickerProps {
  value: string;
  onChange: (name: string) => void;
  onUserLinked: (user: { id: string; nickname: string; name: string; avatar: string } | null) => void;
  linkedUser: { id: string; nickname: string; name: string; avatar: string } | null;
  placeholder?: string;
  label?: string;
  index: number;
}

export function PlayerPicker({
  value,
  onChange,
  onUserLinked,
  linkedUser,
  placeholder = "Name or @nickname",
  label,
  index,
}: PlayerPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [friends, setFriends] = useState<GroupMember[]>([]);
  const [searchResults, setSearchResults] = useState<GroupMember[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAllGroupFriends().then(setFriends).catch(() => {});
  }, []);

  useEffect(() => {
    if (value.length >= 2) {
      searchGroupFriends(value.startsWith("@") ? value.slice(1) : value)
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectUser = (user: GroupMember) => {
    onChange(user.nickname);
    onUserLinked({ id: user.id, nickname: user.nickname, name: user.name, avatar: user.avatar });
    setShowDropdown(false);
  };

  const clearLinked = () => {
    onUserLinked(null);
    onChange("");
    inputRef.current?.focus();
  };

  const colors = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-amber-600"];

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs text-gold-400/60 uppercase tracking-wider font-bold mb-2">
          {label}
        </label>
      )}

      {linkedUser ? (
        <div className="flex items-center gap-3 input-royal">
          <span className="text-xl">{linkedUser.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-marble-100 truncate">{linkedUser.name}</div>
            <div className="text-[10px] text-gold-400">@{linkedUser.nickname}</div>
          </div>
          <button onClick={clearLinked} className="text-marble-400/40 hover:text-error-500 text-sm px-1">✕</button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="input-royal !pl-10"
            maxLength={20}
          />
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${colors[index % 4]} flex items-center justify-center text-white text-[10px] font-bold pointer-events-none`}>
            {index + 1}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showDropdown && !linkedUser && (friends.length > 0 || searchResults.length > 0) && (
          <motion.div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 z-30 glass-panel py-2 max-h-48 overflow-y-auto"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {friends.length > 0 && !value && (
              <>
                <p className="px-3 py-1 text-[9px] text-gold-400/40 uppercase tracking-wider font-bold">Group Friends</p>
                {friends.slice(0, 6).map((f) => (
                  <button
                    key={f.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                    onClick={() => selectUser(f)}
                  >
                    <span className="text-lg">{f.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-marble-100 truncate">{f.name}</div>
                      <div className="text-[10px] text-gold-400/60">@{f.nickname}</div>
                    </div>
                  </button>
                ))}
              </>
            )}

            {searchResults.length > 0 && (
              <>
                <p className="px-3 py-1 text-[9px] text-gold-400/40 uppercase tracking-wider font-bold">Matches</p>
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                    onClick={() => selectUser(u)}
                  >
                    <span className="text-lg">{u.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-marble-100 truncate">{u.name}</div>
                      <div className="text-[10px] text-gold-400/60">@{u.nickname}</div>
                    </div>
                    <span className="text-[9px] text-gold-400/40 uppercase">Invite</span>
                  </button>
                ))}
              </>
            )}

            {value.length >= 2 && searchResults.length === 0 && (
              <p className="px-3 py-2 text-xs text-marble-400/40 text-center">
                No group friends found. Type a name to play as guest.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
