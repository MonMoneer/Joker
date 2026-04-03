-- ============================================================
-- Georgian Joker — Supabase Database Migration
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ka TEXT,
  avatar TEXT DEFAULT '🐔',
  pin_hash TEXT,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  total_score BIGINT DEFAULT 0,
  best_score INT DEFAULT 0,
  worst_score INT DEFAULT 0,
  kings_earned INT DEFAULT 0,
  total_bids INT DEFAULT 0,
  successful_bids INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_nickname ON players(LOWER(nickname));

-- Friends
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, friend_id)
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT,
  mode TEXT NOT NULL DEFAULT 'offline', -- 'online' | 'offline' | 'vs-ai'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  couples_mode BOOLEAN DEFAULT FALSE,
  hist_penalty BOOLEAN DEFAULT FALSE,
  hist_penalty_amount INT DEFAULT -200,
  total_hands INT DEFAULT 24,
  is_complete BOOLEAN DEFAULT FALSE
);

-- Game participants
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  player_nickname TEXT NOT NULL,
  position INT NOT NULL CHECK (position BETWEEN 0 AND 3),
  final_score INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  is_ai BOOLEAN DEFAULT FALSE,
  kings_in_game INT DEFAULT 0,
  UNIQUE(game_id, position)
);

-- Hand results (per hand per game)
CREATE TABLE IF NOT EXISTS hand_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  hand_number INT NOT NULL CHECK (hand_number BETWEEN 1 AND 24),
  set_number INT NOT NULL CHECK (set_number BETWEEN 1 AND 4),
  cards_dealt INT NOT NULL,
  trump_suit TEXT,
  UNIQUE(game_id, hand_number)
);

-- Hand player results
CREATE TABLE IF NOT EXISTS hand_player_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hand_result_id UUID REFERENCES hand_results(id) ON DELETE CASCADE,
  player_nickname TEXT NOT NULL,
  position INT NOT NULL,
  bid INT NOT NULL,
  tricks_won INT NOT NULL,
  score_earned INT NOT NULL,
  cumulative_score INT NOT NULL,
  is_king BOOLEAN DEFAULT FALSE,
  UNIQUE(hand_result_id, position)
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hand_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE hand_player_results ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for now (anon key)
-- In production, restrict to authenticated users
CREATE POLICY "Allow all for players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for friends" ON friends FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for game_players" ON game_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for hand_results" ON hand_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for hand_player_results" ON hand_player_results FOR ALL USING (true) WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_game_players_player ON game_players(player_nickname);
CREATE INDEX IF NOT EXISTS idx_game_players_game ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_games_ended ON games(ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_hand_results_game ON hand_results(game_id);
CREATE INDEX IF NOT EXISTS idx_friends_player ON friends(player_id);
