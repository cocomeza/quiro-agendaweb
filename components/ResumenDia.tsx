'use client';

import type { TurnoConPaciente, TurnoConPago } from '@/lib/supabase/types';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ResumenDiaProps {
  turnos: TurnoConPaciente[];
  fecha: Date;
}


export default function ResumenDia({ turnos, fecha }: ResumenDiaProps) {
  const totalTurnos = turnos.length;
  const completados = turnos.filter(t => t.estado === 'completado').length;
  const pendientes = turnos.filter(t => t.estado === 'programado').length;
  const cancelados = turnos.filter(t => t.estado === 'cancelado').length;
  const pagados = turnos.filter(t => t.pago === 'pagado').length;
  const impagos = turnos.filter(t => t.pago !== 'pagado').length;

  const tarjetas = [
    {
      titulo: 'Total Turnos',
      valor: totalTurnos,
      icono: Calendar,
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      iconColor: 'text-blue-600',
    },
    {
      titulo: 'Atendidos',
      valor: completados,
      icono: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-300',
      iconColor: 'text-green-600',
    },
    {
      titulo: 'Pendientes',
      valor: pendientes,
      icono: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      iconColor: 'text-yellow-600',
    },
    {
      titulo: 'Anulados',
      valor: cancelados,
      icono: XCircle,
      color: 'bg-red-100 text-red-800 border-red-300',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
        Resumen del Día
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {tarjetas.map((tarjeta, index) => {
          const Icon = tarjeta.icono;
          return (
            <div
              key={index}
              className={`${tarjeta.color} border-2 rounded-lg p-3 sm:p-4 flex flex-col items-center text-center`}
            >
              <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${tarjeta.iconColor} mb-2`} />
              <div className="text-3xl sm:text-4xl font-bold">{tarjeta.valor}</div>
              <div className="text-sm sm:text-base font-semibold mt-1">{tarjeta.titulo}</div>
            </div>
          );
        })}
      </div>
      {totalTurnos > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-700">{pagados}</div>
            <div className="text-sm sm:text-base font-semibold text-gray-700">Pagados</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-700">{impagos}</div>
            <div className="text-sm sm:text-base font-semibold text-gray-700">Impagos</div>
          </div>
        </div>
      )}
    </div>
  );
}

