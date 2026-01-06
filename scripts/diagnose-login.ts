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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const userEmail = process.env.USER_EMAIL;
const userPassword = process.env.USER_PASSWORD;

async function diagnoseLogin() {
  console.log('🔍 DIAGNÓSTICO DE LOGIN\n');
  console.log('='.repeat(60));
  console.log('');

  // 1. Verificar variables de entorno
  console.log('1️⃣ VERIFICANDO VARIABLES DE ENTORNO\n');
  
  const issues: string[] = [];
  
  if (!supabaseUrl) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL: NO CONFIGURADA');
    issues.push('Falta NEXT_PUBLIC_SUPABASE_URL en .env.local');
  } else {
    console.log(`   ✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.log('   ⚠️  Formato incorrecto. Debe ser: https://xxx.supabase.co');
      issues.push('NEXT_PUBLIC_SUPABASE_URL tiene formato incorrecto');
    }
  }

  if (!supabaseAnonKey) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: NO CONFIGURADA');
    issues.push('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
  } else {
    console.log(`   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`);
    if (!supabaseAnonKey.startsWith('eyJ')) {
      console.log('   ⚠️  Formato incorrecto. Debe ser un JWT válido (empieza con eyJ)');
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY tiene formato incorrecto');
    }
  }

  if (!userEmail) {
    console.log('   ❌ USER_EMAIL: NO CONFIGURADA');
    issues.push('Falta USER_EMAIL en .env.local');
  } else {
    console.log(`   ✅ USER_EMAIL: ${userEmail}`);
    if (!userEmail.includes('@')) {
      console.log('   ⚠️  Formato incorrecto. Debe ser un email válido');
      issues.push('USER_EMAIL tiene formato incorrecto');
    }
  }

  if (!userPassword) {
    console.log('   ❌ USER_PASSWORD: NO CONFIGURADA');
    issues.push('Falta USER_PASSWORD en .env.local');
  } else {
    console.log(`   ✅ USER_PASSWORD: ${'*'.repeat(userPassword.length)} caracteres`);
    if (userPassword.length < 6) {
      console.log('   ⚠️  Contraseña muy corta. Debe tener al menos 6 caracteres');
      issues.push('USER_PASSWORD es muy corta');
    }
  }

  console.log('');

  if (issues.length > 0) {
    console.log('❌ PROBLEMAS ENCONTRADOS:\n');
    issues.forEach(issue => console.log(`   • ${issue}`));
    console.log('\n📝 SOLUCIÓN:');
    console.log('   1. Verifica que el archivo .env.local existe en la raíz del proyecto');
    console.log('   2. Asegúrate de que todas las variables estén configuradas correctamente');
    console.log('   3. Ejecuta: npm run validate:env\n');
    process.exit(1);
  }

  // 2. Verificar conexión a Supabase
  console.log('2️⃣ VERIFICANDO CONEXIÓN A SUPABASE\n');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('   ❌ No se puede verificar sin URL y ANON KEY');
    process.exit(1);
  }

  // Extraer el hostname de la URL
  let hostname: string;
  try {
    const url = new URL(supabaseUrl);
    hostname = url.hostname;
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Hostname: ${hostname}\n`);
  } catch (err) {
    console.log(`   ❌ URL inválida: ${supabaseUrl}`);
    console.log('   💡 La URL debe tener el formato: https://xxx.supabase.co\n');
    process.exit(1);
  }

  // Verificar conectividad básica usando fetch
  console.log('   🔄 Verificando conectividad básica...\n');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
      },
      signal: AbortSignal.timeout(10000), // Timeout de 10 segundos
    });
    
    if (response.status === 200 || response.status === 401 || response.status === 404) {
      console.log('   ✅ Conexión a Supabase OK (servidor responde)\n');
    } else {
      console.log(`   ⚠️  Servidor responde con código: ${response.status}\n`);
    }
  } catch (err: any) {
    console.log('   ❌ ERROR DE CONECTIVIDAD\n');
    
    if (err.code === 'ENOTFOUND' || err.message.includes('getaddrinfo')) {
      console.log('   💡 PROBLEMA: No se puede resolver el hostname DNS\n');
      console.log('   🔧 POSIBLES SOLUCIONES:\n');
      console.log('      1. Verifica tu conexión a internet');
      console.log('      2. Verifica que el proyecto de Supabase exista:');
      console.log(`         • Ve a https://supabase.com/dashboard`);
      console.log(`         • Busca el proyecto con URL: ${hostname}`);
      console.log('      3. Si el proyecto fue eliminado, crea uno nuevo');
      console.log('      4. Verifica que no haya firewall/proxy bloqueando');
      console.log('      5. Prueba acceder manualmente en el navegador:');
      console.log(`         ${supabaseUrl}\n`);
      console.log('   📝 Si el proyecto fue eliminado:\n');
      console.log('      1. Crea un nuevo proyecto en Supabase');
      console.log('      2. Actualiza .env.local con la nueva URL y ANON KEY');
      console.log('      3. Ejecuta las migraciones del schema\n');
    } else if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
      console.log('   💡 PROBLEMA: Timeout de conexión\n');
      console.log('   🔧 SOLUCIÓN:\n');
      console.log('      • Verifica tu conexión a internet');
      console.log('      • Verifica que no haya firewall bloqueando\n');
    } else {
      console.log(`   💡 Error: ${err.message}\n`);
      console.log(`   Código: ${err.code || 'N/A'}\n`);
    }
    
    console.log('   ⚠️  Continuando con la prueba de login...\n');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 3. Intentar login
  console.log('3️⃣ PROBANDO LOGIN\n');
  
  if (!userEmail || !userPassword) {
    console.log('   ❌ No se puede probar login sin email y contraseña');
    process.exit(1);
  }

  console.log(`   Email: ${userEmail}`);
  console.log(`   Contraseña: ${'*'.repeat(userPassword.length)} caracteres\n`);
  console.log('   🔄 Intentando iniciar sesión...\n');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

    if (error) {
      console.log('   ❌ ERROR DE LOGIN\n');
      console.log(`   Código: ${error.status || 'N/A'}`);
      console.log(`   Mensaje: ${error.message}\n`);

      // Mensajes de ayuda específicos
      if (error.message.includes('Invalid login credentials') || error.message.includes('incorrect')) {
        console.log('   💡 CAUSA PROBABLE:\n');
        console.log('      • Email o contraseña incorrectos');
        console.log('      • Usuario no existe en Supabase');
        console.log('      • Usuario no confirmado\n');
        console.log('   🔧 SOLUCIÓN:\n');
        console.log('      1. Ve a Supabase Dashboard > Authentication > Users');
        console.log('      2. Verifica que el usuario exista con el email:', userEmail);
        console.log('      3. Si no existe, créalo manualmente');
        console.log('      4. Asegúrate de que "Auto Confirm User" esté activado');
        console.log('      5. Verifica que la contraseña sea correcta\n');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('   💡 CAUSA:\n');
        console.log('      • El usuario existe pero el email no está confirmado\n');
        console.log('   🔧 SOLUCIÓN:\n');
        console.log('      1. Ve a Supabase Dashboard > Authentication > Users');
        console.log('      2. Busca el usuario:', userEmail);
        console.log('      3. Activa "Auto Confirm User" o confirma el email manualmente\n');
      } else if (error.message.includes('Too many requests')) {
        console.log('   💡 CAUSA:\n');
        console.log('      • Demasiados intentos de login\n');
        console.log('   🔧 SOLUCIÓN:\n');
        console.log('      • Espera unos minutos antes de intentar nuevamente\n');
      }

      process.exit(1);
    }

    if (data.user && data.session) {
      console.log('   ✅ LOGIN EXITOSO\n');
      console.log('   📊 Información del usuario:');
      console.log(`      ID: ${data.user.id}`);
      console.log(`      Email: ${data.user.email}`);
      console.log(`      Email confirmado: ${data.user.email_confirmed_at ? 'Sí ✅' : 'No ❌'}`);
      console.log(`      Creado: ${new Date(data.user.created_at).toLocaleString()}\n`);
      
      if (!data.user.email_confirmed_at) {
        console.log('   ⚠️  ADVERTENCIA:\n');
        console.log('      El email no está confirmado. Esto puede causar problemas.\n');
        console.log('   🔧 SOLUCIÓN:\n');
        console.log('      1. Ve a Supabase Dashboard > Authentication > Users');
        console.log('      2. Busca este usuario y activa "Auto Confirm User"\n');
      }

      console.log('   🔑 Sesión activa:');
      console.log(`      Access Token: ${data.session.access_token.substring(0, 30)}...`);
      console.log(`      Expira en: ${new Date(data.session.expires_at! * 1000).toLocaleString()}\n`);

      console.log('='.repeat(60));
      console.log('✅ DIAGNÓSTICO COMPLETADO');
      console.log('='.repeat(60));
      console.log('\n🎉 Tu configuración está correcta.');
      console.log('   Si aún tienes problemas en la aplicación web:');
      console.log('   1. Verifica que el servidor de desarrollo esté corriendo');
      console.log('   2. Revisa la consola del navegador para más detalles');
      console.log('   3. Asegúrate de que las cookies estén habilitadas\n');
      
      process.exit(0);
    } else {
      console.log('   ❌ Error: No se recibieron datos del usuario');
      process.exit(1);
    }
  } catch (err: any) {
    console.log('   ❌ ERROR INESPERADO:\n');
    console.log(`   Mensaje: ${err.message}\n`);
    
    if (err.code === 'ENOTFOUND' || err.message.includes('getaddrinfo')) {
      console.log('   💡 PROBLEMA: Error de DNS - No se puede resolver el hostname\n');
      console.log('   🔧 SOLUCIÓN:\n');
      console.log('      1. Verifica tu conexión a internet');
      console.log('      2. Verifica que el proyecto de Supabase exista:');
      console.log(`         • Ve a https://supabase.com/dashboard`);
      console.log(`         • Busca el proyecto con hostname: ${hostname}`);
      console.log('      3. Si el proyecto fue eliminado:');
      console.log('         • Crea un nuevo proyecto en Supabase');
      console.log('         • Actualiza .env.local con la nueva URL y ANON KEY');
      console.log('         • Ejecuta las migraciones del schema');
      console.log('      4. Prueba acceder manualmente en el navegador:');
      console.log(`         ${supabaseUrl}\n`);
    } else if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
      console.log('   💡 PROBLEMA: Timeout de conexión\n');
      console.log('   🔧 SOLUCIÓN:\n');
      console.log('      • Verifica tu conexión a internet');
      console.log('      • Verifica que no haya firewall bloqueando');
      console.log('      • Intenta nuevamente en unos momentos\n');
    } else {
      console.log(`   Código: ${err.code || 'N/A'}\n`);
      console.log('   💡 Verifica:');
      console.log('      • Que Supabase esté funcionando');
      console.log('      • Que tengas conexión a internet');
      console.log('      • Que las variables de entorno sean correctas\n');
    }
    
    process.exit(1);
  }
}

diagnoseLogin();
