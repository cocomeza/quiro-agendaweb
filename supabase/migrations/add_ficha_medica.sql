-- Migración: Agregar campos de ficha médica a la tabla pacientes

-- Agregar campos de ficha médica
ALTER TABLE pacientes
ADD COLUMN IF NOT EXISTS motivo_consulta TEXT,
ADD COLUMN IF NOT EXISTS antecedentes_medicos TEXT,
ADD COLUMN IF NOT EXISTS medicamentos_actuales TEXT,
ADD COLUMN IF NOT EXISTS alergias TEXT,
ADD COLUMN IF NOT EXISTS diagnostico TEXT,
ADD COLUMN IF NOT EXISTS plan_tratamiento TEXT,
ADD COLUMN IF NOT EXISTS observaciones_medicas TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN pacientes.motivo_consulta IS 'Motivo principal de consulta del paciente';
COMMENT ON COLUMN pacientes.antecedentes_medicos IS 'Antecedentes médicos relevantes';
COMMENT ON COLUMN pacientes.medicamentos_actuales IS 'Medicamentos que el paciente está tomando actualmente';
COMMENT ON COLUMN pacientes.alergias IS 'Alergias conocidas del paciente';
COMMENT ON COLUMN pacientes.diagnostico IS 'Diagnóstico del paciente';
COMMENT ON COLUMN pacientes.plan_tratamiento IS 'Plan de tratamiento establecido';
COMMENT ON COLUMN pacientes.observaciones_medicas IS 'Observaciones médicas adicionales';


