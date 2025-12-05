# 🚀 Próximos Pasos - Guía de Implementación

Esta guía te llevará paso a paso desde la configuración inicial hasta tener el sistema funcionando completamente.

## 📋 Checklist de Implementación

### Fase 1: Configuración Inicial ⚙️

- [ ] **1.1 Instalar dependencias**
  ```bash
  npm install
  ```

- [ ] **1.2 Configurar Supabase**
  - Crear proyecto en [supabase.com](https://supabase.com)
  - Obtener `Project URL` y `anon key` desde Settings > API
  - Obtener `service_role key` (secret) desde Settings > API

- [ ] **1.3 Crear base de datos**
  - Ir a SQL Editor en Supabase
  - Ejecutar el script completo de `supabase/schema.sql`
  - Verificar que se crearon las tablas `pacientes` y `turnos`

- [ ] **1.4 Configurar autenticación**
  - Ir a Authentication > Providers
  - Habilitar Email provider
  - Crear usuario administrador en Authentication > Users

- [ ] **1.5 Configurar variables de entorno**
  Crear archivo `.env.local`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
  SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
  ```

### Fase 2: Migración de Datos 📊

- [ ] **2.1 Preparar archivos CSV**
  - Colocar `ReportePacientes_20251204.csv` en la raíz del proyecto
  - (Opcional) Colocar `20251204_20251204_ReporteAgendaProfesional.csv` en la raíz

- [ ] **2.2 Analizar CSV de pacientes**
  ```bash
  npm run migrate:analyze
  ```
  - Revisar las columnas encontradas
  - Ajustar mapeo en `scripts/migrate-frontmy-data.ts` si es necesario

- [ ] **2.3 Migrar pacientes**
  ```bash
  npm run migrate:run
  ```
  - Verificar que no haya errores críticos
  - Revisar `migration-errors.log` si existe

- [ ] **2.4 (Opcional) Analizar CSV de turnos**
  ```bash
  npm run migrate:analyze-appointments
  ```
  - Revisar estructura del CSV
  - Ajustar mapeo si es necesario

- [ ] **2.5 (Opcional) Migrar turnos**
  ```bash
  npm run migrate:appointments
  ```
  - Verificar que los turnos se vinculen correctamente a pacientes
  - Revisar `migration-appointments-errors.log` si existe

- [ ] **2.6 Validar migración**
  ```bash
  npm run migrate:validate
  ```
  - Verificar total de registros migrados
  - Revisar estadísticas de completitud

### Fase 3: Verificación y Pruebas ✅

- [ ] **3.1 Ejecutar aplicación en desarrollo**
  ```bash
  npm run dev
  ```
  - Abrir `http://localhost:3000`
  - Verificar que redirige a `/login`

- [ ] **3.2 Probar autenticación**
  - Iniciar sesión con credenciales creadas en Supabase
  - Verificar que se redirige a la agenda

- [ ] **3.3 Verificar datos migrados**
  - Revisar que los pacientes aparezcan en la vista de Pacientes
  - (Si migraste turnos) Verificar que aparezcan en la agenda
  - Revisar manualmente 5-10 registros en Supabase Dashboard

- [ ] **3.4 Probar funcionalidades básicas**
  - Crear un nuevo paciente
  - Crear un nuevo turno
  - Editar un turno existente
  - Cancelar un turno
  - Navegar entre días en la agenda

- [ ] **3.5 Probar diseño responsive**
  - Abrir en móvil/tablet
  - Verificar que la interfaz se adapta correctamente
  - Probar todas las funcionalidades en diferentes tamaños de pantalla

### Fase 4: Testing 🧪

- [ ] **4.1 Ejecutar tests unitarios**
  ```bash
  npm run test
  ```
  - Verificar que todos los tests pasen

- [ ] **4.2 Ejecutar tests E2E**
  ```bash
  npm run test:e2e
  ```
  - Configurar `TEST_USER_EMAIL` y `TEST_USER_PASSWORD` en `.env.local`
  - Verificar que los tests pasen

- [ ] **4.3 Revisar cobertura**
  ```bash
  npm run test:coverage
  ```
  - Verificar que la cobertura sea adecuada

### Fase 5: Preparación para Producción 🚀

- [ ] **5.1 Build de producción**
  ```bash
  npm run build
  ```
  - Verificar que compile sin errores
  - Revisar warnings si los hay

- [ ] **5.2 Configurar Vercel**
  - Conectar repositorio GitHub con Vercel
  - Agregar variables de entorno en Vercel:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **NO** agregar `SUPABASE_SERVICE_ROLE_KEY` (solo para scripts locales)

- [ ] **5.3 Deploy inicial**
  - Hacer push a la rama `main`
  - Verificar que el deploy se complete exitosamente
  - Probar la aplicación en producción

- [ ] **5.4 Verificar producción**
  - Probar autenticación en producción
  - Verificar que los datos se cargan correctamente
  - Probar todas las funcionalidades principales

### Fase 6: Seguridad y Limpieza 🔒

- [ ] **6.1 Remover Service Role Key**
  - Eliminar `SUPABASE_SERVICE_ROLE_KEY` de `.env.local` después de migración
  - Verificar que no esté en el código fuente
  - Confirmar que `.env.local` está en `.gitignore`

- [ ] **6.2 Limpiar archivos temporales**
  - Archivar archivos CSV originales (fuera del proyecto)
  - Eliminar logs de migración si ya no son necesarios
  - Verificar que archivos sensibles no estén en Git

- [ ] **6.3 Backup de base de datos**
  - Hacer backup de la base de datos migrada en Supabase
  - Documentar fecha y versión del backup

- [ ] **6.4 Documentar configuración**
  - Actualizar `MIGRATION.md` con fecha de migración
  - Documentar cualquier ajuste manual realizado
  - Guardar credenciales de forma segura (password manager)

## 🎯 Orden Recomendado de Ejecución

### Para empezar rápido:

```bash
# 1. Configuración básica
npm install
# Configurar .env.local con credenciales de Supabase
# Ejecutar schema.sql en Supabase

# 2. Migración de datos
npm run migrate:analyze
npm run migrate:run
npm run migrate:validate

# 3. Probar aplicación
npm run dev
# Iniciar sesión y verificar que todo funciona

# 4. (Opcional) Migrar turnos
npm run migrate:analyze-appointments
npm run migrate:appointments
```

### Para producción:

```bash
# 1. Testing completo
npm run test:all

# 2. Build
npm run build

# 3. Deploy en Vercel
# Configurar variables de entorno en Vercel
# Hacer push a main
```

## 📝 Notas Importantes

### ⚠️ Antes de Migrar

1. **Backup:** Si ya tienes datos en Supabase, haz un backup primero
2. **Service Role Key:** Solo úsala en scripts locales, nunca en producción
3. **Orden:** Siempre migra pacientes antes que turnos

### ✅ Después de Migrar

1. **Validación:** Siempre ejecuta `npm run migrate:validate`
2. **Verificación manual:** Revisa al menos 10 registros aleatorios
3. **Limpieza:** Remueve Service Role Key de `.env.local`

### 🔒 Seguridad

- Nunca commitees `.env.local` o Service Role Key
- Usa solo `NEXT_PUBLIC_SUPABASE_ANON_KEY` en producción
- Mantén las credenciales en un password manager

## 🆘 Si Algo Sale Mal

### Problemas Comunes

1. **Error de conexión a Supabase**
   - Verifica que las variables de entorno estén correctas
   - Verifica que el proyecto de Supabase esté activo

2. **Error de RLS (Row Level Security)**
   - Asegúrate de usar `SUPABASE_SERVICE_ROLE_KEY` en scripts de migración
   - Verifica que las políticas RLS estén creadas

3. **Pacientes no encontrados en migración de turnos**
   - Verifica que los nombres coincidan exactamente
   - Revisa mayúsculas/minúsculas y espacios

4. **Errores de build**
   - Ejecuta `npm run lint` para ver errores
   - Verifica que todas las dependencias estén instaladas

### Obtener Ayuda

- Revisa los logs de error (`migration-errors.log`)
- Consulta la documentación en `MIGRATION.md`
- Verifica la consola del navegador para errores del frontend
- Revisa los logs de Supabase Dashboard

## 🎉 Una Vez Completado

Una vez que hayas completado todos los pasos:

1. ✅ Sistema funcionando en producción
2. ✅ Datos migrados correctamente
3. ✅ Tests pasando
4. ✅ Seguridad configurada
5. ✅ Documentación actualizada

**¡Felicidades! Tu sistema de gestión de turnos está listo para usar.** 🎊

---

**Última actualización:** [Fecha actual]
**Versión:** 1.0.0

