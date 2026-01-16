import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { TurnoConPaciente } from '@/lib/supabase/types';

export function generarPDFTurnos(turnos: TurnoConPaciente[], fecha: Date) {
  // Filtrar solo turnos programados y completados (no cancelados)
  // y verificar que tengan al menos nombre y apellido del paciente
  const turnosParaPDF = turnos.filter(t => {
    return (
      t.estado !== 'cancelado' && 
      t.pacientes && 
      t.pacientes.nombre && 
      t.pacientes.apellido
    );
  });
  
  // Ordenar por hora
  const turnosOrdenados = [...turnosParaPDF].sort((a, b) => {
    return a.hora.localeCompare(b.hora);
  });

  // Crear nuevo documento PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configurar fuente
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('QUIROPRAXIA RAMALLO', 105, 20, { align: 'center' });

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Lista de Pacientes con Turno', 105, 30, { align: 'center' });

  // Fecha
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const fechaFormateada = format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  doc.text(fechaFormateada, 105, 38, { align: 'center' });

  // Preparar datos para la tabla
  const datosTabla = turnosOrdenados.map((turno) => {
    // Formatear hora para mostrar solo HH:MM (sin segundos)
    let horaFormateada = '-';
    if (turno.hora) {
      const horaStr = String(turno.hora);
      // Si tiene formato HH:MM:SS, tomar solo HH:MM
      if (horaStr.length >= 5) {
        horaFormateada = horaStr.substring(0, 5);
      } else {
        horaFormateada = horaStr;
      }
    }
    
    return [
      turno.pacientes?.numero_ficha || '-',
      turno.pacientes?.apellido || '-',
      turno.pacientes?.nombre || '-',
      turno.pacientes?.telefono || '-',
      horaFormateada
    ];
  });

  // Crear tabla
  autoTable(doc, {
    startY: 45,
    head: [['Nro. Ficha', 'Apellido', 'Nombre', 'Teléfono', 'Hora']],
    body: datosTabla,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      cellPadding: 3,
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { cellWidth: 30 }, // Nro. Ficha
      1: { cellWidth: 50 }, // Apellido
      2: { cellWidth: 50 }, // Nombre
      3: { cellWidth: 40 }, // Teléfono
      4: { cellWidth: 20 }  // Hora
    },
    margin: { top: 45, left: 10, right: 10 }
  });

  // Pie de página
  const fechaImpresion = format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
  const pageCount = (doc as any).internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Impreso el ${fechaImpresion} - Página ${i} de ${pageCount}`,
      105,
      (doc as any).internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Generar nombre del archivo
  const fechaArchivo = format(fecha, 'yyyy-MM-dd');
  const nombreArchivo = `turnos_${fechaArchivo}.pdf`;

  // Descargar PDF
  doc.save(nombreArchivo);
}
