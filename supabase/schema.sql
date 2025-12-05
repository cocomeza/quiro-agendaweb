-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(255),
  fecha_nacimiento DATE,
  llamado_telefono BOOLEAN DEFAULT false,
  fecha_ultimo_llamado DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS turnos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(20) DEFAULT 'programado' CHECK (estado IN ('programado', 'completado', 'cancelado')),
  pago VARCHAR(20) DEFAULT 'impago' CHECK (pago IN ('pagado', 'impago')),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(fecha, hora)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_paciente_id ON turnos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre_apellido ON pacientes(nombre, apellido);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turnos_updated_at BEFORE UPDATE ON turnos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pacientes (solo usuarios autenticados pueden acceder)
CREATE POLICY "Usuarios autenticados pueden ver pacientes"
  ON pacientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar pacientes"
  ON pacientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar pacientes"
  ON pacientes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar pacientes"
  ON pacientes FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para turnos (solo usuarios autenticados pueden acceder)
CREATE POLICY "Usuarios autenticados pueden ver turnos"
  ON turnos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar turnos"
  ON turnos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar turnos"
  ON turnos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar turnos"
  ON turnos FOR DELETE
  TO authenticated
  USING (true);

-- Vista para calcular la última visita de cada paciente
CREATE OR REPLACE VIEW paciente_ultima_visita AS
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

