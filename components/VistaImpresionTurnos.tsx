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
  const turnosParaImprimir = turnos.filter(t => t.estado !== 'cancelado');
  
  // Ordenar por hora
  const turnosOrdenados = [...turnosParaImprimir].sort((a, b) => {
    return a.hora.localeCompare(b.hora);
  });

  return (
    <div className="print-agenda hidden print:block">
      <div className="p-8">
        {/* Encabezado */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Agenda del Día
          </h1>
          <p className="text-xl text-gray-700">
            {format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Total de turnos: {turnosOrdenados.length}
          </p>
        </div>

        {/* Tabla de turnos */}
        {turnosOrdenados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay turnos programados para este día
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-400">
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Hora</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">N° Ficha</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Paciente</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Teléfono</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Estado</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Pago</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900 text-base">Notas</th>
              </tr>
            </thead>
            <tbody>
              {turnosOrdenados.map((turno, index) => {
                // Calcular edad si tiene fecha de nacimiento
                let edad = null;
                if (turno.pacientes.fecha_nacimiento) {
                  const hoy = new Date();
                  const nacimiento = new Date(turno.pacientes.fecha_nacimiento);
                  edad = hoy.getFullYear() - nacimiento.getFullYear();
                  const mes = hoy.getMonth() - nacimiento.getMonth();
                  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                    edad--;
                  }
                }

                return (
                  <tr 
                    key={turno.id} 
                    className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 text-base">
                      {turno.hora}
                    </td>
                    <td className="py-3 px-4 text-gray-900 text-base font-medium">
                      {turno.pacientes.numero_ficha || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900 text-base">
                      <div className="font-medium">
                        {turno.pacientes.apellido}, {turno.pacientes.nombre}
                      </div>
                      {edad !== null && (
                        <div className="text-sm text-gray-600">Edad: {edad} años</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-base">
                      {turno.pacientes.telefono || '-'}
                    </td>
                    <td className="py-3 px-4 text-base">
                      <span className={`font-medium ${
                        turno.estado === 'completado' ? 'text-green-700' :
                        turno.estado === 'programado' ? 'text-blue-700' :
                        'text-gray-700'
                      }`}>
                        {turno.estado === 'completado' ? 'Completado' :
                         turno.estado === 'programado' ? 'Programado' :
                         turno.estado === 'cancelado' ? 'Cancelado' :
                         turno.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-base">
                      <span className={`font-medium ${
                        turno.pago === 'pagado' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {turno.pago === 'pagado' ? 'Pagado' : 'Impago'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-sm">
                      {turno.notas || '-'}
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

