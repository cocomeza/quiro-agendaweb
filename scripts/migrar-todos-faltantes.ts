import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

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
        const cleanValue = value.replace(/^[\"']|[\"']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizarNombre(nombre: string): string {
  return (nombre || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function nombresCoinciden(nombre1: string, nombre2: string): boolean {
  const n1 = normalizarNombre(nombre1);
  const n2 = normalizarNombre(nombre2);
  return n1 === n2;
}

function parseFechaNacimiento(fechaRaw: string | undefined): string | null {
  if (!fechaRaw) return null;
  
  try {
    // Formato DD/MM/YYYY
    if (fechaRaw.includes('/')) {
      const partes = fechaRaw.split('/');
      if (partes.length === 3) {
        const dia = partes[0].padStart(2, '0');
        const mes = partes[1].padStart(2, '0');
        const año = partes[2];
        return `${año}-${mes}-${dia}`;
      }
    }
    
    // Intentar parsear directamente
    const fecha = new Date(fechaRaw);
    if (!isNaN(fecha.getTime())) {
      return fecha.toISOString().split('T')[0];
    }
  } catch (err) {
    // Ignorar errores
  }
  
  return null;
}

function cleanPhone(phone: string | undefined): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d+\s-]/g, '').trim();
  if (!cleaned) return null;
  cleaned = cleaned.replace(/[\s-]/g, '');
  if (cleaned.length >= 10 && !cleaned.startsWith('+') && !cleaned.startsWith('54')) {
    cleaned = '+54' + cleaned;
  }
  return cleaned.length >= 8 ? cleaned : null;
}

async function migrarTodosFaltantes() {
  console.log('🔍 Buscando y migrando todos los pacientes faltantes...\n');

  try {
    // 1. Leer CSV
    const csvPath = path.join(process.cwd(), 'data', 'ReportePacientes_20251204.csv');
    const csvPathAlt = path.join(process.cwd(), 'ReportePacientes_20251204.csv');
    
    let csvContent = '';
    if (fs.existsSync(csvPath)) {
      csvContent = fs.readFileSync(csvPath, 'utf8');
    } else if (fs.existsSync(csvPathAlt)) {
      csvContent = fs.readFileSync(csvPathAlt, 'utf8');
    } else {
      console.error('❌ No se encontró el archivo CSV');
      process.exit(1);
    }

    const parsed = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true,
    });

    const filasCSV = parsed.data as string[][];

    // 2. Extraer pacientes del CSV
    const pacientesCSV: Array<{
      apellido: string;
      nombre: string;
      dni: string | null;
      telefono: string | null;
      email: string | null;
      fecha_nacimiento: string | null;
      numero_ficha: string | null;
      raw: string[];
    }> = [];

    for (let i = 0; i < filasCSV.length; i++) {
      const fila = filasCSV[i];
      if (!fila || fila.length < 1) continue;

      const primeraColumna = fila[0]?.trim() || '';
      if (!primeraColumna || primeraColumna.includes('Paciente') || primeraColumna.includes('Reporte')) {
        continue;
      }

      let apellido = '';
      let nombre = '';

      if (primeraColumna.includes(',')) {
        const partes = primeraColumna.split(',').map(p => p.trim());
        apellido = partes[0] || '';
        nombre = partes.slice(1).join(' ').trim() || '';
      } else {
        const partes = primeraColumna.trim().split(/\s+/);
        if (partes.length >= 2) {
          apellido = partes[0];
          nombre = partes.slice(1).join(' ');
        } else {
          apellido = partes[0] || '';
        }
      }

      if (!apellido && !nombre) continue;

      const dni = fila[1]?.trim() || null;
      const telefono = fila[4]?.trim() || null;
      const email = fila[5]?.trim() || null;
      const fecha_nacimiento = parseFechaNacimiento(fila[6]?.trim());
      const numero_ficha = fila[8]?.trim() || null;

      pacientesCSV.push({
        apellido: apellido.trim(),
        nombre: nombre.trim(),
        dni: dni || null,
        telefono: cleanPhone(telefono),
        email: email || null,
        fecha_nacimiento: fecha_nacimiento,
        numero_ficha: numero_ficha || null,
        raw: fila,
      });
    }

    console.log(`📋 Pacientes en CSV: ${pacientesCSV.length}`);

    // 3. Obtener pacientes de BD
    const { data: pacientesBD, error: errorBD } = await supabase
      .from('pacientes')
      .select('*');

    if (errorBD) {
      throw errorBD;
    }

    console.log(`📊 Pacientes en BD: ${pacientesBD?.length || 0}\n`);

    // 4. Encontrar faltantes
    const pacientesFaltantes = pacientesCSV.filter(pCSV => {
      return !pacientesBD?.find(pBD => {
        return nombresCoinciden(pBD.apellido || '', pCSV.apellido) &&
               nombresCoinciden(pBD.nombre || '', pCSV.nombre);
      });
    });

    console.log(`❌ Pacientes faltantes: ${pacientesFaltantes.length}\n`);

    if (pacientesFaltantes.length === 0) {
      console.log('✅ Todos los pacientes ya están migrados.\n');
      return;
    }

    // 5. Migrar pacientes faltantes
    console.log('📝 Migrando pacientes faltantes...\n');

    let migrados = 0;
    let errores = 0;

    for (const paciente of pacientesFaltantes) {
      // Verificar si el número de ficha ya está en uso
      let numeroFicha = paciente.numero_ficha;
      if (numeroFicha && numeroFicha !== '0') {
        const { data: fichaExistente } = await supabase
          .from('pacientes')
          .select('*')
          .eq('numero_ficha', numeroFicha);

        if (fichaExistente && fichaExistente.length > 0) {
          console.log(`⚠️  Ficha ${numeroFicha} en uso, omitiendo para ${paciente.apellido}, ${paciente.nombre}`);
          numeroFicha = null;
        }
      } else if (numeroFicha === '0') {
        numeroFicha = null;
      }

      const { data: nuevoPaciente, error: errorInsert } = await supabase
        .from('pacientes')
        .insert({
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          dni: paciente.dni || null,
          telefono: paciente.telefono || null,
          email: paciente.email || null,
          fecha_nacimiento: paciente.fecha_nacimiento || null,
          numero_ficha: numeroFicha || null,
          notas: null,
        })
        .select()
        .single();

      if (errorInsert) {
        console.error(`❌ Error: ${paciente.apellido}, ${paciente.nombre} - ${errorInsert.message}`);
        errores++;
      } else {
        console.log(`✅ ${paciente.apellido}, ${paciente.nombre} (Ficha: ${numeroFicha || 'N/A'})`);
        migrados++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log(`📊 RESUMEN:\n`);
    console.log(`   Migrados: ${migrados}`);
    console.log(`   Errores: ${errores}`);
    console.log(`   Total procesados: ${pacientesFaltantes.length}\n`);

  } catch (error: any) {
    console.error('❌ Error fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrarTodosFaltantes().then(() => {
  console.log('\n✨ Proceso completado.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
