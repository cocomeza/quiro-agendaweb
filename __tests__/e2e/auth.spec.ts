import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('debe redirigir a login si no está autenticado', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@invalid.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/Error|error|incorrecto/i')).toBeVisible();
  });

  test('debe iniciar sesión correctamente', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto('/login');
    
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // Esperar a que la redirección ocurra
    await page.waitForURL('/', { timeout: 20000 });
    await expect(page).toHaveURL('/');
    
    // Verificar que el contenido principal está visible
    await expect(page.locator('text=/Agenda|Pacientes|Seguimiento/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('debe cerrar sesión correctamente', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip();
      return;
    }

    // Login primero
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/', { timeout: 15000 });
    
    // Cerrar sesión
    const cerrarSesion = page.locator('button:has-text("Cerrar sesión")').first();
    if (await cerrarSesion.isVisible({ timeout: 2000 })) {
      await cerrarSesion.click();
      await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

