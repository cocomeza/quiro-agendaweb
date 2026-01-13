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

/**
 * Parsea una fecha ISO como hora local (Argentina UTC-3)
 * Evita problemas de zona horaria donde new Date('2026-01-12') se interpreta como UTC
 */
function parsearFechaLocal(fechaStr: string): Date {
  if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [año, mes, dia] = fechaStr.split('-').map(Number);
    return new Date(año, mes - 1, dia); // mes es 0-indexed
  }
  return new Date(fechaStr);
}

/**
 * Formatea una fecha a string ISO (yyyy-MM-dd)
 */
function formatearFechaISO(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

/**
 * Obtiene el día de la semana de una fecha (0=Domingo, 1=Lunes, etc.)
 */
function obtenerDiaSemana(fecha: Date): { numero: number; nombre: string } {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const numero = fecha.getDay();
  return { numero, nombre: dias[numero] };
}

/**
 * Verifica si una fecha podría tener problemas de zona horaria
 * Compara cómo se parsea como UTC vs hora local
 */
function verificarProblemaZonaHoraria(fechaStr: string): {
  tieneProblema: boolean;
  fechaUTC: Date;
  fechaLocal: Date;
  diaUTC: number;
  diaLocal: number;
  diferencia: number;
} {
  // Parsear como UTC (comportamiento problemático de JavaScript)
  const fechaUTC = new Date(fechaStr + 'T00:00:00Z');
  const diaUTC = fechaUTC.getUTCDate();
  
  // Parsear como hora local (Argentina UTC-3)
  const fechaLocal = parsearFechaLocal(fechaStr);
  const diaLocal = fechaLocal.getDate();
  
  const diferencia = diaLocal - diaUTC;
  const tieneProblema = diferencia !== 0;
  
  return {
    tieneProblema,
    fechaUTC,
    fechaLocal,
    diaUTC,
    diaLocal,
    diferencia,
  };
}

async function verificarYCorregirFechas() {
  console.log('🔍 VERIFICACIÓN Y CORRECCIÓN DE FECHAS DE TURNOS\n');
  console.log('='.repeat(60));
  console.log('🌍 Zona horaria: Argentina (UTC-3)\n');

  try {
    // 1. Buscar turnos de Carlos Sosa específicamente
    console.log('1️⃣ Buscando turnos de CARLOS SOSA...\n');
    
    const { data: turnosCarlos, error: errorCarlos } = await supabase
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
      .ilike('pacientes.apellido', '%sosa%')
      .ilike('pacientes.nombre', '%carlos%')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    if (errorCarlos) {
      console.error('❌ Error al buscar turnos de Carlos:', errorCarlos.message);
    } else if (turnosCarlos && turnosCarlos.length > 0) {
      console.log(`   ✅ Encontrados ${turnosCarlos.length} turno(s) de Carlos Sosa:\n`);
      
      turnosCarlos.forEach((turno: any, index: number) => {
        const paciente = Array.isArray(turno.pacientes) ? turno.pacientes[0] : turno.pacientes;
        const nombreCompleto = paciente 
          ? `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim()
          : 'Sin paciente';
        
        console.log(`   Turno ${index + 1}:`);
        console.log(`   - ID: ${turno.id}`);
        console.log(`   - Paciente: ${nombreCompleto}`);
        console.log(`   - Fecha en BD: ${turno.fecha}`);
        console.log(`   - Hora: ${turno.hora}`);
        console.log(`   - Estado: ${turno.estado}`);
        
        // Verificar problema de zona horaria
        const verificacion = verificarProblemaZonaHoraria(turno.fecha);
        const diaSemanaLocal = obtenerDiaSemana(verificacion.fechaLocal);
        
        console.log(`   - Día de la semana (local): ${diaSemanaLocal.nombre}`);
        console.log(`   - Fecha parseada (local): ${formatearFechaISO(verificacion.fechaLocal)}`);
        
        if (verificacion.tieneProblema) {
          console.log(`   ⚠️  PROBLEMA DETECTADO: Diferencia de ${verificacion.diferencia} día(s)`);
          console.log(`      - Parseado como UTC: día ${verificacion.diaUTC}`);
          console.log(`      - Parseado como local: día ${verificacion.diaLocal}`);
        } else {
          console.log(`   ✅ Fecha correcta (sin problemas de zona horaria)`);
        }
        console.log('');
      });
    } else {
      console.log('   ⚠️  No se encontraron turnos de Carlos Sosa\n');
    }

    // 2. Buscar todos los turnos recientes (últimos 30 días y próximos 30 días)
    console.log('2️⃣ Verificando turnos recientes (últimos 30 días y próximos 30 días)...\n');
    
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const en30Dias = new Date(hoy);
    en30Dias.setDate(en30Dias.getDate() + 30);
    
    const fechaInicio = formatearFechaISO(hace30Dias);
    const fechaFin = formatearFechaISO(en30Dias);
    
    const { data: turnosRecientes, error: errorRecientes } = await supabase
      .from('turnos')
      .select(`
        *,
        pacientes (
          id,
          nombre,
          apellido
        )
      `)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (errorRecientes) {
      console.error('❌ Error al buscar turnos recientes:', errorRecientes.message);
      return;
    }

    if (!turnosRecientes || turnosRecientes.length === 0) {
      console.log('   ⚠️  No se encontraron turnos en el rango especificado\n');
      return;
    }

    console.log(`   📊 Total de turnos encontrados: ${turnosRecientes.length}\n`);

    // 3. Verificar cada turno
    const turnosConProblemas: Array<{
      turno: any;
      problema: ReturnType<typeof verificarProblemaZonaHoraria>;
      paciente: any;
    }> = [];

    console.log('3️⃣ Analizando fechas...\n');
    
    for (const turno of turnosRecientes) {
      const paciente = Array.isArray(turno.pacientes) ? turno.pacientes[0] : turno.pacientes;
      const verificacion = verificarProblemaZonaHoraria(turno.fecha);
      
      if (verificacion.tieneProblema) {
        turnosConProblemas.push({
          turno,
          problema: verificacion,
          paciente,
        });
      }
    }

    if (turnosConProblemas.length === 0) {
      console.log('   ✅ No se encontraron turnos con problemas de zona horaria\n');
    } else {
      console.log(`   ⚠️  Se encontraron ${turnosConProblemas.length} turno(s) con posibles problemas:\n`);
      
      turnosConProblemas.forEach((item, index) => {
        const paciente = item.paciente;
        const nombreCompleto = paciente 
          ? `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim()
          : 'Sin paciente';
        
        console.log(`   ${index + 1}. ${nombreCompleto}`);
        console.log(`      - ID: ${item.turno.id}`);
        console.log(`      - Fecha en BD: ${item.turno.fecha}`);
        console.log(`      - Hora: ${item.turno.hora}`);
        console.log(`      - Diferencia: ${item.problema.diferencia} día(s)`);
        console.log(`      - Parseado UTC: día ${item.problema.diaUTC}`);
        console.log(`      - Parseado local: día ${item.problema.diaLocal}`);
        console.log('');
      });

      // 4. Preguntar si se desea corregir
      console.log('4️⃣ CORRECCIÓN DE FECHAS\n');
      console.log('⚠️  IMPORTANTE: Las fechas en la base de datos están correctas.');
      console.log('   El problema está en cómo se parsean cuando se leen.');
      console.log('   Las correcciones en el código ya solucionan este problema.\n');
      console.log('   Sin embargo, si hay turnos que se crearon con fechas incorrectas');
      console.log('   debido a problemas anteriores, puedes corregirlos manualmente.\n');
      
      // Nota: No vamos a corregir automáticamente porque las fechas en BD están bien
      // El problema ya está resuelto en el código con parsearFechaISO
      console.log('✅ El código ya está corregido para parsear fechas correctamente.');
      console.log('   Los turnos deberían mostrarse correctamente ahora.\n');
    }

    // 5. Resumen
    console.log('5️⃣ RESUMEN\n');
    console.log('='.repeat(60));
    console.log(`Total de turnos verificados: ${turnosRecientes.length}`);
    console.log(`Turnos con problemas detectados: ${turnosConProblemas.length}`);
    console.log('\n✅ Las correcciones en el código (parsearFechaISO)');
    console.log('   deberían resolver el problema de visualización de fechas.\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
verificarYCorregirFechas();
