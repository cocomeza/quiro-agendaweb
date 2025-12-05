# Sistema de Gestión de Turnos - Consultorio Quiropráctico

Aplicación web para gestionar turnos de un consultorio quiropráctico.

## 🎯 Características

- ✅ Visualización de agenda diaria organizada por franjas horarias (08:00 - 19:30)
- ✅ Gestión completa de turnos (crear, editar, cancelar, completar)
- ✅ Base de datos de pacientes con información completa
- ✅ Búsqueda y filtrado de pacientes
- ✅ Diseño responsive para todos los dispositivos
- ✅ Autenticación segura con Supabase Auth
- ✅ Row Level Security (RLS) activado

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Hosting**: Vercel

## 🚀 Deploy en Vercel

**📖 Guía completa:** [CHECKLIST_DEPLOY_VERCEL.md](./CHECKLIST_DEPLOY_VERCEL.md)

### Variables de Entorno Requeridas en Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

⚠️ **Importante**: NO agregar `SUPABASE_SERVICE_ROLE_KEY` en Vercel (solo para desarrollo local).

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Supabase (gratuita)
- Cuenta en Vercel (para deploy)

## 🚀 Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crear un nuevo proyecto en [Supabase](https://supabase.com)
2. Ir a **Settings** > **API** y copiar:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configurar Base de Datos

1. En Supabase, ir a **SQL Editor**
2. Ejecutar el script completo del archivo `supabase/schema.sql`
3. Esto creará las tablas `pacientes` y `turnos` con todas las políticas RLS

### 4. Configurar Autenticación

1. En Supabase, ir a **Authentication** > **Providers**
2. Habilitar **Email** provider
3. (Opcional) Configurar otros proveedores si lo deseas

### 5. Crear Usuario

1. En Supabase, ir a **Authentication** > **Users**
2. Click en **Add user** > **Create new user**
3. Ingresar email y contraseña
4. Guardar las credenciales para iniciar sesión

### 6. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
USER_EMAIL=tu_email@ejemplo.com
USER_PASSWORD=tu_contraseña_segura
```

**📝 Nota:** Puedes copiar `.env.local.example` y completar con tus valores.

### 7. Probar Acceso (Opcional)

Antes de ejecutar la aplicación, puedes probar que las credenciales funcionan:

```bash
npm run test:login
```

Este script verificará:
- ✅ Conexión a Supabase
- ✅ Credenciales de usuario
- ✅ Acceso a las tablas

### 8. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Uso

1. Iniciar sesión con las credenciales creadas en Supabase
2. **Agenda**: Visualizar y gestionar turnos del día seleccionado
3. **Pacientes**: Ver, crear y editar información de pacientes
4. Navegar entre días usando las flechas o el botón "Hoy"
5. Click en cualquier franja horaria para crear un turno
6. Click en un turno existente para editarlo o cancelarlo

## 🎨 Franjas Horarias

El sistema incluye franjas horarias cada 30 minutos desde las 08:00 hasta las 19:30.

## 🔒 Seguridad

- Row Level Security (RLS) activado en todas las tablas
- Solo usuarios autenticados pueden acceder a los datos
- Las políticas RLS permiten acceso completo a usuarios autenticados

## 📦 Deploy en Vercel

1. Conectar tu repositorio GitHub con Vercel
2. Agregar las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático en cada push

## 🧪 Testing

El proyecto incluye tests unitarios y tests end-to-end (E2E):

### Tests Unitarios (Vitest)
- Tests de utilidades y funciones
- Cobertura de código

### Tests E2E (Playwright)
- Tests de autenticación
- Tests de agenda diaria
- Tests de gestión de turnos
- Tests de gestión de pacientes

### Ejecutar Tests

```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Todos los tests
npm run test:all

# Ver más opciones en __tests__/README.md
```

### Variables de Entorno para Tests

Para ejecutar tests E2E, configura:

```env
TEST_USER_EMAIL=tu_email@example.com
TEST_USER_PASSWORD=tu_contraseña
```

## 🔄 Migración de Datos desde Frontmy

Si tienes datos exportados desde Frontmy, puedes migrarlos usando los scripts de migración:

### Migración de Pacientes

```bash
# 1. Analizar el CSV de pacientes
npm run migrate:analyze

# 2. Ejecutar migración de pacientes
npm run migrate:run

# 3. Validar resultados
npm run migrate:validate
```

### Migración de Turnos (Opcional)

**⚠️ IMPORTANTE:** Ejecuta esto DESPUÉS de migrar los pacientes.

```bash
# 1. Analizar el CSV de turnos
npm run migrate:analyze-appointments

# 2. Ejecutar migración de turnos
npm run migrate:appointments
```

### Migración Completa (Pacientes + Turnos)

```bash
npm run migrate:all
```

**📖 Ver guía completa:** [docs/migration/MIGRATION.md](./docs/migration/MIGRATION.md)

**⚠️ Requisitos:**
- Archivo CSV de pacientes: `ReportePacientes_20251204.csv` en la raíz del proyecto o en `data/`
- (Opcional) Archivo CSV de turnos: `20251204_20251204_ReporteAgendaProfesional.csv` en la raíz o en `data/`
- Service Role Key configurada en `.env.local`

**📁 Nota:** Los archivos CSV pueden estar en la raíz del proyecto o en la carpeta `data/`. Los scripts los buscarán automáticamente.

## 🚀 Próximos Pasos

¿Listo para empezar? Sigue la guía paso a paso:

**📖 Ver:** [docs/NEXT_STEPS.md](./docs/NEXT_STEPS.md) - Guía completa de implementación

### Resumen rápido:

1. **Configurar Supabase** → Crear proyecto y ejecutar `supabase/schema.sql`
2. **Migrar datos** → `npm run migrate:run` (y opcionalmente `npm run migrate:appointments`)
3. **Probar aplicación** → `npm run dev` y verificar que todo funciona
4. **Deploy** → Conectar con Vercel y hacer deploy

## 📝 Notas

- El sistema está diseñado para un único profesional
- No incluye métricas, estadísticas ni reportes
- No incluye integraciones externas (WhatsApp/SMS)
- Realtime de Supabase está deshabilitado para optimizar recursos
- Los tests E2E requieren credenciales válidas de Supabase

