# 📥 Guía para Importar Base de Datos desde Frontmy

Esta guía te ayudará a importar la base de datos de pacientes desde Frontmy (archivo CSV) a tu nueva aplicación.

## 📋 Paso 1: Preparar el Archivo CSV

1. **Exportar desde Frontmy:**
   - En Frontmy, exporta el reporte de pacientes
   - Guarda el archivo CSV con un nombre descriptivo (ej: `pacientes_frontmy.csv`)

2. **Colocar el archivo en el proyecto:**
   - Copia el archivo CSV a la raíz del proyecto (donde está `package.json`)
   - Puedes renombrarlo a `ReportePacientes_20251204.csv` o usar cualquier nombre

## 🔧 Paso 2: Configurar Variables de Entorno

1. **Obtener Service Role Key de Supabase:**
   - Ve a [Supabase Dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto
   - Ve a **Settings** > **API**
   - Copia la **`service_role` key** (es secreta, no la compartas)

2. **Agregar al archivo `.env.local`:**
   
   Abre o crea el archivo `.env.local` en la raíz del proyecto y agrega:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

   ⚠️ **IMPORTANTE:** 
   - La Service Role Key es secreta, nunca la compartas
   - No la subas a Git (ya está en `.gitignore`)
   - Solo se usa para scripts de migración

## 🔍 Paso 3: Analizar el CSV (Recomendado)

Antes de migrar, analiza la estructura del CSV para asegurarte de que el script pueda leerlo correctamente:

```bash
npm run migrate:analyze
```

Este comando mostrará:
- Total de registros en el CSV
- Nombres de las columnas
- Ejemplos de datos
- Análisis por columna

**Si el CSV tiene columnas diferentes**, el script intentará encontrarlas automáticamente usando variaciones comunes de nombres.

## 🚀 Paso 4: Ejecutar la Migración

### Opción A: Si el CSV se llama `ReportePacientes_20251204.csv`

```bash
npm run migrate:run
```

### Opción B: Si el CSV tiene otro nombre

Edita el archivo `scripts/migrate-frontmy-data.ts` y cambia la línea 238:

```typescript
const csvPath = path.join(process.cwd(), 'TU_ARCHIVO.csv');
```

Luego ejecuta:

```bash
npm run migrate:run
```

## 📊 Qué Hace el Script

1. **Lee el archivo CSV** con codificación correcta (latin1 o utf8)
2. **Mapea los campos** automáticamente:
   - Nombre y Apellido (busca variaciones: nombre/Nombre/name)
   - Teléfono (busca: telefono/Telefono/celular/Celular)
   - Email (busca: email/Email/correo/Correo)
   - Fecha de nacimiento (busca: fecha_nacimiento/Fecha de Nacimiento/edad)
   - Notas (busca: notas/Notas/observaciones/Observaciones)
3. **Limpia y normaliza** los datos:
   - Normaliza teléfonos (agrega código de país si falta)
   - Parsea fechas desde diferentes formatos
   - Calcula fecha de nacimiento desde edad si es necesario
4. **Elimina duplicados** automáticamente
5. **Inserta en lotes** de 100 registros (más rápido y seguro)
6. **Muestra progreso** en tiempo real

## ✅ Paso 5: Validar la Migración

Después de migrar, valida que todo esté correcto:

```bash
npm run migrate:validate
```

Este comando mostrará:
- Total de pacientes migrados
- Pacientes con teléfono/email/fecha de nacimiento
- Posibles duplicados
- Ejemplos de registros

## 🔍 Verificar en Supabase

1. Ve a Supabase Dashboard > **Table Editor**
2. Selecciona la tabla `pacientes`
3. Verifica que los datos se hayan importado correctamente
4. Revisa algunos registros manualmente

## ⚠️ Solución de Problemas

### Error: "Archivo CSV no encontrado"

**Solución:** 
- Verifica que el archivo CSV esté en la raíz del proyecto (donde está `package.json`)
- Verifica el nombre del archivo en el script

### Error: "Variables de entorno faltantes"

**Solución:**
- Verifica que `.env.local` tenga `SUPABASE_SERVICE_ROLE_KEY`
- Reinicia el terminal después de agregar las variables

### Error: "duplicate key value violates unique constraint"

**Solución:**
- El script elimina duplicados automáticamente
- Si persiste, revisa `migration-errors.log`
- Puede ser que ya existan pacientes en la base de datos

### Los datos no se mapean correctamente

**Solución:**
1. Ejecuta `npm run migrate:analyze` para ver las columnas del CSV
2. Edita `scripts/migrate-frontmy-data.ts`
3. Agrega los nombres de columnas específicos en la función `normalizeField()`

Por ejemplo, si tu CSV tiene una columna llamada "Nombre Completo", agrega:

```typescript
const nombreCompleto = normalizeField(frontmyData, 'Nombre Completo', 'nombre_completo');
```

## 📝 Ejemplo de Uso Completo

```bash
# 1. Analizar CSV
npm run migrate:analyze

# 2. Migrar pacientes
npm run migrate:run

# 3. Validar migración
npm run migrate:validate

# 4. Verificar en Supabase Dashboard
```

## 🎯 Campos que se Migran

| Campo Frontmy | Campo Supabase | Notas |
|---------------|----------------|-------|
| Nombre | `nombre` | Se busca en varias variaciones |
| Apellido | `apellido` | Se busca en varias variaciones |
| Teléfono/Celular | `telefono` | Se normaliza y limpia |
| Email/Correo | `email` | Se valida formato básico |
| Fecha de Nacimiento/Edad | `fecha_nacimiento` | Se parsea o calcula desde edad |
| Notas/Observaciones | `notas` | Se combinan si hay múltiples campos |
| - | `llamado_telefono` | Se inicializa en `false` |
| - | `fecha_ultimo_llamado` | Se inicializa en `null` |

## 🔒 Seguridad Post-Migración

Después de migrar exitosamente:

1. ✅ Verifica que los datos estén correctos
2. ✅ Haz un backup de la base de datos en Supabase
3. ⚠️ **NO** subas la Service Role Key a Git (ya está en `.gitignore`)
4. ✅ Puedes dejar la Service Role Key en `.env.local` para futuras migraciones

## 📞 ¿Necesitas Ayuda?

Si el CSV tiene una estructura muy diferente o encuentras problemas:

1. Ejecuta `npm run migrate:analyze` y comparte el output
2. Comparte los nombres de las columnas de tu CSV
3. Revisa `migration-errors.log` si hay errores

---

**¡Listo!** Una vez migrados los pacientes, podrás verlos en la aplicación y crear turnos para ellos.

