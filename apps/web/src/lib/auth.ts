import { supabase } from "./supabase";

export interface AuthUser {
  id: string;
  nickname: string;
  name: string;
  nameKa?: string;
  avatar: string;
}

const SESSION_KEY = "joker_session";

// ── Signup ──

export async function signup(
  nickname: string,
  name: string,
  pin: string,
  avatar: string,
  nameKa?: string
): Promise<{ user?: AuthUser; error?: string }> {
  // Check nickname availability
  const { data: existing } = await supabase
    .from("players")
    .select("id")
    .ilike("nickname", nickname)
    .maybeSingle();

  if (existing) return { error: "Nickname already taken" };

  // Hash PIN (simple hash for now — SHA-256)
  const pinHash = await hashPin(pin);

  const { data, error } = await supabase
    .from("players")
    .insert({
      nickname,
      name,
      name_ka: nameKa || null,
      avatar,
      pin_hash: pinHash,
    })
    .select("id, nickname, name, name_ka, avatar")
    .single();

  if (error) return { error: error.message };

  const user: AuthUser = {
    id: data.id,
    nickname: data.nickname,
    name: data.name,
    nameKa: data.name_ka,
    avatar: data.avatar,
  };

  saveSession(user);
  return { user };
}

// ── Login ──

export async function login(
  nickname: string,
  pin: string
): Promise<{ user?: AuthUser; error?: string }> {
  const { data, error } = await supabase
    .from("players")
    .select("id, nickname, name, name_ka, avatar, pin_hash")
    .ilike("nickname", nickname)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "User not found" };

  const pinHash = await hashPin(pin);
  if (pinHash !== data.pin_hash) return { error: "Incorrect PIN" };

  const user: AuthUser = {
    id: data.id,
    nickname: data.nickname,
    name: data.name,
    nameKa: data.name_ka,
    avatar: data.avatar,
  };

  saveSession(user);
  return { user };
}

// ── Session ──

export function saveSession(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

// ── PIN Hashing (SHA-256) ──

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`joker_salt_${pin}_v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
