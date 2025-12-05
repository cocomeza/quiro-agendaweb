import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.log('\n📝 Configura en .env.local:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=tu_url');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateMigration() {
  console.log('🔍 Validando migración...\n');

  // 1. Contar total de pacientes
  const { count: totalPatients, error: countError } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error al contar pacientes:', countError);
    return;
  }

  console.log('='.repeat(60));
  console.log('📊 VALIDACIÓN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`\n📊 Total de pacientes en BD: ${totalPatients || 0}\n`);

  // 2. Verificar pacientes sin nombre o apellido
  const { count: withoutName } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .or('nombre.is.null,nombre.eq.,apellido.is.null,apellido.eq.');

  console.log(`⚠️  Pacientes sin nombre/apellido válido: ${withoutName || 0}`);

  // 3. Verificar pacientes con teléfono
  const { count: withPhone } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .not('telefono', 'is', null)
    .neq('telefono', '');

  console.log(`📞 Pacientes con teléfono: ${withPhone || 0} (${((withPhone || 0) / (totalPatients || 1) * 100).toFixed(1)}%)`);

  // 4. Verificar pacientes con email
  const { count: withEmail } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .not('email', 'is', null)
    .neq('email', '');

  console.log(`📧 Pacientes con email: ${withEmail || 0} (${((withEmail || 0) / (totalPatients || 1) * 100).toFixed(1)}%)`);

  // 5. Verificar pacientes con fecha de nacimiento
  const { count: withFechaNac } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .not('fecha_nacimiento', 'is', null);

  console.log(`📅 Pacientes con fecha de nacimiento: ${withFechaNac || 0} (${((withFechaNac || 0) / (totalPatients || 1) * 100).toFixed(1)}%)`);

  // 6. Verificar pacientes con notas
  const { count: withNotas } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .not('notas', 'is', null)
    .neq('notas', '');

  console.log(`📝 Pacientes con notas: ${withNotas || 0} (${((withNotas || 0) / (totalPatients || 1) * 100).toFixed(1)}%)`);

  // 7. Buscar posibles duplicados por nombre y teléfono
  const { data: allPatients } = await supabase
    .from('pacientes')
    .select('nombre, apellido, telefono');

  if (allPatients) {
    const phoneGroups = new Map<string, number>();
    const nameGroups = new Map<string, number>();

    allPatients.forEach(p => {
      // Agrupar por teléfono
      if (p.telefono) {
        const phoneKey = p.telefono.replace(/\D/g, '');
        phoneGroups.set(phoneKey, (phoneGroups.get(phoneKey) || 0) + 1);
      }

      // Agrupar por nombre completo
      const nameKey = `${p.nombre.toLowerCase()}_${p.apellido.toLowerCase()}`;
      nameGroups.set(nameKey, (nameGroups.get(nameKey) || 0) + 1);
    });

    const phoneDuplicates = Array.from(phoneGroups.entries()).filter(([_, count]) => count > 1);
    const nameDuplicates = Array.from(nameGroups.entries()).filter(([_, count]) => count > 1);

    console.log(`\n⚠️  Posibles duplicados:`);
    console.log(`   Por teléfono: ${phoneDuplicates.length}`);
    console.log(`   Por nombre completo: ${nameDuplicates.length}`);
  }

  // 8. Mostrar algunos registros de ejemplo
  console.log(`\n📋 Ejemplos de registros migrados:`);
  const { data: samples } = await supabase
    .from('pacientes')
    .select('nombre, apellido, telefono, email')
    .limit(5);

  if (samples && samples.length > 0) {
    samples.forEach((p, index) => {
      console.log(`\n   ${index + 1}. ${p.nombre} ${p.apellido}`);
      if (p.telefono) console.log(`      Tel: ${p.telefono}`);
      if (p.email) console.log(`      Email: ${p.email}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Validación completada');
  console.log('='.repeat(60) + '\n');
}

validateMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

