/**
 * Script para eliminar pacientes creados durante las pruebas de testing
 * 
 * Este script identifica y elimina pacientes que fueron creados para testing
 * basándose en patrones comunes de nombres, emails o datos de prueba.
 */

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
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Patrones para identificar pacientes de prueba (más específicos)
const PATRONES_TEST = {
  // Nombres que claramente indican que son de prueba
  nombres: [
    'testintegracion',
    'testdni',
    'paciente test',
    'paciente de prueba',
  ],
  // Apellidos que claramente indican que son de prueba
  apellidos: [
    'apellido', // Apellido seguido de números (Apellido123456)
  ],
  // Emails de prueba
  emails: [
    '@example.com',
    'test@example.com',
    'juan@example.com', // Este es específico del test
  ],
  // Teléfonos de prueba
  telefonos: [
    '1234567890', // Teléfono específico del test
    '000000000',
  ],
  // DNI de prueba
  dni: [
    '99999999', // DNI de prueba que empieza con 99999999
  ],
};

async function eliminarPacientesTest() {
  console.log('🔍 Buscando pacientes de prueba...\n');

  try {
    // Obtener todos los pacientes
    const { data: pacientes, error: fetchError } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido, email, telefono, dni, created_at');

    if (fetchError) {
      throw fetchError;
    }

    if (!pacientes || pacientes.length === 0) {
      console.log('✅ No se encontraron pacientes en la base de datos.');
      return;
    }

    console.log(`📊 Total de pacientes encontrados: ${pacientes.length}\n`);

    // Identificar pacientes de prueba
    const pacientesTest = pacientes.filter(paciente => {
      const nombre = (paciente.nombre || '').toLowerCase();
      const apellido = (paciente.apellido || '').toLowerCase();
      const email = (paciente.email || '').toLowerCase();
      const telefono = paciente.telefono || '';
      const dni = (paciente.dni || '').toString();

      // Verificar si coincide con algún patrón de prueba
      // Solo considerar como test si tiene patrones muy específicos
      const esNombreTest = PATRONES_TEST.nombres.some(patron => 
        nombre.includes(patron.toLowerCase())
      );
      
      // Apellido debe tener "Apellido" seguido de números (patrón del test)
      const esApellidoTest = /^apellido\d+$/i.test(apellido);
      
      const esEmailTest = PATRONES_TEST.emails.some(patron => 
        email.includes(patron.toLowerCase())
      );
      const esTelefonoTest = PATRONES_TEST.telefonos.includes(telefono);
      const esDniTest = PATRONES_TEST.dni.some(patron => 
        dni.startsWith(patron)
      );

      // Verificar si el nombre contiene "TestIntegracion" o "TestDNI" seguido de números
      const tienePatronTestIntegracion = /testintegracion\d+/i.test(nombre) || /testdni\d+/i.test(nombre);

      // Solo eliminar si tiene al menos un patrón muy específico de prueba
      return tienePatronTestIntegracion || esApellidoTest || esEmailTest || esTelefonoTest || esDniTest;
    });

    if (pacientesTest.length === 0) {
      console.log('✅ No se encontraron pacientes de prueba para eliminar.');
      return;
    }

    console.log(`⚠️  Se encontraron ${pacientesTest.length} paciente(s) de prueba:\n`);
    pacientesTest.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.nombre} ${p.apellido} (${p.email || 'sin email'}) - ID: ${p.id}`);
    });

    console.log('\n🗑️  Eliminando pacientes de prueba...\n');

    // Primero eliminar turnos asociados
    const idsPacientes = pacientesTest.map(p => p.id);
    
    const { error: turnosError } = await supabase
      .from('turnos')
      .delete()
      .in('paciente_id', idsPacientes);

    if (turnosError) {
      console.warn(`⚠️  Advertencia al eliminar turnos: ${turnosError.message}`);
    } else {
      console.log('✅ Turnos asociados eliminados.');
    }

    // Luego eliminar los pacientes
    const { error: deleteError } = await supabase
      .from('pacientes')
      .delete()
      .in('id', idsPacientes);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`\n✅ Se eliminaron ${pacientesTest.length} paciente(s) de prueba exitosamente.`);
    console.log(`📊 Pacientes restantes: ${pacientes.length - pacientesTest.length}`);

  } catch (error: any) {
    console.error('❌ Error al eliminar pacientes de prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
eliminarPacientesTest()
  .then(() => {
    console.log('\n✨ Proceso completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
