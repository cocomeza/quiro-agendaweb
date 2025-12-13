-- Agregar campos DNI y direccion a la tabla pacientes
-- Este script se puede ejecutar en Supabase SQL Editor si los campos no existen

-- Agregar campo DNI si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pacientes' AND column_name = 'dni'
  ) THEN
    ALTER TABLE pacientes ADD COLUMN dni VARCHAR(20);
  END IF;
END $$;

-- Agregar campo direccion si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pacientes' AND column_name = 'direccion'
  ) THEN
    ALTER TABLE pacientes ADD COLUMN direccion VARCHAR(255);
  END IF;
END $$;
