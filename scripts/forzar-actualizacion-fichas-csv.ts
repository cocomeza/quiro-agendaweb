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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FrontmyPatient {
  [key: string]: string | undefined;
}

interface SupabasePatient {
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
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
  
  if (!nombreCompleto) {
    const nombre = normalizeField(frontmyData, 'nombre', 'Nombre', 'name', 'Name') || '';
    const apellido = normalizeField(frontmyData, 'apellido', 'Apellido', 'lastname', 'Lastname', 'surname', 'Surname') || '';
    nombreCompleto = `${nombre} ${apellido}`.trim();
  }
  
  let nombre = '';
  let apellido = '';
  
  if (nombreCompleto.includes(',')) {
    const partes = nombreCompleto.split(',').map(p => p.trim());
    apellido = partes[0] || '';
    nombre = partes.slice(1).join(' ').trim() || '';
  } else {
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length >= 2) {
      apellido = partes[0];
      nombre = partes.slice(1).join(' ');
    } else {
      apellido = partes[0] || '';
      nombre = '';
    }
  }
  
  if (!nombre && !apellido) {
    return null;
  }

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
  
  function cleanPhone(phone: string | undefined): string | null {
    if (!phone) return null;
    let cleaned = phone.replace(/[^\d+\s-]/g, '').trim();
    if (!cleaned) return null;
    cleaned = cleaned.replace(/[\s-]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('54')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.length >= 10 && !cleaned.startsWith('0')) {
        cleaned = '+54' + cleaned;
      }
    }
    if (cleaned.replace(/\D/g, '').length < 8) {
      return null;
    }
    return cleaned;
  }
  
  const telefono = cleanPhone(telefonoRaw);

  const email = normalizeField(
    frontmyData,
    'email',
    'Email',
    'correo',
    'Correo',
    'e-mail',
    'E-mail'
  ) || null;

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
  
  function parseFechaNacimiento(fechaRaw: string | undefined, edadRaw: string | undefined): string | null {
    if (fechaRaw) {
      try {
        const fecha = new Date(fechaRaw);
        if (!isNaN(fecha.getTime())) {
          const hoy = new Date();
          const añoMinimo = hoy.getFullYear() - 120;
          if (fecha.getFullYear() >= añoMinimo && fecha <= hoy) {
            return fecha.toISOString().split('T')[0];
          }
        }
      } catch (err) {
        // Continuar con cálculo desde edad
      }
    }
    
    if (edadRaw) {
      try {
        const edad = parseInt(edadRaw, 10);
        if (!isNaN(edad) && edad >= 0 && edad <= 120) {
          const hoy = new Date();
          const añoNacimiento = hoy.getFullYear() - edad;
          return `${añoNacimiento}-01-01`;
        }
      } catch (err) {
        // Ignorar errores
      }
    }
    
    return null;
  }
  
  const fecha_nacimiento = parseFechaNacimiento(fechaNacRaw, edadRaw);

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

  // Número de ficha desde el CSV (el CSV es la fuente de verdad)
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

  return {
    nombre: nombre || 'Sin nombre',
    apellido: apellido || 'Sin apellido',
    telefono: telefono || null,
    email: email || null,
    fecha_nacimiento: fecha_nacimiento,
    notas: notas,
    numero_ficha: numero_ficha, // El CSV es la fuente de verdad
  };
}

