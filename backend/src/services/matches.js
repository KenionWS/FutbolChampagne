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
