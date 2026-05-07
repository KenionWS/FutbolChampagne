import { query } from '../config/db.js';

export async function votePrediction(predictionId, userId, resolved) {
  // Verify prediction exists and get match info
  const predResult = await query(
    `SELECT p.match_id, m.group_id
     FROM predictions p
     JOIN matches m ON p.match_id = m.id
     WHERE p.id = $1`,
    [predictionId]
  );

  if (predResult.rows.length === 0) {
    throw new Error('Prediction not found');
  }

  const { match_id, group_id } = predResult.rows[0];

  // Verify user is in group
  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [group_id, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  // Insert or update vote
  const result = await query(
    `INSERT INTO votes (prediction_id, voted_by, resolved)
     VALUES ($1, $2, $3)
     ON CONFLICT (prediction_id, voted_by)
     DO UPDATE SET resolved = $3
     RETURNING id, prediction_id, voted_by, resolved, created_at`,
    [predictionId, userId, resolved]
  );

  return result.rows[0];
}

export async function getPredictionVotes(predictionId, userId) {
  // Verify user can see votes
  const predResult = await query(
    `SELECT p.id, m.group_id
     FROM predictions p
     JOIN matches m ON p.match_id = m.id
     WHERE p.id = $1`,
    [predictionId]
  );

  if (predResult.rows.length === 0) {
    throw new Error('Prediction not found');
  }

  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [predResult.rows[0].group_id, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const result = await query(
    `SELECT v.id, v.prediction_id, v.voted_by, v.resolved,
            u.name as voter_name, v.created_at
     FROM votes v
     JOIN users u ON v.voted_by = u.id
     WHERE v.prediction_id = $1
     ORDER BY v.created_at`,
    [predictionId]
  );

  return result.rows;
}

export async function getVoteStatus(predictionId) {
  // Get vote consensus on prediction
  const result = await query(
    `SELECT
       COUNT(*) as total_votes,
       SUM(CASE WHEN resolved = true THEN 1 ELSE 0 END) as votes_for,
       SUM(CASE WHEN resolved = false THEN 1 ELSE 0 END) as votes_against
     FROM votes
     WHERE prediction_id = $1`,
    [predictionId]
  );

  const votes = result.rows[0];
  return {
    totalVotes: parseInt(votes.total_votes),
    votesFor: parseInt(votes.votes_for || 0),
    votesAgainst: parseInt(votes.votes_against || 0),
    percentage: votes.total_votes > 0
      ? Math.round((votes.votes_for / votes.total_votes) * 100)
      : 0
  };
}
