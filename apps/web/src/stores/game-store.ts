"use client";

import { create } from "zustand";
import type { Language } from "@joker/i18n";
import type { UserProfile, Friend } from "@/lib/user-system";
import {
  saveProfile,
  loadProfile,
  generateUserId,
  getFriends,
  addFriend as addFriendToStorage,
  removeFriend as removeFriendFromStorage,
} from "@/lib/user-system";

// ── UI Store ──

interface UIState {
  language: Language;
  soundEnabled: boolean;
  setLanguage: (lang: Language) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  language: "en",
  soundEnabled: true,
  setLanguage: (language) => set({ language }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
}));

// ── User Profile Store ──

interface UserState {
  profile: UserProfile | null;
  friends: Friend[];
  isLoggedIn: boolean;

  loadUser: () => void;
  saveUser: (data: Partial<UserProfile>) => void;
  createUser: (name: string, nickname: string, avatar: string, nameKa?: string) => UserProfile;
  loadFriends: () => void;
  addFriend: (nickname: string) => { success: boolean; error?: string };
  removeFriend: (nickname: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  friends: [],
  isLoggedIn: false,

  loadUser: () => {
    const profile = loadProfile();
    const friends = getFriends();
    set({
      profile,
      friends,
      isLoggedIn: !!profile,
    });
  },

  saveUser: (data) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...data };
    saveProfile(updated);
    set({ profile: updated });
  },

  createUser: (name, nickname, avatar, nameKa) => {
    const profile: UserProfile = {
      id: generateUserId(),
      name,
      nickname,
      nameKa,
      avatar,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    set({ profile, isLoggedIn: true });
    return profile;
  },

  loadFriends: () => {
    set({ friends: getFriends() });
  },

  addFriend: (nickname) => {
    const result = addFriendToStorage(nickname);
    if (result.success) {
      set({ friends: getFriends() });
    }
    return result;
  },

  removeFriend: (nickname) => {
    removeFriendFromStorage(nickname);
    set({ friends: getFriends() });
  },
}));
