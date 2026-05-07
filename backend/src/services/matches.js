import { query } from '../config/db.js';

export async function createMatch(groupId, userId, opponentName, matchDate) {
  // Verify user is admin of group
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0) {
    throw new Error('Group not found');
  }

  if (adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can create matches');
  }

  const result = await query(
    `INSERT INTO matches (group_id, opponent_name, match_date, status)
     VALUES ($1, $2, $3, 'draft')
     RETURNING id, group_id, opponent_name, match_date, status, created_at`,
    [groupId, opponentName, matchDate]
  );

  return result.rows[0];
}

export async function getGroupMatches(groupId, userId) {
  // Verify user is in group
  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const result = await query(
    `SELECT id, opponent_name, match_date, status, admin_confirmed, created_at
     FROM matches
     WHERE group_id = $1
     ORDER BY match_date DESC`,
    [groupId]
  );

  return result.rows;
}

export async function getMatch(matchId, userId) {
  // Get match details with predictions count
  const result = await query(
    `SELECT m.id, m.group_id, m.opponent_name, m.match_date, m.status,
            m.admin_confirmed, m.created_at
     FROM matches m
     WHERE m.id = $1`,
    [matchId]
  );

  if (result.rows.length === 0) {
    throw new Error('Match not found');
  }

  const match = result.rows[0];

  // Verify user is in group
  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [match.group_id, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  return match;
}

export async function updateMatchStatus(matchId, groupId, userId, newStatus) {
  // Verify user is admin of group
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can update match status');
  }

  const result = await query(
    `UPDATE matches
     SET status = $1, updated_at = NOW()
     WHERE id = $2 AND group_id = $3
     RETURNING id, status, updated_at`,
    [newStatus, matchId, groupId]
  );

  return result.rows[0];
}

export async function updateMatch(matchId, groupId, userId, opponentName, matchDate) {
  // Verify user is admin of group
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can update match');
  }

  const result = await query(
    `UPDATE matches
     SET opponent_name = $1, match_date = $2, updated_at = NOW()
     WHERE id = $3 AND group_id = $4
     RETURNING id, group_id, opponent_name, match_date, status, admin_confirmed, created_at`,
    [opponentName, matchDate, matchId, groupId]
  );

  return result.rows[0];
}

export async function savePlayerStats(matchId, groupId, userId, playerId, goals, saves) {
  // Verify user is admin of group
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can save player stats');
  }

  // Try to update, if not exists insert
  const existing = await query(
    'SELECT id FROM match_player_stats WHERE match_id = $1 AND player_id = $2',
    [matchId, playerId]
  );

  if (existing.rows.length > 0) {
    const result = await query(
      `UPDATE match_player_stats
       SET goals = $1, saves = $2, updated_at = NOW()
       WHERE match_id = $3 AND player_id = $4
       RETURNING id, match_id, player_id, goals, saves`,
      [goals, saves, matchId, playerId]
    );
    return result.rows[0];
  } else {
    const result = await query(
      `INSERT INTO match_player_stats (match_id, player_id, goals, saves)
       VALUES ($1, $2, $3, $4)
       RETURNING id, match_id, player_id, goals, saves`,
      [matchId, playerId, goals, saves]
    );
    return result.rows[0];
  }
}

export async function getMatchPlayerStats(matchId, userId) {
  // Verify user can access match
  const matchCheck = await query(
    `SELECT m.group_id FROM matches m
     JOIN group_members gm ON m.group_id = gm.group_id
     WHERE m.id = $1 AND gm.user_id = $2`,
    [matchId, userId]
  );

  if (matchCheck.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const result = await query(
    `SELECT mps.match_id, mps.player_id, u.name as player_name, u.picture_url,
            mps.goals, mps.saves
     FROM match_player_stats mps
     JOIN users u ON mps.player_id = u.id
     WHERE mps.match_id = $1
     ORDER BY u.name`,
    [matchId]
  );

  return result.rows;
}

export async function deletePrediction(predictionId, groupId, userId) {
  // Verify user is admin of group
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can delete predictions');
  }

  const result = await query(
    `DELETE FROM predictions
     WHERE id = $1 AND match_id IN (
       SELECT id FROM matches WHERE group_id = $2
     )`,
    [predictionId, groupId]
  );

  if (result.rowCount === 0) {
    throw new Error('Prediction not found');
  }

  return true;
}

export async function updatePrediction(predictionId, groupId, userId, predictionText) {
  // Verify user is admin of group
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can update predictions');
  }

  const result = await query(
    `UPDATE predictions
     SET prediction_text = $1, updated_at = NOW()
     WHERE id = $2 AND match_id IN (
       SELECT id FROM matches WHERE group_id = $3
     )
     RETURNING id, prediction_text, category_id, user_id`,
    [predictionText, predictionId, groupId]
  );

  if (result.rows.length === 0) {
    throw new Error('Prediction not found');
  }

  return result.rows[0];
}
