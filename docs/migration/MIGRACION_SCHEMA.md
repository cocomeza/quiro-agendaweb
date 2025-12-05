# Migración del Schema - Agregar Campos de Seguimiento

## 📋 Campos Nuevos Agregados

### Tabla `turnos`:
- **`pago`**: VARCHAR(20) - Valores: 'pagado' o 'impago' (default: 'impago')

### Tabla `pacientes`:
- **`llamado_telefono`**: BOOLEAN - Indica si el paciente fue llamado (default: false)
- **`fecha_ultimo_llamado`**: DATE - Fecha del último llamado telefónico

### Vista `paciente_ultima_visita`:
- Calcula automáticamente la última visita de cada paciente
- Cuenta turnos cancelados en los últimos 20 días
- Calcula la fecha del último turno cancelado

## 🚀 Cómo Aplicar la Migración

### Opción 1: Si es una base de datos nueva
Ejecuta directamente el archivo `supabase/schema.sql` completo en Supabase SQL Editor.

### Opción 2: Si ya tienes datos
Ejecuta el archivo `supabase/migrations/add_seguimiento_fields.sql` en Supabase SQL Editor.

Este script:
- ✅ Verifica si los campos ya existen antes de agregarlos
- ✅ No elimina datos existentes
- ✅ Establece valores por defecto seguros
- ✅ Crea la vista de seguimiento

## ⚠️ Importante

Después de ejecutar la migración, necesitarás:
1. Actualizar los tipos de TypeScript ejecutando: `npm run dev` (Next.js regenerará los tipos)
2. O regenerar manualmente los tipos desde Supabase Dashboard > Settings > API > Generate TypeScript types

