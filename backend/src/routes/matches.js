import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  createMatch,
  getGroupMatches,
  getMatch,
  updateMatchStatus,
  updateMatch,
  savePlayerStats,
  getMatchPlayerStats,
  deletePrediction,
  updatePrediction,
} from '../services/matches.js';
import {
  makePrediction,
  getMatchPredictions,
  getMyPredictions,
} from '../services/predictions.js';
import {
  votePrediction,
  getVotingResults,
  finalizePredictions,
  savePlayerRatings,
  getPlayerAverageRatings,
  getUserPlayerRatings,
  getPredictionResults,
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

// Get my votes for match
router.get('/:matchId/my-votes', authMiddleware, async (req, res) => {
  try {
    const votes = await getMyVotes(
      parseInt(req.params.matchId),
      req.userId
    );
    res.json(votes);
  } catch (error) {
    console.error('Get my votes error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Vote for player in category
router.post('/:matchId/vote', authMiddleware, async (req, res) => {
  try {
    const { categoryId, playerVotedForId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId required' });
    }

    // playerVotedForId can be null (for "Otro") or a valid user ID
    const playerIdToVote = playerVotedForId ? parseInt(playerVotedForId) : null;

    const vote = await votePrediction(
      parseInt(req.params.matchId),
      parseInt(categoryId),
      req.userId,
      playerIdToVote
    );

    res.status(201).json(vote);
  } catch (error) {
    console.error('Vote error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get voting results for category
router.get('/:matchId/:categoryId/vote-results', authMiddleware, async (req, res) => {
  try {
    const results = await getVotingResults(
      parseInt(req.params.matchId),
      parseInt(req.params.categoryId)
    );
    res.json(results);
  } catch (error) {
    console.error('Get vote results error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Finalize predictions (admin only)
router.post('/:matchId/finalize-voting', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: 'groupId required' });
    }

    const result = await finalizePredictions(
      parseInt(req.params.matchId),
      parseInt(groupId),
      req.userId
    );

    res.json(result);
  } catch (error) {
    console.error('Finalize voting error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

// Save player ratings
router.post('/:matchId/player-ratings', authMiddleware, async (req, res) => {
  try {
    const { ratings } = req.body;

    if (!Array.isArray(ratings)) {
      return res.status(400).json({ error: 'ratings array required' });
    }

    const results = await savePlayerRatings(
      parseInt(req.params.matchId),
      req.userId,
      ratings
    );

    res.status(201).json(results);
  } catch (error) {
    console.error('Save ratings error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Get average player ratings
router.get('/:matchId/player-ratings', authMiddleware, async (req, res) => {
  try {
    const ratings = await getPlayerAverageRatings(
      parseInt(req.params.matchId),
      req.userId
    );
    res.json(ratings);
  } catch (error) {
    console.error('Get ratings error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Get my player ratings
router.get('/:matchId/my-player-ratings', authMiddleware, async (req, res) => {
  try {
    const ratings = await getUserPlayerRatings(
      parseInt(req.params.matchId),
      req.userId
    );
    res.json(ratings);
  } catch (error) {
    console.error('Get my ratings error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Save player stats (goals, saves)
router.post('/:matchId/player-stats', authMiddleware, async (req, res) => {
  try {
    const { groupId, playerId, goals, saves } = req.body;

    if (!groupId || !playerId || (goals === undefined && saves === undefined)) {
      return res.status(400).json({ error: 'groupId, playerId, and goals/saves required' });
    }

    const stats = await savePlayerStats(
      parseInt(req.params.matchId),
      parseInt(groupId),
      req.userId,
      parseInt(playerId),
      goals !== undefined ? parseInt(goals) : 0,
      saves !== undefined ? parseInt(saves) : 0
    );

    res.status(201).json(stats);
  } catch (error) {
    console.error('Save player stats error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

// Get match player stats
router.get('/:matchId/player-stats', authMiddleware, async (req, res) => {
  try {
    const stats = await getMatchPlayerStats(parseInt(req.params.matchId), req.userId);
    res.json(stats);
  } catch (error) {
    console.error('Get player stats error:', error.message);
    res.status(403).json({ error: error.message });
  }
});

// Delete prediction (admin only)
router.delete('/predictions/:predictionId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: 'groupId required' });
    }

    await deletePrediction(
      parseInt(req.params.predictionId),
      parseInt(groupId),
      req.userId
    );

    res.json({ message: 'Prediction deleted' });
  } catch (error) {
    console.error('Delete prediction error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

// Update prediction (admin only)
router.patch('/predictions/:predictionId', authMiddleware, async (req, res) => {
  try {
    const { groupId, predictionText } = req.body;

    if (!groupId || !predictionText) {
      return res.status(400).json({ error: 'groupId and predictionText required' });
    }

    const updated = await updatePrediction(
      parseInt(req.params.predictionId),
      parseInt(groupId),
      req.userId,
      predictionText
    );

    res.json(updated);
  } catch (error) {
    console.error('Update prediction error:', error.message);
    res
      .status(error.message.includes('admin') ? 403 : 500)
      .json({ error: error.message });
  }
});

export default router;
