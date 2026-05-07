import { query } from '../config/db.js';

export async function makePrediction(matchId, userId, categoryId, predictionText) {
  // Verify user is in group and match exists
  const matchResult = await query(
    `SELECT m.group_id FROM matches m
     WHERE m.id = $1`,
    [matchId]
  );

  if (matchResult.rows.length === 0) {
    throw new Error('Match not found');
  }

  const groupId = matchResult.rows[0].group_id;

  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  // Check if category belongs to group
  const categoryCheck = await query(
    'SELECT * FROM prediction_categories WHERE id = $1 AND group_id = $2',
    [categoryId, groupId]
  );

  if (categoryCheck.rows.length === 0) {
    throw new Error('Invalid category for this group');
  }

  const result = await query(
    `INSERT INTO predictions (match_id, user_id, category_id, prediction_text)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (match_id, user_id, category_id)
     DO UPDATE SET prediction_text = $4
     RETURNING id, match_id, user_id, category_id, prediction_text, created_at`,
    [matchId, userId, categoryId, predictionText]
  );

  return result.rows[0];
}

export async function getMatchPredictions(matchId, userId) {
  // Verify user is in match's group
  const matchResult = await query(
    `SELECT m.group_id FROM matches m WHERE m.id = $1`,
    [matchId]
  );

  if (matchResult.rows.length === 0) {
    throw new Error('Match not found');
  }

  const groupId = matchResult.rows[0].group_id;

  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const result = await query(
    `SELECT p.id, p.match_id, p.user_id, p.category_id, p.prediction_text,
            u.name as user_name, pc.name as category_name, p.created_at
     FROM predictions p
     JOIN users u ON p.user_id = u.id
     JOIN prediction_categories pc ON p.category_id = pc.id
     WHERE p.match_id = $1
     ORDER BY pc.name, u.name`,
    [matchId]
  );

  return result.rows;
}

export async function getMyPredictions(matchId, userId) {
  const result = await query(
    `SELECT p.id, p.category_id, p.prediction_text, pc.name as category_name
     FROM predictions p
     JOIN prediction_categories pc ON p.category_id = pc.id
     WHERE p.match_id = $1 AND p.user_id = $2
     ORDER BY pc.name`,
    [matchId, userId]
  );

  return result.rows;
}
