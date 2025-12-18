-- Migración: Agregar campos completos de ficha médica según formato nuevo
-- Basado en el formato de ficha médica física proporcionado

-- Agregar campos de información general adicional
ALTER TABLE pacientes
ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50),
ADD COLUMN IF NOT EXISTS recomendado_por VARCHAR(255),
ADD COLUMN IF NOT EXISTS barrio VARCHAR(100),
ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100),
ADD COLUMN IF NOT EXISTS provincia VARCHAR(100),
ADD COLUMN IF NOT EXISTS obra_social VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefono_laboral VARCHAR(20),
ADD COLUMN IF NOT EXISTS ocupacion_actual VARCHAR(255),
ADD COLUMN IF NOT EXISTS ocupaciones_previas TEXT,
ADD COLUMN IF NOT EXISTS hobbies_deportes TEXT;

-- Agregar campos de historia de salud (almacenados como JSON para flexibilidad)
ALTER TABLE pacientes
ADD COLUMN IF NOT EXISTS historia_salud JSONB DEFAULT '{}'::jsonb;

-- Agregar campos de problemas médicos (almacenados como JSON para flexibilidad)
ALTER TABLE pacientes
ADD COLUMN IF NOT EXISTS problemas_medicos JSONB DEFAULT '{}'::jsonb;

-- Comentarios para documentación
COMMENT ON COLUMN pacientes.estado_civil IS 'Estado civil del paciente';
COMMENT ON COLUMN pacientes.recomendado_por IS 'Persona o medio que recomendó al paciente';
COMMENT ON COLUMN pacientes.barrio IS 'Barrio donde reside el paciente';
COMMENT ON COLUMN pacientes.ciudad IS 'Ciudad donde reside el paciente';
COMMENT ON COLUMN pacientes.provincia IS 'Provincia donde reside el paciente';
COMMENT ON COLUMN pacientes.obra_social IS 'Obra social o seguro médico del paciente';
COMMENT ON COLUMN pacientes.telefono_laboral IS 'Teléfono laboral del paciente';
COMMENT ON COLUMN pacientes.ocupacion_actual IS 'Ocupación actual del paciente';
COMMENT ON COLUMN pacientes.ocupaciones_previas IS 'Ocupaciones previas del paciente';
COMMENT ON COLUMN pacientes.hobbies_deportes IS 'Hobbies y deportes que practica el paciente';
COMMENT ON COLUMN pacientes.historia_salud IS 'Historia de salud del paciente (preguntas 1-10) en formato JSON';
COMMENT ON COLUMN pacientes.problemas_medicos IS 'Problemas médicos del paciente organizados por categorías en formato JSON';
