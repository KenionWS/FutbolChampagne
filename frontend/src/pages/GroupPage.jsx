import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { groupsApi } from '../services/groupsApi';
import { matchesApi } from '../services/matchesApi';
import api from '../services/api';
import './GroupPage.css';

function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupRes = await groupsApi.getGroup(parseInt(groupId));
      setGroup(groupRes.data);

      const userRes = await api.get('/auth/me');
      setUser(userRes.data);

      const matchesRes = await matchesApi.getGroupMatches(groupId);
      setMatches(matchesRes.data);

      const membersRes = await groupsApi.getGroupMembers(parseInt(groupId));
      setGroupMembers(membersRes.data);

      const standingsRes = await api.get(`/groups/${groupId}/standings`);
      setStandings(standingsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading group');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (opponentName, matchDate) => {
    try {
      await api.post(`/matches/groups/${groupId}`, {
        opponentName,
        matchDate,
      });
      setShowCreateMatchModal(false);
      fetchGroupData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating match');
    }
  };

  if (loading) return <div className="container group-page"><p>Loading...</p></div>;
  if (error) return <div className="container group-page"><p className="error-message">{error}</p></div>;

  const copyCode = () => {
    navigator.clipboard.writeText(group?.invite_code);
    alert('Código copiado!');
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('¿Estás seguro de que quieres abandonar el grupo?')) return;
    try {
      await api.post(`/groups/${groupId}/leave`);
      window.location.href = '/groups';
    } catch (err) {
      alert(err.response?.data?.error || 'Error al abandonar el grupo');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este miembro?')) return;
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      fetchGroupData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar el miembro');
    }
  };

  return (
    <div className="container group-page">
      <div className="group-header">
        <div className="header-top">
          <div>
            <h2>{group?.name}</h2>
            {user?.id === group?.admin_id && (
              <p className="admin-badge">👑 Eres admin</p>
            )}
          </div>
          <div className="header-right">
            {user?.id === group?.admin_id && (
              <button
                className="btn-create-match"
                onClick={() => setShowCreateMatchModal(true)}
              >
                + Crear Partido
              </button>
            )}
            <div className="invite-code-box">
              <span className="label">Código:</span>
              <code>{group?.invite_code}</code>
              <button className="copy-btn" onClick={copyCode}>
                Copiar
              </button>
            </div>
            <div className="group-menu">
              <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>⋮</button>
              {showMenu && (
                <div className="menu-dropdown">
                  <button onClick={handleLeaveGroup} className="menu-item leave-item">
                    Abandonar grupo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="group-tabs">
          <button
            className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Partidos
          </button>
          <button
            className={`tab ${activeTab === 'standings' ? 'active' : ''}`}
            onClick={() => setActiveTab('standings')}
          >
            Posiciones
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Miembros
          </button>
        </div>
      </div>

      <div className="group-content">
        {activeTab === 'matches' && (
          <div className="matches-section">
            {matches.length === 0 ? (
              <p>No hay partidos aún</p>
            ) : (
              <div className="matches-list">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="match-card"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <h3>{match.opponent_name}</h3>
                    <p>
                      {new Date(match.match_date).toLocaleDateString('es-AR')}
                    </p>
                    <span className={`status status-${match.status}`}>
                      {match.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="standings-section">
            {standings.length === 0 ? (
              <p>No hay datos de posiciones aún</p>
            ) : (
              <div className="standings-table">
                <div className="standings-header">
                  <div className="col-position">Pos</div>
                  <div className="col-player">Jugador</div>
                  <div className="col-stats">Puntos</div>
                  <div className="col-stats">Aciertos</div>
                  <div className="col-stats">Total</div>
                </div>
                {standings.map((player, index) => (
                  <div key={player.id} className="standings-row">
                    <div className="col-position">
                      <span className="position-badge">{index + 1}</span>
                    </div>
                    <div className="col-player">
                      {player.picture_url && (
                        <img src={player.picture_url} alt={player.name} />
                      )}
                      <span>{player.name}</span>
                    </div>
                    <div className="col-stats points">{player.points}</div>
                    <div className="col-stats">
                      {player.correct_predictions}/{player.total_predictions}
                    </div>
                    <div className="col-stats">{player.total_predictions}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-section">
            {groupMembers.length === 0 ? (
              <p>No hay miembros</p>
            ) : (
              <div className="members-list">
                {groupMembers.map((member) => (
                  <div key={member.id} className="member-card">
                    {member.picture_url && (
                      <img src={member.picture_url} alt={member.name} />
                    )}
                    <div className="member-info">
                      <h4>{member.name}</h4>
                      <p>{member.email}</p>
                      <small>
                        Unido: {new Date(member.joined_at).toLocaleDateString('es-AR')}
                      </small>
                    </div>
                    {user?.id === group?.admin_id && user?.id !== member.id && (
                      <button
                        className="btn-delete-member"
                        onClick={() => handleDeleteMember(member.id)}
                        title="Eliminar miembro"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedMatch && (
        <MatchModal
          match={selectedMatch}
          group={group}
          groupId={parseInt(groupId)}
          members={groupMembers}
          user={user}
          onClose={() => setSelectedMatch(null)}
          onUpdate={() => fetchGroupData()}
        />
      )}

      {showCreateMatchModal && (
        <CreateMatchModal
          onClose={() => setShowCreateMatchModal(false)}
          onCreate={handleCreateMatch}
        />
      )}
    </div>
  );
}

function CreateMatchModal({ onClose, onCreate }) {
  const [opponentName, setOpponentName] = useState('');
  const [matchDate, setMatchDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!opponentName.trim() || !matchDate) {
      alert('Completa todos los campos');
      return;
    }
    onCreate(opponentName, matchDate);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Crear Nuevo Partido</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rival</label>
            <input
              type="text"
              placeholder="Ej: Amigos del barrio"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Fecha y hora</label>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-submit">
              Crear
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MatchModal({ match, group, groupId, members = [], user: propUser, onClose, onUpdate }) {
  const [predictions, setPredictions] = useState([]);
  const [myPredictions, setMyPredictions] = useState({});
  const [myVotes, setMyVotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ opponentName: match.opponent_name, matchDate: '' });
  const [newPredictionText, setNewPredictionText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [user, setUser] = useState(propUser);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);

  const matchPassed = new Date(match.match_date) < new Date();
  const canVote = !matchPassed && match.status === 'voting';

  useEffect(() => {
    fetchMatchData();
    fetchCategories();
    fetchUser();

    // Format match date for edit input
    const date = new Date(match.match_date);
    const isoDate = date.toISOString().slice(0, 16);
    setEditData({ opponentName: match.opponent_name, matchDate: isoDate });
  }, [match.id]);

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const predsRes = await matchesApi.getMatchPredictions(match.id);
      setPredictions(predsRes.data);

      const myPdsRes = await matchesApi.getMyPredictions(match.id);
      const myPdsMap = {};
      myPdsRes.data.forEach((pd) => {
        myPdsMap[pd.category_id] = pd.prediction_text;
      });
      setMyPredictions(myPdsMap);

      // Fetch personal votes
      const myVotesRes = await api.get(`/matches/${match.id}/my-votes`);
      setMyVotes(myVotesRes.data);
    } catch (err) {
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const fetchUser = async () => {
    if (!user) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    }
  };

  const handleEditMatch = async () => {
    if (!editData.opponentName.trim() || !editData.matchDate) return;

    try {
      await api.patch(`/matches/${match.id}`, {
        opponentName: editData.opponentName,
        matchDate: editData.matchDate,
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      alert('Error editing match');
    }
  };

  const handleMakePrediction = async () => {
    if (!selectedCategory || !newPredictionText.trim()) return;

    try {
      await matchesApi.makePrediction(
        match.id,
        selectedCategory,
        newPredictionText
      );
      setNewPredictionText('');
      setSelectedCategory('');
      fetchMatchData();
    } catch (err) {
      alert('Error making prediction');
    }
  };

  const handleVote = async (predictionId, resolved) => {
    try {
      await matchesApi.votePrediction(predictionId, resolved);
      fetchMatchData();
    } catch (err) {
      alert('Error voting');
    }
  };

  const isAdmin = user?.id === group?.admin_id;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await api.post(`/groups/${groupId}/categories`, {
        name: newCategoryName,
      });
      setNewCategoryName('');
      setShowNewCategoryForm(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating category');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="match-header">
          <div>
            <h2>{match.opponent_name}</h2>
            <p className="match-date">
              {new Date(match.match_date).toLocaleString('es-AR')}
            </p>
          </div>
          {isAdmin && !isEditing && (
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              ✏️ Editar
            </button>
          )}
        </div>
        <span className={`status status-${match.status}`}>
          {match.status}
        </span>

        {isEditing && isAdmin && (
          <div className="edit-form">
            <input
              type="text"
              value={editData.opponentName}
              onChange={(e) =>
                setEditData({ ...editData, opponentName: e.target.value })
              }
              placeholder="Nombre del rival"
            />
            <input
              type="datetime-local"
              value={editData.matchDate}
              onChange={(e) =>
                setEditData({ ...editData, matchDate: e.target.value })
              }
            />
            <div className="edit-buttons">
              <button className="btn-save" onClick={handleEditMatch}>
                Guardar
              </button>
              <button
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="modal-content">
          {match.status === 'draft' && (
            <div className="predictions-section">
              <h3>Haz tu predicción</h3>

              {isAdmin && (
                <div className="create-category-section">
                  {!showNewCategoryForm ? (
                    <button
                      className="btn-add-category"
                      onClick={() => setShowNewCategoryForm(true)}
                    >
                      + Agregar categoría
                    </button>
                  ) : (
                    <div className="new-category-form">
                      <input
                        type="text"
                        placeholder="Nombre de la categoría"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        autoFocus
                      />
                      <div className="category-form-buttons">
                        <button
                          className="btn-save"
                          onClick={handleCreateCategory}
                        >
                          Crear
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setShowNewCategoryForm(false);
                            setNewCategoryName('');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="prediction-form">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Selecciona categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="">Selecciona jugador</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedMember && selectedCategory) {
                      const member = members.find(
                        (m) => m.id === parseInt(selectedMember)
                      );
                      setNewPredictionText(member.name);
                      handleMakePrediction();
                      setSelectedMember('');
                    }
                  }}
                  className="btn-submit"
                >
                  Predecir
                </button>
              </div>

              {predictions.length > 0 && (
                <div className="predictions-list">
                  <h4>Predicciones</h4>
                  {predictions.map((pred) => (
                    <div key={pred.id} className="prediction-item">
                      <div className="prediction-text">
                        <strong>{pred.user_name}</strong>:{' '}
                        {pred.prediction_text}
                        <small> ({pred.category_name})</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {match.status === 'voting' && (
            <div className="voting-section">
              <h3>Vota si acertaron</h3>
              {matchPassed ? (
                <p className="warning-message">
                  ⚠️ La fecha del partido ya pasó, no se puede votar
                </p>
              ) : (
                predictions.length > 0 ? (
                  <div className="predictions-list">
                    {predictions.map((pred) => (
                      <div key={pred.id} className="prediction-vote">
                        <div className="prediction-text">
                          <strong>{pred.user_name}</strong>: {pred.prediction_text}
                          <small> ({pred.category_name})</small>
                        </div>
                        {canVote && (
                          <div className="vote-buttons">
                            <button
                              className="btn-yes"
                              onClick={() => handleVote(pred.id, true)}
                            >
                              ✓ Acertó
                            </button>
                            <button
                              className="btn-no"
                              onClick={() => handleVote(pred.id, false)}
                            >
                              ✗ No
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No hay predicciones</p>
                )
              )}
            </div>
          )}

          {match.status === 'resolved' && (
            <div className="results-section">
              <h3>Resultados</h3>
              {predictions.length > 0 ? (
                <div className="predictions-list">
                  {predictions.map((pred) => (
                    <div key={pred.id} className="prediction-result">
                      <strong>{pred.user_name}</strong>: {pred.prediction_text}
                      <small> ({pred.category_name})</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay predicciones</p>
              )}
            </div>
          )}

          {myVotes.length > 0 && (
            <div className="my-votes-section">
              <h3>Mis votos</h3>
              <div className="predictions-list">
                {myVotes.map((vote) => (
                  <div key={vote.id} className="my-vote-item">
                    <div className="vote-info">
                      <strong>{vote.predicted_by_name}</strong>: {vote.prediction_text}
                      <small> ({vote.category_name})</small>
                    </div>
                    <div className={`vote-result ${vote.resolved ? 'correct' : 'incorrect'}`}>
                      {vote.resolved ? '✓ Acertó' : '✗ No'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupPage;
