import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

async function analyzeCSV() {
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
      console.log(`📁 Analizando archivo: ${path.basename(csvPath)}\n`);
    } else {
      console.log('📁 Se encontraron múltiples archivos CSV:');
      csvFiles.forEach((f, i) => console.log(`   ${i + 1}. ${path.basename(f)}`));
      console.log(`\n💡 Analizando el primero: ${path.basename(csvFiles[0])}\n`);
      csvPath = csvFiles[0];
    }
  } else {
    console.log(`📁 Analizando archivo: ${path.basename(csvPath)}\n`);
  }

  console.log('📊 Analizando CSV...\n');
  
  // Intentar diferentes codificaciones
  let fileContent: string;
  try {
    // Primero intentar con latin1 (Windows-1252)
    fileContent = fs.readFileSync(csvPath, 'latin1');
  } catch (err) {
    try {
      // Si falla, intentar con utf8
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
  if (!firstLine.includes(';') && !firstLine.includes(',')) {
    csvContent = lines.slice(1).join('\n');
    console.log(`📋 Saltando primera línea (título): "${firstLine}"\n`);
  }
  
  const delimiter = secondLine.includes(';') ? ';' : ',';
  console.log(`📋 Delimitador detectado: ${delimiter === ';' ? 'punto y coma (;)' : 'coma (,)'}\n`);

  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    delimiter: delimiter,
    newline: '\n',
  });

  if (result.errors.length > 0) {
    console.warn('⚠️  Advertencias al parsear CSV:');
    result.errors.forEach(err => {
      console.warn(`   Línea ${err.row}: ${err.message}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📋 ANÁLISIS DEL CSV');
  console.log('='.repeat(60));
  console.log(`\n📊 Total de registros: ${result.data.length}`);
  
  if (result.data.length === 0) {
    console.error('\n❌ No se encontraron registros en el CSV');
    process.exit(1);
  }

  const firstRow = result.data[0] as Record<string, unknown>;
  console.log(`\n📋 Columnas encontradas (${Object.keys(firstRow).length}):`);
  const columns = Object.keys(firstRow);
  columns.forEach((col, index) => {
    console.log(`   ${index + 1}. "${col}"`);
  });

  console.log('\n🔍 Primeros 3 registros:');
  console.log(JSON.stringify(result.data.slice(0, 3), null, 2));

  console.log('\n📊 Análisis de datos por columna:');
  columns.forEach(col => {
    const values = result.data
      .map(row => (row as Record<string, unknown>)[col])
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

  console.log('\n' + '='.repeat(60));
  console.log('✅ Análisis completado');
  console.log('='.repeat(60));
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisa las columnas encontradas');
  console.log('   2. Ajusta el mapeo en scripts/migrate-frontmy-data.ts');
  console.log('   3. Ejecuta: npx tsx scripts/migrate-frontmy-data.ts\n');
}

analyzeCSV().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});

