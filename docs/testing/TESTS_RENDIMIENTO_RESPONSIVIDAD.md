# 🚀 Tests de Rendimiento y Responsividad

Este documento describe los tests de rendimiento y responsividad implementados para el proyecto.

## 📊 Tests de Rendimiento

### Ubicación
`__tests__/e2e/rendimiento.spec.ts`

### Tests Implementados

#### 1. **Carga de Agenda**
- **Objetivo**: Verificar que la agenda carga en menos de 3 segundos
- **Métrica**: Tiempo de carga completo
- **Umbral**: < 3000ms

#### 2. **Carga de Lista de Pacientes**
- **Objetivo**: Verificar que la lista de pacientes carga rápidamente
- **Métrica**: Tiempo de carga
- **Umbral**: < 2000ms

#### 3. **Apertura de Modales**
- **Objetivo**: Verificar que los modales se abren instantáneamente
- **Métrica**: Tiempo de apertura
- **Umbral**: < 500ms

#### 4. **Búsqueda de Pacientes**
- **Objetivo**: Verificar que la búsqueda es rápida
- **Métrica**: Tiempo de respuesta de búsqueda
- **Umbral**: < 1000ms

#### 5. **Renderizado Completo**
- **Objetivo**: Verificar que múltiples turnos se renderizan sin lag
- **Métrica**: Tiempo hasta `networkidle`
- **Umbral**: < 2000ms

#### 6. **Scroll Suave**
- **Objetivo**: Verificar que el scroll es fluido
- **Métrica**: Tiempo de animación de scroll
- **Umbral**: < 1000ms

#### 7. **Métricas de Lighthouse**
- **Objetivo**: Obtener métricas básicas de rendimiento
- **Métricas**:
  - DOM Content Loaded
  - Load Complete
  - First Paint
  - First Contentful Paint

#### 8. **Operaciones Simultáneas**
- **Objetivo**: Verificar que múltiples operaciones no bloquean la UI
- **Métrica**: Tiempo total de operaciones múltiples
- **Umbral**: < 5000ms

#### 9. **Memory Leaks**
- **Objetivo**: Verificar que no hay memory leaks en navegación
- **Métrica**: Estado de la página después de múltiples navegaciones
- **Verificación**: Página sigue respondiendo

### Ejecutar Tests de Rendimiento

```bash
# Ejecutar solo tests de rendimiento
npm run test:e2e:rendimiento

# Con UI interactiva
npx playwright test __tests__/e2e/rendimiento.spec.ts --ui

# Con reporte detallado
npx playwright test __tests__/e2e/rendimiento.spec.ts --reporter=html
```

---

## 📱 Tests de Responsividad

### Ubicación
`__tests__/e2e/responsividad.spec.ts`

### Tamaños de Pantalla Probados

| Dispositivo | Resolución | Uso |
|------------|------------|-----|
| Móvil | 375x667 | iPhone SE |
| Móvil Grande | 414x896 | iPhone 11 Pro Max |
| Tablet | 768x1024 | iPad Portrait |
| Tablet Landscape | 1024x768 | iPad Landscape |
| Desktop | 1280x720 | HD Desktop |
| Desktop Grande | 1920x1080 | Full HD Desktop |

### Tests Implementados

#### 1. **Renderizado en Móvil**
- Verifica que el layout se adapta correctamente
- Verifica que no hay overflow horizontal
- Verifica que los elementos son visibles

#### 2. **Navegación Móvil**
- Verifica que la navegación es accesible
- Verifica tamaño mínimo de botones (44x44px)
- Verifica que los elementos son táctiles

#### 3. **Renderizado en Tablet**
- Verifica layout adaptativo
- Verifica que el contenido se ajusta correctamente

#### 4. **Renderizado en Desktop**
- Verifica layout completo
- Verifica que todos los elementos son visibles

#### 5. **Modales Responsivos**
- Verifica que los modales se adaptan al tamaño de pantalla
- En móvil: máximo ancho de pantalla - margen
- En desktop: ancho máximo razonable (800px)

#### 6. **Formularios Responsivos**
- Verifica que los formularios funcionan en todos los tamaños
- Verifica que los inputs son accesibles
- Verifica que los campos se muestran correctamente

#### 7. **Tablas Responsivas**
- Verifica que las tablas tienen scroll horizontal en móvil si es necesario
- Verifica que las tablas son legibles

#### 8. **Tipografía Responsiva**
- Verifica tamaño mínimo de fuente:
  - Móvil: ≥ 14px
  - Desktop: ≥ 16px

#### 9. **Botones Táctiles**
- Verifica tamaño mínimo de 44x44px en móvil
- Cumple con WCAG 2.1 para elementos táctiles

