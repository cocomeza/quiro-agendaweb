# 🧪 Comandos para Ejecutar Tests

## 📋 Prerequisitos

Asegúrate de tener las variables de entorno configuradas en `.env.local`:
```env
TEST_USER_EMAIL=tu_email@ejemplo.com
TEST_USER_PASSWORD=tu_contraseña
```

---

## 🔬 Tests Unitarios (Vitest)

### Ejecutar todos los tests unitarios:
```bash
npm run test
```

### Ejecutar tests en modo watch (se re-ejecutan al cambiar archivos):
```bash
npm run test:watch
```

### Ejecutar tests con cobertura:
```bash
npm run test:coverage
```

### Ejecutar tests con UI interactiva:
```bash
npm run test:ui
```

### Ejecutar tests específicos:
```bash
npm run test -- __tests__/unit/utils.test.ts
npm run test -- __tests__/unit/export-pacientes.test.ts
```

---

## 🎭 Tests E2E (Playwright)

### Instalar navegadores (solo la primera vez):
```bash
npx playwright install chromium firefox msedge
```

### Ejecutar todos los tests E2E:
```bash
npm run test:e2e
```

### Ejecutar tests E2E solo en Chromium:
```bash
npx playwright test --project=chromium
```

### Ejecutar tests E2E solo en Firefox:
```bash
npx playwright test --project=firefox
```

### Ejecutar tests E2E solo en Edge:
```bash
npx playwright test --project=msedge
```

### Ejecutar tests E2E con UI interactiva:
```bash
npm run test:e2e:ui
```

### Ejecutar tests E2E en modo debug:
```bash
npm run test:e2e:debug
```

### Ejecutar un archivo específico de tests:
```bash
npx playwright test __tests__/e2e/auth.spec.ts
npx playwright test __tests__/e2e/pacientes.spec.ts
npx playwright test __tests__/e2e/turnos.spec.ts
npx playwright test __tests__/e2e/agenda.spec.ts
npx playwright test __tests__/e2e/exportacion.spec.ts
npx playwright test __tests__/e2e/seguimiento.spec.ts
npx playwright test __tests__/e2e/ficha-medica.spec.ts
npx playwright test __tests__/e2e/agenda-mejoras.spec.ts
```

### Ejecutar un test específico por nombre:
```bash
npx playwright test -g "debe iniciar sesión correctamente"
```

### Ver reporte HTML después de ejecutar:
```bash
npx playwright show-report
```

---

## 🚀 Ejecutar Todos los Tests

### Tests unitarios + E2E:
```bash
npm run test:all
```

### O ejecutar por separado:
```bash
# Primero unitarios
npm run test

# Luego E2E
npm run test:e2e
```

---

## 📊 Archivos de Tests Creados

### Tests Unitarios:
- ✅ `__tests__/unit/utils.test.ts` - Utilidades (copiar, formatear, turnos próximos/atrasados)
- ✅ `__tests__/unit/export-pacientes.test.ts` - Exportación CSV/JSON

### Tests E2E:
- ✅ `__tests__/e2e/auth.spec.ts` - Autenticación (login/logout)
- ✅ `__tests__/e2e/pacientes.spec.ts` - CRUD de pacientes
- ✅ `__tests__/e2e/turnos.spec.ts` - CRUD de turnos
- ✅ `__tests__/e2e/agenda.spec.ts` - Vista de agenda
- ✅ `__tests__/e2e/exportacion.spec.ts` - Exportación de datos
- ✅ `__tests__/e2e/seguimiento.spec.ts` - Filtros de seguimiento
- ✅ `__tests__/e2e/ficha-medica.spec.ts` - Ficha médica
- ✅ `__tests__/e2e/agenda-mejoras.spec.ts` - Mejoras de agenda (imprimir, copiar teléfono, etc.)

---

## ⚙️ Configuración

Los tests E2E están configurados para ejecutarse en:
- ✅ **Chromium** (Chrome)
- ✅ **Firefox**
- ✅ **Microsoft Edge**

El servidor de desarrollo se inicia automáticamente antes de ejecutar los tests E2E.

---

## 🐛 Troubleshooting

### Si los tests E2E fallan:
1. Verifica que el servidor de desarrollo esté corriendo: `npm run dev`
2. Verifica las variables de entorno en `.env.local`
3. Ejecuta con más tiempo: `npx playwright test --timeout=60000`

### Si los tests unitarios fallan:
1. Verifica que las dependencias estén instaladas: `npm install`
2. Ejecuta con más detalle: `npm run test -- --reporter=verbose`

---

## 📝 Notas

- Los tests E2E pueden tardar varios minutos en ejecutarse completamente
- Algunos tests pueden hacer `test.skip()` si no hay datos de prueba disponibles
- Los tests están diseñados para ser resilientes y no fallar si faltan datos

