import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([A-Z_]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key] = value.trim();
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_USER_EMAIL || process.env.USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD || process.env.USER_PASSWORD;

async function testLogin() {
  console.log('🔐 Probando acceso a Supabase...\n');

  // Verificar variables de entorno
  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurada');
    console.log('\n📝 Agrega a .env.local:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co\n');
    process.exit(1);
  }

  if (!supabaseAnonKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada');
    console.log('\n📝 Agrega a .env.local:');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui\n');
    process.exit(1);
  }

  if (!testEmail) {
    console.error('❌ Error: TEST_USER_EMAIL o USER_EMAIL no está configurada');
    console.log('\n📝 Agrega a .env.local:');
    console.log('   USER_EMAIL=tu_email@ejemplo.com');
    console.log('   USER_PASSWORD=tu_contraseña\n');
    process.exit(1);
  }

  if (!testPassword) {
    console.error('❌ Error: TEST_USER_PASSWORD o USER_PASSWORD no está configurada');
    console.log('\n📝 Agrega a .env.local:');
    console.log('   USER_PASSWORD=tu_contraseña\n');
    process.exit(1);
  }

  console.log('📋 Configuración detectada:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword ? '*'.repeat(testPassword.length) : 'no configurada'}\n`);

  // Crear cliente de Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('🔄 Intentando iniciar sesión...\n');

    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.error('❌ Error al iniciar sesión:');
      console.error(`   Código: ${error.status}`);
      console.error(`   Mensaje: ${error.message}\n`);

      // Mensajes de ayuda según el error
      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 Posibles causas:');
        console.log('   1. Email o contraseña incorrectos');
        console.log('   2. Usuario no existe en Supabase');
        console.log('   3. Usuario no confirmado (verifica "Auto Confirm User")\n');
        console.log('🔧 Solución:');
        console.log('   1. Ve a Supabase Dashboard > Authentication > Users');
        console.log('   2. Verifica que el usuario exista');
        console.log('   3. Si no existe, créalo con "Auto Confirm User" activado');
        console.log('   4. Verifica que las credenciales en .env.local sean correctas\n');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('💡 El usuario existe pero no está confirmado\n');
        console.log('🔧 Solución:');
        console.log('   1. Ve a Supabase Dashboard > Authentication > Users');
        console.log('   2. Busca tu usuario');
        console.log('   3. Activa "Auto Confirm User" o confirma el email manualmente\n');
      }

      process.exit(1);
    }

    if (data.user && data.session) {
      console.log('✅ ¡Login exitoso!\n');
      console.log('📊 Información del usuario:');
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email confirmado: ${data.user.email_confirmed_at ? 'Sí' : 'No'}`);
      console.log(`   Creado: ${data.user.created_at}\n`);
      console.log('🔑 Sesión activa:');
      console.log(`   Access Token: ${data.session.access_token.substring(0, 20)}...`);
      console.log(`   Expira en: ${new Date(data.session.expires_at! * 1000).toLocaleString()}\n`);

      // Probar acceso a las tablas
      console.log('🔄 Probando acceso a las tablas...\n');

      // Probar acceso a pacientes
      const { data: pacientes, error: pacientesError } = await supabase
        .from('pacientes')
        .select('count')
        .limit(1);

      if (pacientesError) {
        console.error('⚠️  Error al acceder a la tabla pacientes:');
        console.error(`   ${pacientesError.message}\n`);
      } else {
        console.log('✅ Acceso a tabla "pacientes" OK');
      }

      // Probar acceso a turnos
      const { data: turnos, error: turnosError } = await supabase
        .from('turnos')
        .select('count')
        .limit(1);

      if (turnosError) {
        console.error('⚠️  Error al acceder a la tabla turnos:');
        console.error(`   ${turnosError.message}\n`);
      } else {
        console.log('✅ Acceso a tabla "turnos" OK\n');
      }

      console.log('='.repeat(60));
      console.log('✅ TODAS LAS PRUEBAS PASARON');
      console.log('='.repeat(60));
      console.log('\n🎉 Tu configuración está correcta. Puedes usar estas credenciales');
      console.log('   para acceder a la aplicación en http://localhost:3000\n');

      process.exit(0);
    } else {
      console.error('❌ Error: No se recibieron datos del usuario');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Error inesperado:');
    console.error(err.message);
    console.error('\n💡 Verifica:');
    console.log('   1. Que Supabase esté funcionando');
    console.log('   2. Que las variables de entorno sean correctas');
    console.log('   3. Que tengas conexión a internet\n');
    process.exit(1);
  }
}

testLogin();

