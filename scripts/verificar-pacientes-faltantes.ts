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

// Función para normalizar nombres (quitar espacios, convertir a minúsculas)
function normalizarNombre(nombre: string): string {
  return (nombre || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Función para comparar nombres (flexible con espacios y mayúsculas)
function nombresCoinciden(nombre1: string, nombre2: string): boolean {
  const n1 = normalizarNombre(nombre1);
  const n2 = normalizarNombre(nombre2);
  return n1 === n2;
}

async function verificarPacientesFaltantes() {
  console.log('🔍 Verificando pacientes faltantes comparando CSV con base de datos...\n');

  try {
    // 1. Leer CSV
    const csvPath = path.join(process.cwd(), 'data', 'ReportePacientes_20251204.csv');
    const csvPathAlt = path.join(process.cwd(), 'ReportePacientes_20251204.csv');
    
    let csvContent = '';
    if (fs.existsSync(csvPath)) {
      csvContent = fs.readFileSync(csvPath, 'utf8');
      console.log(`📄 CSV encontrado: ${csvPath}\n`);
    } else if (fs.existsSync(csvPathAlt)) {
      csvContent = fs.readFileSync(csvPathAlt, 'utf8');
      console.log(`📄 CSV encontrado: ${csvPathAlt}\n`);
    } else {
      console.error('❌ No se encontró el archivo CSV ReportePacientes_20251204.csv');
      console.log('   Buscado en:');
      console.log(`   - ${csvPath}`);
      console.log(`   - ${csvPathAlt}`);
      process.exit(1);
    }

    // Parsear CSV
    const parsed = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true,
    });

    const filasCSV = parsed.data as string[][];
    console.log(`📊 Total de filas en CSV: ${filasCSV.length}\n`);

    // Extraer pacientes del CSV
    // Formato: Apellido, Nombre;DNI;Sexo;Edad;Telefono;Email;Fecha Nacimiento;Fecha Ultima Visita;Ficha;...
    const pacientesCSV: Array<{
      apellido: string;
      nombre: string;
      dni: string | null;
      telefono: string | null;
      numero_ficha: string | null;
      raw: string[];
    }> = [];

    for (let i = 0; i < filasCSV.length; i++) {
      const fila = filasCSV[i];
      if (!fila || fila.length < 1) continue;

      const primeraColumna = fila[0]?.trim() || '';
      if (!primeraColumna || primeraColumna.includes('Paciente') || primeraColumna.includes('Reporte')) {
        continue; // Saltar encabezados
      }

      // Parsear formato: "APELLIDO, NOMBRE" o "APELLIDO , NOMBRE" (con espacios)
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
      const numero_ficha = fila[8]?.trim() || null;

      pacientesCSV.push({
        apellido: apellido.trim(),
        nombre: nombre.trim(),
        dni: dni || null,
        telefono: telefono || null,
        numero_ficha: numero_ficha || null,
        raw: fila,
      });
    }

    console.log(`📋 Pacientes extraídos del CSV: ${pacientesCSV.length}\n`);

    // 2. Obtener pacientes de la base de datos
    const { data: pacientesBD, error: errorBD } = await supabase
      .from('pacientes')
      .select('*')
      .order('apellido', { ascending: true })
      .order('nombre', { ascending: true });

    if (errorBD) {
      throw errorBD;
    }

    console.log(`📊 Pacientes en base de datos: ${pacientesBD?.length || 0}\n`);

    // 3. Comparar y encontrar faltantes
    const pacientesFaltantes: typeof pacientesCSV = [];

    for (const pacienteCSV of pacientesCSV) {
      // Buscar coincidencia en BD
      const encontrado = pacientesBD?.find(p => {
        const coincideApellido = nombresCoinciden(p.apellido || '', pacienteCSV.apellido);
        const coincideNombre = nombresCoinciden(p.nombre || '', pacienteCSV.nombre);
        return coincideApellido && coincideNombre;
      });

      if (!encontrado) {
        pacientesFaltantes.push(pacienteCSV);
      }
    }

    // 4. Mostrar resultados
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📊 RESUMEN:\n`);
    console.log(`   CSV: ${pacientesCSV.length} pacientes`);
    console.log(`   BD: ${pacientesBD?.length || 0} pacientes`);
    console.log(`   Faltantes: ${pacientesFaltantes.length} pacientes\n`);

    if (pacientesFaltantes.length > 0) {
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log(`❌ PACIENTES FALTANTES (${pacientesFaltantes.length}):\n`);

      pacientesFaltantes.forEach((p, index) => {
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre}`);
        console.log(`   DNI: ${p.dni || 'N/A'}`);
        console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
        console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        console.log('');
      });

      // Agrupar por apellido para mejor visualización
      const porApellido: { [key: string]: typeof pacientesFaltantes } = {};
      pacientesFaltantes.forEach(p => {
        const apellido = p.apellido.toUpperCase();
        if (!porApellido[apellido]) {
          porApellido[apellido] = [];
        }
        porApellido[apellido].push(p);
      });

      console.log('\n═══════════════════════════════════════════════════════════\n');
      console.log('📋 Agrupados por apellido:\n');
      Object.keys(porApellido).sort().forEach(apellido => {
        console.log(`${apellido} (${porApellido[apellido].length}):`);
        porApellido[apellido].forEach(p => {
          console.log(`   - ${p.nombre} (Ficha: ${p.numero_ficha || 'N/A'}, DNI: ${p.dni || 'N/A'})`);
        });
        console.log('');
      });

      // Mostrar algunos ejemplos de pacientes que SÍ están en BD para comparar
      console.log('\n═══════════════════════════════════════════════════════════\n');
      console.log('✅ Ejemplos de pacientes que SÍ están en BD (primeros 5):\n');
      pacientesBD?.slice(0, 5).forEach((p, index) => {
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre} (Ficha: ${p.numero_ficha || 'N/A'})`);
      });

    } else {
      console.log('✅ ¡Todos los pacientes del CSV están en la base de datos!\n');
    }

    // 5. Verificar pacientes en BD que no están en CSV (pueden ser creados manualmente)
    if (pacientesBD && pacientesBD.length > pacientesCSV.length) {
      const pacientesExtra = pacientesBD.filter(pBD => {
        return !pacientesCSV.find(pCSV => {
          const coincideApellido = nombresCoinciden(pBD.apellido || '', pCSV.apellido);
          const coincideNombre = nombresCoinciden(pBD.nombre || '', pCSV.nombre);
          return coincideApellido && coincideNombre;
        });
      });

      if (pacientesExtra.length > 0) {
        console.log('\n═══════════════════════════════════════════════════════════\n');
        console.log(`ℹ️  Pacientes en BD que NO están en CSV (${pacientesExtra.length}):\n`);
        console.log('   (Estos pueden ser pacientes creados manualmente)\n');
        pacientesExtra.slice(0, 10).forEach((p, index) => {
          console.log(`${index + 1}. ${p.apellido}, ${p.nombre} (Ficha: ${p.numero_ficha || 'N/A'})`);
        });
        if (pacientesExtra.length > 10) {
          console.log(`\n   ... y ${pacientesExtra.length - 10} más`);
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verificarPacientesFaltantes().then(() => {
  console.log('\n✨ Verificación completada.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
