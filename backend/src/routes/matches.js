import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  createMatch,
  getGroupMatches,
  getMatch,
  updateMatchStatus,
  updateMatch,
} from '../services/matches.js';
import {
  makePrediction,
  getMatchPredictions,
  getMyPredictions,
} from '../services/predictions.js';
import {
  votePrediction,
  getPredictionVotes,
  getVoteStatus,
} from '../services/votes.js';

const router = express.Router();

// Create match
router.post('/groups/:groupId', authMiddleware, async (req, res) => {
  try {
    const { opponentName, matchDate } = req.body;

    if (!opponentName || !matchDate) {
      return res
        .status(400)
        .json({ error: 'opponentName and matchDate required' });
    }

    const match = await createMatch(
      parseInt(req.params.groupId),
      req.userId,
      opponentName,
      new Date(matchDate)
    );

    res.status(201).json(match);
  } catch (error) {
    console.error('Create match error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

// Get group matches
router.get('/groups/:groupId', authMiddleware, async (req, res) => {
  try {
    const matches = await getGroupMatches(parseInt(req.params.groupId), req.userId);
    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Get match details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const match = await getMatch(parseInt(req.params.id), req.userId);
    res.json(match);
  } catch (error) {
    console.error('Get match error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Update match details
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { opponentName, matchDate } = req.body;

    if (!opponentName || !matchDate) {
      return res
        .status(400)
        .json({ error: 'opponentName and matchDate required' });
    }

    // Get match to find group
    const match = await getMatch(parseInt(req.params.id), req.userId);
    const updated = await updateMatch(
      parseInt(req.params.id),
      match.group_id,
      req.userId,
      opponentName,
      new Date(matchDate)
    );

    res.json(updated);
  } catch (error) {
    console.error('Update match error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

// Update match status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status required' });
    }

    // Get match to find group
    const match = await getMatch(parseInt(req.params.id), req.userId);
    const updated = await updateMatchStatus(
      parseInt(req.params.id),
      match.group_id,
      req.userId,
      status
    );

    res.json(updated);
  } catch (error) {
    console.error('Update match error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

// Make prediction
router.post('/:matchId/predictions', authMiddleware, async (req, res) => {
  try {
    const { categoryId, predictionText } = req.body;

    if (!categoryId || !predictionText) {
      return res
        .status(400)
        .json({ error: 'categoryId and predictionText required' });
    }

    const prediction = await makePrediction(
      parseInt(req.params.matchId),
      req.userId,
      parseInt(categoryId),
      predictionText
    );

    res.status(201).json(prediction);
  } catch (error) {
    console.error('Make prediction error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Get match predictions
router.get('/:matchId/predictions', authMiddleware, async (req, res) => {
  try {
    const predictions = await getMatchPredictions(
      parseInt(req.params.matchId),
      req.userId
    );
    res.json(predictions);
  } catch (error) {
    console.error('Get predictions error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Get my predictions for match
router.get('/:matchId/my-predictions', authMiddleware, async (req, res) => {
  try {
    const predictions = await getMyPredictions(
      parseInt(req.params.matchId),
      req.userId
    );
    res.json(predictions);
  } catch (error) {
    console.error('Get my predictions error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Vote on prediction
router.post('/predictions/:predictionId/vote', authMiddleware, async (req, res) => {
  try {
    const { resolved } = req.body;

    if (resolved === undefined) {
      return res.status(400).json({ error: 'resolved required' });
    }

    const vote = await votePrediction(
      parseInt(req.params.predictionId),
      req.userId,
      resolved
    );

    res.status(201).json(vote);
  } catch (error) {
    console.error('Vote error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Get prediction votes
router.get('/predictions/:predictionId/votes', authMiddleware, async (req, res) => {
  try {
    const votes = await getPredictionVotes(
      parseInt(req.params.predictionId),
      req.userId
    );
    res.json(votes);
  } catch (error) {
    console.error('Get votes error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Get vote status (consensus)
router.get(
  '/predictions/:predictionId/vote-status',
  authMiddleware,
  async (req, res) => {
    try {
      const status = await getVoteStatus(parseInt(req.params.predictionId));
      res.json(status);
    } catch (error) {
      console.error('Get vote status error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
