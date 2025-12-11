'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { TurnoConPaciente } from '@/lib/supabase/types';
import { Printer } from 'lucide-react';

interface ListaPacientesDiaProps {
  turnos: TurnoConPaciente[];
  fecha: Date;
}

export default function ListaPacientesDia({ turnos, fecha }: ListaPacientesDiaProps) {
  // Filtrar solo turnos programados y completados (no cancelados)
  const turnosActivos = turnos.filter(t => t.estado !== 'cancelado');
  
  // Ordenar por hora
  const turnosOrdenados = [...turnosActivos].sort((a, b) => {
    return a.hora.localeCompare(b.hora);
  });

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Encabezado único - se adapta a pantalla e impresión */}
      <div className="px-4 sm:px-6 print:p-8 py-4 print:py-6 border-b print:border-b-2 print:border-gray-300">
        <div className="flex items-center justify-between print:flex-col print:text-center print:items-center">
          <div className="print:w-full">
            <h3 className="text-lg sm:text-xl print:text-3xl font-bold text-gray-900 print:mb-2">
              Lista de Pacientes con Turno
            </h3>
            <p className="text-sm print:text-xl print:font-semibold text-gray-600 print:text-gray-700 mt-1 print:mt-0">
              {format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            <p className="hidden print:block text-sm text-gray-600 mt-2">
              Total de pacientes: {turnosOrdenados.length}
            </p>
          </div>
          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold shadow-md no-print"
            title="Imprimir lista de pacientes"
            aria-label="Imprimir lista de pacientes del día"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Lista</span>
            <span className="sm:hidden">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 sm:p-6 print:p-8">
        {turnosOrdenados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-base font-medium">No hay pacientes con turno programado para este día</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-left text-xs sm:text-sm print:text-base font-bold text-gray-900">
                    Nro. Ficha
                  </th>
                  <th className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-left text-xs sm:text-sm print:text-base font-bold text-gray-900">
                    Apellido
                  </th>
                  <th className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-left text-xs sm:text-sm print:text-base font-bold text-gray-900">
                    Nombre
                  </th>
                  <th className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-left text-xs sm:text-sm print:text-base font-bold text-gray-900">
                    Teléfono
                  </th>
                  <th className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-left text-xs sm:text-sm print:text-base font-bold text-gray-900">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody>
                {turnosOrdenados.map((turno, index) => (
                  <tr 
                    key={turno.id} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 print:hover:bg-inherit transition`}
                  >
                    <td className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-xs sm:text-sm print:text-base text-gray-900 font-medium">
                      {turno.pacientes.numero_ficha || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-xs sm:text-sm print:text-base text-gray-900 font-semibold">
                      {turno.pacientes.apellido}
                    </td>
                    <td className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-xs sm:text-sm print:text-base text-gray-900 font-semibold">
                      {turno.pacientes.nombre}
                    </td>
                    <td className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-xs sm:text-sm print:text-base text-gray-900">
                      {turno.pacientes.telefono || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 sm:px-4 print:px-4 py-2 sm:py-3 print:py-3 text-xs sm:text-sm print:text-base text-gray-900 font-medium">
                      {turno.hora.slice(0, 5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Resumen - oculto al imprimir */}
        {turnosOrdenados.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 no-print">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Total:</span> {turnosOrdenados.length} {turnosOrdenados.length === 1 ? 'paciente' : 'pacientes'} con turno
            </p>
          </div>
        )}

        {/* Pie de página - solo visible al imprimir */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-sm text-gray-600 text-center">
          <p>Impreso el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
        </div>
      </div>
    </div>
  );
}

