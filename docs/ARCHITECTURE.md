# El Bidón - Architecture

## Database Design

### Core Concepts

**Users**: Identificados por Google OAuth (email + google_id)

**Groups**: Espacios privados con código de invitación. Admin crea categorías custom.

**Matches (Fechas)**: Cada partido. Estados: draft → active → voting → resolved

**Predictions**: Antes del partido, cada usuario predice por categoría (e.g., "Messi goleador")

**Votes**: Después del partido, todos votan si cada predicción fue acertada o no (votación colectiva)

**Match Stats**: Admin confirma goles y asistencias (datos objetivos)

**Player Ratings**: Todos ratan a todos post-match (1-10)

**Match Scores**: Puntaje calculado por usuario por fecha:
- `prediction_points`: Predicciones acertadas
- `stats_points`: Goles × 3 + Asistencias × 1
- `subjective_score`: Promedio de ratings
- `total_points`: Suma de todo

**Season Standings**: Tabla acumulada por temporada

---

## Data Flow

### Pre-Match
1. Admin crea match (fecha, opponent)
2. Usuarios hacen predicciones (categoría + texto)

### Post-Match
1. Admin confirma stats (goles/asistencias)
2. Usuarios votan predicciones (true/false)
3. Usuarios ratan jugadores (1-10)

### Scoring
1. Sistema calcula `match_scores` automáticamente
2. `season_standings` se actualiza acumulativamente
3. Tabla de posiciones visible en real-time

---

## API Endpoints (sketch)

```
Auth
  POST /auth/google          (redirect URL after OAuth)
  GET  /auth/me              (current user)

Groups
  POST   /groups             (crear grupo)
  GET    /groups/:id         (detalles grupo)
  POST   /groups/:id/join    (unirse con código)
  GET    /groups/:id/members (listado miembros)

Prediction Categories
  POST   /groups/:id/categories     (crear categoría)
  GET    /groups/:id/categories     (listar)

Matches
  POST   /groups/:id/matches        (crear fecha)
  GET    /groups/:id/matches        (listar)
  GET    /matches/:id               (detalles fecha)

Predictions
  POST   /matches/:id/predictions   (registrar predicción)
  GET    /matches/:id/predictions   (mis predicciones)

Votes
  POST   /predictions/:id/votes     (votar si acertó)
  GET    /predictions/:id/votes     (quién votó qué)

Ratings
  POST   /matches/:id/ratings       (ratear jugador)
  GET    /matches/:id/ratings       (ratings del partido)

Stats
  POST   /matches/:id/stats         (admin: confirmar goles/asistencias)
  GET    /matches/:id/stats         (stats del partido)

Standings
  GET    /groups/:id/standings/:season  (tabla de posiciones)
  GET    /groups/:id/history            (histórico de fechas)
```

---

## Key Design Decisions

1. **Votación colectiva**: No decide una sola persona. Todos votan y se resuelve por consenso.
2. **Ratings en rango 1-10** (no binario) para permitir matices.
3. **Stats admin-confirmados**: Evita disputes sobre goles/asistencias.
4. **Categorías custom per grupo**: Cada grupo define sus propias predicciones.
5. **Invitation codes**: Privacidad total, no descubrimiento de grupos.
6. **Season structure**: Permite restart periódico, histórico de temporadas.
