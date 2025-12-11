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
        // Remover comillas si las tiene
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

// Usar Service Role Key para bypass RLS durante migración
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
  console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key');
  console.log('\n💡 La Service Role Key se obtiene en:');
  console.log('   Supabase Dashboard > Settings > API > service_role key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FrontmyPatient {
  // Campos comunes de Frontmy - ajustar según el CSV real
  [key: string]: string | undefined;
  nombre?: string;
  apellido?: string;
  Nombre?: string;
  Apellido?: string;
  telefono?: string;
  Telefono?: string;
  celular?: string;
  Celular?: string;
  email?: string;
  Email?: string;
  correo?: string;
  fecha_nacimiento?: string;
  'Fecha de Nacimiento'?: string;
  'Fecha Nacimiento'?: string;
  edad?: string;
  Edad?: string;
  notas?: string;
  Notas?: string;
  observaciones?: string;
  Observaciones?: string;
  comentarios?: string;
  Comentarios?: string;
}

interface SupabasePatient {
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  llamado_telefono?: boolean;
  fecha_ultimo_llamado?: string | null;
  notas: string | null;
  numero_ficha: string | null;
}

function normalizeField(data: FrontmyPatient, ...possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    const value = data[key];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function mapFrontmyToSupabase(frontmyData: FrontmyPatient): SupabasePatient | null {
  // El CSV de Frontmy tiene el nombre completo en el campo "Paciente"
  // Formato típico: "APELLIDO, Nombre" o "APELLIDO Nombre"
  let nombreCompleto = normalizeField(
    frontmyData,
    'Paciente',
    'Reporte de Pacientes',
    'nombre',
    'Nombre',
    'name',
    'Name',
    'nombre_completo',
    'Nombre Completo'
  ) || '';
  
  // Si no hay nombre completo, intentar combinar nombre y apellido
  if (!nombreCompleto) {
    const nombre = normalizeField(frontmyData, 'nombre', 'Nombre', 'name', 'Name') || '';
    const apellido = normalizeField(frontmyData, 'apellido', 'Apellido', 'lastname', 'Lastname', 'surname', 'Surname') || '';
    nombreCompleto = `${nombre} ${apellido}`.trim();
  }
  
  // Separar nombre y apellido del nombre completo
  // Formato típico: "APELLIDO, Nombre" o "APELLIDO Nombre"
  let nombre = '';
  let apellido = '';
  
  if (nombreCompleto.includes(',')) {
    // Formato: "APELLIDO, Nombre"
    const partes = nombreCompleto.split(',').map(p => p.trim());
    apellido = partes[0] || '';
    nombre = partes.slice(1).join(' ').trim() || '';
  } else {
    // Formato: "APELLIDO Nombre" - asumir que el último token es el nombre
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length >= 2) {
      apellido = partes[0];
      nombre = partes.slice(1).join(' ');
    } else {
      apellido = partes[0] || '';
      nombre = '';
    }
  }
  
  // Validar que al menos tenga nombre o apellido
  if (!nombre && !apellido) {
    return null; // Registro inválido
  }

  // Normalizar teléfono (el CSV usa "Telefono" con mayúscula)
  const telefonoRaw = normalizeField(
    frontmyData,
    'Telefono',
    'telefono',
    'Teléfono',
    'teléfono',
    'celular',
    'Celular',
    'phone',
    'Phone'
  );
  const telefono = cleanPhone(telefonoRaw);

  // Normalizar email
  const email = normalizeField(
    frontmyData,
    'email',
    'Email',
    'correo',
    'Correo',
    'e-mail',
    'E-mail'
  ) || null;

  // Normalizar fecha de nacimiento (el CSV usa "Fecha Nacimiento")
  const fechaNacRaw = normalizeField(
    frontmyData,
    'Fecha Nacimiento',
    'Fecha de Nacimiento',
    'fecha_nacimiento',
    'fecha_nac',
    'birthdate',
    'Birthdate',
    'fecha de nacimiento'
  );
  const edadRaw = normalizeField(frontmyData, 'Edad', 'edad', 'age', 'Age');
  const fecha_nacimiento = parseFechaNacimiento(fechaNacRaw, edadRaw);

  // Normalizar notas
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

  // Normalizar número de ficha médica
  const numero_ficha = normalizeField(
    frontmyData,
    'Ficha',
    'ficha',
    'numero_ficha',
    'Numero Ficha',
    'Número Ficha',
    'numero',
    'Numero'
  ) || null;

  // Construir objeto solo con campos que existen en la BD
  const paciente: any = {
    nombre: nombre || 'Sin nombre',
    apellido: apellido || 'Sin apellido',
    telefono: telefono || null,
    email: email || null,
    fecha_nacimiento: fecha_nacimiento,
    notas: notas,
    numero_ficha: numero_ficha,
  };
  
  // Agregar campos opcionales solo si existen en el schema
  // (se omitirán automáticamente si no existen)
  return paciente;
}

