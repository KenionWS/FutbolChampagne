import api from './api';

export const groupsApi = {
  createGroup: (name) => api.post('/groups', { name }),
  getMyGroups: () => api.get('/groups'),
  getGroup: (id) => api.get(`/groups/${id}`),
  joinGroup: (inviteCode) => api.post('/groups/join', { inviteCode }),
  getGroupMembers: (id) => api.get(`/groups/${id}/members`),
};