async function forzarActualizacionFichas() {
  console.log('🔄 Forzando actualización de números de ficha desde CSV...\n');
  console.log('⚠️  El CSV es la fuente de verdad. Todos los pacientes se actualizarán con el numero_ficha del CSV.\n');

  // Buscar archivo CSV
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'ReportePacientes_20251204.csv'),
    path.join(process.cwd(), 'ReportePacientes_20251204.csv'),
  ];
  
  let csvPath = possiblePaths.find(p => fs.existsSync(p)) || null;
  
  if (!csvPath) {
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
      process.exit(1);
    }
    csvPath = csvFiles[0];
  }

  console.log(`📁 Usando archivo: ${path.basename(csvPath)}\n`);

  // Leer CSV
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

  const lines = fileContent.split('\n');
  const firstLine = lines[0].trim();
  const secondLine = lines[1]?.trim() || '';
  
  let csvContent = fileContent;
  if (!firstLine.includes(';') && !firstLine.includes(',')) {
    csvContent = lines.slice(1).join('\n');
  }
  
  const delimiter = secondLine.includes(';') ? ';' : ',';

  const parseResult = Papa.parse<FrontmyPatient>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
    delimiter: delimiter,
    newline: '\n',
  });

  const frontmyPatients = parseResult.data;
  console.log(`📊 Total de registros en CSV: ${frontmyPatients.length}\n`);

  // Transformar datos
  const pacientesCSV = frontmyPatients
    .map(mapFrontmyToSupabase)
    .filter((patient): patient is SupabasePatient => patient !== null);

  console.log(`✅ Registros válidos: ${pacientesCSV.length}\n`);

  // Obtener todos los pacientes de la BD
  const { data: pacientesBD, error: errorBD } = await supabase
    .from('pacientes')
    .select('id, nombre, apellido, telefono, numero_ficha');

  if (errorBD) {
    console.error('❌ Error al obtener pacientes:', errorBD.message);
    process.exit(1);
  }

  if (!pacientesBD || pacientesBD.length === 0) {
    console.log('⚠️  No hay pacientes en la base de datos\n');
    process.exit(0);
  }

  console.log(`📊 Pacientes en BD: ${pacientesBD.length}\n`);

  // Crear mapa de pacientes CSV por nombre+apellido+teléfono
  const mapaCSV = new Map<string, SupabasePatient>();
  pacientesCSV.forEach(p => {
    const nombreKey = `${p.nombre.toLowerCase().trim()}_${p.apellido.toLowerCase().trim()}`;
    const phoneKey = p.telefono ? p.telefono.replace(/\D/g, '') : 'sin-telefono';
    const key = `${nombreKey}_${phoneKey}`;
    mapaCSV.set(key, p);
  });

  // Actualizar TODOS los pacientes con el numero_ficha del CSV
  let actualizados = 0;
  let sinCambios = 0;
  let errores = 0;
  const pacientesParaActualizar: Array<{ id: string; numero_ficha: string | null }> = [];

  pacientesBD.forEach(pacienteBD => {
    const nombreKey = `${pacienteBD.nombre.toLowerCase().trim()}_${pacienteBD.apellido.toLowerCase().trim()}`;
    const phoneKey = pacienteBD.telefono ? pacienteBD.telefono.replace(/\D/g, '') : 'sin-telefono';
    const key = `${nombreKey}_${phoneKey}`;
    
    const pacienteCSV = mapaCSV.get(key);
    
    if (pacienteCSV) {
      const fichaBD = (pacienteBD.numero_ficha || '').trim();
      const fichaCSV = (pacienteCSV.numero_ficha || '').trim();
      
      // SIEMPRE actualizar con el valor del CSV (incluso si es "0" o está vacío)
      if (fichaBD !== fichaCSV) {
        pacientesParaActualizar.push({
          id: pacienteBD.id,
          numero_ficha: pacienteCSV.numero_ficha,
        });
      } else {
        sinCambios++;
      }
    }
  });

  console.log(`📊 Análisis:`);
  console.log(`   🔄 A actualizar: ${pacientesParaActualizar.length}`);
  console.log(`   ✅ Sin cambios: ${sinCambios}`);
  console.log(`   ⚠️  No encontrados en CSV: ${pacientesBD.length - pacientesParaActualizar.length - sinCambios}\n`);

  if (pacientesParaActualizar.length === 0) {
    console.log('✅ Todos los pacientes ya tienen el número de ficha correcto del CSV\n');
    process.exit(0);
  }

  // Actualizar en lotes
  const batchSize = 50;
  for (let i = 0; i < pacientesParaActualizar.length; i += batchSize) {
    const batch = pacientesParaActualizar.slice(i, i + batchSize);
    
    for (const { id, numero_ficha } of batch) {
      const { error } = await supabase
        .from('pacientes')
        .update({ numero_ficha: numero_ficha })
        .eq('id', id);

      if (error) {
        console.warn(`⚠️  Error al actualizar paciente ${id}: ${error.message}`);
        errores++;
      } else {
        actualizados++;
      }
    }
    
    console.log(`✅ Procesados ${Math.min(i + batchSize, pacientesParaActualizar.length)}/${pacientesParaActualizar.length}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`✅ Actualizados: ${actualizados}`);
  console.log(`✅ Sin cambios: ${sinCambios}`);
  console.log(`❌ Errores: ${errores}`);
  console.log('='.repeat(60) + '\n');
}

forzarActualizacionFichas()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });

