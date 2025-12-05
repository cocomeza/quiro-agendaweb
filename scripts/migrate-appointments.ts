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
  console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key');
  console.log('\n💡 La Service Role Key se obtiene en:');
  console.log('   Supabase Dashboard > Settings > API > service_role key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FrontmyAppointment {
  [key: string]: string | undefined;
  fecha?: string;
  Fecha?: string;
  'Fecha de Turno'?: string;
  hora?: string;
  Hora?: string;
  'Hora de Turno'?: string;
  paciente?: string;
  Paciente?: string;
  nombre?: string;
  Nombre?: string;
  apellido?: string;
  Apellido?: string;
  'Nombre Completo'?: string;
  estado?: string;
  Estado?: string;
  'Estado del Turno'?: string;
  observaciones?: string;
  Observaciones?: string;
  notas?: string;
  Notas?: string;
  comentarios?: string;
  Comentarios?: string;
}

interface SupabaseAppointment {
  paciente_id: string;
  fecha: string;
  hora: string;
  estado: 'programado' | 'completado' | 'cancelado';
  notas: string | null;
}

function normalizeField(data: FrontmyAppointment, ...possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    const value = data[key];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

async function findPatientByName(nombre: string, apellido: string): Promise<string | null> {
  // Buscar por nombre y apellido exactos primero
  let { data, error } = await supabase
    .from('pacientes')
    .select('id')
    .eq('nombre', nombre)
    .eq('apellido', apellido)
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return data.id;
  }

  // Si no se encuentra, buscar por nombre completo (concatenado)
  const nombreCompleto = `${nombre} ${apellido}`.trim();
  
  // Buscar con ILIKE en nombre y apellido combinados
  const { data: data2 } = await supabase
    .from('pacientes')
    .select('id, nombre, apellido')
    .or(`nombre.ilike.%${nombre}%,apellido.ilike.%${apellido}%`)
    .limit(10);

  if (data2 && data2.length > 0) {
    // Buscar coincidencia más cercana
    for (const p of data2) {
      const fullName = `${p.nombre} ${p.apellido}`.toLowerCase();
      const searchName = nombreCompleto.toLowerCase();
      
      if (fullName === searchName || 
          fullName.includes(searchName) || 
          searchName.includes(fullName)) {
        return p.id;
      }
    }
    
    // Si hay solo uno, usarlo
    if (data2.length === 1) {
      return data2[0].id;
    }
  }

  return null;
}

function mapAppointmentStatus(frontmyStatus: string | undefined): 'programado' | 'completado' | 'cancelado' {
  if (!frontmyStatus) return 'programado';
  
  const normalized = frontmyStatus.toLowerCase().trim();
  
  if (normalized.includes('atendido') || 
      normalized.includes('realizado') || 
      normalized.includes('completado') ||
      normalized.includes('completo') ||
      normalized === 'si' ||
      normalized === 's') {
    return 'completado';
  }
  
  if (normalized.includes('cancelado') || 
      normalized.includes('anulado') ||
      normalized.includes('cancel') ||
      normalized === 'no') {
    return 'cancelado';
  }
  
  return 'programado';
}

function parseAppointmentDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  
  try {
    const cleaned = dateStr.trim();
    
    // Formato DD/MM/YYYY
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [day, month, year] = cleaned.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Formato YYYY-MM-DD (ya correcto)
    if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return cleaned;
    }
    
    // Formato DD-MM-YYYY
    if (cleaned.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      const [day, month, year] = cleaned.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Intentar parsear con Date
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  } catch {
    return null;
  }
}

function parseAppointmentTime(timeStr: string | undefined): string | null {
  if (!timeStr) return null;
  
  try {
    const cleaned = timeStr.trim();
    
    // Formato HH:MM:SS -> HH:MM
    if (cleaned.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return cleaned.slice(0, 5);
    }
    
    // Formato HH:MM (correcto)
    if (cleaned.match(/^\d{2}:\d{2}$/)) {
      return cleaned;
    }
    
    // Formato H:MM -> 0H:MM
    if (cleaned.match(/^\d{1}:\d{2}$/)) {
      return '0' + cleaned;
    }
    
    return null;
  } catch {
    return null;
  }
}

