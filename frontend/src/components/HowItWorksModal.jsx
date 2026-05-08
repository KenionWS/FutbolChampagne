import React from 'react';
import './HowItWorksModal.css';

function HowItWorksModal({ onClose }) {
  return (
    <div className="how-it-works">
      <div className="how-it-works-header">
        <h2>⚽ ¿Cómo funciona Fútbol Champagne?</h2>
        <p className="subtitle">Fantasy fútbol entre amigos, simple y divertido</p>
      </div>

      <div className="how-it-works-content">
        <section className="how-section">
          <div className="how-icon">👥</div>
          <div className="how-text">
            <h3>1. Armá tu grupo</h3>
            <p>
              Creá un grupo nuevo y compartí el <strong>código de invitación</strong> con
              tus amigos para que se sumen. Vos sos el admin y podés gestionar todo desde
              ahí.
            </p>
          </div>
        </section>

        <section className="how-section">
          <div className="how-icon">📅</div>
          <div className="how-text">
            <h3>2. Cargá un partido</h3>
            <p>
              El admin crea cada <strong>fecha</strong> con la información del rival y el
              día del partido. Antes del partido todos hacen sus predicciones.
            </p>
          </div>
        </section>

        <section className="how-section">
          <div className="how-icon">🔮</div>
          <div className="how-text">
            <h3>3. Hacé tus predicciones</h3>
            <p>
              Cada jugador predice cosas como <em>"¿quién va a ser la figura?"</em>,{' '}
              <em>"¿quién va a hacer un gol?"</em>, etc. Las{' '}
              <strong>categorías son personalizables</strong> por grupo: cada grupo arma
              las suyas.
            </p>
          </div>
        </section>

        <section className="how-section">
          <div className="how-icon">🗳️</div>
          <div className="how-text">
            <h3>4. Voten después del partido</h3>
            <p>
              Después de jugar, todos votan a quién creen que le corresponde cada
              categoría. El sistema calcula las{' '}
              <strong>predicciones acertadas automáticamente</strong> según los votos del
              grupo.
            </p>
          </div>
        </section>

        <section className="how-section">
          <div className="how-icon">⭐</div>
          <div className="how-text">
            <h3>5. Calificá a los compañeros</h3>
            <p>
              Cada uno le pone un puntaje del <strong>1 al 10</strong> a los demás según
              cómo jugaron. Esto suma al puntaje subjetivo de cada jugador en la fecha.
            </p>
          </div>
        </section>

        <section className="how-section">
          <div className="how-icon">🏆</div>
          <div className="how-text">
            <h3>6. Acumulá puntos en la tabla</h3>
            <p>
              Por cada partido sumás puntos por:
            </p>
            <ul className="how-list">
              <li>✅ Predicciones acertadas</li>
              <li>⚽ Goles y asistencias (cargados por el admin)</li>
              <li>📊 Promedio de calificaciones</li>
            </ul>
            <p>
              Todo eso arma la <strong>tabla del grupo</strong> y podés ver tus
              estadísticas individuales fecha por fecha.
            </p>
          </div>
        </section>

        <section className="how-section how-tip">
          <div className="how-icon">💡</div>
          <div className="how-text">
            <h3>Tips</h3>
            <ul className="how-list">
              <li>Tocá el avatar (arriba a la derecha) para cambiar tu emoji</li>
              <li>Tocá tu nombre para editar nombre, apellido y sobrenombre</li>
              <li>Tocá el logo para volver al inicio en cualquier momento</li>
              <li>Tocá un jugador en la tabla para ver sus stats partido a partido</li>
            </ul>
          </div>
        </section>
      </div>

      <button className="btn-close-how" onClick={onClose}>
        ¡Listo, a jugar!
      </button>
    </div>
  );
}

export default HowItWorksModal;
