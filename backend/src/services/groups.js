import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';

export async function createGroup(userId, name) {
  const inviteCode = uuidv4().split('-')[0].toUpperCase();

  const result = await query(
    `INSERT INTO groups (name, admin_id, invite_code)
     VALUES ($1, $2, $3)
     RETURNING id, name, admin_id, invite_code, created_at`,
    [name, userId, inviteCode]
  );

  const group = result.rows[0];

  // Add creator as member
  await query(
    'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
    [group.id, userId]
  );

  // Create default categories
  const defaultCategories = ['Goleador', 'Asistencia', 'Mejor gol'];
  for (const cat of defaultCategories) {
    await query(
      `INSERT INTO prediction_categories (group_id, name, created_by)
       VALUES ($1, $2, $3)`,
      [group.id, cat, userId]
    );
  }

  return group;
}

export async function getGroup(groupId, userId) {
  // Verify user is in group
  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const result = await query(
    `SELECT g.id, g.name, g.admin_id, g.invite_code, g.created_at,
            u.name as admin_name
     FROM groups g
     JOIN users u ON g.admin_id = u.id
     WHERE g.id = $1`,
    [groupId]
  );

  return result.rows[0];
}

export async function getUserGroups(userId) {
  const result = await query(
    `SELECT g.id, g.name, g.admin_id, g.created_at,
            COUNT(gm.user_id) as member_count
     FROM groups g
     JOIN group_members gm ON g.id = gm.group_id
     WHERE g.id IN (
       SELECT group_id FROM group_members WHERE user_id = $1
     )
     GROUP BY g.id, g.name, g.admin_id, g.created_at
     ORDER BY g.created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function joinGroup(userId, inviteCode) {
  // Find group by invite code
  const groupResult = await query(
    'SELECT id FROM groups WHERE invite_code = $1',
    [inviteCode]
  );

  if (groupResult.rows.length === 0) {
    throw new Error('Invalid invite code');
  }

  const groupId = groupResult.rows[0].id;

  // Check if already member
  const memberResult = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (memberResult.rows.length > 0) {
    throw new Error('Already a member of this group');
  }

  // Add user to group
  await query(
    'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
    [groupId, userId]
  );

  return groupId;
}

export async function getGroupMembers(groupId, userId) {
  // Verify user is in group
  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const result = await query(
    `SELECT u.id, u.name, u.email, u.picture_url, gm.joined_at
     FROM users u
     JOIN group_members gm ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at ASC`,
    [groupId]
  );

  return result.rows;
}

export async function getGroupCategories(groupId, userId) {
  // Verify user is in group
  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  const result = await query(
    `SELECT id, name FROM prediction_categories
     WHERE group_id = $1
     ORDER BY name`,
    [groupId]
  );

  return result.rows;
}

export async function leaveGroup(groupId, userId) {
  const result = await query(
    'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (result.rowCount === 0) {
    throw new Error('Not a member of this group');
  }

  return true;
}

export async function removeGroupMember(groupId, userId, targetUserId) {
  // Verify user is admin of group
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can remove members');
  }

  const result = await query(
    'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, targetUserId]
  );

  if (result.rowCount === 0) {
    throw new Error('Member not found');
  }

  return true;
}

export async function createCategory(groupId, userId, categoryName) {
  // Verify user is admin of group
  const adminCheck = await query(
    'SELECT admin_id FROM groups WHERE id = $1',
    [groupId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].admin_id !== userId) {
    throw new Error('Only admin can create categories');
  }

  const result = await query(
    `INSERT INTO prediction_categories (group_id, name, created_by)
     VALUES ($1, $2, $3)
     RETURNING id, name`,
    [groupId, categoryName, userId]
  );

  return result.rows[0];
}

export async function getGroupStandings(groupId, userId) {
  // Verify user is in group
  const member = await query(
    'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );

  if (member.rows.length === 0) {
    throw new Error('Not a member of this group');
  }

  // Get all group members
  const membersResult = await query(
    `SELECT u.id, u.name, u.picture_url
     FROM users u
     JOIN group_members gm ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY u.name ASC`,
    [groupId]
  );

  // For each member, calculate their points
  const standings = [];
  for (const member of membersResult.rows) {
    // Count total predictions
    const predictionsResult = await query(
      `SELECT COUNT(*) as count
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       WHERE p.user_id = $1 AND m.group_id = $2`,
      [member.id, groupId]
    );
    const totalPredictions = parseInt(predictionsResult.rows[0]?.count || 0);

    // Count correct predictions from prediction_results table
    const correctResult = await query(
      `SELECT COUNT(*) as count
       FROM prediction_results pr
       JOIN predictions p ON pr.prediction_id = p.id
       JOIN matches m ON p.match_id = m.id
       WHERE p.user_id = $1 AND m.group_id = $2 AND pr.is_correct = true`,
      [member.id, groupId]
    );
    const correctPredictions = parseInt(correctResult.rows[0]?.count || 0);

    // Get average rating for this player (from this group's matches only)
    const ratingResult = await query(
      `SELECT ROUND(AVG(pmr.rating)::numeric, 1) as avg_rating, COUNT(*) as rating_count
       FROM player_match_ratings pmr
       JOIN matches m ON pmr.match_id = m.id
       WHERE pmr.player_id = $1 AND m.group_id = $2`,
      [member.id, groupId]
    );
    const avgRating = parseFloat(ratingResult.rows[0]?.avg_rating || 0);
    console.log(`Player ${member.name} (${member.id}): avg_rating=${avgRating}, count=${ratingResult.rows[0]?.rating_count}`);

    standings.push({
      id: member.id,
      name: member.name,
      picture_url: member.picture_url,
      total_predictions: totalPredictions,
      correct_predictions: correctPredictions,
      points: correctPredictions,
      average_rating: avgRating
    });
  }

  // Sort by points descending
  standings.sort((a, b) => b.points - a.points);
  return standings;
}
