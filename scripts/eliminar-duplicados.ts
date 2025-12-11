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

async function eliminarDuplicados() {
  console.log('🔍 Buscando pacientes duplicados...\n');

  try {
    // Obtener todos los pacientes
    const { data: pacientes, error } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido, telefono, email, numero_ficha, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!pacientes || pacientes.length === 0) {
      console.log('⚠️  No se encontraron pacientes\n');
      process.exit(0);
    }

    console.log(`📊 Total de pacientes: ${pacientes.length}\n`);

    // Identificar duplicados basándose en nombre + apellido + teléfono
    const duplicados: Record<string, any[]> = {};
    
    pacientes.forEach(paciente => {
      const nombreKey = `${paciente.nombre.toLowerCase().trim()}_${paciente.apellido.toLowerCase().trim()}`;
      const phoneKey = paciente.telefono ? paciente.telefono.replace(/\D/g, '') : 'sin-telefono';
      const key = `${nombreKey}_${phoneKey}`;
      
      if (!duplicados[key]) {
        duplicados[key] = [];
      }
      duplicados[key].push(paciente);
    });

    // Filtrar solo los que tienen duplicados (más de 1)
    const gruposDuplicados = Object.values(duplicados).filter(grupo => grupo.length > 1);

    if (gruposDuplicados.length === 0) {
      console.log('✅ No se encontraron pacientes duplicados\n');
      process.exit(0);
    }

    console.log(`⚠️  Se encontraron ${gruposDuplicados.length} grupos de duplicados\n`);

    let totalEliminados = 0;
    const idsAEliminar: string[] = [];

    // Para cada grupo de duplicados, mantener el más antiguo y eliminar los demás
    for (const grupo of gruposDuplicados) {
      // Ordenar por created_at (el más antiguo primero)
      grupo.sort((a, b) => {
        const fechaA = new Date(a.created_at).getTime();
        const fechaB = new Date(b.created_at).getTime();
        return fechaA - fechaB;
      });

      const mantener = grupo[0];
      const eliminar = grupo.slice(1);

      console.log(`\n📋 Duplicados encontrados para: ${mantener.nombre} ${mantener.apellido}`);
      console.log(`   ✅ Mantener: ${mantener.id} (creado: ${mantener.created_at})`);
      
      // Si el paciente a mantener no tiene numero_ficha, intentar copiarlo de los duplicados
      if (!mantener.numero_ficha) {
        const duplicadoConFicha = eliminar.find(d => d.numero_ficha);
        if (duplicadoConFicha) {
          console.log(`   📝 Copiando número de ficha "${duplicadoConFicha.numero_ficha}" al paciente a mantener`);
          const { error: updateError } = await supabase
            .from('pacientes')
            .update({ numero_ficha: duplicadoConFicha.numero_ficha })
            .eq('id', mantener.id);
          
          if (updateError) {
            console.log(`   ⚠️  Error al copiar número de ficha: ${updateError.message}`);
          } else {
            mantener.numero_ficha = duplicadoConFicha.numero_ficha;
          }
        }
      }

      eliminar.forEach(dup => {
        console.log(`   ❌ Eliminar: ${dup.id} (creado: ${dup.created_at})`);
        idsAEliminar.push(dup.id);
      });

      totalEliminados += eliminar.length;
    }

    if (idsAEliminar.length === 0) {
      console.log('\n✅ No hay pacientes para eliminar\n');
      process.exit(0);
    }

    console.log(`\n⚠️  Se eliminarán ${idsAEliminar.length} pacientes duplicados`);
    console.log('⚠️  Esta acción no se puede deshacer. ¿Deseas continuar? (S/N)');
    
    // En modo no interactivo, usar una variable de entorno o proceder con cuidado
    const confirmar = process.env.CONFIRMAR_ELIMINAR === 'true';
    
    if (!confirmar) {
      console.log('\n💡 Para confirmar la eliminación, ejecuta:');
      console.log('   CONFIRMAR_ELIMINAR=true npx tsx scripts/eliminar-duplicados.ts\n');
      process.exit(0);
    }

    // Eliminar en lotes
    const batchSize = 50;
    let eliminados = 0;

    for (let i = 0; i < idsAEliminar.length; i += batchSize) {
      const batch = idsAEliminar.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from('pacientes')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`❌ Error al eliminar lote: ${deleteError.message}`);
      } else {
        eliminados += batch.length;
        console.log(`✅ Eliminados ${eliminados}/${idsAEliminar.length} pacientes`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Pacientes eliminados: ${eliminados}`);
    console.log(`📊 Pacientes restantes: ${pacientes.length - eliminados}`);
    console.log('='.repeat(60) + '\n');

  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

eliminarDuplicados()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });

