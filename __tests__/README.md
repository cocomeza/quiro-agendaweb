# Guía de Testing

Este proyecto incluye tests unitarios y tests end-to-end (E2E) para asegurar la calidad del código.

## Estructura de Tests

```
__tests__/
├── e2e/              # Tests end-to-end con Playwright
│   ├── auth.spec.ts      # Tests de autenticación
│   ├── agenda.spec.ts    # Tests de agenda diaria
│   ├── turnos.spec.ts    # Tests de gestión de turnos
│   └── pacientes.spec.ts # Tests de gestión de pacientes
├── unit/             # Tests unitarios con Vitest
│   └── utils.test.ts     # Tests de utilidades
└── setup.ts          # Configuración global de tests
```

## Configuración

### Variables de Entorno para Tests E2E

Crea un archivo `.env.test.local` con:

```env
TEST_USER_EMAIL=tu_email@example.com
TEST_USER_PASSWORD=tu_contraseña
```

O configura estas variables en tu sistema:

```bash
export TEST_USER_EMAIL=tu_email@example.com
export TEST_USER_PASSWORD=tu_contraseña
```

## Ejecutar Tests

### Tests Unitarios

```bash
# Ejecutar todos los tests unitarios
npm run test

# Modo watch (re-ejecuta al cambiar archivos)
npm run test:watch

# UI interactiva
npm run test:ui

# Con reporte de cobertura
npm run test:coverage
```

### Tests E2E

```bash
# Ejecutar todos los tests E2E (headless)
npm run test:e2e

# Modo UI interactivo
npm run test:e2e:ui

# Modo debug (paso a paso)
npm run test:e2e:debug
```

### Todos los Tests

```bash
# Ejecutar unitarios + E2E
npm run test:all
```

## Escribir Nuevos Tests

### Test Unitario

```typescript
import { describe, it, expect } from 'vitest';

describe('Mi función', () => {
  it('debe hacer algo', () => {
    expect(true).toBe(true);
  });
});
```

### Test E2E

```typescript
import { test, expect } from '@playwright/test';

test('debe hacer algo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

## CI/CD

Los tests se ejecutan automáticamente en GitHub Actions cuando:
- Se hace push a `main` o `develop`
- Se crea un Pull Request a `main`

Ver `.github/workflows/test.yml` para más detalles.

## Notas

- Los tests E2E requieren que la aplicación esté corriendo en `http://localhost:3000`
- Playwright se encarga de iniciar el servidor automáticamente
- Algunos tests pueden ser marcados como `skip` si no hay datos de prueba disponibles