function cleanPhone(phone: string | undefined): string | null {
  if (!phone) return null;
  
  // Remover caracteres no numéricos excepto + y espacios
  let cleaned = phone.replace(/[^\d+\s-]/g, '').trim();
  
  if (!cleaned) return null;
  
  // Remover espacios y guiones
  cleaned = cleaned.replace(/[\s-]/g, '');
  
  // Si no tiene código de país, intentar agregar +54 (Argentina)
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('54')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length >= 10 && !cleaned.startsWith('0')) {
      // Asumir código de país argentino si tiene 10+ dígitos
      cleaned = '+54' + cleaned;
    }
  }
  
  // Validar longitud mínima
  if (cleaned.replace(/\D/g, '').length < 8) {
    return null;
  }
  
  return cleaned;
}

function parseFechaNacimiento(fechaRaw: string | undefined, edadRaw: string | undefined): string | null {
  // Si tenemos fecha de nacimiento directa
  if (fechaRaw) {
    try {
      // Intentar diferentes formatos de fecha
      const formats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      ];
      
      let fecha: Date | null = null;
      
      // Intentar parsear directamente
      fecha = new Date(fechaRaw);
      
      if (!isNaN(fecha.getTime())) {
        // Validar que la fecha sea razonable (no futura, no muy antigua)
        const hoy = new Date();
        const añoMinimo = hoy.getFullYear() - 120;
        
        if (fecha.getFullYear() >= añoMinimo && fecha <= hoy) {
          return fecha.toISOString().split('T')[0]; // Retornar en formato YYYY-MM-DD
        }
      }
    } catch (err) {
      // Continuar con cálculo desde edad
    }
  }
  
  // Si tenemos edad, calcular fecha aproximada
  if (edadRaw) {
    try {
      const edad = parseInt(edadRaw, 10);
      if (!isNaN(edad) && edad >= 0 && edad <= 120) {
        const hoy = new Date();
        const añoNacimiento = hoy.getFullYear() - edad;
        // Usar 1 de enero como fecha aproximada
        return `${añoNacimiento}-01-01`;
      }
    } catch (err) {
      // Ignorar errores
    }
  }
  
  return null;
}

function removeDuplicates(patients: SupabasePatient[]): SupabasePatient[] {
  const seen = new Set<string>();
  
  return patients.filter(patient => {
    // Crear key única: nombre + apellido + teléfono (normalizado)
    const nombreKey = `${patient.nombre.toLowerCase()}_${patient.apellido.toLowerCase()}`.replace(/\s/g, '');
    const phoneKey = patient.telefono ? patient.telefono.replace(/\D/g, '') : 'sin-telefono';
    const key = `${nombreKey}_${phoneKey}`;
    
    if (seen.has(key)) {
      return false; // Duplicado, omitir
    }
    
    seen.add(key);
    return true;
  });
}

