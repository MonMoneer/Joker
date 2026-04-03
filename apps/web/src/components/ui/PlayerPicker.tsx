"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchUsers, findUserByNickname, getFriends } from "@/lib/user-system";
import type { UserProfile, Friend } from "@/lib/user-system";

interface PlayerPickerProps {
  value: string;
  onChange: (name: string) => void;
  onUserLinked: (user: UserProfile | null) => void;
  linkedUser: UserProfile | null;
  placeholder?: string;
  label?: string;
  index: number;
}

/**
 * Input field that lets you type a name OR pick a registered user.
 * Shows friends first, then search results from local user registry.
 * When a user is linked, their nickname is shown and scores count for rankings.
 */
export function PlayerPicker({
  value,
  onChange,
  onUserLinked,
  linkedUser,
  placeholder = "Player name or @nickname",
  label,
  index,
}: PlayerPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFriends(getFriends());
  }, []);

  useEffect(() => {
    if (value.startsWith("@")) {
      const query = value.slice(1);
      setSearchResults(searchUsers(query));
    } else if (value.length >= 2) {
      setSearchResults(searchUsers(value));
    } else {
      setSearchResults([]);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectUser = (user: UserProfile) => {
    onChange(user.nickname);
    onUserLinked(user);
    setShowDropdown(false);
  };

  const selectFriend = (friend: Friend) => {
    const user = findUserByNickname(friend.nickname);
    if (user) {
      selectUser(user);
    } else {
      onChange(friend.name);
      setShowDropdown(false);
    }
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
        // Linked user display
        <div className="flex items-center gap-3 input-royal">
          <span className="text-xl">{linkedUser.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-marble-100 truncate">
              {linkedUser.name}
            </div>
            <div className="text-[10px] text-gold-400">@{linkedUser.nickname}</div>
          </div>
          <button
            onClick={clearLinked}
            className="text-marble-400/40 hover:text-error-500 text-sm px-1"
          >
            ✕
          </button>
        </div>
      ) : (
        // Text input with search
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="input-royal"
            maxLength={20}
          />
          <div
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${colors[index % 4]} flex items-center justify-center text-white text-[10px] font-bold pointer-events-none`}
          >
            {index + 1}
          </div>
        </div>
      )}

      {/* Dropdown: friends + search results */}
      <AnimatePresence>
        {showDropdown && !linkedUser && (friends.length > 0 || searchResults.length > 0) && (
          <motion.div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 z-30 glass-panel py-2 max-h-48 overflow-y-auto"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {/* Friends section */}
            {friends.length > 0 && !value && (
              <>
                <p className="px-3 py-1 text-[9px] text-gold-400/40 uppercase tracking-wider font-bold">
                  Friends
                </p>
                {friends.map((friend) => (
                  <button
                    key={friend.nickname}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                    onClick={() => selectFriend(friend)}
                  >
                    <span className="text-lg">{friend.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-marble-100 truncate">{friend.name}</div>
                      <div className="text-[10px] text-gold-400/60">@{friend.nickname}</div>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <>
                <p className="px-3 py-1 text-[9px] text-gold-400/40 uppercase tracking-wider font-bold">
                  {value.startsWith("@") ? "Users" : "Matches"}
                </p>
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                    onClick={() => selectUser(user)}
                  >
                    <span className="text-lg">{user.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-marble-100 truncate">{user.name}</div>
                      <div className="text-[10px] text-gold-400/60">@{user.nickname}</div>
                    </div>
                    <span className="text-[9px] text-gold-400/40 uppercase">Invite</span>
                  </button>
                ))}
              </>
            )}

            {value.length >= 2 && searchResults.length === 0 && friends.length === 0 && (
              <p className="px-3 py-2 text-xs text-marble-400/40 text-center">
                No users found. Type a name to play as guest.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