async function mapFrontmyAppointmentToSupabase(
  frontmyData: FrontmyAppointment
): Promise<SupabaseAppointment | null> {
  // Obtener nombre y apellido del paciente
  let nombre = normalizeField(frontmyData, 'nombre', 'Nombre', 'nombre_paciente', 'Nombre Paciente') || '';
  let apellido = normalizeField(frontmyData, 'apellido', 'Apellido', 'apellido_paciente', 'Apellido Paciente') || '';
  
  // Si no hay nombre/apellido separados, intentar desde campo completo
  const nombreCompleto = normalizeField(
    frontmyData,
    'paciente',
    'Paciente',
    'Nombre Completo',
    'nombre_completo'
  );
  
  if (nombreCompleto && (!nombre || !apellido)) {
    // Intentar separar nombre completo
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length >= 2) {
      const nombreFinal = partes[0];
      const apellidoFinal = partes.slice(1).join(' ');
      
      if (!nombre) nombre = nombreFinal;
      if (!apellido) apellido = apellidoFinal;
    }
  }
  
  if (!nombre && !apellido) {
    return null; // No se puede migrar sin paciente
  }

  // Buscar ID del paciente
  const patientId = await findPatientByName(nombre || 'Sin nombre', apellido || 'Sin apellido');
  
  if (!patientId) {
    console.warn(`⚠️  Paciente no encontrado: ${nombre} ${apellido}`);
    return null;
  }

  // Parsear fecha y hora
  const fecha = parseAppointmentDate(
    normalizeField(
      frontmyData,
      'fecha',
      'Fecha',
      'Fecha de Turno',
      'fecha_turno',
      'date',
      'Date'
    )
  );
  
  const hora = parseAppointmentTime(
    normalizeField(
      frontmyData,
      'hora',
      'Hora',
      'Hora de Turno',
      'hora_turno',
      'time',
      'Time'
    )
  );

  if (!fecha || !hora) {
    console.warn(`⚠️  Fecha u hora inválida para turno de ${nombre} ${apellido}: fecha=${fecha}, hora=${hora}`);
    return null;
  }

  // Mapear estado
  const estado = mapAppointmentStatus(
    normalizeField(
      frontmyData,
      'estado',
      'Estado',
      'Estado del Turno',
      'estado_turno',
      'status',
      'Status'
    )
  );

  // Obtener notas
  const notas = normalizeField(
    frontmyData,
    'notas',
    'Notas',
    'observaciones',
    'Observaciones',
    'comentarios',
    'Comentarios',
    'notes',
    'Notes'
  ) || null;

  return {
    paciente_id: patientId,
    fecha,
    hora,
    estado,
    notas,
  };
}

function removeDuplicateAppointments(appointments: SupabaseAppointment[]): SupabaseAppointment[] {
  const seen = new Set<string>();
  
  return appointments.filter(apt => {
    // Key única: paciente_id + fecha + hora
    const key = `${apt.paciente_id}_${apt.fecha}_${apt.hora}`;
    
    if (seen.has(key)) {
      return false; // Duplicado
    }
    
    seen.add(key);
    return true;
  });
}

