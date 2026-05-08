-- Permitir google_id nulo para usuarios que se registran con email
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
