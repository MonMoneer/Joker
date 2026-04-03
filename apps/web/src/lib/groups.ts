import { supabase } from "./supabase";
import { getSession } from "./auth";

export interface Group {
  id: string;
  name: string;
  code: string;
  created_by: string;
  max_members: number;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  nickname: string;
  name: string;
  avatar: string;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  return Array.from({ length: 6 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join("");
}

// ── Create Group ──

export async function createGroup(name: string): Promise<{ group?: Group; error?: string }> {
  const session = getSession();
  if (!session) return { error: "Not logged in" };

  const code = generateCode();

  const { data, error } = await supabase
    .from("groups")
    .insert({ name, code, created_by: session.id })
    .select()
    .single();

  if (error) return { error: error.message };

  // Auto-join the creator
  await supabase.from("group_members").insert({
    group_id: data.id,
    player_id: session.id,
  });

  return { group: data };
}

// ── Join Group ──

export async function joinGroup(code: string): Promise<{ group?: Group; error?: string }> {
  const session = getSession();
  if (!session) return { error: "Not logged in" };

  const { data: group, error: findError } = await supabase
    .from("groups")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (findError) return { error: findError.message };
  if (!group) return { error: "Group not found" };

  // Check member count
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if (count && count >= group.max_members) return { error: "Group is full (max 20)" };

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("player_id", session.id)
    .maybeSingle();

  if (existing) return { error: "Already a member" };

  await supabase.from("group_members").insert({
    group_id: group.id,
    player_id: session.id,
  });

  return { group };
}

// ── My Groups ──

export async function getMyGroups(): Promise<Group[]> {
  const session = getSession();
  if (!session) return [];

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("player_id", session.id);

  if (!memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  return groups || [];
}

// ── Group Members ──

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data } = await supabase
    .from("group_members")
    .select("player_id, players(id, nickname, name, avatar)")
    .eq("group_id", groupId);

  if (!data) return [];

  return data.map((m: any) => ({
    id: m.players.id,
    nickname: m.players.nickname,
    name: m.players.name,
    avatar: m.players.avatar,
  }));
}

// ── All My Group Friends (across all groups) ──

export async function getAllGroupFriends(): Promise<GroupMember[]> {
  const session = getSession();
  if (!session) return [];

  // Get all group IDs I'm in
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("player_id", session.id);

  if (!myMemberships || myMemberships.length === 0) return [];

  const groupIds = myMemberships.map((m) => m.group_id);

  // Get all members of those groups
  const { data } = await supabase
    .from("group_members")
    .select("player_id, players(id, nickname, name, avatar)")
    .in("group_id", groupIds)
    .neq("player_id", session.id);

  if (!data) return [];

  // Deduplicate by player ID
  const seen = new Set<string>();
  const friends: GroupMember[] = [];
  for (const m of data as any[]) {
    if (!seen.has(m.players.id)) {
      seen.add(m.players.id);
      friends.push({
        id: m.players.id,
        nickname: m.players.nickname,
        name: m.players.name,
        avatar: m.players.avatar,
      });
    }
  }

  return friends;
}

// ── Search Group Friends ──

export async function searchGroupFriends(query: string): Promise<GroupMember[]> {
  if (!query || query.length < 2) return [];
  const friends = await getAllGroupFriends();
  const q = query.toLowerCase();
  return friends.filter(
    (f) => f.nickname.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
  );
}

// ── Leave Group ──

export async function leaveGroup(groupId: string): Promise<{ error?: string }> {
  const session = getSession();
  if (!session) return { error: "Not logged in" };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("player_id", session.id);

  return error ? { error: error.message } : {};
}
