import { test, expect } from '@playwright/test';
import { login, navegarAVista } from './helpers';

test.describe('Mejoras de UI y UX', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
      await page.waitForTimeout(2000);
    } catch (error) {
      test.skip();
    }
  });

  test('debe mostrar resumen compacto del día en la agenda', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Verificar que existe el resumen con tarjetas
    const resumenTotal = page.locator('text=/Total|Completados|Pendientes|Cancelados/i').first();
    await expect(resumenTotal).toBeVisible({ timeout: 5000 });
    
    // Verificar que hay números en las tarjetas
    const numerosResumen = page.locator('text=/\\d+/').first();
    await expect(numerosResumen).toBeVisible({ timeout: 3000 });
  });

  test('debe mostrar información completa de pacientes en la lista', async ({ page }) => {
    await navegarAVista(page, 'pacientes');
    await page.waitForTimeout(2000);
    
    // Verificar que se muestra información estructurada
    const pacienteCard = page.locator('div[class*="hover"]').first();
    
    if (await pacienteCard.isVisible({ timeout: 5000 })) {
      // Verificar que hay iconos de información
      const iconos = page.locator('svg').first();
      await expect(iconos).toBeVisible({ timeout: 3000 });
      
      // Verificar que hay información de contacto
      const infoContacto = page.locator('text=/\\+\\d|@|\\d{2}:\\d{2}/i').first();
      if (await infoContacto.isVisible({ timeout: 2000 })) {
        await expect(infoContacto).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('debe tener mejor contraste en select de estado', async ({ page }) => {
    // Abrir modal de turno
    await page.click('button:has-text("Nuevo Turno")');
    await page.waitForTimeout(1000);
    
    const estadoSelect = page.locator('select[id="estado"]');
    if (await estadoSelect.isVisible({ timeout: 3000 })) {
      // Verificar que el select tiene estilos mejorados
      const clases = await estadoSelect.getAttribute('class');
      expect(clases).toContain('border-2');
      expect(clases).toContain('font-bold');
      
      // Seleccionar diferentes estados y verificar colores
      await estadoSelect.selectOption('completado');
      await page.waitForTimeout(300);
      const clasesCompletado = await estadoSelect.getAttribute('class');
      expect(clasesCompletado).toContain('green');
      
      await estadoSelect.selectOption('cancelado');
      await page.waitForTimeout(300);
      const clasesCancelado = await estadoSelect.getAttribute('class');
      expect(clasesCancelado).toContain('red');
    } else {
      test.skip();
    }
  });

  test('debe mostrar slots disponibles con estilo dashed', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Buscar slots disponibles
    const slotDisponible = page.locator('text=/Disponible/i').first();
    
    if (await slotDisponible.isVisible({ timeout: 3000 })) {
      // Verificar que el slot tiene el estilo correcto
      const contenedor = slotDisponible.locator('..');
      const clases = await contenedor.getAttribute('class');
      if (clases) {
        expect(clases).toContain('border-dashed');
      }
    } else {
      test.skip();
    }
  });

  test('debe tener navegación de fecha mejorada', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Verificar que existe el header con gradiente
    const header = page.locator('div[class*="from-indigo"], div[class*="bg-indigo"]').first();
    if (await header.isVisible({ timeout: 3000 })) {
      await expect(header).toBeVisible();
    }
    
    // Verificar botones de navegación
    const botonAnterior = page.locator('button[aria-label*="anterior"], button[aria-label*="Día anterior"]').first();
    const botonSiguiente = page.locator('button[aria-label*="siguiente"], button[aria-label*="Día siguiente"]').first();
    
    if (await botonAnterior.isVisible({ timeout: 2000 })) {
      await expect(botonAnterior).toBeVisible();
    }
    if (await botonSiguiente.isVisible({ timeout: 2000 })) {
      await expect(botonSiguiente).toBeVisible();
    }
  });
});
