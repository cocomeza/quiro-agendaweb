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

async function buscarPacienteEspecifico() {
  console.log('🔍 Búsqueda exhaustiva de DEGLIANTONI JUAN JOSE y MERAVIGLIA JUAN PEDRO\n');

  try {
    // Obtener TODOS los pacientes sin filtros
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

    console.log(`📊 Total de pacientes: ${pacientes.length}\n`);

    // Buscar DEGLIANTONI con cualquier variación de "juan jose"
    console.log('🔎 Buscando DEGLIANTONI con nombre que contenga "juan" y "jose"...\n');
    const degliantoniConJuanJose = pacientes.filter(p => {
      const apellido = (p.apellido || '').toLowerCase();
      const nombre = (p.nombre || '').toLowerCase();
      const nombreCompleto = `${nombre} ${apellido}`.toLowerCase();
      
      return (apellido.includes('degliantoni') || apellido.includes('degli')) &&
             (nombre.includes('juan') || nombre.includes('jose')) &&
             (nombreCompleto.includes('juan') && nombreCompleto.includes('jose'));
    });

    if (degliantoniConJuanJose.length > 0) {
      console.log(`✅ Encontrados ${degliantoniConJuanJose.length} paciente(s):\n`);
      degliantoniConJuanJose.forEach((p, index) => {
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Nombre completo: "${p.nombre} ${p.apellido}"`);
        console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
        console.log(`   Email: ${p.email || 'N/A'}`);
        console.log(`   DNI: ${p.dni || 'N/A'}`);
        console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        console.log(`   Fecha de nacimiento: ${p.fecha_nacimiento || 'N/A'}`);
        console.log(`   Creado: ${p.created_at || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontró DEGLIANTONI con nombre "Juan Jose"\n');
    }

    // Buscar MERAVIGLIA con cualquier variación de "juan pedro"
    console.log('🔎 Buscando MERAVIGLIA con nombre que contenga "juan" y "pedro"...\n');
    const meravigliaConJuanPedro = pacientes.filter(p => {
      const apellido = (p.apellido || '').toLowerCase();
      const nombre = (p.nombre || '').toLowerCase();
      const nombreCompleto = `${nombre} ${apellido}`.toLowerCase();
      
      return (apellido.includes('meraviglia') || apellido.includes('merav')) &&
             (nombre.includes('juan') || nombre.includes('pedro')) &&
             (nombreCompleto.includes('juan') && nombreCompleto.includes('pedro'));
    });

    if (meravigliaConJuanPedro.length > 0) {
      console.log(`✅ Encontrados ${meravigliaConJuanPedro.length} paciente(s):\n`);
      meravigliaConJuanPedro.forEach((p, index) => {
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Nombre completo: "${p.nombre} ${p.apellido}"`);
        console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
        console.log(`   Email: ${p.email || 'N/A'}`);
        console.log(`   DNI: ${p.dni || 'N/A'}`);
        console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        console.log(`   Fecha de nacimiento: ${p.fecha_nacimiento || 'N/A'}`);
        console.log(`   Creado: ${p.created_at || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontró MERAVIGLIA con nombre "Juan Pedro"\n');
    }

    // Mostrar TODOS los DEGLIANTONI sin importar el nombre
    console.log('\n📋 TODOS los pacientes con apellido DEGLIANTONI (sin importar nombre):\n');
    const todosDegliantoni = pacientes.filter(p => {
      const apellido = (p.apellido || '').toLowerCase();
      return apellido.includes('degliantoni') || apellido === 'degliantoni';
    });

    if (todosDegliantoni.length > 0) {
      console.log(`📌 Total: ${todosDegliantoni.length}\n`);
      todosDegliantoni.forEach((p, index) => {
        const nombreLower = (p.nombre || '').toLowerCase();
        const tieneJuan = nombreLower.includes('juan');
        const tieneJose = nombreLower.includes('jose');
        const marcador = (tieneJuan && tieneJose) ? ' ⭐' : '';
        
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre}${marcador}`);
        console.log(`   Nombre completo: "${p.nombre} ${p.apellido}"`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
        console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        console.log('');
      });
    }

    // Mostrar TODOS los MERAVIGLIA sin importar el nombre
    console.log('\n📋 TODOS los pacientes con apellido MERAVIGLIA (sin importar nombre):\n');
    const todosMeraviglia = pacientes.filter(p => {
      const apellido = (p.apellido || '').toLowerCase();
      return apellido.includes('meraviglia') || apellido === 'meraviglia';
    });

    if (todosMeraviglia.length > 0) {
      console.log(`📌 Total: ${todosMeraviglia.length}\n`);
      todosMeraviglia.forEach((p, index) => {
        const nombreLower = (p.nombre || '').toLowerCase();
        const tieneJuan = nombreLower.includes('juan');
        const tienePedro = nombreLower.includes('pedro');
        const marcador = (tieneJuan && tienePedro) ? ' ⭐' : '';
        
        console.log(`${index + 1}. ${p.apellido}, ${p.nombre}${marcador}`);
        console.log(`   Nombre completo: "${p.nombre} ${p.apellido}"`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Teléfono: ${p.telefono || 'N/A'}`);
        console.log(`   Número de ficha: ${p.numero_ficha || 'N/A'}`);
        console.log('');
      });
    }

    // Buscar en turnos por si hay referencias
    console.log('\n🔍 Buscando en turnos por referencias...\n');
    try {
      // Buscar turnos de pacientes DEGLIANTONI
      const { data: turnosDegliantoni } = await supabase
        .from('turnos')
        .select('*, pacientes(*)')
        .ilike('pacientes.apellido', '%degliantoni%');

      if (turnosDegliantoni && turnosDegliantoni.length > 0) {
        console.log(`📌 Turnos de pacientes DEGLIANTONI: ${turnosDegliantoni.length}`);
        const pacientesUnicos = new Set();
        turnosDegliantoni.forEach((t: any) => {
          if (t.pacientes && !pacientesUnicos.has(t.pacientes.id)) {
            pacientesUnicos.add(t.pacientes.id);
            console.log(`   - ${t.pacientes.apellido}, ${t.pacientes.nombre} (${t.pacientes.id})`);
          }
        });
      }

      // Buscar turnos de pacientes MERAVIGLIA
      const { data: turnosMeraviglia } = await supabase
        .from('turnos')
        .select('*, pacientes(*)')
        .ilike('pacientes.apellido', '%meraviglia%');

      if (turnosMeraviglia && turnosMeraviglia.length > 0) {
        console.log(`\n📌 Turnos de pacientes MERAVIGLIA: ${turnosMeraviglia.length}`);
        const pacientesUnicos = new Set();
        turnosMeraviglia.forEach((t: any) => {
          if (t.pacientes && !pacientesUnicos.has(t.pacientes.id)) {
            pacientesUnicos.add(t.pacientes.id);
            console.log(`   - ${t.pacientes.apellido}, ${t.pacientes.nombre} (${t.pacientes.id})`);
          }
        });
      }
    } catch (err) {
      console.log('⚠️  No se pudieron buscar turnos');
    }

  } catch (error: any) {
    console.error('❌ Error al buscar pacientes:', error.message);
    process.exit(1);
  }
}

buscarPacienteEspecifico().then(() => {
  console.log('\n✨ Búsqueda completada.');
  console.log('\n💡 Si no encontraste al paciente, puede que:');
  console.log('   1. Fue eliminado de la base de datos');
  console.log('   2. Está con un nombre diferente (ej: "Juan José" con acento)');
  console.log('   3. No se migró correctamente desde Frontmy');
  console.log('   4. Está en otra base de datos o proyecto');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
