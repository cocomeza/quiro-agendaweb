# Sistema de Gestión de Turnos - Consultorio Quiropráctico

Aplicación web moderna y completa para gestionar turnos, pacientes y fichas médicas de un consultorio quiropráctico.

## 🎯 Características Principales

### 📅 Agenda Diaria
- ✅ Visualización de turnos organizados por franjas horarias (08:00 - 19:30)
- ✅ Intervalos de **15 minutos** para mayor flexibilidad en la programación
- ✅ Navegación entre fechas (anterior/siguiente/hoy)
- ✅ Vista de calendario mensual
- ✅ Gestión completa de turnos (crear, editar, cancelar, completar)
- ✅ Estados de turno: programado, completado, cancelado
- ✅ Estado de pago: pagado/impago
- ✅ Visualización de edad del paciente en la agenda
- ✅ Edición de turnos desde la vista de calendario
- ✅ Impresión de turnos del día con selector de fecha

### 👥 Gestión de Pacientes
- ✅ Lista completa de pacientes con información detallada
- ✅ Búsqueda avanzada por nombre, apellido, teléfono, email, DNI, número de ficha
- ✅ Crear, editar y eliminar pacientes
- ✅ Información completa: nombre, apellido, teléfono, email, fecha de nacimiento, DNI, dirección, barrio, ciudad, provincia, O.S., ocupación, hobbies
- ✅ Número de ficha único para cada paciente
- ✅ Visualización de edad calculada automáticamente
- ✅ Exportación de pacientes a CSV y JSON
- ✅ Importación de pacientes desde CSV

### 📋 Ficha Médica Completa
- ✅ Sistema completo de ficha médica para cada paciente
- ✅ **Información General**: Datos personales completos
- ✅ **Historia de Salud**: Nacimiento, accidentes, ejercicios, estrés, sueño, cirugías, fracturas, etc.
- ✅ **Problemas Médicos**: Categorías completas (Enfermedades, Músculo-Esquelético, Sistema Nervioso, General, Gastro-Intestinal, Genito-Urinario, Cardio-Vascular, ORL, Femenino)
- ✅ **Información Clínica**: Antecedentes médicos, medicamentos actuales, alergias, diagnóstico, plan de tratamiento, observaciones
- ✅ Vista de impresión optimizada con todos los datos
- ✅ Guardado automático de todos los campos

### 📊 Seguimiento de Pacientes
- ✅ Filtro: Pacientes próximos a volver (18-28 días desde última visita)
- ✅ Filtro: Pacientes con cancelaciones recientes (últimos 20 días)
- ✅ Filtro: Pacientes sin llamadas telefónicas
- ✅ Tabla con información de seguimiento detallada
- ✅ Marcar pacientes como "llamados"
- ✅ Cálculo automático de última visita

### 🎨 Interfaz de Usuario
- ✅ Diseño responsive para todos los dispositivos (móvil, tablet, desktop)
- ✅ Búsqueda rápida de pacientes con mejor contraste
- ✅ Modales intuitivos y fáciles de usar
- ✅ Notificaciones toast para feedback al usuario
- ✅ Mejoras de contraste en todos los campos de búsqueda
- ✅ UI/UX moderna y profesional

### 🔒 Seguridad
- ✅ Autenticación segura con Supabase Auth
- ✅ Row Level Security (RLS) activado en todas las tablas
- ✅ Solo usuarios autenticados pueden acceder a los datos
- ✅ Protección de rutas con middleware

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Hosting**: Vercel
- **Testing**: Vitest (unitarios), Playwright (E2E)
- **Librerías**: date-fns, jsPDF, PapaParse, Lucide React

## 🚀 Deploy en Vercel

**📖 Guía completa:** [docs/VERCEL_DEPLOY.md](./docs/VERCEL_DEPLOY.md)

### Variables de Entorno Requeridas en Vercel:

```env
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
3. Ejecutar las migraciones adicionales en orden:
   - `supabase/migrations/add_dni_direccion.sql`
   - `supabase/migrations/add_ficha_medica.sql`
   - `supabase/migrations/add_numero_ficha.sql`
   - `supabase/migrations/add_seguimiento_fields.sql`
   - `supabase/migrations/add_ficha_medica_completa.sql` (si existe)

Esto creará las tablas `pacientes` y `turnos` con todas las políticas RLS y campos necesarios.

### 4. Configurar Autenticación

1. En Supabase, ir a **Authentication** > **Providers**
2. Habilitar **Email** provider
3. (Opcional) Configurar otros proveedores si lo deseas

### 5. Crear Usuario

1. En Supabase, ir a **Authentication** > **Users**
2. Click en **Add user** > **Create new user**
3. Ingresar email y contraseña
4. **Activar "Auto Confirm User"** para evitar problemas de confirmación
5. Guardar las credenciales para iniciar sesión

### 6. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Para tests E2E
TEST_USER_EMAIL=tu_email@ejemplo.com
TEST_USER_PASSWORD=tu_contraseña_segura
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

### Iniciar Sesión
1. Abrir la aplicación en `http://localhost:3000`
2. Iniciar sesión con las credenciales creadas en Supabase

### Agenda
- Visualizar y gestionar turnos del día seleccionado
- Navegar entre días usando las flechas o el botón "Hoy"
- Click en cualquier franja horaria para crear un turno
- Click en un turno existente para editarlo o cancelarlo
- Cambiar estado de turno (programado/completado/cancelado)
- Marcar pago (pagado/impago)
- Ver vista de calendario mensual
- Imprimir turnos del día

### Pacientes
- Ver lista completa de pacientes
- Buscar pacientes por nombre, apellido, teléfono, email, DNI o número de ficha
- Crear nuevo paciente
- Editar información de paciente existente
- Abrir ficha médica del paciente
- Exportar pacientes a CSV o JSON

