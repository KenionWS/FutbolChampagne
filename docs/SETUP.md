# Setup Local Development

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Google OAuth credentials (from Google Cloud Console)

## Database Setup

1. Create a database:
```bash
createdb el_bidon
```

2. Run schema:
```bash
psql el_bidon < db/schema.sql
```

3. Verify tables:
```bash
psql el_bidon -c "\dt"
```

## Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
cp .env.example .env
```

2. Update `.env` with:
   - `DATABASE_URL`: PostgreSQL connection string
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `JWT_SECRET`: Any random string (e.g., `openssl rand -hex 32`)
   - `FRONTEND_URL`: `http://localhost:3000`

3. Start server:
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## Frontend Setup

1. Create React app:
```bash
cd frontend
npx create-react-app . (or use Vite)
npm install
```

2. Create `.env`:
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
```

3. Start dev server:
```bash
npm start
```

Frontend runs on `http://localhost:3000`

## Verify Setup

- Backend health: `curl http://localhost:3001/health`
- Frontend: `http://localhost:3000`
- DB: `psql el_bidon -c "SELECT COUNT(*) FROM users;"`

## Troubleshooting

**DB connection error**: Check `DATABASE_URL` in `.env`
**CORS errors**: Ensure `FRONTEND_URL` matches your frontend URL
**Google auth fails**: Verify `GOOGLE_CLIENT_ID` is correct

