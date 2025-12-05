import * as fs from 'fs';
import * as path from 'path';

function validateEnvFile() {
  console.log('🔍 Validando archivo .env.local...\n');

  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: Archivo .env.local no encontrado\n');
    console.log('📝 Crea el archivo .env.local en la raíz del proyecto con:');
    console.log('');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui');
    console.log('SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui');
    console.log('USER_EMAIL=tu_email@ejemplo.com');
    console.log('USER_PASSWORD=tu_contraseña_segura');
    console.log('');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'USER_EMAIL',
    'USER_PASSWORD',
  ];

  const optionalVars = [
    'TEST_USER_EMAIL',
    'TEST_USER_PASSWORD',
  ];

  const foundVars: string[] = [];
  const missingVars: string[] = [];
  const emptyVars: string[] = [];
  const issues: string[] = [];

  // Analizar cada línea
  lines.forEach((line, index) => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      foundVars.push(key);
      
      if (!value || value.trim() === '' || value.includes('tu_') || value.includes('aqui')) {
        emptyVars.push(key);
        issues.push(`⚠️  ${key}: Parece estar vacío o con valor de ejemplo`);
      }
    }
  });

  // Verificar variables requeridas
  requiredVars.forEach(varName => {
    if (!foundVars.includes(varName)) {
      missingVars.push(varName);
    }
  });

  console.log('='.repeat(60));
  console.log('📋 ANÁLISIS DE .env.local');
  console.log('='.repeat(60));
  console.log('');

  // Mostrar variables encontradas
  console.log('✅ Variables encontradas:');
  requiredVars.forEach(varName => {
    if (foundVars.includes(varName) && !emptyVars.includes(varName)) {
      const value = process.env[varName] || 'no cargada';
      const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
      console.log(`   ✓ ${varName}: ${displayValue}`);
    }
  });
  console.log('');

  // Mostrar variables opcionales encontradas
  const foundOptional = optionalVars.filter(v => foundVars.includes(v));
  if (foundOptional.length > 0) {
    console.log('📌 Variables opcionales encontradas:');
    foundOptional.forEach(varName => {
      console.log(`   • ${varName}`);
    });
    console.log('');
  }

  // Mostrar problemas
  if (missingVars.length > 0) {
    console.log('❌ Variables faltantes:');
    missingVars.forEach(varName => {
      console.log(`   ✗ ${varName}`);
    });
    console.log('');
  }

  if (emptyVars.length > 0) {
    console.log('⚠️  Variables con valores inválidos:');
    emptyVars.forEach(varName => {
      console.log(`   ⚠ ${varName}`);
    });
    console.log('');
  }

  // Validaciones específicas
  console.log('🔍 Validaciones específicas:');
  console.log('');

  // Validar formato de URL de Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (supabaseUrl) {
    if (supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')) {
      console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL: Formato correcto');
    } else {
      console.log('   ⚠️  NEXT_PUBLIC_SUPABASE_URL: Debe ser https://xxx.supabase.co');
      issues.push('NEXT_PUBLIC_SUPABASE_URL tiene formato incorrecto');
    }
  }

  // Validar formato de email
  const userEmail = process.env.USER_EMAIL || '';
  if (userEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(userEmail)) {
      console.log('   ✅ USER_EMAIL: Formato correcto');
    } else {
      console.log('   ⚠️  USER_EMAIL: Debe ser un email válido (ej: usuario@ejemplo.com)');
      issues.push('USER_EMAIL tiene formato incorrecto');
    }
  }

  // Validar longitud de contraseña
  const userPassword = process.env.USER_PASSWORD || '';
  if (userPassword) {
    if (userPassword.length >= 6) {
      console.log(`   ✅ USER_PASSWORD: Longitud correcta (${userPassword.length} caracteres)`);
    } else {
      console.log('   ⚠️  USER_PASSWORD: Debe tener al menos 6 caracteres');
      issues.push('USER_PASSWORD es muy corta');
    }
  }

  // Validar formato de keys
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (anonKey) {
    if (anonKey.startsWith('eyJ')) {
      console.log('   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Formato JWT correcto');
    } else {
      console.log('   ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY: Debe ser un JWT válido (empieza con eyJ)');
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY tiene formato incorrecto');
    }
  }

  if (serviceKey) {
    if (serviceKey.startsWith('eyJ')) {
      console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY: Formato JWT correcto');
    } else {
      console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY: Debe ser un JWT válido (empieza con eyJ)');
      issues.push('SUPABASE_SERVICE_ROLE_KEY tiene formato incorrecto');
    }
  }

  console.log('');
  console.log('='.repeat(60));

  // Resumen final
  if (missingVars.length === 0 && emptyVars.length === 0 && issues.length === 0) {
    console.log('✅ CONFIGURACIÓN CORRECTA');
    console.log('='.repeat(60));
    console.log('');
    console.log('🎉 Tu archivo .env.local está bien configurado.');
    console.log('   Puedes ejecutar: npm run test:login');
    console.log('');
    process.exit(0);
  } else {
    console.log('⚠️  CONFIGURACIÓN INCOMPLETA O CON ERRORES');
    console.log('='.repeat(60));
    console.log('');
    
    if (missingVars.length > 0) {
      console.log('📝 Agrega las siguientes variables a .env.local:');
      missingVars.forEach(varName => {
        console.log(`   ${varName}=valor_aqui`);
      });
      console.log('');
    }

    if (emptyVars.length > 0) {
      console.log('📝 Completa los valores de las siguientes variables:');
      emptyVars.forEach(varName => {
        console.log(`   ${varName}=valor_real_aqui`);
      });
      console.log('');
    }

    if (issues.length > 0) {
      console.log('💡 Corrige los siguientes problemas:');
      issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
      console.log('');
    }

    console.log('📖 Ver ejemplo completo en: .env.local.example');
    console.log('');
    process.exit(1);
  }
}

// Cargar variables de entorno desde .env.local
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !line.trim().startsWith('#')) {
        const [, key, value] = match;
        process.env[key] = value.trim();
      }
    });
  }
} catch (err) {
  // Ignorar errores al cargar
}

validateEnvFile();

