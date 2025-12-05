# 📁 Estructura del Proyecto

Este documento describe la organización de archivos y carpetas del proyecto.

## 📂 Estructura de Directorios

```
agenda-web-quiropraxico/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── auth/
│   │       └── login/
│   ├── login/                    # Página de login
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página principal (agenda)
│
├── components/                    # Componentes React
│   ├── AgendaDiaria.tsx          # Vista de agenda diaria
│   ├── AgendaPage.tsx            # Página principal de agenda
│   ├── BusquedaRapida.tsx        # Búsqueda rápida de pacientes
│   ├── FichaMedica.tsx           # Modal de ficha médica
│   ├── ListaPacientes.tsx        # Lista de pacientes
│   ├── LoginForm.tsx             # Formulario de login
│   ├── ModalPaciente.tsx         # Modal crear/editar paciente
│   ├── ModalTurno.tsx            # Modal crear/editar turno
│   ├── ResumenDia.tsx            # Resumen del día
│   ├── SeguimientoPacientes.tsx   # Vista de seguimiento
│   ├── Toast.tsx                 # Componente de notificaciones
│   ├── ToastProvider.tsx         # Provider de notificaciones
│   └── VistaImpresionTurnos.tsx  # Vista para imprimir
│
├── docs/                          # 📚 Documentación
│   ├── README.md                 # Índice de documentación
│   ├── GUIA_USUARIO.md           # Guía para usuarios
│   ├── NEXT_STEPS.md             # Próximos pasos
│   ├── RESUMEN_FUNCIONALIDADES.md # Resumen de funcionalidades
│   ├── SUPABASE_SETUP.md         # Configuración de Supabase
│   ├── TROUBLESHOOTING.md        # Solución de problemas
│   │
│   ├── development/              # 🔧 Documentación de desarrollo
│   │   ├── BUGS_Y_MEJORAS_ENCONTRADOS.md
│   │   ├── MEJORAS_IMPLEMENTADAS.md
│   │   ├── MEJORAS_PROFESIONALES_APLICADAS.md
│   │   └── MEJORAS_USABILIDAD.md
│   │
│   ├── features/                 # ✨ Documentación de funcionalidades
│   │   ├── GUIA_EXPORTAR_PACIENTES.md
│   │   └── GUIA_FICHA_MEDICA.md
│   │
│   ├── migration/               # 🔄 Documentación de migración
│   │   ├── GUIA_IMPORTAR_CSV.md
│   │   ├── INSTRUCCIONES_RAPIDAS.md
│   │   ├── MIGRACION_SCHEMA.md
│   │   └── MIGRATION.md
│   │
│   └── testing/                 # 🧪 Documentación de testing
│       ├── COMANDOS_TESTS.md
│       └── TESTS_RENDIMIENTO_RESPONSIVIDAD.md
│
├── data/                         # 📊 Datos temporales (no se sube a Git)
│   ├── README.md                # Explicación de la carpeta
│   ├── *.csv                     # Archivos CSV de migración
│   └── *.log                     # Logs de migración
│
├── lib/                          # 📚 Librerías y utilidades
│   ├── supabase/                 # Clientes de Supabase
│   │   ├── client.ts             # Cliente para browser
│   │   ├── server.ts             # Cliente para server
│   │   └── types.ts              # Tipos TypeScript
│   ├── export-pacientes.ts       # Exportación de pacientes
│   ├── logger.ts                 # Sistema de logging
│   ├── toast.ts                  # Utilidades de notificaciones
│   ├── utils.ts                  # Utilidades generales
│   └── validaciones.ts           # Validaciones de formularios
│
├── scripts/                       # 🔧 Scripts de utilidad
│   ├── README.md                 # Documentación de scripts
│   ├── analyze-csv.ts            # Analizar CSV de pacientes
│   ├── analyze-appointments-csv.ts # Analizar CSV de turnos
│   ├── diagnose.ts               # Diagnóstico del sistema
│   ├── migrate-frontmy-data.ts   # Migrar pacientes desde Frontmy
│   ├── migrate-appointments.ts   # Migrar turnos desde Frontmy
│   ├── test-login.ts             # Probar login
│   ├── validate-env.ts           # Validar variables de entorno
│   └── validate-migration.ts     # Validar migración
│
├── supabase/                      # 🗄️ Schema y migraciones de Supabase
│   ├── migrations/               # Migraciones SQL
│   │   ├── add_ficha_medica.sql
│   │   └── add_seguimiento_fields.sql
│   └── schema.sql                # Schema completo de la BD
│
├── __tests__/                     # 🧪 Tests
│   ├── README.md                 # Documentación de tests
│   ├── setup.ts                  # Configuración de tests
│   ├── e2e/                      # Tests end-to-end (Playwright)
│   │   ├── global-setup.ts
│   │   ├── helpers.ts
│   │   ├── agenda.spec.ts
│   │   ├── agenda-mejoras.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── bugs-y-mejoras.spec.ts
│   │   ├── exportacion.spec.ts
│   │   ├── ficha-medica.spec.ts
│   │   ├── pacientes.spec.ts
│   │   ├── rendimiento.spec.ts
│   │   ├── responsividad.spec.ts
│   │   ├── seguimiento.spec.ts
│   │   └── turnos.spec.ts
│   └── unit/                     # Tests unitarios (Vitest)
│       ├── export-pacientes.test.ts
│       └── utils.test.ts
│
├── .github/                       # ⚙️ GitHub Actions
│   └── workflows/
│       ├── deploy.yml            # CI/CD para deploy
│       └── test.yml              # CI/CD para tests
│
├── LICENSE                        # Licencia MIT
├── README.md                      # Documentación principal
├── ESTRUCTURA_PROYECTO.md        # Este archivo
├── middleware.ts                  # Middleware de Next.js (auth)
├── next.config.ts                 # Configuración de Next.js
├── package.json                   # Dependencias y scripts
├── playwright.config.ts          # Configuración de Playwright
├── postcss.config.mjs            # Configuración de PostCSS
├── tailwind.config.ts            # Configuración de Tailwind
├── tsconfig.json                  # Configuración de TypeScript
└── vitest.config.ts              # Configuración de Vitest
```

