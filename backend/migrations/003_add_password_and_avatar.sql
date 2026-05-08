-- Agregar columnas de contraseña y avatar a usuarios
ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255),
ADD COLUMN avatar VARCHAR(255) DEFAULT '⚽',
ADD COLUMN registration_type VARCHAR(50) DEFAULT 'google';

-- Crear índice único para email si no existe
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);
