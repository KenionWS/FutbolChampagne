import React from 'react';
import { useParams } from 'react-router-dom';
import './GroupPage.css';

function GroupPage() {
  const { groupId } = useParams();

  return (
    <div className="container group-page">
      <div className="group-header">
        <h2>Nombre del Grupo</h2>
        <div className="group-tabs">
          <button className="tab active">Próximo Partido</button>
          <button className="tab">Predicciones</button>
          <button className="tab">Posiciones</button>
          <button className="tab">Historial</button>
        </div>
      </div>

      <div className="group-content">
        {/* Content will go here based on active tab */}
        <p>Contenido del grupo...</p>
      </div>
    </div>
  );
}

export default GroupPage;