## 📋 Descripción de Carpetas Principales

### `/app`
Contiene las páginas y rutas de Next.js usando App Router.

### `/components`
Componentes React reutilizables. Cada componente tiene una responsabilidad específica.

### `/docs`
Toda la documentación del proyecto organizada por categorías:
- **General**: Documentación general del proyecto
- **Development**: Mejoras y estándares de desarrollo
- **Features**: Guías de funcionalidades específicas
- **Migration**: Documentación de migración de datos
- **Testing**: Documentación de tests

### `/data`
Carpeta para archivos temporales:
- Archivos CSV de migración (no se suben a Git)
- Logs de errores de migración
- **⚠️ Esta carpeta está en `.gitignore`**

### `/lib`
Librerías y utilidades:
- **supabase/**: Clientes y tipos de Supabase
- Utilidades generales (validaciones, exportación, logging, etc.)

### `/scripts`
Scripts de Node.js para:
- Migración de datos
- Análisis de CSVs
- Validación y diagnóstico

### `/supabase`
Schema y migraciones de la base de datos:
- **schema.sql**: Schema completo
- **migrations/**: Migraciones incrementales

### `/__tests__`
Tests automatizados:
- **e2e/**: Tests end-to-end con Playwright
- **unit/**: Tests unitarios con Vitest

## 🔍 Archivos Importantes en la Raíz

- **README.md**: Documentación principal del proyecto
- **package.json**: Dependencias y scripts npm
- **middleware.ts**: Manejo de autenticación
- **LICENSE**: Licencia MIT
- **.gitignore**: Archivos ignorados por Git

## 📝 Convenciones de Nombres

- **Componentes**: PascalCase (ej: `AgendaDiaria.tsx`)
- **Utilidades**: camelCase (ej: `export-pacientes.ts`)
- **Tests**: `.spec.ts` para E2E, `.test.ts` para unitarios
- **Documentación**: UPPERCASE con guiones (ej: `GUIA_USUARIO.md`)

## 🚀 Próximos Pasos

Para empezar a trabajar con el proyecto:
1. Lee **[README.md](./README.md)** para configuración inicial
2. Revisa **[docs/NEXT_STEPS.md](./docs/NEXT_STEPS.md)** para implementación
3. Consulta **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** si tienes problemas

