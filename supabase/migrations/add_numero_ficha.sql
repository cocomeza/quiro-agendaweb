-- Migración: Agregar campo numero_ficha a la tabla pacientes
-- Fecha: 2025-01-XX
-- Descripción: Agrega el campo numero_ficha para almacenar el número de ficha médica de cada paciente

-- Agregar columna numero_ficha a la tabla pacientes
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS numero_ficha VARCHAR(20);

-- Crear índice para mejorar búsquedas por número de ficha (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_pacientes_numero_ficha ON pacientes(numero_ficha);

-- Comentario en la columna para documentación
COMMENT ON COLUMN pacientes.numero_ficha IS 'Número de ficha médica del paciente';

