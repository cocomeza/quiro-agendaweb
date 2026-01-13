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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function corregirFechaTurnoCarlos() {
  console.log('🔧 CORRECCIÓN DE FECHA DEL TURNO DE CARLOS SOSA\n');
  console.log('='.repeat(60));
  console.log('🌍 Zona horaria: Argentina (UTC-3)\n');

  try {
    // Buscar el turno específico de Carlos Sosa del 11 de enero de 2026
    console.log('1️⃣ Buscando turno de Carlos Sosa del 11 de enero de 2026...\n');
    
    const { data: turnos, error: errorBusqueda } = await supabase
      .from('turnos')
      .select(`
        *,
        pacientes (
          id,
          nombre,
          apellido,
          telefono
        )
      `)
      .eq('fecha', '2026-01-11')
      .eq('hora', '09:40:00')
      .ilike('pacientes.apellido', '%sosa%')
      .ilike('pacientes.nombre', '%carlos%');

    if (errorBusqueda) {
      console.error('❌ Error al buscar turnos:', errorBusqueda.message);
      process.exit(1);
    }

    if (!turnos || turnos.length === 0) {
      console.log('   ⚠️  No se encontró el turno específico\n');
      console.log('   Buscando todos los turnos de Carlos Sosa en enero 2026...\n');
      
      // Buscar todos los turnos de Carlos Sosa en enero 2026
      const { data: todosTurnos, error: errorTodos } = await supabase
        .from('turnos')
        .select(`
          *,
          pacientes (
            id,
            nombre,
            apellido,
            telefono
          )
        `)
        .gte('fecha', '2026-01-01')
        .lte('fecha', '2026-01-31')
        .ilike('pacientes.apellido', '%sosa%')
        .ilike('pacientes.nombre', '%carlos%')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (errorTodos) {
        console.error('❌ Error:', errorTodos.message);
        process.exit(1);
      }

      if (todosTurnos && todosTurnos.length > 0) {
        console.log(`   ✅ Encontrados ${todosTurnos.length} turno(s):\n`);
        todosTurnos.forEach((turno: any, index: number) => {
          const paciente = Array.isArray(turno.pacientes) ? turno.pacientes[0] : turno.pacientes;
          const nombreCompleto = paciente 
            ? `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim()
            : 'Sin paciente';
          
          console.log(`   ${index + 1}. ${nombreCompleto}`);
          console.log(`      - ID: ${turno.id}`);
          console.log(`      - Fecha: ${turno.fecha}`);
          console.log(`      - Hora: ${turno.hora}`);
          console.log(`      - Estado: ${turno.estado}`);
          console.log('');
        });
        
        console.log('   💡 Si necesitas corregir un turno específico, edita este script');
        console.log('      y especifica el ID del turno a corregir.\n');
      } else {
        console.log('   ⚠️  No se encontraron turnos de Carlos Sosa en enero 2026\n');
      }
      
      return;
    }

    const turno = turnos[0];
    const paciente = Array.isArray(turno.pacientes) ? turno.pacientes[0] : turno.pacientes;
    const nombreCompleto = paciente 
      ? `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim()
      : 'Sin paciente';

    console.log('   ✅ Turno encontrado:\n');
    console.log(`   - ID: ${turno.id}`);
    console.log(`   - Paciente: ${nombreCompleto}`);
    console.log(`   - Fecha actual: ${turno.fecha} (Domingo 11 de enero)`);
    console.log(`   - Hora: ${turno.hora}`);
    console.log(`   - Estado: ${turno.estado}`);
    console.log('');

    // Verificar si ya existe un turno el 12 de enero a la misma hora
    console.log('2️⃣ Verificando si existe conflicto con turno del 12 de enero...\n');
    
    const { data: turnoExistente, error: errorExistente } = await supabase
      .from('turnos')
      .select('id, paciente_id, fecha, hora, estado')
      .eq('fecha', '2026-01-12')
      .eq('hora', turno.hora)
      .maybeSingle();

    if (errorExistente) {
      console.error('❌ Error al verificar turno existente:', errorExistente.message);
      process.exit(1);
    }

    if (turnoExistente) {
      console.log('   ⚠️  Ya existe un turno el 12 de enero a la misma hora:');
      console.log(`      - ID: ${turnoExistente.id}`);
      console.log(`      - Fecha: ${turnoExistente.fecha}`);
      console.log(`      - Hora: ${turnoExistente.hora}`);
      console.log(`      - Estado: ${turnoExistente.estado}`);
      console.log('');
      console.log('   💡 No se puede corregir automáticamente porque hay un conflicto.');
      console.log('      Revisa manualmente en la aplicación.\n');
      return;
    }

    // Corregir la fecha
    console.log('3️⃣ Corrigiendo fecha de 2026-01-11 a 2026-01-12...\n');
    
    const { error: errorUpdate } = await supabase
      .from('turnos')
      .update({ fecha: '2026-01-12' })
      .eq('id', turno.id);

    if (errorUpdate) {
      console.error('❌ Error al actualizar turno:', errorUpdate.message);
      process.exit(1);
    }

    console.log('   ✅ Fecha corregida exitosamente!\n');
    console.log('   📋 Resumen:');
    console.log(`      - Turno ID: ${turno.id}`);
    console.log(`      - Paciente: ${nombreCompleto}`);
    console.log(`      - Fecha anterior: 2026-01-11 (Domingo)`);
    console.log(`      - Fecha nueva: 2026-01-12 (Lunes)`);
    console.log(`      - Hora: ${turno.hora}`);
    console.log('');

    // Verificar la corrección
    console.log('4️⃣ Verificando corrección...\n');
    
    const { data: turnoVerificado, error: errorVerificacion } = await supabase
      .from('turnos')
      .select('id, fecha, hora, estado, pacientes(nombre, apellido)')
      .eq('id', turno.id)
      .single();

    if (errorVerificacion) {
      console.error('❌ Error al verificar:', errorVerificacion.message);
      return;
    }

    if (turnoVerificado.fecha === '2026-01-12') {
      console.log('   ✅ Verificación exitosa: La fecha fue corregida correctamente\n');
    } else {
      console.log('   ⚠️  La fecha no coincide. Verifica manualmente.\n');
    }

    console.log('='.repeat(60));
    console.log('✅ CORRECCIÓN COMPLETADA\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
corregirFechaTurnoCarlos();
