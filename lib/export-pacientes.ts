import { Database } from '@/lib/supabase/types';

type Paciente = Database['public']['Tables']['pacientes']['Row'];

/**
 * Exporta la lista de pacientes a un archivo CSV
 */
export function exportarPacientesCSV(pacientes: Paciente[], nombreArchivo: string = 'pacientes') {
  if (pacientes.length === 0) {
    throw new Error('No hay pacientes para exportar');
  }

  // Crear encabezados del CSV
  const headers = [
    'Nombre',
    'Apellido',
    'Teléfono',
    'Email',
    'Fecha de Nacimiento',
    'Edad',
    'Género',
    'Motivo de Consulta',
    'Antecedentes Médicos',
    'Medicamentos Actuales',
    'Alergias',
    'Diagnóstico',
    'Plan de Tratamiento',
    'Observaciones Médicas',
    'Notas',
    'Fecha de Registro',
    'Última Actualización',
  ];

  // Crear filas de datos
  const rows = pacientes.map((paciente) => {
    // Calcular edad si tiene fecha de nacimiento
    let edad = '';
    if (paciente.fecha_nacimiento) {
      const hoy = new Date();
      const nacimiento = new Date(paciente.fecha_nacimiento);
      let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edadCalculada--;
      }
      edad = edadCalculada.toString();
    }

    // Formatear fecha de nacimiento
    const fechaNacimiento = paciente.fecha_nacimiento
      ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR')
      : '';

    // Formatear fechas de registro
    const fechaRegistro = paciente.created_at
      ? new Date(paciente.created_at).toLocaleDateString('es-AR')
      : '';

    const fechaActualizacion = paciente.updated_at
      ? new Date(paciente.updated_at).toLocaleDateString('es-AR')
      : '';

    return [
      paciente.nombre || '',
      paciente.apellido || '',
      paciente.telefono || '',
      paciente.email || '',
      fechaNacimiento,
      edad,
      (paciente as any).genero || '',
      (paciente as any).motivo_consulta || '',
      (paciente as any).antecedentes_medicos || '',
      (paciente as any).medicamentos_actuales || '',
      (paciente as any).alergias || '',
      (paciente as any).diagnostico || '',
      (paciente as any).plan_tratamiento || '',
      (paciente as any).observaciones_medicas || '',
      paciente.notas || '',
      fechaRegistro,
      fechaActualizacion,
    ];
  });

  // Crear contenido CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        // Escapar comillas y envolver en comillas si contiene comas o comillas
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ),
  ].join('\n');

  // Crear BOM para UTF-8 (ayuda con Excel)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Crear URL y descargar
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Agregar fecha al nombre del archivo
  const fecha = new Date().toISOString().split('T')[0];
  link.download = `${nombreArchivo}_${fecha}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpiar URL
  URL.revokeObjectURL(url);
}

/**
 * Exporta la lista de pacientes a JSON
 */
export function exportarPacientesJSON(pacientes: Paciente[], nombreArchivo: string = 'pacientes') {
  if (pacientes.length === 0) {
    throw new Error('No hay pacientes para exportar');
  }

  const datos = {
    fecha_exportacion: new Date().toISOString(),
    total_pacientes: pacientes.length,
    pacientes: pacientes.map(p => ({
      nombre: p.nombre,
      apellido: p.apellido,
      telefono: p.telefono,
      email: p.email,
      fecha_nacimiento: p.fecha_nacimiento,
      motivo_consulta: (p as any).motivo_consulta || null,
      antecedentes_medicos: (p as any).antecedentes_medicos || null,
      medicamentos_actuales: (p as any).medicamentos_actuales || null,
      alergias: (p as any).alergias || null,
      diagnostico: (p as any).diagnostico || null,
      plan_tratamiento: (p as any).plan_tratamiento || null,
      observaciones_medicas: (p as any).observaciones_medicas || null,
      notas: p.notas,
      fecha_registro: p.created_at,
      ultima_actualizacion: p.updated_at,
    })),
  };

  const jsonContent = JSON.stringify(datos, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const fecha = new Date().toISOString().split('T')[0];
  link.download = `${nombreArchivo}_${fecha}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

