# Solución de Problemas de Login

## Error: `ENOTFOUND` o `fetch failed`

Si recibes un error como:
```
TypeError: fetch failed
Error: getaddrinfo ENOTFOUND xxfcyuzrqftrtaegdlze.supabase.co
```

Esto significa que **no se puede resolver el hostname DNS** de tu proyecto de Supabase.

### 🔍 Diagnóstico

1. **Ejecuta el script de diagnóstico:**
   ```bash
   npm run diagnose:login
   ```

2. **Verifica manualmente en el navegador:**
   - Abre: `https://supabase.com/dashboard`
   - Inicia sesión en tu cuenta
   - Verifica que tu proyecto exista

3. **Prueba acceder directamente a la URL:**
   - Abre en el navegador: `https://xxfcyuzrqftrtaegdlze.supabase.co` (reemplaza con tu URL)
   - Si no carga, el proyecto probablemente fue eliminado o suspendido

### 🔧 Soluciones

#### Opción 1: El proyecto fue eliminado o suspendido

Si el proyecto de Supabase fue eliminado, necesitas crear uno nuevo:

1. **Crear nuevo proyecto en Supabase:**
   - Ve a https://supabase.com/dashboard
   - Click en "New Project"
   - Completa los datos del proyecto
   - Espera a que se cree (puede tardar unos minutos)

2. **Obtener las nuevas credenciales:**
   - Ve a **Settings** > **API**
   - Copia:
     - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Actualizar `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-nuevo-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_nueva_anon_key
   ```

4. **Configurar la base de datos:**
   - Ve a **SQL Editor** en Supabase
   - Ejecuta el script completo de `supabase/schema.sql`
   - Esto creará las tablas y políticas RLS

5. **Crear usuario:**
   - Ve a **Authentication** > **Users**
   - Click en "Add User" > "Create new user"
   - Ingresa el email y contraseña
   - **IMPORTANTE:** Activa "Auto Confirm User"
   - Actualiza `USER_EMAIL` y `USER_PASSWORD` en `.env.local`

#### Opción 2: Problema de conexión a internet

1. Verifica tu conexión a internet
2. Prueba acceder a otros sitios web
3. Verifica que no haya firewall/proxy bloqueando
4. Intenta desde otra red (móvil, otra WiFi)

#### Opción 3: Problema de DNS

1. Prueba cambiar tu DNS a:
   - Google DNS: `8.8.8.8` y `8.8.4.4`
   - Cloudflare DNS: `1.1.1.1` y `1.0.0.1`

2. En Windows:
   - Abre Configuración de Red
   - Cambia la configuración de DNS
   - Reinicia tu conexión

### ✅ Verificación después de solucionar

1. Ejecuta el diagnóstico nuevamente:
   ```bash
   npm run diagnose:login
   ```

2. Deberías ver:
   ```
   ✅ Conexión a Supabase OK
   ✅ LOGIN EXITOSO
   ```

3. Prueba en la aplicación web:
   ```bash
   npm run dev
   ```
   - Abre http://localhost:3000/login
   - Intenta iniciar sesión

## Error: `Invalid login credentials`

Si recibes este error, significa que las credenciales son incorrectas o el usuario no existe.

### Solución:

1. **Verifica en Supabase Dashboard:**
   - Ve a **Authentication** > **Users**
   - Busca tu usuario por email
   - Si no existe, créalo manualmente

2. **Si el usuario existe pero no puedes hacer login:**
   - Verifica que "Auto Confirm User" esté activado
   - Resetea la contraseña si es necesario
   - Asegúrate de que el email y contraseña en `.env.local` sean correctos

## Error: `Email not confirmed`

El usuario existe pero el email no está confirmado.

### Solución:

1. Ve a **Authentication** > **Users** en Supabase
2. Busca tu usuario
3. Activa "Auto Confirm User" o confirma el email manualmente

## Error: Variables de entorno no configuradas

Si recibes errores sobre variables faltantes:

1. Verifica que el archivo `.env.local` exista en la raíz del proyecto
2. Ejecuta:
   ```bash
   npm run validate:env
   ```
3. Completa las variables faltantes según las instrucciones

## Obtener ayuda adicional

Si el problema persiste:

1. Revisa los logs del servidor de desarrollo
2. Revisa la consola del navegador (F12)
3. Verifica los logs de Supabase Dashboard > Logs
4. Ejecuta `npm run diagnose:login` y comparte el output completo
