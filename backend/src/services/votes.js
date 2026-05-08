import { query } from '../config/db.js';

export async function votePrediction(matchId, categoryId, userId, playerVotedForId) {
  // Verify user can vote
  const memberCheck = await query(
    `SELECT gm.user_id FROM matches m
     JOIN group_members gm ON m.group_id = gm.group_id
     WHERE m.id = $1 AND gm.user_id = $2`,
    [matchId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  // Check if already voted in this category for this match
  const existingVote = await query(
    'SELECT * FROM votes WHERE match_id = $1 AND category_id = $2 AND voted_by = $3',
    [matchId, categoryId, userId]
  );

  if (existingVote.rows.length > 0) {
    // Update existing vote
    const result = await query(
      `UPDATE votes
       SET player_voted_for_id = $1
       WHERE match_id = $2 AND category_id = $3 AND voted_by = $4
       RETURNING id, match_id, category_id, voted_by, player_voted_for_id, created_at`,
      [playerVotedForId, matchId, categoryId, userId]
    );
    return result.rows[0];
  } else {
    // Get a prediction to link to (any prediction from this category in this match)
    const predictionCheck = await query(
      `SELECT id FROM predictions p
       WHERE p.match_id = $1 AND p.category_id = $2
       LIMIT 1`,
      [matchId, categoryId]
    );

    if (predictionCheck.rows.length === 0) {
      throw new Error('No predictions in this category');
    }

    // Insert new vote
    const result = await query(
      `INSERT INTO votes (prediction_id, match_id, category_id, voted_by, player_voted_for_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, match_id, category_id, voted_by, player_voted_for_id, created_at`,
      [predictionCheck.rows[0].id, matchId, categoryId, userId, playerVotedForId]
    );
    return result.rows[0];
  }
}

export async function getVotingResults(matchId, categoryId) {
  // Get voting results for a category: who got the most votes
  const result = await query(
    `SELECT
       v.player_voted_for_id,
       u.name as player_name,
       u.picture_url,
       COUNT(*) as vote_count,
       ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM votes WHERE match_id = $1 AND category_id = $2), 1) as percentage
     FROM votes v
     LEFT JOIN users u ON v.player_voted_for_id = u.id
     WHERE v.match_id = $1 AND v.category_id = $2
     GROUP BY v.player_voted_for_id, u.name, u.picture_url
     ORDER BY vote_count DESC`,
    [matchId, categoryId]
  );

  return result.rows;
}

export async function finalizePredictions(matchId, groupId, userId) {
  // Verify user is admin
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can finalize predictions');
  }

  // Get all categories with predictions in this match
  const categories = await query(
    `SELECT DISTINCT category_id FROM predictions
     WHERE match_id = $1`,
    [matchId]
  );

  for (const cat of categories.rows) {
    // Get the majority winner for this category
    const winner = await query(
      `SELECT player_voted_for_id, COUNT(*) as vote_count
       FROM votes
       WHERE match_id = $1 AND category_id = $2
       GROUP BY player_voted_for_id
       ORDER BY vote_count DESC
       LIMIT 1`,
      [matchId, cat.category_id]
    );

    const categoryWinnerId = winner.rows.length > 0 ? winner.rows[0].player_voted_for_id : null;
    const totalVotes = await query(
      'SELECT COUNT(*) FROM votes WHERE match_id = $1 AND category_id = $2',
      [matchId, cat.category_id]
    );
    const totalCount = parseInt(totalVotes.rows[0].count);
    const winnerVotes = winner.rows.length > 0 ? parseInt(winner.rows[0].vote_count) : 0;
    const percentage = totalCount > 0 ? Math.round((winnerVotes / totalCount) * 100) : 0;

    // For each prediction in this category, check if it was correct
    const predictions = await query(
      `SELECT id, prediction_text, user_id FROM predictions
       WHERE match_id = $1 AND category_id = $2`,
      [matchId, cat.category_id]
    );

    for (const pred of predictions.rows) {
      const isCorrect = categoryWinnerId ?
        await checkPredictionCorrect(pred.prediction_text, categoryWinnerId) :
        false;

      // Check if result already exists
      const existingResult = await query(
        'SELECT id FROM prediction_results WHERE prediction_id = $1',
        [pred.id]
      );

      if (existingResult.rows.length > 0) {
        // Update existing result
        await query(
          `UPDATE prediction_results
           SET category_winner_id = $1, is_correct = $2, vote_percentage = $3
           WHERE prediction_id = $4`,
          [categoryWinnerId, isCorrect, percentage, pred.id]
        );
      } else {
        // Insert new result
        await query(
          `INSERT INTO prediction_results (prediction_id, category_winner_id, is_correct, vote_percentage)
           VALUES ($1, $2, $3, $4)`,
          [pred.id, categoryWinnerId, isCorrect, percentage]
        );
      }
    }
  }

  return { message: 'Predictions finalized' };
}

async function checkPredictionCorrect(predictionText, winnerPlayerId) {
  // Get winner's name to check if it matches prediction
  const winner = await query(
    'SELECT name FROM users WHERE id = $1',
    [winnerPlayerId]
  );

  if (winner.rows.length === 0) return false;

  // Simple check: if prediction text contains winner's name, it's correct
  return predictionText.toLowerCase().includes(winner.rows[0].name.toLowerCase());
}

export async function getPredictionResults(predictionId) {
  const result = await query(
    `SELECT pr.id, pr.prediction_id, pr.category_winner_id, u.name as winner_name,
            pr.is_correct, pr.vote_percentage
     FROM prediction_results pr
     LEFT JOIN users u ON pr.category_winner_id = u.id
     WHERE pr.prediction_id = $1`,
    [predictionId]
  );

  return result.rows[0] || null;
}

export async function savePlayerRatings(matchId, userId, ratings) {
  // Verify user is in group
  const memberCheck = await query(
    `SELECT gm.user_id FROM matches m
     JOIN group_members gm ON m.group_id = gm.group_id
     WHERE m.id = $1 AND gm.user_id = $2`,
    [matchId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const results = [];
  for (const rating of ratings) {
    // Validate rating is between 1 and 10
    const validRating = Math.max(1, Math.min(10, parseInt(rating.rating) || 5));

    const result = await query(
      `INSERT INTO player_match_ratings (match_id, player_id, rated_by, rating)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (match_id, player_id, rated_by) DO UPDATE SET rating = $4
       RETURNING id, match_id, player_id, rating`,
      [matchId, rating.playerId, userId, validRating]
    );
    results.push(result.rows[0]);
  }

  return results;
}

export async function getPlayerAverageRatings(matchId, userId) {
  // Verify user can access
  const memberCheck = await query(
    `SELECT gm.user_id FROM matches m
     JOIN group_members gm ON m.group_id = gm.group_id
     WHERE m.id = $1 AND gm.user_id = $2`,
    [matchId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const result = await query(
    `SELECT
       pmr.player_id,
       u.name,
       u.picture_url,
       ROUND(AVG(pmr.rating)::numeric, 1) as average_rating,
       COUNT(pmr.id) as rating_count
     FROM player_match_ratings pmr
     JOIN users u ON pmr.player_id = u.id
     WHERE pmr.match_id = $1
     GROUP BY pmr.player_id, u.name, u.picture_url
     ORDER BY average_rating DESC`,
    [matchId]
  );

  return result.rows;
}

export async function getUserPlayerRatings(matchId, userId) {
  const result = await query(
    `SELECT player_id, rating FROM player_match_ratings
     WHERE match_id = $1 AND rated_by = $2
     ORDER BY player_id`,
    [matchId, userId]
  );

  return result.rows;
}
