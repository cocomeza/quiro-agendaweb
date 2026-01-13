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

// Nombres a buscar (todas las variaciones posibles)
const nombresBuscar = [
  // Degliantoni Juan Jose - todas las variaciones
  { nombre: 'juan jose', apellido: 'degliantoni' },
  { nombre: 'juan jose', apellido: 'degliantoni' },
  { nombre: 'juanjose', apellido: 'degliantoni' },
  { nombre: 'juan-jose', apellido: 'degliantoni' },
  { nombre: 'juan_jose', apellido: 'degliantoni' },
  { nombre: 'juan josé', apellido: 'degliantoni' },
  { nombre: 'JUAN JOSE', apellido: 'DEGLIANTONI' },
  { nombre: 'JUAN JOSÉ', apellido: 'DEGLIANTONI' },
  { nombre: 'Juan Jose', apellido: 'Degliantoni' },
  { nombre: 'Juan José', apellido: 'Degliantoni' },
  { nombre: 'JuanJose', apellido: 'Degliantoni' },
  // Meraviglia Juan Pedro - todas las variaciones
  { nombre: 'juan pedro', apellido: 'meraviglia' },
  { nombre: 'juanpedro', apellido: 'meraviglia' },
  { nombre: 'juan-pedro', apellido: 'meraviglia' },
  { nombre: 'juan_pedro', apellido: 'meraviglia' },
  { nombre: 'JUAN PEDRO', apellido: 'MERAVIGLIA' },
  { nombre: 'Juan Pedro', apellido: 'Meraviglia' },
  { nombre: 'JuanPedro', apellido: 'Meraviglia' },
  // Búsquedas parciales
  { nombre: 'juan', apellido: 'degliantoni' },
  { nombre: 'jose', apellido: 'degliantoni' },
  { nombre: 'juan', apellido: 'meraviglia' },
  { nombre: 'pedro', apellido: 'meraviglia' },
];

