# Migración de Datos desde Frontmy

Esta guía explica cómo migrar los datos de pacientes desde Frontmy (archivo CSV) a Supabase.

## 📋 Requisitos Previos

1. Archivo CSV exportado de Frontmy: `ReportePacientes_20251204.csv`
2. (Opcional) Archivo CSV de turnos: `20251204_20251204_ReporteAgendaProfesional.csv`
3. Service Role Key de Supabase (para bypass RLS durante migración)
4. Variables de entorno configuradas

## 🔧 Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Agrega a tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**⚠️ IMPORTANTE:** La Service Role Key se obtiene en:
- Supabase Dashboard > Settings > API > `service_role` key (secret)

**🔒 Seguridad:** La Service Role Key bypassa RLS. Úsala solo en scripts de migración y nunca la expongas en el frontend.

### 3. Colocar Archivos CSV

Coloca los archivos CSV en la raíz del proyecto:
- `ReportePacientes_20251204.csv` (requerido)
- `20251204_20251204_ReporteAgendaProfesional.csv` (opcional, para migrar turnos)

## 🚀 Proceso de Migración

### ⚠️ Orden de Ejecución

**IMPORTANTE:** Debes migrar primero los pacientes y luego los turnos, ya que los turnos necesitan referenciar los IDs de pacientes.

### Paso 1: Analizar el CSV de Pacientes

Primero, analiza la estructura del CSV de pacientes:

```bash
npm run migrate:analyze
```

Este script mostrará:
- Total de registros
- Nombres de columnas
- Ejemplos de datos
- Análisis por columna

**📝 Nota:** Si el CSV tiene columnas diferentes a las esperadas, deberás ajustar el mapeo en `scripts/migrate-frontmy-data.ts`.

### Paso 2: Ajustar Mapeo (si es necesario)

Si las columnas del CSV no coinciden con las esperadas, edita `scripts/migrate-frontmy-data.ts` y ajusta la función `mapFrontmyToSupabase()`.

El mapeo actual espera columnas como:
- `nombre` / `Nombre`
- `apellido` / `Apellido`
- `telefono` / `Telefono` / `celular`
- `email` / `Email`
- `fecha_nacimiento` / `Fecha de Nacimiento` / `edad`
- `notas` / `Notas` / `observaciones`

### Paso 2: Ejecutar Migración de Pacientes

```bash
npm run migrate:run
```

El script:
1. Lee el archivo CSV
2. Transforma los datos al formato de Supabase
3. Elimina duplicados
4. Inserta en lotes de 100 registros
5. Muestra progreso y resumen final

**⏱️ Tiempo estimado:** Depende del tamaño del CSV (aprox. 1-2 segundos por 100 registros).

### Paso 3: Analizar CSV de Turnos (Opcional)

Si tienes el archivo de turnos (`20251204_20251204_ReporteAgendaProfesional.csv`), analízalo:

```bash
npm run migrate:analyze-appointments
```

Este script mostrará la estructura del CSV de turnos.

### Paso 4: Migrar Turnos (Opcional)

**⚠️ IMPORTANTE:** Solo ejecuta esto DESPUÉS de migrar los pacientes.

```bash
npm run migrate:appointments
```

El script:
1. Lee el archivo CSV de turnos
2. Busca los pacientes correspondientes por nombre/apellido
3. Transforma los datos al formato de Supabase
4. Elimina duplicados
5. Inserta en lotes de 50 registros
6. Muestra progreso y resumen final

**⏱️ Tiempo estimado:** Más lento que pacientes porque busca cada paciente en la BD (aprox. 2-3 segundos por 10 turnos).

**📝 Nota:** Los turnos sin paciente correspondiente se omitirán.

### Paso 5: Validar Migración

```bash
npm run migrate:validate
```

Este script verifica:
- Total de pacientes migrados
- Pacientes con teléfono/email/fecha de nacimiento
- Posibles duplicados
- Ejemplos de registros

### Migración Completa (Ambos)

Para migrar pacientes y turnos en secuencia:

```bash
npm run migrate:all
```

Esto ejecutará primero la migración de pacientes y luego la de turnos.

## 📊 Estructura de Datos

### Schema de Supabase - Pacientes

