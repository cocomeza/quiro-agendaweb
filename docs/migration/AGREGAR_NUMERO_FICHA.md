# Migración: Agregar campo numero_ficha

## Descripción
Esta migración agrega el campo `numero_ficha` a la tabla `pacientes` para almacenar el número de ficha médica de cada paciente, que viene del CSV exportado de Frontmy.

## Script SQL

Ejecuta el siguiente script en el SQL Editor de Supabase:

```sql
-- Agregar columna numero_ficha a la tabla pacientes
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS numero_ficha VARCHAR(20);

-- Crear índice para mejorar búsquedas por número de ficha
CREATE INDEX IF NOT EXISTS idx_pacientes_numero_ficha ON pacientes(numero_ficha);

-- Comentario en la columna para documentación
COMMENT ON COLUMN pacientes.numero_ficha IS 'Número de ficha médica del paciente';
```

## Pasos para ejecutar

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el script SQL de arriba
5. Haz clic en **Run** o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## Verificación

Después de ejecutar el script, verifica que la columna se agregó correctamente:

```sql
-- Verificar que la columna existe
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'pacientes' 
  AND column_name = 'numero_ficha';
```

Deberías ver:
- `column_name`: `numero_ficha`
- `data_type`: `character varying`
- `character_maximum_length`: `20`

## Notas

- El campo es opcional (puede ser NULL)
- El campo tiene un máximo de 20 caracteres
- Si ya tienes pacientes en la base de datos, el campo se creará con valores NULL
- Puedes actualizar los valores ejecutando el script de migración de datos: `npx tsx scripts/migrate-frontmy-data.ts`

## Rollback (si necesitas revertir)

Si necesitas eliminar el campo (no recomendado si ya tienes datos):

```sql
-- ⚠️ ADVERTENCIA: Esto eliminará todos los datos de numero_ficha
DROP INDEX IF EXISTS idx_pacientes_numero_ficha;
ALTER TABLE pacientes DROP COLUMN IF EXISTS numero_ficha;
```

