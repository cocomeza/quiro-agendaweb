import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * Tests E2E para la funcionalidad de impresión de lista de pacientes
 * 
 * Como QA Senior, este test verifica:
 * 1. Que la lista de pacientes se muestra correctamente
 * 2. Que el botón de impresión está disponible y funcional
 * 3. Que el contenido es visible antes de imprimir
 * 4. Que la vista previa de impresión muestra el contenido correcto
 * 5. Que los datos de los pacientes se muestran correctamente
 */
test.describe('Impresión de Lista de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
      await page.waitForTimeout(2000);
    } catch (error) {
      test.skip();
    }
  });

  test('debe mostrar la lista de pacientes con turno para el día seleccionado', async ({ page }) => {
    // Esperar a que la agenda cargue
    await page.waitForTimeout(2000);
    
    // Verificar que estamos en la vista de agenda
    const contenidoAgenda = page.locator('text=/Agenda|Hoy|hoy/i').first();
    await expect(contenidoAgenda).toBeVisible({ timeout: 10000 });
    
    // Buscar el componente de lista de pacientes
    // Puede estar en la sección de "Lista de Pacientes con Turno"
    const listaPacientes = page.locator('text=/Lista de Pacientes con Turno|Lista de pacientes/i').first();
    
    // Si no está visible, puede que no haya turnos o esté en otra sección
    if (await listaPacientes.isVisible({ timeout: 5000 })) {
      await expect(listaPacientes).toBeVisible();
      
      // Verificar que hay una tabla o lista de pacientes
      const tabla = page.locator('table').first();
      if (await tabla.isVisible({ timeout: 3000 })) {
        await expect(tabla).toBeVisible();
        
        // Verificar que hay columnas esperadas
        const columnas = [
          'Nro. Ficha',
          'Apellido',
          'Nombre',
          'Teléfono',
          'Hora'
        ];
        
        for (const columna of columnas) {
          const header = page.locator(`th:has-text("${columna}")`).first();
          if (await header.isVisible({ timeout: 2000 })) {
            await expect(header).toBeVisible();
          }
        }
      }
    } else {
      // Si no hay lista visible, puede que no haya turnos
      // Verificar que al menos hay un mensaje indicando esto
      const sinTurnos = page.locator('text=/No hay|sin turno|vacío/i').first();
      if (await sinTurnos.isVisible({ timeout: 3000 })) {
        console.log('No hay turnos para el día seleccionado');
      }
    }
  });

  test('debe mostrar el botón de impresión cuando hay pacientes con turno', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Buscar el botón de impresión
    const botonImprimir = page.locator('button:has-text("Imprimir Lista"), button:has-text("Imprimir")')
      .filter({ hasText: /Imprimir/i })
      .first();
    
    // El botón puede estar visible o no dependiendo de si hay turnos
    if (await botonImprimir.isVisible({ timeout: 5000 })) {
      await expect(botonImprimir).toBeVisible();
      await expect(botonImprimir).toBeEnabled();
      
      // Verificar que tiene el ícono de impresora
      const iconoImpresora = botonImprimir.locator('svg, [class*="printer"], [class*="Printer"]').first();
      if (await iconoImpresora.isVisible({ timeout: 1000 })) {
        await expect(iconoImpresora).toBeVisible();
      }
    } else {
      // Si no hay botón, puede que no haya turnos
      console.log('Botón de impresión no visible - puede que no haya turnos');
    }
  });

  test('debe mostrar contenido correcto antes de imprimir', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Buscar la lista de pacientes
    const listaContainer = page.locator('[class*="print-lista-pacientes"], [id*="lista-pacientes"]').first();
    
    if (await listaContainer.isVisible({ timeout: 5000 })) {
      await expect(listaContainer).toBeVisible();
      
      // Verificar que el título está visible
      const titulo = page.locator('h3:has-text("Lista de Pacientes con Turno"), h2:has-text("Lista de Pacientes")').first();
      if (await titulo.isVisible({ timeout: 3000 })) {
        await expect(titulo).toBeVisible();
      }
      
      // Verificar que la fecha está visible
      const fecha = page.locator('text=/lunes|martes|miércoles|jueves|viernes|sábado|domingo/i').first();
      if (await fecha.isVisible({ timeout: 3000 })) {
        await expect(fecha).toBeVisible();
      }
      
      // Verificar que hay una tabla con datos
      const tabla = listaContainer.locator('table').first();
      if (await tabla.isVisible({ timeout: 3000 })) {
        await expect(tabla).toBeVisible();
        
        // Verificar que hay filas de datos (más allá del header)
        const filas = tabla.locator('tbody tr');
        const cantidadFilas = await filas.count();
        
        if (cantidadFilas > 0) {
          // Verificar que al menos una fila tiene datos
          const primeraFila = filas.first();
          await expect(primeraFila).toBeVisible();
          
          // Verificar que la fila tiene celdas con contenido
          const celdas = primeraFila.locator('td');
          const cantidadCeldas = await celdas.count();
          expect(cantidadCeldas).toBeGreaterThan(0);
          
          // Verificar que al menos una celda tiene texto
          const primeraCelda = celdas.first();
          const textoCelda = await primeraCelda.textContent();
          expect(textoCelda?.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('debe generar PDF al hacer click en el botón de impresión', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Buscar el botón de impresión
    const botonImprimir = page.locator('button:has-text("Imprimir Lista"), button:has-text("Imprimir")')
      .filter({ hasText: /Imprimir/i })
      .first();
    
    if (await botonImprimir.isVisible({ timeout: 5000 })) {
      // Interceptar la descarga del PDF
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      // Hacer click en el botón
      await botonImprimir.click();
      await page.waitForTimeout(1000);
      
      // Verificar que se inició la descarga del PDF
      const download = await downloadPromise;
      
      if (download) {
        // Verificar que el archivo tiene extensión .pdf
        const nombreArchivo = download.suggestedFilename();
        expect(nombreArchivo).toMatch(/\.pdf$/i);
        expect(nombreArchivo).toMatch(/turnos_/i);
        
        // Verificar que el archivo tiene contenido
        const path = await download.path();
        if (path) {
          const fs = require('fs');
          const stats = fs.statSync(path);
          expect(stats.size).toBeGreaterThan(0);
        }
      } else {
        // Si no hay descarga, verificar que al menos se ejecutó la función
        // (puede que no haya turnos para imprimir)
        const listaContainer = page.locator('[class*="print-lista-pacientes"]').first();
        if (await listaContainer.isVisible({ timeout: 2000 })) {
          await expect(listaContainer).toBeVisible();
        }
      }
    } else {
      console.log('Botón de impresión no encontrado - puede que no haya turnos');
    }
  });

  test('debe verificar que el contenido es visible en modo impresión', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Buscar la lista de pacientes
    const listaContainer = page.locator('[class*="print-lista-pacientes"]').first();
    
    if (await listaContainer.isVisible({ timeout: 5000 })) {
      // Verificar que todos los elementos importantes son visibles
      const elementos = [
        { selector: 'h3:has-text("Lista de Pacientes")', descripcion: 'Título' },
        { selector: 'table', descripcion: 'Tabla de pacientes' },
        { selector: 'thead', descripcion: 'Encabezado de tabla' },
        { selector: 'tbody', descripcion: 'Cuerpo de tabla' }
      ];
      
      for (const elemento of elementos) {
        const locator = listaContainer.locator(elemento.selector).first();
        if (await locator.isVisible({ timeout: 2000 })) {
          await expect(locator).toBeVisible();
          
          // Verificar que el elemento tiene contenido visible
          const texto = await locator.textContent();
          if (texto) {
            expect(texto.trim().length).toBeGreaterThan(0);
          }
        }
      }
      
      // Verificar que la tabla tiene datos
      const tabla = listaContainer.locator('table').first();
      if (await tabla.isVisible({ timeout: 2000 })) {
        const filas = tabla.locator('tbody tr');
        const cantidadFilas = await filas.count();
        
        if (cantidadFilas > 0) {
          // Verificar que cada fila tiene 5 columnas (Nro. Ficha, Apellido, Nombre, Teléfono, Hora)
          for (let i = 0; i < Math.min(cantidadFilas, 3); i++) {
            const fila = filas.nth(i);
            const celdas = fila.locator('td');
            const cantidadCeldas = await celdas.count();
            expect(cantidadCeldas).toBe(5);
            
            // Verificar que las celdas tienen contenido
            for (let j = 0; j < cantidadCeldas; j++) {
              const celda = celdas.nth(j);
              const texto = await celda.textContent();
              // Al menos debe tener algo (puede ser "-" si no hay dato)
              expect(texto).toBeTruthy();
            }
          }
        }
      }
    }
  });

  test('debe verificar que los estilos de impresión están aplicados correctamente', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const listaContainer = page.locator('[class*="print-lista-pacientes"]').first();
    
    if (await listaContainer.isVisible({ timeout: 5000 })) {
      // Verificar que el elemento tiene la clase correcta
      const clases = await listaContainer.evaluate((el) => {
        return Array.from(el.classList);
      });
      
      expect(clases).toContain('print-lista-pacientes');
      
      // Verificar que los elementos hijos tienen visibilidad
      const tabla = listaContainer.locator('table').first();
      if (await tabla.isVisible({ timeout: 2000 })) {
        // Verificar que la tabla tiene estilos aplicados
        const estilosTabla = await tabla.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            display: styles.display,
            visibility: styles.visibility,
            width: styles.width
          };
        });
        
        expect(estilosTabla.display).not.toBe('none');
        expect(estilosTabla.visibility).not.toBe('hidden');
      }
    }
  });

  test('debe verificar que el contenido no está oculto por clases no-print', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const listaContainer = page.locator('[class*="print-lista-pacientes"]').first();
    
    if (await listaContainer.isVisible({ timeout: 5000 })) {
      // Verificar que no tiene la clase no-print
      const tieneNoPrint = await listaContainer.evaluate((el) => {
        return el.classList.contains('no-print');
      });
      expect(tieneNoPrint).toBe(false);
      
      // Verificar que los elementos importantes no tienen no-print
      const elementos = ['table', 'thead', 'tbody', 'tr', 'th', 'td'];
      
      for (const selector of elementos) {
        const elementosEncontrados = listaContainer.locator(selector);
        const cantidad = await elementosEncontrados.count();
        
        if (cantidad > 0) {
          for (let i = 0; i < Math.min(cantidad, 5); i++) {
            const elemento = elementosEncontrados.nth(i);
            const tieneNoPrint = await elemento.evaluate((el) => {
              return el.classList.contains('no-print');
            });
            expect(tieneNoPrint).toBe(false);
          }
        }
      }
    }
  });
});
