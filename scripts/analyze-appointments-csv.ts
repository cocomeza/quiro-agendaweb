import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

async function analyzeAppointmentsCSV() {
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
      console.log('   Ejemplo: 20251204_20251204_ReporteAgendaProfesional.csv');
      process.exit(1);
    } else if (csvFiles.length === 1) {
      csvPath = csvFiles[0];
      console.log(`📁 Analizando archivo: ${path.basename(csvPath)}\n`);
    } else {
      console.log('📁 Se encontraron múltiples archivos CSV de turnos:');
      csvFiles.forEach((f, i) => console.log(`   ${i + 1}. ${path.basename(f)}`));
      console.log(`\n💡 Analizando el primero: ${path.basename(csvFiles[0])}\n`);
      csvPath = csvFiles[0];
    }
  } else {
    console.log(`📁 Analizando archivo: ${path.basename(csvPath)}\n`);
  }

  console.log('📊 Analizando CSV de Turnos...\n');
  
  // Intentar diferentes codificaciones
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

  const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    console.warn('⚠️  Advertencias al parsear CSV:');
    result.errors.forEach(err => {
      console.warn(`   Línea ${err.row}: ${err.message}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📋 ANÁLISIS DEL CSV DE TURNOS');
  console.log('='.repeat(60));
  console.log(`\n📊 Total de registros: ${result.data.length}`);
  
  if (result.data.length === 0) {
    console.error('\n❌ No se encontraron registros en el CSV');
    process.exit(1);
  }

  console.log(`\n📋 Columnas encontradas (${Object.keys(result.data[0]).length}):`);
  const columns = Object.keys(result.data[0]);
  columns.forEach((col, index) => {
    console.log(`   ${index + 1}. "${col}"`);
  });

  console.log('\n🔍 Primeros 3 registros:');
  console.log(JSON.stringify(result.data.slice(0, 3), null, 2));

  console.log('\n📊 Análisis de datos por columna:');
  columns.forEach(col => {
    const values = result.data
      .map(row => (row as any)[col])
      .filter(val => val !== null && val !== undefined && val !== '');
    
    const uniqueValues = new Set(values);
    const sampleValues = Array.from(uniqueValues).slice(0, 5);
    
    console.log(`\n   "${col}":`);
    console.log(`      - Valores no vacíos: ${values.length}/${result.data.length}`);
    console.log(`      - Valores únicos: ${uniqueValues.size}`);
    if (sampleValues.length > 0) {
      console.log(`      - Ejemplos: ${sampleValues.join(', ')}`);
    }
  });

  // Análisis específico de fechas y estados
  const fechaColumns = columns.filter(col => 
    col.toLowerCase().includes('fecha') || 
    col.toLowerCase().includes('date') ||
    col.toLowerCase().includes('dia')
  );
  
  const horaColumns = columns.filter(col => 
    col.toLowerCase().includes('hora') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('horario')
  );
  
  const estadoColumns = columns.filter(col => 
    col.toLowerCase().includes('estado') || 
    col.toLowerCase().includes('status') ||
    col.toLowerCase().includes('estado')
  );
  
  const pacienteColumns = columns.filter(col => 
    col.toLowerCase().includes('paciente') || 
    col.toLowerCase().includes('patient') ||
    col.toLowerCase().includes('nombre') ||
    col.toLowerCase().includes('apellido')
  );

  console.log('\n🎯 Columnas relevantes detectadas:');
  if (fechaColumns.length > 0) {
    console.log(`   📅 Fecha: ${fechaColumns.join(', ')}`);
  }
  if (horaColumns.length > 0) {
    console.log(`   🕐 Hora: ${horaColumns.join(', ')}`);
  }
  if (estadoColumns.length > 0) {
    console.log(`   ✅ Estado: ${estadoColumns.join(', ')}`);
  }
  if (pacienteColumns.length > 0) {
    console.log(`   👤 Paciente: ${pacienteColumns.join(', ')}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Análisis completado');
  console.log('='.repeat(60));
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisa las columnas encontradas');
  console.log('   2. Ajusta el mapeo en scripts/migrate-appointments.ts');
  console.log('   3. Ejecuta: npm run migrate:appointments\n');
}

analyzeAppointmentsCSV().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});

