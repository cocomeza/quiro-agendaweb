'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { TurnoConPaciente, TurnoConPago } from '@/lib/supabase/types';
import { useState, useEffect } from 'react';

interface VistaImpresionTurnosProps {
  turnos: TurnoConPaciente[];
  fecha: Date;
}

export default function VistaImpresionTurnos({ turnos, fecha }: VistaImpresionTurnosProps) {
  const [fechaImpresion, setFechaImpresion] = useState<string>('');

  // Calcular fecha de impresión solo en el cliente
  useEffect(() => {
    setFechaImpresion(format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es }));
  }, []);

  // Filtrar solo turnos programados y completados (no cancelados)
  // y verificar que tengan al menos nombre y apellido del paciente
  const turnosParaImprimir = turnos.filter(t => {
    // Verificar que el turno tenga paciente y datos completos
    if (!t.pacientes) return false;
    if (!t.pacientes.nombre || !t.pacientes.apellido) return false;
    // Incluir todos los estados excepto cancelados (o incluir todos si se desea)
    return true; // Mostrar todos los turnos que tengan datos completos
  });
  
  // Ordenar por hora
  const turnosOrdenados = [...turnosParaImprimir].sort((a, b) => {
    return a.hora.localeCompare(b.hora);
  });

  return (
    <div className="print-agenda hidden print:block">
      <div className="p-8">
        {/* Encabezado */}
        <div className="mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lista de Pacientes con Turno
          </h1>
          <p className="text-xl text-gray-700">
            {format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>

        {/* Tabla de turnos */}
        {turnosOrdenados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay turnos pendientes para este día
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-400">
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Nro. Ficha</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Apellido</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Nombre</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Teléfono</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Hora</th>
              </tr>
            </thead>
            <tbody>
              {turnosOrdenados.map((turno, index) => {
                // Verificar que el turno tenga datos completos del paciente
                if (!turno.pacientes || !turno.pacientes.nombre || !turno.pacientes.apellido) {
                  return null;
                }

                return (
                  <tr 
                    key={turno.id} 
                    className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="py-3 px-4 text-gray-900 text-base font-medium">
                      {turno.pacientes.numero_ficha || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900 text-base font-medium">
                      {turno.pacientes.apellido || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900 text-base font-medium">
                      {turno.pacientes.nombre || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900 text-base font-medium">
                      {turno.pacientes.telefono || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900 text-base font-medium">
                      {turno.hora}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pie de página */}
        {fechaImpresion && (
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Impreso el {fechaImpresion}</p>
          </div>
        )}
      </div>
    </div>
  );
}