async function migratePatients() {
  console.log('🚀 Iniciando migración de pacientes desde Frontmy...\n');

  // Buscar archivo CSV en data/ o en la raíz del proyecto
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'ReportePacientes_20251204.csv'),
    path.join(process.cwd(), 'ReportePacientes_20251204.csv'),
  ];
  
  let csvPath = possiblePaths.find(p => fs.existsSync(p)) || null;
  
  if (!csvPath) {
    // Buscar cualquier archivo CSV en data/ o en la raíz
    const searchDirs = [
      fs.existsSync(path.join(process.cwd(), 'data')) ? path.join(process.cwd(), 'data') : null,
      process.cwd(),
    ].filter(Boolean) as string[];
    
    const csvFiles: string[] = [];
    searchDirs.forEach(dir => {
      const files = fs.readdirSync(dir);
      files.filter(f => f.toLowerCase().endsWith('.csv') && f.toLowerCase().includes('paciente')).forEach(f => {
        csvFiles.push(path.join(dir, f));
      });
    });
    
    if (csvFiles.length === 0) {
      console.error('❌ No se encontró ningún archivo CSV de pacientes');
      console.log('\n📝 Coloca el archivo CSV exportado de Frontmy en la raíz del proyecto o en data/');
      console.log('   Ejemplo: ReportePacientes_20251204.csv\n');
      process.exit(1);
    } else if (csvFiles.length === 1) {
      csvPath = csvFiles[0];
      console.log(`📁 Usando archivo: ${path.basename(csvPath)}\n`);
    } else {
      console.log('📁 Se encontraron múltiples archivos CSV:');
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

  // Detectar delimitador y saltar primera línea si es título
  const lines = fileContent.split('\n');
  const firstLine = lines[0].trim();
  const secondLine = lines[1]?.trim() || '';
  
  // Si la primera línea no parece un header (no tiene punto y coma ni coma), saltarla
  let csvContent = fileContent;
  let skipLines = 0;
  
  if (!firstLine.includes(';') && !firstLine.includes(',')) {
    // Primera línea es título, saltarla
    csvContent = lines.slice(1).join('\n');
    skipLines = 1;
    console.log(`📋 Saltando primera línea (título): "${firstLine}"\n`);
  }
  
  const delimiter = secondLine.includes(';') ? ';' : ',';
  console.log(`📋 Delimitador detectado: ${delimiter === ';' ? 'punto y coma (;)' : 'coma (,)'}\n`);

  const parseResult = Papa.parse<FrontmyPatient>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
    delimiter: delimiter,
    newline: '\n',
  });

  if (parseResult.errors.length > 0) {
    console.warn('⚠️  Advertencias al parsear CSV:');
    parseResult.errors.forEach(err => {
      console.warn(`   Línea ${err.row}: ${err.message}`);
    });
    console.log('');
  }

  const frontmyPatients = parseResult.data;
  console.log(`📊 Total de registros en CSV: ${frontmyPatients.length}\n`);

  // 2. Transformar datos
  const transformedPatients = frontmyPatients
    .map(mapFrontmyToSupabase)
    .filter((patient): patient is SupabasePatient => patient !== null);

  console.log(`✅ Registros válidos para importar: ${transformedPatients.length}\n`);

  // 3. Verificar duplicados
  const uniquePatients = removeDuplicates(transformedPatients);
  console.log(`🔍 Registros únicos (sin duplicados): ${uniquePatients.length}\n`);

  if (uniquePatients.length === 0) {
    console.log('⚠️  No hay pacientes válidos para migrar.\n');
    process.exit(0);
  }

  // 3.5. Verificar si los pacientes ya existen en la BD
  console.log('🔍 Verificando pacientes existentes en la base de datos...\n');
  const { data: pacientesExistentes, error: errorExistentes } = await supabase
    .from('pacientes')
    .select('id, nombre, apellido, telefono, numero_ficha');

  if (errorExistentes) {
    console.warn('⚠️  No se pudieron verificar pacientes existentes:', errorExistentes.message);
  }

  // Crear un mapa de pacientes existentes para búsqueda rápida
  const mapaExistentes = new Map<string, any>();
  if (pacientesExistentes) {
    pacientesExistentes.forEach(p => {
      const nombreKey = `${p.nombre.toLowerCase().trim()}_${p.apellido.toLowerCase().trim()}`;
      const phoneKey = p.telefono ? p.telefono.replace(/\D/g, '') : 'sin-telefono';
      const key = `${nombreKey}_${phoneKey}`;
      mapaExistentes.set(key, p);
    });
  }

  // Separar en nuevos y actualizaciones
  const pacientesNuevos: SupabasePatient[] = [];
  const pacientesActualizar: Array<{ id: string; datos: SupabasePatient }> = [];

  uniquePatients.forEach(paciente => {
    const nombreKey = `${paciente.nombre.toLowerCase().trim()}_${paciente.apellido.toLowerCase().trim()}`;
    const phoneKey = paciente.telefono ? paciente.telefono.replace(/\D/g, '') : 'sin-telefono';
    const key = `${nombreKey}_${phoneKey}`;
    
    const existente = mapaExistentes.get(key);
    
    if (existente) {
      // El CSV es la fuente de verdad: SIEMPRE actualizar numero_ficha desde el CSV
      // Actualizar todos los pacientes con el numero_ficha del CSV (incluso si es "0")
      if (paciente.numero_ficha !== null && paciente.numero_ficha !== undefined) {
        const fichaActual = (existente.numero_ficha || '').trim();
        const fichaCSV = (paciente.numero_ficha || '').trim();
        
        // Actualizar si es diferente (el CSV siempre tiene prioridad)
        if (fichaActual !== fichaCSV) {
          pacientesActualizar.push({ id: existente.id, datos: paciente });
        }
      }
    } else {
      // Es un paciente nuevo
      pacientesNuevos.push(paciente);
    }
  });

  console.log(`📊 Análisis de pacientes:`);
  console.log(`   ✅ Nuevos: ${pacientesNuevos.length}`);
  console.log(`   🔄 A actualizar (agregar numero_ficha): ${pacientesActualizar.length}`);
  console.log(`   ⏭️  Ya existen (sin cambios): ${uniquePatients.length - pacientesNuevos.length - pacientesActualizar.length}\n`);

  // 4. Actualizar pacientes existentes con numero_ficha desde el CSV (el CSV es la fuente de verdad)
  if (pacientesActualizar.length > 0) {
    console.log(`🔄 Actualizando ${pacientesActualizar.length} pacientes existentes con número de ficha desde CSV...\n`);
    
    let actualizados = 0;
    let errores = 0;
    
    for (const { id, datos } of pacientesActualizar) {
      const { error: updateError } = await supabase
        .from('pacientes')
        .update({ numero_ficha: datos.numero_ficha })
        .eq('id', id);

      if (updateError) {
        console.warn(`⚠️  Error al actualizar paciente ${id}: ${updateError.message}`);
        errores++;
      } else {
        actualizados++;
      }
    }
    
    console.log(`✅ Actualización completada: ${actualizados} actualizados, ${errores} errores\n`);
  }

  if (pacientesNuevos.length === 0) {
    console.log('✅ No hay pacientes nuevos para insertar.\n');
    console.log('💡 Todos los pacientes del CSV ya existen en la base de datos.\n');
    process.exit(0);
  }

  // 5. Insertar solo pacientes nuevos en lotes de 100
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ batch: number; error: string; data: any }> = [];

  for (let i = 0; i < uniquePatients.length; i += batchSize) {
    const batch = uniquePatients.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(pacientesNuevos.length / batchSize);

    console.log(`📦 Procesando lote ${batchNumber}/${totalBatches} (${batch.length} registros)...`);

    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error en lote ${batchNumber}:`, error.message);
        errorCount += batch.length;
        errors.push({ batch: batchNumber, error: error.message, data: batch });
      } else {
        successCount += data?.length || 0;
        console.log(`✅ Lote ${batchNumber} completado: ${data?.length || 0} pacientes insertados`);
      }
    } catch (err: any) {
      console.error(`❌ Error inesperado en lote ${batchNumber}:`, err.message);
      errorCount += batch.length;
      errors.push({ batch: batchNumber, error: err.message, data: batch });
    }

    // Pequeña pausa entre lotes
    if (i + batchSize < pacientesNuevos.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 5. Guardar log de errores si hay
  if (errors.length > 0) {
    const errorLogPath = path.join(process.cwd(), 'migration-errors.log');
    fs.writeFileSync(
      errorLogPath,
      JSON.stringify(errors, null, 2),
      'utf8'
    );
    console.log(`\n⚠️  Errores guardados en: migration-errors.log`);
  }

  // 6. Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Nuevos pacientes insertados: ${successCount}`);
  console.log(`🔄 Pacientes actualizados: ${pacientesActualizar.length}`);
  console.log(`❌ Errores: ${errorCount}`);
  if (pacientesNuevos.length > 0) {
    console.log(`📈 Tasa de éxito: ${((successCount / pacientesNuevos.length) * 100).toFixed(2)}%`);
  }
  console.log('='.repeat(60) + '\n');
}

migratePatients()
  .then(() => {
    console.log('✅ Migración completada\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });

