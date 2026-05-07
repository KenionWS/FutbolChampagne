import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  createGroup,
  getGroup,
  getUserGroups,
  joinGroup,
  getGroupMembers,
  getGroupCategories,
  leaveGroup,
  removeGroupMember,
  createCategory,
  getGroupStandings,
} from '../services/groups.js';

const router = express.Router();

// Create group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name required' });
    }

    const group = await createGroup(req.userId, name);
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get my groups
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await getUserGroups(req.userId);
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get specific group
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await getGroup(parseInt(req.params.id), req.userId);
    res.json(group);
  } catch (error) {
    console.error('Get group error:', error.message);
    res.status(error.message.includes('Not a member') ? 403 : 500).json({
      error: error.message,
    });
  }
});

// Join group with invite code
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code required' });
    }

    const groupId = await joinGroup(req.userId, inviteCode);
    res.status(201).json({ groupId, message: 'Joined group successfully' });
  } catch (error) {
    console.error('Join group error:', error.message);
    res.status(error.message.includes('Invalid') ? 400 : 500).json({
      error: error.message,
    });
  }
});

// Get group members
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const members = await getGroupMembers(parseInt(req.params.id), req.userId);
    res.json(members);
  } catch (error) {
    console.error('Get members error:', error.message);
    res.status(error.message.includes('Not a member') ? 403 : 500).json({
      error: error.message,
    });
  }
});

// Get group categories
router.get('/:id/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await getGroupCategories(parseInt(req.params.id), req.userId);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Create category (admin only)
router.post('/:id/categories', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name required' });
    }

    const category = await createCategory(parseInt(req.params.id), req.userId, name);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

// Get group standings
router.get('/:id/standings', authMiddleware, async (req, res) => {
  try {
    const standings = await getGroupStandings(parseInt(req.params.id), req.userId);
    res.json(standings);
  } catch (error) {
    console.error('Get standings error:', error.message);
    res.status(error.message.includes('Not a member') ? 403 : 500).json({
      error: error.message,
    });
  }
});

// Leave group
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    await leaveGroup(parseInt(req.params.id), req.userId);
    res.json({ message: 'Left group' });
  } catch (error) {
    console.error('Leave group error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Remove member from group (admin only)
router.delete('/:id/members/:memberId', authMiddleware, async (req, res) => {
  try {
    await removeGroupMember(
      parseInt(req.params.id),
      req.userId,
      parseInt(req.params.memberId)
    );
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

export default router;
