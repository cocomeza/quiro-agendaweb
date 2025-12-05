# 🚀 Guía de Deploy en Vercel

## Paso 1: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

### Variables Requeridas:

| Variable | Descripción | Dónde encontrarla |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anónima de Supabase | Supabase Dashboard → Settings → API → anon public key |

### ⚠️ Importante:

- **NO** agregues `SUPABASE_SERVICE_ROLE_KEY` en Vercel (solo para desarrollo local)
- **NO** agregues `USER_EMAIL` ni `USER_PASSWORD` en Vercel (solo para desarrollo local)
- Las variables deben estar disponibles para **Production**, **Preview** y **Development**

## Paso 2: Configurar Variables en Vercel Dashboard

1. En la sección **Environment Variables**, click en **Add New**
2. Ingresa el nombre de la variable (ej: `NEXT_PUBLIC_SUPABASE_URL`)
3. Ingresa el valor de la variable
4. Selecciona los ambientes donde aplicará:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click en **Save**
6. Repite para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Paso 3: Hacer Deploy

1. Si ya tienes el proyecto conectado, Vercel hará deploy automático
2. Si no, ve a **Deployments** y click en **Redeploy** para aplicar las nuevas variables

## Paso 4: Verificar

1. Una vez desplegado, visita tu URL de Vercel
2. Verifica que la aplicación carga correctamente
3. Prueba hacer login con tus credenciales

## 🔧 Solución de Problemas

### Error: "Environment Variable references Secret which does not exist"

**Solución:** El archivo `vercel.json` ya fue corregido. Solo necesitas:
1. Configurar las variables directamente en Vercel Dashboard (sin usar Secrets)
2. Hacer un nuevo deploy

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solución:** 
1. Verifica que agregaste la variable en Vercel Dashboard
2. Verifica que seleccionaste los ambientes correctos (Production, Preview, Development)
3. Haz un nuevo deploy después de agregar las variables

### La aplicación no carga después del deploy

**Solución:**
1. Revisa los logs de build en Vercel Dashboard
2. Verifica que las variables de entorno están correctamente configuradas
3. Asegúrate de que tu proyecto Supabase está activo y accesible

## 📝 Notas

- Las variables que empiezan con `NEXT_PUBLIC_` son expuestas al cliente (browser)
- Las variables sin `NEXT_PUBLIC_` solo están disponibles en el servidor
- Después de agregar variables nuevas, siempre haz un nuevo deploy

