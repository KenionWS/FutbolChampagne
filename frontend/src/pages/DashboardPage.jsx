import React, { useState } from 'react';
import './DashboardPage.css';

function DashboardPage() {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="container dashboard">
      <h2>Mis Grupos</h2>
      <button onClick={() => setShowCreateModal(true)}>+ Crear Grupo</button>

      {groups.length === 0 ? (
        <div className="empty-state">
          <p>No tienes grupos aún</p>
          <p>Crea uno o pídele a un amigo que te invite</p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div key={group.id} className="group-card">
              <h3>{group.name}</h3>
              <p>{group.memberCount} miembros</p>
              <button>Entrar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
