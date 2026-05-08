-- Agregar campos de perfil adicionales
ALTER TABLE users
ADD COLUMN surname VARCHAR(255),
ADD COLUMN nickname VARCHAR(255);
