# 👤 Guía de Creación de Usuario

Esta guía explica cómo crear el usuario administrador para acceder a la aplicación.

## 🔐 Crear Usuario en Supabase

La aplicación usa **Supabase Auth** para la autenticación, por lo que debes crear el usuario directamente en el dashboard de Supabase.

### Paso 1: Acceder a Supabase Dashboard

1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto

### Paso 2: Crear Usuario Administrador

1. En el menú lateral, ve a **Authentication**
2. Click en **Users**
3. Click en el botón **Add user** (arriba a la derecha)
4. Selecciona **Create new user**

### Paso 3: Completar Datos del Usuario

Completa el formulario con:

- **Email**: Tu email (ej: `admin@consultorio.com` o tu email personal)
- **Password**: Una contraseña segura (mínimo 6 caracteres)
- **Auto Confirm User**: ✅ **Activar esta opción** (importante para evitar confirmación por email)

### Paso 4: Guardar Credenciales

**⚠️ IMPORTANTE:** Guarda estas credenciales de forma segura:
- Email: `tu_email@ejemplo.com`
- Password: `tu_contraseña_segura`

Estas serán tus credenciales para iniciar sesión en la aplicación.

## 🧪 Probar Acceso (Recomendado)

Antes de acceder a la aplicación, puedes probar que las credenciales funcionan:

1. **Agregar credenciales a `.env.local`:**
   ```env
   USER_EMAIL=tu_email@ejemplo.com
   USER_PASSWORD=tu_contraseña_segura
   ```

2. **Ejecutar test automatizado:**
   ```bash
   npm run test:login
   ```

   Este script verificará:
   - ✅ Conexión a Supabase
   - ✅ Credenciales de usuario
   - ✅ Acceso a las tablas

   Si todo está correcto, verás "✅ TODAS LAS PRUEBAS PASARON"

## 🚀 Acceder a la Aplicación

Una vez creado el usuario y probado el acceso:

1. **Iniciar la aplicación:**
   ```bash
   npm run dev
   ```

2. **Abrir en el navegador:**
   - Ve a `http://localhost:3000`
   - Serás redirigido automáticamente a `/login`

3. **Iniciar sesión:**
   - Ingresa el **email** que creaste en Supabase (o el de `USER_EMAIL` en `.env.local`)
   - Ingresa la **contraseña** que configuraste (o la de `USER_PASSWORD` en `.env.local`)
   - Click en "Iniciar sesión"

4. **¡Listo!** Deberías ver la agenda principal

## 🔄 Crear Múltiples Usuarios

Si necesitas crear más usuarios (por ejemplo, para otros profesionales o asistentes):

1. Repite los pasos anteriores en Supabase Dashboard
2. Cada usuario puede iniciar sesión con sus propias credenciales
3. Todos los usuarios autenticados tienen acceso completo (según las políticas RLS)

## 🔒 Seguridad

### Recomendaciones:

- ✅ Usa contraseñas seguras (mínimo 12 caracteres, con mayúsculas, minúsculas, números y símbolos)
- ✅ No compartas tus credenciales
- ✅ Considera usar un password manager
- ✅ Si olvidas tu contraseña, puedes resetearla desde Supabase Dashboard

### Resetear Contraseña:

1. Ve a Supabase Dashboard > Authentication > Users
2. Busca tu usuario
3. Click en los tres puntos (...) junto al usuario
4. Selecciona "Reset password"
5. Se enviará un email con instrucciones (si tienes email habilitado)

## ⚠️ Solución de Problemas

### No puedo iniciar sesión

**Verifica:**
1. ✅ Que el usuario exista en Supabase Dashboard > Authentication > Users
2. ✅ Que "Auto Confirm User" esté activado (o que hayas confirmado el email)
3. ✅ Que las variables de entorno estén correctas en `.env.local`
4. ✅ Que la aplicación esté corriendo (`npm run dev`)

### Error: "Invalid login credentials"

**Posibles causas:**
- Email o contraseña incorrectos
- Usuario no confirmado (verifica "Auto Confirm User")
- Variables de entorno incorrectas

**Solución:**
1. Verifica las credenciales en Supabase Dashboard
2. Si es necesario, crea un nuevo usuario
3. Asegúrate de que "Auto Confirm User" esté activado

### Error: "User not found"

**Solución:**
- Verifica que el usuario exista en Supabase Dashboard
- Asegúrate de estar usando el proyecto correcto de Supabase

## 📝 Notas Importantes

- **Un solo profesional:** El sistema está diseñado para un único profesional, pero puedes crear múltiples usuarios si lo necesitas
- **Acceso completo:** Todos los usuarios autenticados tienen acceso completo a pacientes y turnos (según RLS)
- **Sin roles:** El sistema no tiene roles diferenciados (admin/usuario), todos tienen los mismos permisos

## 🎯 Ejemplo Completo

```
1. Supabase Dashboard > Authentication > Users
2. Click "Add user" > "Create new user"
3. Email: admin@consultorio.com
4. Password: MiContraseñaSegura123!
5. ✅ Auto Confirm User: Activado
6. Click "Create user"

7. En la aplicación (http://localhost:3000):
   - Email: admin@consultorio.com
   - Password: MiContraseñaSegura123!
   - Click "Iniciar sesión"
```

---

**¿Necesitas ayuda?** Revisa `SUPABASE_SETUP.md` para más detalles sobre la configuración de Supabase.

