# 🔧 Troubleshooting - Solución de Problemas

Esta guía te ayuda a resolver problemas comunes durante la instalación y configuración.

## 📦 Problemas de Instalación de Dependencias

### Error: ERESOLVE unable to resolve dependency tree

**Problema:** Conflicto de versiones entre dependencias (especialmente con React 19).

**Solución 1: Usar --legacy-peer-deps (Recomendado)**
```bash
npm install --legacy-peer-deps
```

**Solución 2: Actualizar lucide-react**
Ya hemos actualizado `lucide-react` a una versión compatible. Si aún tienes problemas:
```bash
npm install lucide-react@latest --legacy-peer-deps
```

**Solución 3: Limpiar e instalar**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

### Error: Module not found

**Problema:** Módulos faltantes después de instalar.

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 🔐 Problemas de Configuración de Supabase

### Error: Invalid API key

**Problema:** La clave de API no es válida.

**Solución:**
1. Verifica que copiaste la clave completa (sin espacios)
2. Verifica que estás usando la clave correcta:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` para el frontend
   - `SUPABASE_SERVICE_ROLE_KEY` solo para scripts de migración
3. Regenera las claves en Supabase Dashboard si es necesario

### Error: relation does not exist

**Problema:** Las tablas no existen en Supabase.

**Solución:**
1. Ve a SQL Editor en Supabase
2. Ejecuta el script completo de `supabase/schema.sql`
3. Verifica que las tablas se crearon en Table Editor

### Error: RLS policy violation

**Problema:** Políticas de seguridad bloqueando operaciones.

**Solución:**
- Para scripts de migración: Usa `SUPABASE_SERVICE_ROLE_KEY`
- Para la aplicación: Verifica que las políticas RLS estén creadas correctamente
- Verifica que el usuario esté autenticado

## 📊 Problemas de Migración

### Error: Archivo CSV no encontrado

**Problema:** El script no encuentra el archivo CSV.

**Solución:**
1. Verifica que el archivo esté en la raíz del proyecto
2. Verifica el nombre exacto del archivo (case-sensitive)
3. Verifica que tengas permisos de lectura

### Error: Paciente no encontrado (en migración de turnos)

**Problema:** Los turnos no pueden vincularse a pacientes.

**Solución:**
1. Asegúrate de migrar pacientes primero
2. Verifica que los nombres en el CSV de turnos coincidan con los pacientes migrados
3. Revisa diferencias en mayúsculas/minúsculas o espacios
4. El script muestra advertencias para pacientes no encontrados

### Error: Invalid date format

**Problema:** Las fechas no se pueden parsear.

**Solución:**
1. Verifica el formato de fechas en el CSV
2. Los formatos soportados son: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
3. Ajusta el script si tu CSV usa otro formato

## 🚀 Problemas de Desarrollo

### Error: Port 3000 already in use

**Problema:** El puerto 3000 está ocupado.

**Solución:**
```bash
# Opción 1: Usar otro puerto
npm run dev -- -p 3001

# Opción 2: Cerrar el proceso que usa el puerto
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: Cannot find module

**Problema:** Módulos faltantes.

**Solución:**
```bash
npm install --legacy-peer-deps
# O si ya instalaste:
npm install <nombre-del-modulo> --legacy-peer-deps
```

### Error: TypeScript errors

**Problema:** Errores de tipos TypeScript.

**Solución:**
1. Verifica que todas las dependencias estén instaladas
2. Ejecuta `npm run lint` para ver errores específicos
3. Asegúrate de que `tsconfig.json` esté configurado correctamente

## 🌐 Problemas de Producción (Vercel)

### Error: Build failed

**Problema:** El build falla en Vercel.

**Solución:**
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs de build en Vercel
3. Verifica que `npm run build` funcione localmente
4. Asegúrate de que no uses `SUPABASE_SERVICE_ROLE_KEY` en producción

### Error: Environment variables missing

**Problema:** Variables de entorno no configuradas en Vercel.

**Solución:**
1. Ve a Settings > Environment Variables en Vercel
2. Agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. NO agregues `SUPABASE_SERVICE_ROLE_KEY` (solo para scripts locales)

## 🧪 Problemas de Testing

### Error: Tests failing

**Problema:** Los tests fallan.

**Solución:**
1. Verifica que las variables de entorno de test estén configuradas:
   ```env
   TEST_USER_EMAIL=tu_email@example.com
   TEST_USER_PASSWORD=tu_contraseña
   ```
2. Asegúrate de que el usuario de test exista en Supabase
3. Ejecuta tests individualmente para identificar el problema:
   ```bash
   npm run test -- <nombre-del-test>
   ```

## 💡 Soluciones Generales

### Limpiar todo y empezar de nuevo

```bash
# Eliminar dependencias
rm -rf node_modules package-lock.json

# Limpiar caché
npm cache clean --force

# Reinstalar
npm install --legacy-peer-deps
```

### Verificar versiones de Node.js

El proyecto requiere Node.js 18+:

```bash
node --version
```

Si tienes una versión anterior, actualiza Node.js desde [nodejs.org](https://nodejs.org)

### Verificar permisos

En Windows, a veces necesitas ejecutar PowerShell como Administrador.

## 📞 Obtener Ayuda

Si el problema persiste:

1. **Revisa los logs:**
   - Consola del navegador (F12)
   - Logs de terminal
   - Logs de Vercel (si es en producción)

2. **Revisa la documentación:**
   - `README.md` - Documentación general
   - `MIGRATION.md` - Guía de migración
   - `NEXT_STEPS.md` - Pasos de implementación

3. **Verifica archivos de error:**
   - `migration-errors.log` - Errores de migración de pacientes
   - `migration-appointments-errors.log` - Errores de migración de turnos

4. **Comandos útiles para diagnóstico:**
   ```bash
   # Verificar configuración
   npm run lint
   
   # Verificar build
   npm run build
   
   # Verificar tests
   npm run test
   ```

---

**Última actualización:** [Fecha actual]

