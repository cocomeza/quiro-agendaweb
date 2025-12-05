import { Page, expect } from '@playwright/test';

/**
 * Helper para hacer login en los tests
 */
export async function login(page: Page) {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  
  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL y TEST_USER_PASSWORD deben estar configuradas en .env.local');
  }

  await page.goto('/login');
  
  // Esperar a que el formulario esté visible
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Esperar a que el botón esté habilitado
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
  
  await submitButton.click();
  
  // Esperar a que la redirección ocurra y la página cargue
  await page.waitForURL('/', { timeout: 20000 });
  
  // Esperar a que el contenido principal esté visible
  await expect(page.locator('text=/Agenda|Pacientes|Seguimiento/i').first()).toBeVisible({ timeout: 10000 });
  
  // Pequeña pausa para asegurar que todo está cargado
  await page.waitForTimeout(1000);
}

/**
 * Helper para navegar a una vista específica
 */
export async function navegarAVista(page: Page, vista: 'agenda' | 'pacientes' | 'seguimiento') {
  const selectores = {
    agenda: 'button:has-text("Agenda")',
    pacientes: 'button:has-text("Pacientes")',
    seguimiento: 'button:has-text("Seguimiento")',
  };

  const selector = selectores[vista];
  const boton = page.locator(selector).first();
  
  await expect(boton).toBeVisible({ timeout: 5000 });
  await boton.click();
  
  // Esperar a que la vista cambie
  await page.waitForTimeout(500);
}

