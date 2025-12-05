# Scripts de Migración

Este directorio contiene scripts para migrar datos desde Frontmy a Supabase.

## Scripts Disponibles

### `analyze-csv.ts`

Analiza la estructura del archivo CSV antes de la migración.

**Uso:**
```bash
npm run migrate:analyze
```

**Qué hace:**
- Lee el archivo `ReportePacientes_20251204.csv`
- Muestra total de registros
- Lista todas las columnas encontradas
- Muestra ejemplos de datos
- Analiza cada columna (valores únicos, ejemplos)

**Cuándo usarlo:**
- Antes de la primera migración
- Si el CSV tiene una estructura diferente
- Para entender qué datos están disponibles

### `migrate-frontmy-data.ts`

Migra los datos del CSV a Supabase.

**Uso:**
```bash
npm run migrate:run
```

**Qué hace:**
1. Lee el archivo CSV
2. Transforma los datos al formato de Supabase
3. Elimina duplicados
4. Inserta en lotes de 100 registros
5. Muestra progreso y resumen

**Requisitos:**
- Archivo `ReportePacientes_20251204.csv` en la raíz
- Variables de entorno configuradas (ver MIGRATION.md)

**Salida:**
- Logs en consola
- `migration-errors.log` si hay errores

### `analyze-appointments-csv.ts`

Analiza la estructura del archivo CSV de turnos antes de la migración.

**Uso:**
```bash
npm run migrate:analyze-appointments
```

**Qué hace:**
- Lee el archivo `20251204_20251204_ReporteAgendaProfesional.csv`
- Muestra total de turnos
- Lista todas las columnas encontradas
- Identifica columnas relevantes (fecha, hora, paciente, estado)
- Muestra ejemplos de datos

**Cuándo usarlo:**
- Antes de migrar turnos
- Si el CSV tiene una estructura diferente
- Para entender qué datos están disponibles

### `migrate-appointments.ts`

Migra los turnos del CSV a Supabase.

**Uso:**
```bash
npm run migrate:appointments
```

**⚠️ IMPORTANTE:** Ejecuta esto DESPUÉS de migrar pacientes.

**Qué hace:**
1. Lee el archivo CSV de turnos
2. Busca cada paciente por nombre/apellido en la BD
3. Transforma los datos al formato de Supabase
4. Elimina duplicados
5. Inserta en lotes de 50 registros
6. Muestra progreso y resumen

**Requisitos:**
- Archivo `20251204_20251204_ReporteAgendaProfesional.csv` en la raíz
- Pacientes ya migrados previamente
- Variables de entorno configuradas

**Salida:**
- Logs en consola
- `migration-appointments-errors.log` si hay errores

### `validate-migration.ts`

Valida los datos migrados después de la migración.

**Uso:**
```bash
npm run migrate:validate
```

**Qué hace:**
- Cuenta total de pacientes migrados
- Verifica pacientes con teléfono/email/fecha de nacimiento
- Busca posibles duplicados
- Muestra ejemplos de registros

**Cuándo usarlo:**
- Después de ejecutar la migración
- Para verificar la integridad de los datos
- Para diagnosticar problemas

## Configuración

Todos los scripts requieren:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## Orden de Ejecución

**IMPORTANTE:** Sigue este orden:

1. **Primero:** Migrar pacientes
   ```bash
   npm run migrate:analyze
   npm run migrate:run
   ```

2. **Segundo:** Migrar turnos (opcional)
   ```bash
   npm run migrate:analyze-appointments
   npm run migrate:appointments
   ```

3. **Tercero:** Validar
   ```bash
   npm run migrate:validate
   ```

O ejecuta todo en secuencia:
```bash
npm run migrate:all
```

## Troubleshooting

### El script no encuentra el CSV

Asegúrate de que el archivo esté en la raíz del proyecto:
```
proyecto/
├── ReportePacientes_20251204.csv  ← Aquí
├── scripts/
├── package.json
└── ...
```

### Error de codificación

Si ves caracteres raros, el script intenta automáticamente:
1. `latin1` (Windows-1252)
2. `utf8`

Si persiste, convierte el CSV manualmente a UTF-8.

### Errores de migración

Revisa `migration-errors.log` para ver qué registros fallaron y por qué.

## Personalización

Si tu CSV tiene columnas diferentes, edita `migrate-frontmy-data.ts`:

1. Ajusta la interfaz `FrontmyPatient`
2. Modifica `normalizeField()` para agregar más variantes de nombres
3. Ajusta `mapFrontmyToSupabase()` para el mapeo específico