#### 10. **Orientación Landscape**
- Verifica que el layout se adapta a orientación horizontal
- Verifica que no hay problemas de layout

#### 11. **Zoom al 200%**
- Verifica que la aplicación funciona con zoom aumentado
- Verifica accesibilidad con zoom
- Cumple con WCAG 2.1 nivel AA

#### 12. **Breakpoints Específicos**
- Verifica comportamiento en 768px (tablet/mobile)
- Verifica comportamiento en 1024px (desktop)

### Ejecutar Tests de Responsividad

```bash
# Ejecutar solo tests de responsividad
npm run test:e2e:responsividad

# Con UI interactiva (recomendado para ver los cambios)
npx playwright test __tests__/e2e/responsividad.spec.ts --ui

# Con reporte HTML
npx playwright test __tests__/e2e/responsividad.spec.ts --reporter=html

# Ejecutar en un navegador específico
npx playwright test __tests__/e2e/responsividad.spec.ts --project=chromium
```

---

## 🎯 Métricas y Umbrales

### Rendimiento

| Métrica | Umbral Objetivo | Umbral Crítico |
|---------|----------------|----------------|
| Carga de Agenda | < 3s | < 5s |
| Carga de Pacientes | < 2s | < 3s |
| Apertura de Modal | < 500ms | < 1s |
| Búsqueda | < 1s | < 2s |
| Renderizado Completo | < 2s | < 3s |
| Scroll | < 1s | < 2s |

### Responsividad

| Aspecto | Requisito |
|---------|-----------|
| Overflow Horizontal | No permitido |
| Tamaño de Botones (Móvil) | Mínimo 44x44px |
| Tamaño de Fuente (Móvil) | Mínimo 14px |
| Tamaño de Fuente (Desktop) | Mínimo 16px |
| Ancho de Modal (Móvil) | Pantalla - 20px |
| Ancho de Modal (Desktop) | Máximo 800px |

---

## 📈 Interpretación de Resultados

### Tests de Rendimiento

Los tests de rendimiento muestran tiempos en milisegundos. Si un test falla:

1. **Revisar logs**: Los tiempos se imprimen en la consola
2. **Identificar cuellos de botella**: Comparar tiempos entre diferentes operaciones
3. **Optimizar**: 
   - Reducir tamaño de bundles
   - Implementar lazy loading
   - Optimizar queries de base de datos
   - Usar memoización

### Tests de Responsividad

Los tests de responsividad verifican que la UI se adapta correctamente. Si un test falla:

1. **Revisar CSS**: Verificar media queries y breakpoints
2. **Verificar overflow**: Asegurar que no hay scroll horizontal no deseado
3. **Tamaños mínimos**: Verificar que los elementos cumplen con WCAG
4. **Probar manualmente**: Usar las herramientas de desarrollo del navegador

---

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
TEST_USER_EMAIL=tu-email@ejemplo.com
TEST_USER_PASSWORD=tu-contraseña
```

### Playwright Config

Los tests están configurados para ejecutarse en:
- Chromium
- Firefox
- MS Edge

Configuración en `playwright.config.ts`:
- Timeout: 60000ms
- Base URL: http://localhost:3000
- WebServer: npm run dev

---

## 📝 Mejoras Futuras

### Rendimiento
- [ ] Integrar Lighthouse CI
- [ ] Agregar tests de Core Web Vitals
- [ ] Medir tiempo de First Input Delay (FID)
- [ ] Medir Largest Contentful Paint (LCP)
- [ ] Medir Cumulative Layout Shift (CLS)

### Responsividad
- [ ] Agregar más breakpoints específicos
- [ ] Tests de dark mode
- [ ] Tests de high contrast mode
- [ ] Tests de diferentes DPI
- [ ] Tests de diferentes ratios de aspecto

---

## 🐛 Troubleshooting

### Tests de Rendimiento Fracasan

**Problema**: Los tiempos son mayores a los umbrales

**Soluciones**:
1. Verificar que el servidor de desarrollo está corriendo
2. Verificar conexión a Supabase
3. Revisar si hay procesos pesados en segundo plano
4. Considerar aumentar umbrales si son consistentemente altos

### Tests de Responsividad Fracasan

**Problema**: Elementos no se adaptan correctamente

**Soluciones**:
1. Verificar que Tailwind CSS está configurado correctamente
2. Revisar media queries en componentes
3. Verificar que los breakpoints están correctos
4. Probar manualmente en diferentes dispositivos

---

## 📚 Referencias

- [Web Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [WCAG 2.1 - Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Playwright - Viewport](https://playwright.dev/docs/emulation#viewport)
- [Lighthouse Performance](https://developers.google.com/web/tools/lighthouse)

---

**Última actualización**: Diciembre 2025

