-- Migración: Agregar campos de seguimiento y pago
-- Ejecutar este script en Supabase SQL Editor si ya tienes datos

-- Agregar campo pago a turnos (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turnos' AND column_name = 'pago'
  ) THEN
    ALTER TABLE turnos ADD COLUMN pago VARCHAR(20) DEFAULT 'impago' CHECK (pago IN ('pagado', 'impago'));
  END IF;
END $$;

-- Agregar campos de seguimiento a pacientes (si no existen)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pacientes' AND column_name = 'llamado_telefono'
  ) THEN
    ALTER TABLE pacientes ADD COLUMN llamado_telefono BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pacientes' AND column_name = 'fecha_ultimo_llamado'
  ) THEN
    ALTER TABLE pacientes ADD COLUMN fecha_ultimo_llamado DATE;
  END IF;
END $$;

-- Crear vista para calcular última visita (reemplazar si existe)
DROP VIEW IF EXISTS paciente_ultima_visita;

CREATE VIEW paciente_ultima_visita AS
SELECT 
  p.id,
  p.nombre,
  p.apellido,
  p.telefono,
  p.email,
  p.fecha_nacimiento,
  p.llamado_telefono,
  p.fecha_ultimo_llamado,
  p.notas,
  p.created_at,
  p.updated_at,
  MAX(CASE WHEN t.estado = 'completado' THEN t.fecha END) as ultima_visita,
  COUNT(CASE WHEN t.estado = 'cancelado' AND t.fecha >= CURRENT_DATE - INTERVAL '20 days' THEN 1 END) as turnos_cancelados_recientes,
  MAX(CASE WHEN t.estado = 'cancelado' AND t.fecha >= CURRENT_DATE - INTERVAL '20 days' THEN t.fecha END) as fecha_ultimo_cancelado
FROM pacientes p
LEFT JOIN turnos t ON t.paciente_id = p.id
GROUP BY p.id, p.nombre, p.apellido, p.telefono, p.email, p.fecha_nacimiento, p.llamado_telefono, p.fecha_ultimo_llamado, p.notas, p.created_at, p.updated_at;

