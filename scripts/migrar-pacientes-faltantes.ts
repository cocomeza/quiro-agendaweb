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

// Datos de los pacientes faltantes del CSV
const pacientesFaltantes = [
  {
    // Línea 109: DEGLIANTONI, JUAN JOSE;;M;70;336-4535352;;16/03/1955;30/01/2024;347;;
    apellido: 'DEGLIANTONI',
    nombre: 'JUAN JOSE',
    dni: null,
    telefono: '336-4535352',
    email: null,
    fecha_nacimiento: '1955-03-16', // 16/03/1955
    numero_ficha: '347',
    notas: null,
  },
  {
    // Línea 262: MERAVIGLIA , JUAN PEDRO;49882329;M;15;3407-408470;;15/09/2010;11/09/2025;438;;
    apellido: 'MERAVIGLIA',
    nombre: 'JUAN PEDRO',
    dni: '49882329',
    telefono: '3407-408470',
    email: null,
    fecha_nacimiento: '2010-09-15', // 15/09/2010
    numero_ficha: '438',
    notas: null,
  },
];

async function migrarPacientesFaltantes() {
  console.log('🔍 Verificando si los pacientes ya existen...\n');

  try {
    // Verificar si ya existen
    for (const paciente of pacientesFaltantes) {
      const { data: existentes, error: errorBusqueda } = await supabase
        .from('pacientes')
        .select('*')
        .ilike('apellido', paciente.apellido)
        .ilike('nombre', paciente.nombre);

      if (errorBusqueda) {
        console.error(`❌ Error al buscar ${paciente.apellido}, ${paciente.nombre}:`, errorBusqueda.message);
        continue;
      }

      if (existentes && existentes.length > 0) {
        console.log(`⚠️  ${paciente.apellido}, ${paciente.nombre} ya existe en la base de datos:`);
        existentes.forEach((p: any) => {
          console.log(`   ID: ${p.id}`);
          console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
          console.log(`   DNI: ${p.dni || 'N/A'}`);
          console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        });
        console.log('');
      } else {
        console.log(`✅ ${paciente.apellido}, ${paciente.nombre} NO existe. Se creará.\n`);
      }
    }

    console.log('\n📝 Migrando pacientes faltantes...\n');

    for (const paciente of pacientesFaltantes) {
      // Verificar nuevamente antes de insertar
      const { data: existentes } = await supabase
        .from('pacientes')
        .select('*')
        .ilike('apellido', paciente.apellido)
        .ilike('nombre', paciente.nombre);

      if (existentes && existentes.length > 0) {
        console.log(`⏭️  Omitiendo ${paciente.apellido}, ${paciente.nombre} (ya existe)\n`);
        continue;
      }

      // Verificar si el número de ficha ya está en uso
      if (paciente.numero_ficha) {
        const { data: fichaExistente } = await supabase
          .from('pacientes')
          .select('*')
          .eq('numero_ficha', paciente.numero_ficha);

        if (fichaExistente && fichaExistente.length > 0) {
          console.log(`⚠️  El número de ficha ${paciente.numero_ficha} ya está en uso por otro paciente.`);
          console.log(`   Se creará ${paciente.apellido}, ${paciente.nombre} sin número de ficha.\n`);
          paciente.numero_ficha = null;
        }
      }

      // Insertar paciente
      const { data: nuevoPaciente, error: errorInsert } = await supabase
        .from('pacientes')
        .insert({
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          dni: paciente.dni || null,
          telefono: paciente.telefono || null,
          email: paciente.email || null,
          fecha_nacimiento: paciente.fecha_nacimiento || null,
          numero_ficha: paciente.numero_ficha || null,
          notas: paciente.notas || null,
        })
        .select()
        .single();

      if (errorInsert) {
        console.error(`❌ Error al crear ${paciente.apellido}, ${paciente.nombre}:`, errorInsert.message);
        console.error(`   Detalles:`, errorInsert);
      } else {
        console.log(`✅ Creado: ${paciente.apellido}, ${paciente.nombre}`);
        console.log(`   ID: ${nuevoPaciente.id}`);
        console.log(`   DNI: ${nuevoPaciente.dni || 'N/A'}`);
        console.log(`   Teléfono: ${nuevoPaciente.telefono || 'N/A'}`);
        console.log(`   Número de ficha: ${nuevoPaciente.numero_ficha || 'N/A'}`);
        console.log(`   Fecha de nacimiento: ${nuevoPaciente.fecha_nacimiento || 'N/A'}`);
        console.log('');
      }
    }

    console.log('\n✨ Migración completada.\n');

    // Verificar resultados finales
    console.log('🔍 Verificando pacientes migrados...\n');
    for (const paciente of pacientesFaltantes) {
      const { data: verificados } = await supabase
        .from('pacientes')
        .select('*')
        .ilike('apellido', paciente.apellido)
        .ilike('nombre', paciente.nombre);

      if (verificados && verificados.length > 0) {
        console.log(`✅ ${paciente.apellido}, ${paciente.nombre} está en la base de datos`);
        verificados.forEach((p: any) => {
          console.log(`   ID: ${p.id}`);
        });
      } else {
        console.log(`❌ ${paciente.apellido}, ${paciente.nombre} NO está en la base de datos`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

migrarPacientesFaltantes().then(() => {
  console.log('\n✨ Proceso completado.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
