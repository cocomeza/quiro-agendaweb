# Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para el sistema de gestión de turnos.

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (si no tienes una)
2. Click en **New Project**
3. Completa la información:
   - **Name**: Nombre de tu proyecto (ej: "consultorio-quiropractico")
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Region**: Selecciona la región más cercana
4. Click en **Create new project**
5. Espera a que se complete la configuración (puede tomar unos minutos)

## Paso 2: Obtener Credenciales

1. En tu proyecto, ve a **Settings** (⚙️) > **API**
2. Encontrarás dos valores importantes:
   - **Project URL**: Copia esta URL (ej: `https://xxxxx.supabase.co`)
   - **anon public key**: Copia esta clave (es una cadena larga)

## Paso 3: Crear Base de Datos

1. Ve a **SQL Editor** en el menú lateral
2. Click en **New query**
3. Abre el archivo `supabase/schema.sql` de este proyecto
4. Copia TODO el contenido del archivo
5. Pégalo en el editor SQL de Supabase
6. Click en **Run** (o presiona Ctrl+Enter)
7. Deberías ver el mensaje "Success. No rows returned"

Esto creará:
- Tabla `pacientes` con todos los campos necesarios
- Tabla `turnos` con relación a pacientes
- Índices para mejorar el rendimiento
- Políticas RLS (Row Level Security)
- Triggers para actualizar `updated_at` automáticamente

## Paso 4: Configurar Autenticación

1. Ve a **Authentication** > **Providers**
2. Asegúrate de que **Email** esté habilitado
3. (Opcional) Puedes configurar:
   - **Confirm email**: Desactivar si quieres acceso inmediato sin confirmación
   - **Secure email change**: Activar para mayor seguridad

## Paso 5: Crear Usuario Administrador

1. Ve a **Authentication** > **Users**
2. Click en **Add user** > **Create new user**
3. Completa:
   - **Email**: Tu email (ej: admin@consultorio.com)
   - **Password**: Una contraseña segura
   - **Auto Confirm User**: Activar (para evitar confirmación por email)
4. Click en **Create user**
5. **Guarda estas credenciales** - las usarás para iniciar sesión

## Paso 6: Verificar Configuración

1. Ve a **Table Editor**
2. Deberías ver dos tablas: `pacientes` y `turnos`
3. Ve a **Authentication** > **Policies**
4. Deberías ver políticas RLS para ambas tablas

## Paso 7: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

Reemplaza los valores con los que copiaste en el Paso 2.

## ✅ Verificación Final

1. Ejecuta `npm run dev` en tu proyecto
2. Ve a `http://localhost:3000`
3. Deberías ser redirigido a `/login`
4. Inicia sesión con las credenciales del Paso 5
5. Si todo está bien, verás la agenda vacía

## 🔧 Troubleshooting

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el script SQL completo
- Verifica que las tablas existan en **Table Editor**

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS estén creadas
- Asegúrate de estar autenticado correctamente

### No puedo iniciar sesión
- Verifica que el usuario exista en **Authentication** > **Users**
- Si activaste "Confirm email", verifica tu email o desactívalo temporalmente

### Error de conexión
- Verifica que las variables de entorno estén correctas
- Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` no tenga una barra al final
- Verifica que la clave `NEXT_PUBLIC_SUPABASE_ANON_KEY` sea la correcta

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Dashboard](https://app.supabase.com)

