import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi } from '../services/groupsApi';
import './DashboardPage.css';

function DashboardPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [formData, setFormData] = useState({ groupName: '', inviteCode: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getMyGroups();
      setGroups(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.groupName.trim()) return;

    try {
      await groupsApi.createGroup(formData.groupName);
      setFormData({ groupName: '', inviteCode: '' });
      setShowCreateModal(false);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating group');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!formData.inviteCode.trim()) return;

    try {
      const response = await groupsApi.joinGroup(formData.inviteCode);
      setFormData({ groupName: '', inviteCode: '' });
      setShowJoinModal(false);
      navigate(`/groups/${response.data.groupId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error joining group');
    }
  };

  const goToGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  if (loading) return <div className="container dashboard"><p>Loading...</p></div>;

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <h2>Mis Grupos</h2>
        <div className="button-group">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            + Crear Grupo
          </button>
          <button onClick={() => setShowJoinModal(true)} className="btn-secondary">
            Unirse con Código
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {groups.length === 0 ? (
        <div className="empty-state">
          <p>No tienes grupos aún</p>
          <p>Crea uno o pídele a un amigo que te invite</p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group-card"
              onClick={() => goToGroup(group.id)}
            >
              <h3>{group.name}</h3>
              <p>{group.member_count} miembros</p>
              <button onClick={(e) => {
                e.stopPropagation();
                goToGroup(group.id);
              }}>
                Entrar
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Crear Nuevo Grupo</h3>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                placeholder="Nombre del grupo"
                value={formData.groupName}
                onChange={(e) =>
                  setFormData({ ...formData, groupName: e.target.value })
                }
                autoFocus
              />
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  Crear
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Unirse a Grupo</h3>
            <form onSubmit={handleJoinGroup}>
              <input
                type="text"
                placeholder="Código de invitación"
                value={formData.inviteCode}
                onChange={(e) =>
                  setFormData({ ...formData, inviteCode: e.target.value })
                }
                autoFocus
              />
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  Unirse
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