### Ficha Médica
- Acceder desde la lista de pacientes o desde el modal de paciente
- Completar información general, historia de salud, problemas médicos e información clínica
- Guardar automáticamente
- Imprimir ficha médica completa

### Seguimiento
- Ver pacientes próximos a volver
- Ver pacientes con cancelaciones recientes
- Ver pacientes sin llamadas
- Marcar pacientes como llamados

## 🎨 Franjas Horarias

El sistema incluye franjas horarias cada **15 minutos** desde las 08:00 hasta las 19:30, permitiendo mayor flexibilidad en la programación de turnos.

## 🧪 Testing

El proyecto incluye una suite completa de tests unitarios y tests end-to-end (E2E):

### Tests Unitarios (Vitest)
- ✅ Tests de utilidades y funciones
- ✅ Tests de validaciones
- ✅ Tests de exportación de pacientes
- ✅ Tests de API de login
- ✅ Tests de integridad de datos
- ✅ Tests de validaciones de turnos
- ✅ Cobertura de código

### Tests E2E (Playwright)
- ✅ Tests de autenticación
- ✅ Tests de agenda diaria
- ✅ Tests de gestión de turnos
- ✅ Tests de gestión de pacientes
- ✅ Tests de ficha médica completa
- ✅ Tests de exportación de pacientes
- ✅ Tests de validaciones de formularios
- ✅ Tests de CRUD crítico
- ✅ Tests de rendimiento
- ✅ Tests de responsividad
- ✅ Tests de impresión y PDF

### Ejecutar Tests

```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Tests E2E con UI interactiva
npm run test:e2e:ui

# Tests E2E en modo debug
npm run test:e2e:debug

# Tests de rendimiento
npm run test:e2e:rendimiento

# Tests de responsividad
npm run test:e2e:responsividad

# Todos los tests
npm run test:all

# Ver más opciones en __tests__/README.md
```

### Variables de Entorno para Tests

Para ejecutar tests E2E, configura en `.env.local`:

```env
TEST_USER_EMAIL=tu_email@example.com
TEST_USER_PASSWORD=tu_contraseña
```

### Limpiar Pacientes de Prueba

Si creaste pacientes de prueba durante los tests, puedes eliminarlos:

```bash
npm run clean:test-pacientes
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
- Archivo CSV de pacientes: `ReportePacientes_*.csv` en la raíz del proyecto o en `data/`
- (Opcional) Archivo CSV de turnos: `*_ReporteAgendaProfesional.csv` en la raíz o en `data/`
- Service Role Key configurada en `.env.local`

**📁 Nota:** Los archivos CSV pueden estar en la raíz del proyecto o en la carpeta `data/`. Los scripts los buscarán automáticamente.

## 📚 Documentación

El proyecto incluye documentación completa:

- **[docs/RESUMEN_FUNCIONALIDADES.md](./docs/RESUMEN_FUNCIONALIDADES.md)** - Resumen de todas las funcionalidades
- **[docs/features/GUIA_FICHA_MEDICA.md](./docs/features/GUIA_FICHA_MEDICA.md)** - Guía de uso de ficha médica
- **[docs/features/GUIA_EXPORTAR_PACIENTES.md](./docs/features/GUIA_EXPORTAR_PACIENTES.md)** - Guía de exportación
- **[docs/VERCEL_DEPLOY.md](./docs/VERCEL_DEPLOY.md)** - Guía de deploy en Vercel
- **[docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)** - Configuración de Supabase
- **[docs/migration/MIGRATION.md](./docs/migration/MIGRATION.md)** - Guía de migración de datos
- **[__tests__/README.md](./__tests__/README.md)** - Documentación de tests
- **[__tests__/CRITICAL_TESTS.md](./__tests__/CRITICAL_TESTS.md)** - Tests críticos implementados

## 🔒 Seguridad

- Row Level Security (RLS) activado en todas las tablas
- Solo usuarios autenticados pueden acceder a los datos
- Las políticas RLS permiten acceso completo a usuarios autenticados
- Middleware de autenticación en todas las rutas protegidas
- Validación de datos en cliente y servidor

## 📦 Deploy en Vercel

1. Conectar tu repositorio GitHub con Vercel
2. Agregar las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático en cada push a `main`

**📖 Ver guía completa:** [docs/VERCEL_DEPLOY.md](./docs/VERCEL_DEPLOY.md)

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción

# Tests
npm run test             # Tests unitarios
npm run test:e2e         # Tests E2E
npm run test:all         # Todos los tests

# Migración
npm run migrate:run      # Migrar pacientes
npm run migrate:appointments  # Migrar turnos
npm run migrate:all      # Migrar todo

# Utilidades
npm run test:login       # Probar login
npm run diagnose         # Diagnóstico del sistema
npm run validate:env     # Validar variables de entorno
npm run clean:test-pacientes  # Limpiar pacientes de prueba
```

## 📝 Notas

- El sistema está diseñado para un único profesional
- No incluye métricas, estadísticas ni reportes complejos
- No incluye integraciones externas (WhatsApp/SMS)
- Realtime de Supabase está deshabilitado para optimizar recursos
- Los tests E2E requieren credenciales válidas de Supabase
- El sistema usa intervalos de 15 minutos para mayor flexibilidad

## 🤝 Contribuir

Este es un proyecto privado, pero si encuentras algún problema o tienes sugerencias, puedes:

1. Crear un issue en el repositorio
2. Proponer mejoras a través de pull requests
3. Reportar bugs con detalles de reproducción

## 📄 Licencia

Ver archivo [LICENSE](./LICENSE) para más detalles.

---

**Desarrollado con ❤️ para consultorios quiroprácticos**
