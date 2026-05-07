import api from './api';

export const matchesApi = {
  getGroupMatches: (groupId) => api.get(`/matches/groups/${groupId}`),
  getMatch: (matchId) => api.get(`/matches/${matchId}`),

  // Predictions
  makePrediction: (matchId, categoryId, predictionText) =>
    api.post(`/matches/${matchId}/predictions`, {
      categoryId,
      predictionText,
    }),
  getMatchPredictions: (matchId) => api.get(`/matches/${matchId}/predictions`),
  getMyPredictions: (matchId) => api.get(`/matches/${matchId}/my-predictions`),

  // Votes
  votePrediction: (predictionId, resolved) =>
    api.post(`/matches/predictions/${predictionId}/vote`, { resolved }),
  getPredictionVotes: (predictionId) =>
    api.get(`/matches/predictions/${predictionId}/votes`),
  getVoteStatus: (predictionId) =>
    api.get(`/matches/predictions/${predictionId}/vote-status`),
};