async function buscarPacientes() {
  console.log('🔍 Buscando pacientes en la base de datos...\n');

  try {
    // Obtener todos los pacientes
    const { data: pacientes, error: fetchError } = await supabase
      .from('pacientes')
      .select('*')
      .order('apellido', { ascending: true })
      .order('nombre', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!pacientes || pacientes.length === 0) {
      console.log('❌ No se encontraron pacientes en la base de datos.');
      return;
    }

    console.log(`📊 Total de pacientes en la base de datos: ${pacientes.length}\n`);

    // Buscar coincidencias exactas y parciales
    console.log('🔎 Buscando coincidencias...\n');

    const resultados: any[] = [];

    for (const busqueda of nombresBuscar) {
      const nombreLower = busqueda.nombre.toLowerCase();
      const apellidoLower = busqueda.apellido.toLowerCase();

      const coincidencias = pacientes.filter(p => {
        const nombreP = (p.nombre || '').toLowerCase();
        const apellidoP = (p.apellido || '').toLowerCase();

        const coincideNombre = nombreP.includes(nombreLower) || nombreLower.includes(nombreP);
        const coincideApellido = apellidoP.includes(apellidoLower) || apellidoLower.includes(apellidoP);

        return coincideNombre && coincideApellido;
      });

      if (coincidencias.length > 0) {
        resultados.push(...coincidencias);
      }
    }

    // Buscar variaciones de degliantoni y meraviglia
    const apellidosBuscar = ['degliantoni', 'meraviglia'];
    for (const apellidoBuscar of apellidosBuscar) {
      const coincidencias = pacientes.filter(p => {
        const apellidoP = (p.apellido || '').toLowerCase();
        return apellidoP.includes(apellidoBuscar.toLowerCase()) || 
               apellidoBuscar.toLowerCase().includes(apellidoP);
      });

      if (coincidencias.length > 0) {
        resultados.push(...coincidencias);
      }
    }

    // Eliminar duplicados
    const resultadosUnicos = Array.from(
      new Map(resultados.map(p => [p.id, p])).values()
    );

    if (resultadosUnicos.length > 0) {
      console.log(`✅ Se encontraron ${resultadosUnicos.length} paciente(s) que coinciden:\n`);
      resultadosUnicos.forEach((p, index) => {
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
        console.log(`   Email: ${p.email || 'N/A'}`);
        console.log(`   DNI: ${p.dni || 'N/A'}`);
        console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        console.log(`   Fecha de nacimiento: ${p.fecha_nacimiento || 'N/A'}`);
        console.log(`   Creado: ${p.created_at || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron pacientes que coincidan con los nombres buscados.\n');
    }

    // Mostrar TODOS los pacientes con apellidos DEGLIANTONI o MERAVIGLIA
    console.log('\n📋 TODOS los pacientes con apellido DEGLIANTONI o MERAVIGLIA:\n');
    
    const apellidosExactos = pacientes.filter(p => {
      const apellidoP = (p.apellido || '').toLowerCase();
      return apellidoP === 'degliantoni' || apellidoP === 'meraviglia';
    });

    if (apellidosExactos.length > 0) {
      console.log(`📌 Total encontrados: ${apellidosExactos.length}\n`);
      apellidosExactos.forEach((p, index) => {
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
        console.log(`   Email: ${p.email || 'N/A'}`);
        console.log(`   DNI: ${p.dni || 'N/A'}`);
        console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        console.log(`   Fecha de nacimiento: ${p.fecha_nacimiento || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron pacientes con esos apellidos exactos.\n');
    }

    // Buscar pacientes con apellidos similares
    console.log('\n📋 Buscando pacientes con apellidos similares...\n');
    
    const apellidosSimilares = pacientes.filter(p => {
      const apellidoP = (p.apellido || '').toLowerCase();
      return (apellidoP.includes('degli') || 
             apellidoP.includes('merav') ||
             apellidoP.includes('antoni') ||
             apellidoP.includes('viglia')) && 
             apellidoP !== 'degliantoni' && 
             apellidoP !== 'meraviglia';
    });

    if (apellidosSimilares.length > 0) {
      console.log(`📌 Pacientes con apellidos similares (${apellidosSimilares.length}):\n`);
      apellidosSimilares.forEach((p, index) => {
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre} (ID: ${p.id})`);
      });
    }

    // Mostrar todos los pacientes con nombre "juan"
    console.log('\n📋 Pacientes con nombre "Juan" o "Jose" o "Pedro":\n');
    
    const nombresJuan = pacientes.filter(p => {
      const nombreP = (p.nombre || '').toLowerCase();
      return nombreP.includes('juan') || 
             nombreP.includes('jose') ||
             nombreP.includes('pedro');
    });

    if (nombresJuan.length > 0) {
      console.log(`📌 Total: ${nombresJuan.length} paciente(s)\n`);
      nombresJuan.slice(0, 20).forEach((p, index) => {
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre} (ID: ${p.id})`);
      });
      if (nombresJuan.length > 20) {
        console.log(`\n... y ${nombresJuan.length - 20} más`);
      }
    }

    // Buscar en turnos por si hay referencias
    console.log('\n🔍 Buscando en turnos por referencias a estos pacientes...\n');
    try {
      const { data: turnos, error: turnosError } = await supabase
        .from('turnos')
        .select('*, pacientes(*)')
        .or('pacientes.apellido.ilike.degliantoni,pacientes.apellido.ilike.meraviglia');

      if (!turnosError && turnos && turnos.length > 0) {
        console.log(`📌 Se encontraron ${turnos.length} turno(s) relacionados:\n`);
        turnos.slice(0, 10).forEach((t: any, index: number) => {
          if (t.pacientes) {
            console.log(`${index + 1}. ${t.pacientes.apellido}, ${t.pacientes.nombre} - Turno: ${t.fecha} ${t.hora}`);
          }
        });
      }
    } catch (err) {
      // Ignorar errores en búsqueda de turnos
    }

    // Buscar TODOS los pacientes con apellido DEGLIANTONI o MERAVIGLIA (sin filtros)
    console.log('\n🔍 BÚSQUEDA EXHAUSTIVA - Todos los pacientes con apellidos DEGLIANTONI o MERAVIGLIA:\n');
    const todosDegliantoniMeraviglia = pacientes.filter(p => {
      const apellidoP = (p.apellido || '').toLowerCase().trim();
      return apellidoP === 'degliantoni' || 
             apellidoP === 'meraviglia' ||
             apellidoP.includes('degliantoni') ||
             apellidoP.includes('meraviglia');
    });

    if (todosDegliantoniMeraviglia.length > 0) {
      console.log(`📌 Total: ${todosDegliantoniMeraviglia.length} paciente(s)\n`);
      todosDegliantoniMeraviglia.forEach((p, index) => {
        const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
        const tieneJuanJose = nombreCompleto.includes('juan') && nombreCompleto.includes('jose');
        const tieneJuanPedro = nombreCompleto.includes('juan') && nombreCompleto.includes('pedro');
        
        let marcador = '';
        if (tieneJuanJose && p.apellido?.toLowerCase().includes('degliantoni')) {
          marcador = ' ⭐ POSIBLE COINCIDENCIA';
        }
        if (tieneJuanPedro && p.apellido?.toLowerCase().includes('meraviglia')) {
          marcador = ' ⭐ POSIBLE COINCIDENCIA';
        }

        console.log(`${index + 1}. ${p.apellido}, ${p.nombre}${marcador}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Nombre completo: "${p.nombre} ${p.apellido}"`);
        console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
        console.log(`   Email: ${p.email || 'N/A'}`);
        console.log(`   DNI: ${p.dni || 'N/A'}`);
        console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        console.log('');
      });
    }

    // Mostrar todos los pacientes (primeros 50)
    console.log('\n📋 Lista completa de pacientes (primeros 50):\n');
    pacientes.slice(0, 50).forEach((p, index) => {
      console.log(`${index + 1}. ${p.apellido}, ${p.nombre} (ID: ${p.id})`);
    });
    if (pacientes.length > 50) {
      console.log(`\n... y ${pacientes.length - 50} más`);
    }

  } catch (error: any) {
    console.error('❌ Error al buscar pacientes:', error.message);
    process.exit(1);
  }
}

buscarPacientes().then(() => {
  console.log('\n✨ Búsqueda completada.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