async function migrateAppointments() {
  console.log('🚀 Iniciando migración de turnos desde Frontmy...\n');

  // Buscar archivo CSV en data/ o en la raíz del proyecto
  const possiblePaths = [
    path.join(process.cwd(), 'data', '20251204_20251204_ReporteAgendaProfesional.csv'),
    path.join(process.cwd(), '20251204_20251204_ReporteAgendaProfesional.csv'),
  ];
  
  let csvPath = possiblePaths.find(p => fs.existsSync(p)) || null;
  
  if (!csvPath) {
    // Buscar cualquier archivo CSV de agenda/turnos en data/ o en la raíz
    const searchDirs = [
      fs.existsSync(path.join(process.cwd(), 'data')) ? path.join(process.cwd(), 'data') : null,
      process.cwd(),
    ].filter(Boolean) as string[];
    
    const csvFiles: string[] = [];
    searchDirs.forEach(dir => {
      const files = fs.readdirSync(dir);
      files.filter(f => {
        const lower = f.toLowerCase();
        return lower.endsWith('.csv') && (lower.includes('agenda') || lower.includes('turno') || lower.includes('profesional'));
      }).forEach(f => {
        csvFiles.push(path.join(dir, f));
      });
    });
    
    if (csvFiles.length === 0) {
      console.error('❌ No se encontró ningún archivo CSV de turnos');
      console.log('\n📝 Asegúrate de que el archivo CSV de turnos esté en la raíz del proyecto o en data/');
      console.log('   Ejemplo: 20251204_20251204_ReporteAgendaProfesional.csv\n');
      process.exit(1);
    } else if (csvFiles.length === 1) {
      csvPath = csvFiles[0];
      console.log(`📁 Usando archivo: ${path.basename(csvPath)}\n`);
    } else {
      console.log('📁 Se encontraron múltiples archivos CSV de turnos:');
      csvFiles.forEach((f, i) => console.log(`   ${i + 1}. ${path.basename(f)}`));
      console.log(`\n💡 Usando el primero: ${path.basename(csvFiles[0])}\n`);
      csvPath = csvFiles[0];
    }
  } else {
    console.log(`📁 Usando archivo: ${path.basename(csvPath)}\n`);
  }

  // 1. Leer archivo CSV
  let fileContent: string;
  try {
    fileContent = fs.readFileSync(csvPath, 'latin1');
  } catch (err) {
    try {
      fileContent = fs.readFileSync(csvPath, 'utf8');
    } catch (err2) {
      console.error('❌ Error al leer el archivo:', err2);
      process.exit(1);
    }
  }

  const parseResult = Papa.parse<FrontmyAppointment>(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.warn('⚠️  Advertencias al parsear CSV:');
    parseResult.errors.forEach(err => {
      console.warn(`   Línea ${err.row}: ${err.message}`);
    });
    console.log('');
  }

  const frontmyAppointments = parseResult.data;
  console.log(`📊 Total de turnos en CSV: ${frontmyAppointments.length}\n`);

  // 2. Transformar datos (con búsqueda de pacientes)
  const transformedAppointments: SupabaseAppointment[] = [];
  let skippedCount = 0;

  console.log('🔄 Buscando pacientes y transformando turnos...\n');

  for (let i = 0; i < frontmyAppointments.length; i++) {
    const appointment = frontmyAppointments[i];
    const mapped = await mapFrontmyAppointmentToSupabase(appointment);
    
    if (mapped) {
      transformedAppointments.push(mapped);
    } else {
      skippedCount++;
    }

    // Mostrar progreso cada 10 registros
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\r   Procesados: ${i + 1}/${frontmyAppointments.length}...`);
    }
  }

  console.log(`\n\n✅ Turnos válidos para importar: ${transformedAppointments.length}`);
  console.log(`⚠️  Turnos omitidos (paciente no encontrado o datos inválidos): ${skippedCount}\n`);

  if (transformedAppointments.length === 0) {
    console.log('⚠️  No hay turnos válidos para migrar.\n');
    process.exit(0);
  }

  // 3. Remover duplicados
  const uniqueAppointments = removeDuplicateAppointments(transformedAppointments);
  console.log(`🔍 Turnos únicos (sin duplicados): ${uniqueAppointments.length}\n`);

  // 4. Insertar en lotes de 50
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ batch: number; error: string; data: any }> = [];

  for (let i = 0; i < uniqueAppointments.length; i += batchSize) {
    const batch = uniqueAppointments.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(uniqueAppointments.length / batchSize);

    console.log(`📦 Procesando lote ${batchNumber}/${totalBatches} (${batch.length} turnos)...`);

    try {
      const { data, error } = await supabase
        .from('turnos')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error en lote ${batchNumber}:`, error.message);
        errorCount += batch.length;
        errors.push({ batch: batchNumber, error: error.message, data: batch });
      } else {
        successCount += data?.length || 0;
        console.log(`✅ Lote ${batchNumber} completado: ${data?.length || 0} turnos insertados`);
      }
    } catch (err: any) {
      console.error(`❌ Error inesperado en lote ${batchNumber}:`, err.message);
      errorCount += batch.length;
      errors.push({ batch: batchNumber, error: err.message, data: batch });
    }

    // Pausa entre lotes
    if (i + batchSize < uniqueAppointments.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 5. Guardar log de errores si hay
  if (errors.length > 0) {
    const errorLogPath = fs.existsSync(path.join(process.cwd(), 'data')) 
      ? path.join(process.cwd(), 'data', 'migration-appointments-errors.log')
      : path.join(process.cwd(), 'migration-appointments-errors.log');
    fs.writeFileSync(
      errorLogPath,
      JSON.stringify(errors, null, 2),
      'utf8'
    );
    console.log(`\n⚠️  Errores guardados en: migration-appointments-errors.log`);
  }

  // 6. Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN DE TURNOS');
  console.log('='.repeat(60));
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`⏭️  Omitidos: ${skippedCount}`);
  console.log(`📈 Tasa de éxito: ${uniqueAppointments.length > 0 ? ((successCount / uniqueAppointments.length) * 100).toFixed(2) : 0}%`);
  console.log('='.repeat(60) + '\n');
}

migrateAppointments()
  .then(() => {
    console.log('✅ Migración de turnos completada\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });

