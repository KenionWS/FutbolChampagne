-- El Bidón - Database Schema

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups (with invite code)
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members
CREATE TABLE group_members (
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);

-- Prediction categories (custom per group)
CREATE TABLE prediction_categories (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches (fechas)
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  opponent_name VARCHAR(255),
  match_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, voting, resolved
  admin_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions (before match)
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES prediction_categories(id) ON DELETE CASCADE,
  prediction_text VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (match_id, user_id, category_id)
);

-- Votes resolving predictions (after match)
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  voted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resolved BOOLEAN NOT NULL, -- true = acertó, false = no acertó
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (prediction_id, voted_by)
);

-- Match participants (who played, for rating)
CREATE TABLE match_participants (
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participated BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (match_id, user_id)
);

-- Player ratings (subjective scores post-match)
CREATE TABLE player_ratings (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (match_id, player_id, rated_by)
);

-- Match stats (admin confirmed: goals, assists)
CREATE TABLE match_stats (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (match_id, user_id)
);

-- Match scores (calculated per user per match)
CREATE TABLE match_scores (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prediction_points INTEGER DEFAULT 0, -- sum of correct predictions
  stats_points INTEGER DEFAULT 0, -- goals * 3 + assists * 1
  subjective_score DECIMAL(5,2) DEFAULT 0, -- avg of ratings
  total_points DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (match_id, user_id)
);

-- Season standings (table por temporada)
CREATE TABLE season_standings (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  season VARCHAR(50) NOT NULL, -- e.g., "2025-spring"
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points DECIMAL(10,2) DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (group_id, season, user_id)
);

-- Indexes for performance
CREATE INDEX idx_groups_admin ON groups(admin_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_votes_prediction ON votes(prediction_id);
CREATE INDEX idx_match_stats_match ON match_stats(match_id);
CREATE INDEX idx_match_scores_match ON match_scores(match_id);
CREATE INDEX idx_standings_group ON season_standings(group_id);
