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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userEmail = process.env.USER_EMAIL || process.env.TEST_USER_EMAIL;
const userPassword = process.env.USER_PASSWORD || process.env.TEST_USER_PASSWORD;

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA\n');
  console.log('='.repeat(60));

  // 1. Verificar variables de entorno
  console.log('\n1️⃣ VERIFICANDO VARIABLES DE ENTORNO\n');
  
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': supabaseUrl,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': supabaseAnonKey,
    'SUPABASE_SERVICE_ROLE_KEY': supabaseServiceKey,
    'USER_EMAIL': userEmail,
    'USER_PASSWORD': userPassword ? '*'.repeat(userPassword.length) : undefined,
  };

  let envOk = true;
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`   ✅ ${key}: Configurada`);
    } else {
      console.log(`   ❌ ${key}: FALTANTE`);
      envOk = false;
    }
  }

  if (!envOk) {
    console.log('\n⚠️  Configura las variables faltantes en .env.local');
    process.exit(1);
  }

  // 2. Verificar conexión a Supabase
  console.log('\n2️⃣ VERIFICANDO CONEXIÓN A SUPABASE\n');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('   ❌ No se puede verificar sin URL y ANON KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Intentar una consulta simple
    const { data, error } = await supabase.from('pacientes').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('   ⚠️  Las tablas no existen en Supabase');
        console.log('   💡 Solución: Ejecuta supabase/schema.sql en Supabase SQL Editor');
      } else if (error.message.includes('JWT')) {
        console.log('   ⚠️  Error de autenticación con la ANON KEY');
        console.log('   💡 Verifica que la ANON KEY sea correcta');
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    } else {
      console.log('   ✅ Conexión a Supabase OK');
      console.log('   ✅ Tablas existen');
    }
  } catch (err: any) {
    console.log(`   ❌ Error de conexión: ${err.message}`);
    console.log('   💡 Verifica que la URL de Supabase sea correcta');
  }

  // 3. Verificar usuario en Supabase (usando service role)
  console.log('\n3️⃣ VERIFICANDO USUARIO EN SUPABASE\n');
  
  if (!userEmail) {
    console.log('   ⚠️  USER_EMAIL no configurado, saltando verificación');
  } else {
    if (!supabaseServiceKey) {
      console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY no configurado');
      console.log('   💡 Necesario para verificar usuarios');
    } else {
      try {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();
        
        if (usersError) {
          console.log(`   ⚠️  Error al listar usuarios: ${usersError.message}`);
        } else {
          const user = users?.users.find(u => u.email === userEmail);
          
          if (user) {
            console.log(`   ✅ Usuario encontrado: ${userEmail}`);
            console.log(`      ID: ${user.id}`);
            console.log(`      Email confirmado: ${user.email_confirmed_at ? 'Sí ✅' : 'No ❌'}`);
            console.log(`      Creado: ${new Date(user.created_at).toLocaleString()}`);
            
            if (!user.email_confirmed_at) {
              console.log('\n   ⚠️  PROBLEMA: Usuario no confirmado');
              console.log('   💡 Solución:');
              console.log('      1. Ve a Supabase Dashboard > Authentication > Users');
              console.log('      2. Busca tu usuario');
              console.log('      3. Activa "Auto Confirm User" o confirma manualmente');
            }
          } else {
            console.log(`   ❌ Usuario NO encontrado: ${userEmail}`);
            console.log('\n   💡 Solución:');
            console.log('      1. Ve a Supabase Dashboard > Authentication > Users');
            console.log('      2. Click "Add user" > "Create new user"');
            console.log('      3. Ingresa el email y contraseña');
            console.log('      4. ✅ Activa "Auto Confirm User"');
            console.log('      5. Click "Create user"');
          }
        }
      } catch (err: any) {
        console.log(`   ⚠️  Error: ${err.message}`);
      }
    }
  }

  // 4. Probar login
  console.log('\n4️⃣ PROBANDO LOGIN\n');
  
  if (!userEmail || !userPassword) {
    console.log('   ⚠️  Credenciales no configuradas, saltando prueba de login');
  } else {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      });

      if (error) {
        console.log(`   ❌ Login fallido: ${error.message}`);
        
        if (error.message.includes('Invalid login credentials')) {
          console.log('\n   💡 Posibles causas:');
          console.log('      • Email o contraseña incorrectos');
          console.log('      • Usuario no existe en Supabase');
          console.log('      • Usuario no confirmado');
        } else if (error.message.includes('Email not confirmed')) {
          console.log('\n   💡 El usuario existe pero no está confirmado');
          console.log('      Ve a Supabase Dashboard y confirma el email');
        }
      } else {
        console.log('   ✅ Login exitoso!');
        console.log(`      Usuario: ${data.user?.email}`);
        console.log(`      ID: ${data.user?.id}`);
      }
    } catch (err: any) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }

  // 5. Verificar acceso a tablas
  console.log('\n5️⃣ VERIFICANDO ACCESO A TABLAS\n');
  
  if (!userEmail || !userPassword) {
    console.log('   ⚠️  Necesitas estar autenticado para probar acceso');
  } else {
    try {
      // Intentar login primero
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      });

      if (authError) {
        console.log(`   ⚠️  No se puede autenticar: ${authError.message}`);
        console.log('   💡 Resuelve el problema de autenticación primero');
      } else {
        // Probar acceso a pacientes
        const { data: pacientes, error: pacientesError } = await supabase
          .from('pacientes')
          .select('id')
          .limit(1);

        if (pacientesError) {
          console.log(`   ❌ Error accediendo a "pacientes": ${pacientesError.message}`);
          
          if (pacientesError.message.includes('permission denied') || pacientesError.message.includes('policy')) {
            console.log('   💡 Problema con políticas RLS');
            console.log('      Verifica que las políticas estén creadas en supabase/schema.sql');
          }
        } else {
          console.log('   ✅ Acceso a "pacientes" OK');
        }

        // Probar acceso a turnos
        const { data: turnos, error: turnosError } = await supabase
          .from('turnos')
          .select('id')
          .limit(1);

        if (turnosError) {
          console.log(`   ❌ Error accediendo a "turnos": ${turnosError.message}`);
        } else {
          console.log('   ✅ Acceso a "turnos" OK');
        }
      }
    } catch (err: any) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }

  // 6. Verificar schema SQL
  console.log('\n6️⃣ VERIFICANDO SCHEMA SQL\n');
  
  const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    console.log('   ✅ Archivo schema.sql existe');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    if (schemaContent.includes('CREATE TABLE pacientes')) {
      console.log('   ✅ Contiene creación de tabla "pacientes"');
    } else {
      console.log('   ⚠️  No se encontró creación de tabla "pacientes"');
    }
    
    if (schemaContent.includes('CREATE TABLE turnos')) {
      console.log('   ✅ Contiene creación de tabla "turnos"');
    } else {
      console.log('   ⚠️  No se encontró creación de tabla "turnos"');
    }
    
    if (schemaContent.includes('ROW LEVEL SECURITY') || schemaContent.includes('RLS')) {
      console.log('   ✅ Contiene políticas RLS');
    } else {
      console.log('   ⚠️  No se encontraron políticas RLS');
    }
  } else {
    console.log('   ❌ Archivo schema.sql no encontrado');
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('='.repeat(60));
  console.log('\n💡 Próximos pasos recomendados:');
  console.log('   1. Si el usuario no existe: Créalo en Supabase Dashboard');
  console.log('   2. Si el usuario no está confirmado: Activa "Auto Confirm User"');
  console.log('   3. Si las tablas no existen: Ejecuta supabase/schema.sql');
  console.log('   4. Si hay errores de RLS: Verifica las políticas en schema.sql');
  console.log('\n🔧 Comandos útiles:');
  console.log('   npm run validate:env    - Validar .env.local');
  console.log('   npm run test:login     - Probar login');
  console.log('   npm run diagnose       - Ejecutar este diagnóstico\n');
}

diagnose().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});

