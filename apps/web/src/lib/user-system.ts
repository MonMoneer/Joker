/**
 * User System — Local-first with Supabase sync
 *
 * Users have: name, nickname (unique, shown on table), avatar
 * Friends: add by nickname, invite to rooms/calculator
 */

export interface UserProfile {
  id: string;
  name: string;
  nickname: string; // Unique, always shown on table
  nameKa?: string;
  avatar: string;
  createdAt: string;
}

export interface Friend {
  nickname: string;
  name: string;
  avatar: string;
  addedAt: string;
}

const STORAGE_KEYS = {
  profile: "joker_user_profile",
  friends: "joker_friends",
  users: "joker_all_users", // Local user registry for offline play
};

// ── Profile Management ──

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  // Also register in local user directory
  registerUser(profile);
}

export function loadProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.profile);
    if (!data) return null;
    return JSON.parse(data) as UserProfile;
  } catch {
    return null;
  }
}

export function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Nickname Validation ──

export function isNicknameValid(nickname: string): { valid: boolean; error?: string } {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, error: "Nickname is required" };
  }
  if (nickname.length < 3) {
    return { valid: false, error: "Nickname must be at least 3 characters" };
  }
  if (nickname.length > 15) {
    return { valid: false, error: "Nickname must be 15 characters or less" };
  }
  if (!/^[a-zA-Z0-9_\-.]+$/.test(nickname)) {
    return { valid: false, error: "Only letters, numbers, _ - . allowed" };
  }
  return { valid: true };
}

export function isNicknameTaken(nickname: string, excludeId?: string): boolean {
  const users = getAllUsers();
  return users.some(
    (u) => u.nickname.toLowerCase() === nickname.toLowerCase() && u.id !== excludeId
  );
}

// ── Local User Registry (for offline nickname lookup) ──

function registerUser(profile: UserProfile): void {
  const users = getAllUsers();
  const existing = users.findIndex((u) => u.id === profile.id);
  if (existing >= 0) {
    users[existing] = profile;
  } else {
    users.push(profile);
  }
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

export function getAllUsers(): UserProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.users);
    if (!data) return [];
    return JSON.parse(data) as UserProfile[];
  } catch {
    return [];
  }
}

export function findUserByNickname(nickname: string): UserProfile | null {
  const users = getAllUsers();
  return users.find(
    (u) => u.nickname.toLowerCase() === nickname.toLowerCase()
  ) || null;
}

export function searchUsers(query: string): UserProfile[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const users = getAllUsers();
  const me = loadProfile();
  return users.filter(
    (u) =>
      u.id !== me?.id &&
      (u.nickname.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
  );
}

// ── Friends System ──

export function getFriends(): Friend[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.friends);
    if (!data) return [];
    return JSON.parse(data) as Friend[];
  } catch {
    return [];
  }
}

export function addFriend(nickname: string): { success: boolean; error?: string } {
  const user = findUserByNickname(nickname);
  if (!user) {
    return { success: false, error: `User "${nickname}" not found` };
  }

  const me = loadProfile();
  if (me && user.id === me.id) {
    return { success: false, error: "You can't add yourself" };
  }

  const friends = getFriends();
  if (friends.some((f) => f.nickname.toLowerCase() === nickname.toLowerCase())) {
    return { success: false, error: `"${nickname}" is already your friend` };
  }

  friends.push({
    nickname: user.nickname,
    name: user.name,
    avatar: user.avatar,
    addedAt: new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEYS.friends, JSON.stringify(friends));
  return { success: true };
}

export function removeFriend(nickname: string): void {
  const friends = getFriends().filter(
    (f) => f.nickname.toLowerCase() !== nickname.toLowerCase()
  );
  localStorage.setItem(STORAGE_KEYS.friends, JSON.stringify(friends));
}

export function isFriend(nickname: string): boolean {
  return getFriends().some(
    (f) => f.nickname.toLowerCase() === nickname.toLowerCase()
  );
}
