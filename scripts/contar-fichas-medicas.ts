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
  console.log('\n📝 Verificando .env.local...');
  
  if (!fs.existsSync(envPath)) {
    console.error('   ❌ Archivo .env.local no encontrado');
  } else {
    console.log('   ✅ Archivo .env.local encontrado');
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  }
  
  console.log('\n📝 Configura en .env.local:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function contarFichasMedicas() {
  console.log('📊 Consultando números de fichas médicas...\n');

  try {
    // Obtener todos los pacientes con su número de ficha
    const { data: pacientes, error } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido, numero_ficha')
      .order('numero_ficha', { ascending: true, nullsFirst: false });

    if (error) throw error;

    if (!pacientes || pacientes.length === 0) {
      console.log('⚠️  No se encontraron pacientes en la base de datos\n');
      process.exit(0);
    }

    // Estadísticas
    const totalPacientes = pacientes.length;
    const pacientesConFicha = pacientes.filter(p => p.numero_ficha && p.numero_ficha.trim() !== '').length;
    const pacientesSinFicha = totalPacientes - pacientesConFicha;
    
    // Obtener números de ficha únicos
    const fichasUnicas = new Set(
      pacientes
        .filter(p => p.numero_ficha && p.numero_ficha.trim() !== '')
        .map(p => p.numero_ficha?.trim())
    );
    
    // Detectar duplicados
    const fichasDuplicadas: Record<string, number> = {};
    pacientes.forEach(p => {
      if (p.numero_ficha && p.numero_ficha.trim() !== '') {
        const ficha = p.numero_ficha.trim();
        fichasDuplicadas[ficha] = (fichasDuplicadas[ficha] || 0) + 1;
      }
    });
    
    const fichasConDuplicados = Object.entries(fichasDuplicadas)
      .filter(([_, count]) => count > 1)
      .map(([ficha, count]) => ({ ficha, count }));

    // Mostrar resultados
    console.log('='.repeat(60));
    console.log('📋 ESTADÍSTICAS DE FICHAS MÉDICAS');
    console.log('='.repeat(60));
    console.log(`\n📊 Total de pacientes: ${totalPacientes}`);
    console.log(`✅ Pacientes con número de ficha: ${pacientesConFicha} (${((pacientesConFicha / totalPacientes) * 100).toFixed(1)}%)`);
    console.log(`❌ Pacientes sin número de ficha: ${pacientesSinFicha} (${((pacientesSinFicha / totalPacientes) * 100).toFixed(1)}%)`);
    console.log(`🔢 Números de ficha únicos: ${fichasUnicas.size}`);
    
    if (fichasConDuplicados.length > 0) {
      console.log(`\n⚠️  Números de ficha duplicados: ${fichasConDuplicados.length}`);
      console.log('\n📋 Fichas duplicadas:');
      fichasConDuplicados.forEach(({ ficha, count }) => {
        console.log(`   - Ficha "${ficha}": ${count} pacientes`);
      });
    } else {
      console.log('\n✅ No hay números de ficha duplicados');
    }

    // Mostrar algunos ejemplos
    if (pacientesConFicha > 0) {
      console.log('\n📋 Ejemplos de pacientes con ficha:');
      pacientes
        .filter(p => p.numero_ficha && p.numero_ficha.trim() !== '')
        .slice(0, 10)
        .forEach(p => {
          console.log(`   - Ficha ${p.numero_ficha}: ${p.nombre} ${p.apellido}`);
        });
      
      if (pacientesConFicha > 10) {
        console.log(`   ... y ${pacientesConFicha - 10} más`);
      }
    }

    // Mostrar algunos pacientes sin ficha
    if (pacientesSinFicha > 0) {
      console.log('\n📋 Ejemplos de pacientes sin ficha:');
      pacientes
        .filter(p => !p.numero_ficha || p.numero_ficha.trim() === '')
        .slice(0, 5)
        .forEach(p => {
          console.log(`   - ${p.nombre} ${p.apellido}`);
        });
      
      if (pacientesSinFicha > 5) {
        console.log(`   ... y ${pacientesSinFicha - 5} más`);
      }
    }

    // Rango de números de ficha
    if (fichasUnicas.size > 0) {
      const fichasNumericas = Array.from(fichasUnicas)
        .map(f => parseInt(f || '0', 10))
        .filter(n => !isNaN(n) && n > 0)
        .sort((a, b) => a - b);
      
      if (fichasNumericas.length > 0) {
        console.log('\n📊 Rango de números de ficha:');
        console.log(`   - Mínimo: ${fichasNumericas[0]}`);
        console.log(`   - Máximo: ${fichasNumericas[fichasNumericas.length - 1]}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Consulta completada');
    console.log('='.repeat(60) + '\n');

  } catch (err: any) {
    console.error('❌ Error al consultar la base de datos:', err.message);
    process.exit(1);
  }
}

contarFichasMedicas()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });

