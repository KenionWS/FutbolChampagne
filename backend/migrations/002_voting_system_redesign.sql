-- Migration: Voting System Redesign
-- Date: 2026-05-07
-- Changes: Replace boolean voting with player-selection voting

-- 1. Create prediction results table
CREATE TABLE IF NOT EXISTS prediction_results (
  id SERIAL PRIMARY KEY,
  prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  category_winner_id INTEGER REFERENCES users(id),
  is_correct BOOLEAN,
  vote_percentage INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create player match ratings table
CREATE TABLE IF NOT EXISTS player_match_ratings (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES users(id),
  rated_by INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, player_id, rated_by)
);

-- 3. Alter votes table to use new structure
ALTER TABLE votes DROP CONSTRAINT votes_prediction_id_voted_by_key;
ALTER TABLE votes DROP COLUMN resolved;
ALTER TABLE votes ADD COLUMN player_voted_for_id INTEGER REFERENCES users(id);
ALTER TABLE votes ADD COLUMN match_id INTEGER REFERENCES matches(id);
ALTER TABLE votes ADD COLUMN category_id INTEGER REFERENCES prediction_categories(id);
ALTER TABLE votes ADD CONSTRAINT votes_unique UNIQUE(prediction_id, voted_by);
ALTER TABLE votes ADD CONSTRAINT votes_category_unique UNIQUE(match_id, category_id, voted_by);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_prediction_results_prediction ON prediction_results(prediction_id);
CREATE INDEX IF NOT EXISTS idx_player_match_ratings_match ON player_match_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_ratings_player ON player_match_ratings(player_id);
CREATE INDEX IF NOT EXISTS idx_votes_player_voted ON votes(player_voted_for_id);
