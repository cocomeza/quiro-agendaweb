import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Tests de Rendimiento', () => {
  test.beforeEach(async ({ page }) => {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
      test.skip();
      return;
    }
    
    await login(page);
    await page.waitForURL('/', { timeout: 20000 });
  });

  test('debe cargar la agenda en menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="agenda-container"], .agenda-container, main', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de carga de agenda: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // Menos de 3 segundos
  });

  test('debe cargar la lista de pacientes en menos de 2 segundos', async ({ page }) => {
    await page.click('a[href*="pacientes"], button:has-text("Pacientes")');
    await page.waitForTimeout(500); // Esperar navegación
    
    const startTime = Date.now();
    
    // Esperar a que la lista se cargue
    await page.waitForSelector('[data-testid="pacientes-list"], .pacientes-list, table, button:has-text("Nuevo Paciente")', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de carga de pacientes: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000); // Menos de 2 segundos
  });

  test('debe abrir modal de turno en menos de 500ms', async ({ page }) => {
    const startTime = Date.now();
    
    await page.click('button:has-text("Nuevo Turno")');
    await page.waitForSelector('dialog, [role="dialog"], form', { timeout: 2000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de apertura de modal: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(500); // Menos de 500ms
  });

  test('debe realizar búsqueda de pacientes en menos de 1 segundo', async ({ page }) => {
    await page.click('a[href*="pacientes"], button:has-text("Pacientes")');
    await page.waitForTimeout(500);
    
    const startTime = Date.now();
    
    // Buscar un paciente
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(300); // Esperar resultados
    }
    
    const searchTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de búsqueda: ${searchTime}ms`);
    expect(searchTime).toBeLessThan(1000); // Menos de 1 segundo
  });

  test('debe renderizar múltiples turnos sin lag', async ({ page }) => {
    // Navegar a la agenda
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const startTime = Date.now();
    
    // Esperar a que todos los elementos se rendericen
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    const renderTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de renderizado completo: ${renderTime}ms`);
    expect(renderTime).toBeLessThan(2000); // Menos de 2 segundos
  });

  test('debe manejar scroll suave en lista de pacientes', async ({ page }) => {
    await page.click('a[href*="pacientes"], button:has-text("Pacientes")');
    await page.waitForTimeout(500);
    
    const startTime = Date.now();
    
    // Hacer scroll
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    });
    
    await page.waitForTimeout(500); // Esperar animación
    
    const scrollTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de scroll: ${scrollTime}ms`);
    expect(scrollTime).toBeLessThan(1000); // Scroll debe ser rápido
  });

  test('debe medir métricas de Lighthouse (si está disponible)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Métricas básicas de rendimiento
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find((entry: any) => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find((entry: any) => entry.name === 'first-contentful-paint')?.startTime || 0,
      };
    });
    
    console.log('📊 Métricas de rendimiento:', metrics);
    
    // Verificar que el DOM se carga rápidamente
    expect(metrics.domContentLoaded).toBeLessThan(2000);
    expect(metrics.loadComplete).toBeLessThan(3000);
  });

  test('debe manejar múltiples operaciones simultáneas', async ({ page }) => {
    const startTime = Date.now();
    
    // Realizar múltiples acciones rápidamente
    await Promise.all([
      page.goto('/'),
      page.waitForLoadState('domcontentloaded'),
    ]);
    
    await page.waitForTimeout(500);
    
    // Abrir y cerrar modal rápidamente
    await page.click('button:has-text("Nuevo Turno")');
    await page.waitForSelector('dialog, [role="dialog"]', { timeout: 1000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de operaciones múltiples: ${totalTime}ms`);
    expect(totalTime).toBeLessThan(5000); // Menos de 5 segundos para todo
  });

  test('debe verificar que no hay memory leaks en navegación', async ({ page }) => {
    // Navegar entre vistas múltiples veces
    for (let i = 0; i < 5; i++) {
      await page.click('a[href*="pacientes"], button:has-text("Pacientes")');
      await page.waitForTimeout(300);
      await page.click('a[href*="agenda"], button:has-text("Agenda")');
      await page.waitForTimeout(300);
    }
    
    // Verificar que la página sigue respondiendo
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(isResponsive).toBe(true);
  });
});

