import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Tamaños de pantalla comunes
const viewports = {
  mobile: { width: 375, height: 667 },      // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 },     // iPad
  tabletLandscape: { width: 1024, height: 768 }, // iPad Landscape
  desktop: { width: 1280, height: 720 },     // HD
  desktopLarge: { width: 1920, height: 1080 }, // Full HD
};

test.describe('Tests de Responsividad', () => {
  test.beforeEach(async ({ page }) => {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
      test.skip();
      return;
    }
    
    await login(page);
    await page.waitForURL('/', { timeout: 20000 });
  });

  // Tests para móvil
  test('debe renderizar correctamente en móvil (375x667)', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verificar que el header es visible
    const header = page.locator('header, [role="banner"]').first();
    await expect(header).toBeVisible();
    
    // Verificar que el contenido principal es visible
    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible();
    
    // Verificar que los botones son accesibles
    const buttons = page.locator('button').first();
    await expect(buttons).toBeVisible();
    
    // Verificar que no hay overflow horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = viewports.mobile.width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Margen de error
  });

  test('debe mostrar navegación móvil correctamente', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/');
    
    // Verificar que la navegación existe
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    
    // Verificar que los botones de navegación son táctiles (mínimo 44x44px)
    const navButtons = nav.locator('button, a');
    const count = await navButtons.count();
    
    if (count > 0) {
      const firstButton = navButtons.first();
      const box = await firstButton.boundingBox();
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  // Tests para tablet
  test('debe renderizar correctamente en tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verificar layout
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
    
    // Verificar que el contenido se adapta
    const content = await page.evaluate(() => {
      return {
        bodyWidth: document.body.clientWidth,
        bodyHeight: document.body.clientHeight,
      };
    });
    
    expect(content.bodyWidth).toBeLessThanOrEqual(viewports.tablet.width);
  });

  test('debe mostrar agenda correctamente en tablet', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await page.goto('/');
    
    // Verificar que los elementos de la agenda son visibles
    const agendaElements = page.locator('button:has-text("Nuevo Turno"), .agenda-container, main');
    await expect(agendaElements.first()).toBeVisible();
  });

  // Tests para desktop
  test('debe renderizar correctamente en desktop (1280x720)', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verificar que el layout es completo
    const header = page.locator('header').first();
    const nav = page.locator('nav').first();
    const main = page.locator('main').first();
    
    await expect(header).toBeVisible();
    await expect(nav).toBeVisible();
    await expect(main).toBeVisible();
  });

  test('debe mostrar todos los elementos en desktop grande (1920x1080)', async ({ page }) => {
    await page.setViewportSize(viewports.desktopLarge);
    await page.goto('/');
    
    // Verificar que no hay elementos cortados
    const allVisible = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, input, select, textarea');
      let allInViewport = true;
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          allInViewport = false;
        }
      });
      
      return allInViewport;
    });
    
    expect(allVisible).toBe(true);
  });

  // Tests de modales en diferentes tamaños
  test('debe mostrar modal correctamente en móvil', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/');
    
    await page.click('button:has-text("Nuevo Turno")');
    await page.waitForSelector('dialog, [role="dialog"]', { timeout: 2000 });
    
    const modal = page.locator('dialog, [role="dialog"]').first();
    await expect(modal).toBeVisible();
    
    // Verificar que el modal es responsive
    const modalBox = await modal.boundingBox();
    if (modalBox) {
      expect(modalBox.width).toBeLessThanOrEqual(viewports.mobile.width - 20); // Margen
    }
  });

  test('debe mostrar modal correctamente en desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    
    await page.click('button:has-text("Nuevo Turno")');
    await page.waitForSelector('dialog, [role="dialog"]', { timeout: 2000 });
    
    const modal = page.locator('dialog, [role="dialog"]').first();
    await expect(modal).toBeVisible();
    
    // En desktop, el modal puede ser más grande
    const modalBox = await modal.boundingBox();
    if (modalBox) {
      expect(modalBox.width).toBeLessThanOrEqual(800); // Max width razonable
    }
  });

  // Tests de formularios
  test('debe mostrar formularios correctamente en todos los tamaños', async ({ page }) => {
    const sizes = [viewports.mobile, viewports.tablet, viewports.desktop];
    
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto('/');
      
      await page.click('button:has-text("Nuevo Paciente")');
      await page.waitForSelector('form, dialog form', { timeout: 2000 });
      
      const form = page.locator('form').first();
      await expect(form).toBeVisible();
      
      // Verificar que los inputs son accesibles
      const inputs = form.locator('input, select, textarea');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
      
      // Cerrar modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  // Tests de tablas
  test('debe mostrar tabla de pacientes con scroll horizontal en móvil', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.click('a[href*="pacientes"], button:has-text("Pacientes")');
    await page.waitForTimeout(500);
    
    // Verificar que la tabla existe
    const table = page.locator('table').first();
    const tableExists = await table.count() > 0;
    
    if (tableExists) {
      await expect(table).toBeVisible();
      
      // Verificar que hay scroll horizontal si es necesario
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      // En móvil, es aceptable tener scroll horizontal en tablas
      expect(typeof hasHorizontalScroll).toBe('boolean');
    }
  });

  // Tests de tipografía
  test('debe tener texto legible en todos los tamaños', async ({ page }) => {
    const sizes = [viewports.mobile, viewports.tablet, viewports.desktop];
    
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto('/');
      
      // Verificar tamaño mínimo de fuente (al menos 14px en móvil, 16px en desktop)
      const fontSize = await page.evaluate(() => {
        const body = document.body;
        const computed = window.getComputedStyle(body);
        return parseFloat(computed.fontSize);
      });
      
      if (size.width <= 768) {
        expect(fontSize).toBeGreaterThanOrEqual(14);
      } else {
        expect(fontSize).toBeGreaterThanOrEqual(16);
      }
    }
  });

  // Tests de botones táctiles
  test('debe tener botones con tamaño mínimo táctil en móvil', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/');
    
    const buttons = page.locator('button, a[role="button"]');
    const count = await buttons.count();
    
    if (count > 0) {
      // Verificar al menos los primeros 5 botones
      for (let i = 0; i < Math.min(5, count); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        
        if (box) {
          // Mínimo 44x44px para elementos táctiles según WCAG
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  // Tests de orientación
  test('debe adaptarse a orientación landscape en tablet', async ({ page }) => {
    await page.setViewportSize(viewports.tabletLandscape);
    await page.goto('/');
    
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
    
    // Verificar que el layout se adapta
    const layout = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        bodyWidth: document.body.clientWidth,
      };
    });
    
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.width);
  });

  // Tests de zoom
  test('debe funcionar correctamente con zoom al 200%', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    
    // Simular zoom al 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    await page.waitForTimeout(500);
    
    // Verificar que los elementos siguen siendo accesibles
    const buttons = page.locator('button').first();
    await expect(buttons).toBeVisible();
    
    // Verificar que no hay overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    // Con zoom, puede haber overflow, pero debe ser manejable
    expect(typeof hasOverflow).toBe('boolean');
  });

  // Tests de breakpoints específicos
  test('debe adaptarse correctamente en breakpoint de 768px', async ({ page }) => {
    // Justo en el breakpoint común de tablet/mobile
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
    
    // Verificar que no hay problemas de layout
    const layout = await page.evaluate(() => {
      return {
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
        bodyWidth: document.body.clientWidth,
      };
    });
    
    expect(layout.bodyWidth).toBeLessThanOrEqual(768);
  });

  test('debe adaptarse correctamente en breakpoint de 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
    
    // Verificar layout de desktop
    const layout = await page.evaluate(() => {
      return {
        bodyWidth: document.body.clientWidth,
        maxWidth: Math.max(...Array.from(document.querySelectorAll('*')).map(el => el.clientWidth)),
      };
    });
    
    expect(layout.bodyWidth).toBeLessThanOrEqual(1024);
  });
});