```sql
pacientes (
  id UUID PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(255),
  fecha_nacimiento DATE,
  notas TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Schema de Supabase - Turnos

```sql
turnos (
  id UUID PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(20) CHECK (estado IN ('programado', 'completado', 'cancelado')),
  notas TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(fecha, hora)
)
```

### Transformaciones Aplicadas - Pacientes

1. **Nombre y Apellido:** Se separan si vienen juntos, o se normalizan desde diferentes columnas
2. **Teléfono:** Se limpia y normaliza (agrega código de país +54 si falta)
3. **Email:** Se valida formato básico
4. **Fecha de Nacimiento:** Se parsea desde fecha o se calcula desde edad
5. **Notas:** Se combinan observaciones/comentarios si existen múltiples campos

### Transformaciones Aplicadas - Turnos

1. **Paciente:** Se busca por nombre y apellido en la base de datos migrada
2. **Fecha:** Se parsea desde diferentes formatos (DD/MM/YYYY, YYYY-MM-DD, etc.)
3. **Hora:** Se normaliza a formato HH:MM
4. **Estado:** Se mapea a 'programado', 'completado' o 'cancelado'
5. **Notas:** Se migran observaciones/comentarios si existen

## 🔍 Troubleshooting

### Error: "Archivo CSV no encontrado"

**Solución:** Asegúrate de que los archivos CSV estén en la raíz del proyecto:
- `ReportePacientes_20251204.csv` (para pacientes)
- `20251204_20251204_ReporteAgendaProfesional.csv` (para turnos, opcional)

### Error: "Variables de entorno faltantes"

**Solución:** Verifica que `.env.local` tenga:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Error: "duplicate key value violates unique constraint"

**Causa:** Hay duplicados en el CSV o en la base de datos.

**Solución:** El script elimina duplicados automáticamente. Si persiste, revisa `migration-errors.log`.

### Error: "value too long for type character varying(X)"

**Causa:** Algún campo excede el límite de caracteres.

**Solución:** Los campos se truncan automáticamente:
- `nombre`/`apellido`: 100 caracteres
- `telefono`: 20 caracteres
- `email`: 255 caracteres

### Advertencia: "RLS policy violation"

**Causa:** Estás usando `anon` key en lugar de `service_role` key.

**Solución:** Verifica que uses `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Advertencia: "Paciente no encontrado" (en migración de turnos)

**Causa:** El turno referencia un paciente que no existe en la base de datos.

**Solución:** 
- Asegúrate de migrar pacientes primero
- Verifica que los nombres en el CSV de turnos coincidan con los nombres migrados
- Revisa si hay diferencias en mayúsculas/minúsculas o espacios

### Problemas de Codificación

Si el CSV tiene caracteres raros, el script intenta:
1. Primero con codificación `latin1` (Windows-1252)
2. Si falla, con `utf8`

Si persisten problemas, convierte el CSV manualmente a UTF-8.

## 📝 Logs y Errores

Si hay errores durante la migración, se guardan en:
- `migration-errors.log` (errores de pacientes)
- `migration-appointments-errors.log` (errores de turnos)

Cada log contiene:
- Número de lote
- Mensaje de error
- Datos del lote que falló

Revisa estos archivos para identificar problemas específicos.

## ✅ Checklist Post-Migración

- [ ] Ejecutar `npm run migrate:validate`
- [ ] Verificar manualmente 5-10 registros de pacientes en Supabase Dashboard
- [ ] (Si migraste turnos) Verificar que los turnos estén vinculados correctamente a pacientes
- [ ] Revisar `migration-errors.log` si existe
- [ ] Revisar `migration-appointments-errors.log` si migraste turnos
- [ ] Verificar que los pacientes aparezcan en la aplicación
- [ ] (Si migraste turnos) Verificar que los turnos aparezcan en la agenda
- [ ] Hacer backup de la base de datos migrada
- [ ] Remover Service Role Key de `.env.local` (usar solo en scripts)

## 🔒 Seguridad Post-Migración

**IMPORTANTE:** Después de la migración:

1. **NO** commits la Service Role Key en Git
2. **NO** uses la Service Role Key en el frontend
3. **SÍ** mantén la Service Role Key solo en `.env.local` (que está en `.gitignore`)
4. **SÍ** usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` en producción

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de consola
2. Revisa `migration-errors.log`
3. Ejecuta `npm run migrate:validate` para diagnóstico
4. Verifica que el schema de Supabase esté correcto

## 📅 Historial de Migraciones

| Fecha | Registros Originales | Registros Migrados | Tasa de Éxito | Notas |
|-------|---------------------|-------------------|---------------|-------|
| - | - | - | - | - |

---

**Última actualización:** [Completar después de migración]

