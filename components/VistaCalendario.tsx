'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { TurnoConPaciente, Paciente } from '@/lib/supabase/types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface VistaCalendarioProps {
  turnos: TurnoConPaciente[];
  fechaSeleccionada: Date;
  onSeleccionarFecha: (fecha: Date) => void;
  onAbrirModalTurno: (turno?: TurnoConPaciente) => void;
  loading: boolean;
}

export default function VistaCalendario({
  turnos,
  fechaSeleccionada,
  onSeleccionarFecha,
  onAbrirModalTurno,
  loading,
}: VistaCalendarioProps) {
  const [mesActual, setMesActual] = useState(startOfMonth(fechaSeleccionada));

  const mesAnterior = () => {
    setMesActual(subMonths(mesActual, 1));
  };

  const mesSiguiente = () => {
    setMesActual(addMonths(mesActual, 1));
  };

  const irAHoy = () => {
    const hoy = new Date();
    setMesActual(startOfMonth(hoy));
    onSeleccionarFecha(hoy);
  };

  // Obtener todos los días del mes
  const diasDelMes = eachDayOfInterval({
    start: startOfMonth(mesActual),
    end: endOfMonth(mesActual),
  });

  // Obtener días del mes anterior para completar la primera semana
  const primerDia = getDay(startOfMonth(mesActual));
  const diasAnteriores = [];
  for (let i = primerDia - 1; i >= 0; i--) {
    const fecha = new Date(mesActual);
    fecha.setDate(fecha.getDate() - i - 1);
    diasAnteriores.push(fecha);
  }

  // Obtener días del mes siguiente para completar la última semana
  const ultimoDia = getDay(endOfMonth(mesActual));
  const diasSiguientes = [];
  const diasFaltantes = 6 - ultimoDia;
  for (let i = 1; i <= diasFaltantes; i++) {
    const fecha = new Date(endOfMonth(mesActual));
    fecha.setDate(fecha.getDate() + i);
    diasSiguientes.push(fecha);
  }

  // Contar turnos por día
  const contarTurnosPorDia = (fecha: Date) => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    return turnos.filter(t => t.fecha === fechaStr).length;
  };

  // Obtener turnos de un día específico
  const obtenerTurnosDelDia = (fecha: Date) => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    return turnos.filter(t => t.fecha === fechaStr);
  };

  // Nombres de los días de la semana
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header del calendario */}
      <div className="border-b px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={mesAnterior}
              className="p-2 hover:bg-gray-100 rounded-md transition flex-shrink-0"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {format(mesActual, 'MMMM yyyy', { locale: es })}
              </h2>
            </div>
            <button
              onClick={mesSiguiente}
              className="p-2 hover:bg-gray-100 rounded-md transition flex-shrink-0"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={irAHoy}
            className="ml-2 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold text-gray-800 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition flex-shrink-0 shadow-sm"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-700 text-base font-medium">Cargando calendario...</p>
          </div>
        ) : (
          <>
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {diasSemana.map((dia) => (
                <div
                  key={dia}
                  className="text-center text-sm sm:text-base font-bold text-gray-900 py-2"
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Días del mes anterior (grises) */}
            {diasAnteriores.length > 0 && (
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1">
                {diasAnteriores.map((dia, index) => (
                  <div
                    key={`prev-${index}`}
                    className="aspect-square p-1 sm:p-2 text-gray-400 text-xs sm:text-sm"
                  >
                    {format(dia, 'd')}
                  </div>
                ))}
              </div>
            )}

            {/* Días del mes actual */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {diasDelMes.map((dia) => {
                const turnosDelDia = obtenerTurnosDelDia(dia);
                const cantidadTurnos = turnosDelDia.length;
                const esHoy = isToday(dia);
                const esSeleccionado = isSameDay(dia, fechaSeleccionada);
                const esDelMesActual = isSameMonth(dia, mesActual);

                return (
                  <div
                    key={dia.toISOString()}
                    onClick={() => {
                      if (esDelMesActual) {
                        onSeleccionarFecha(dia);
                      }
                    }}
                    className={`aspect-square p-1 sm:p-2 border rounded-md transition cursor-pointer ${
                      esSeleccionado
                        ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-200'
                        : esHoy
                        ? 'bg-blue-50 border-blue-300'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${!esDelMesActual ? 'opacity-50' : ''}`}
                  >
                    <div className="flex flex-col h-full">
                      <div
                        className={`text-sm sm:text-base font-bold ${
                          esSeleccionado
                            ? 'text-white'
                            : esHoy
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {format(dia, 'd')}
                      </div>
                      {cantidadTurnos > 0 && (
                        <div className="flex-1 flex items-end mt-1">
                          <div className="w-full">
                            {turnosDelDia.slice(0, 3).map((turno, idx) => {
                              const colorEstado =
                                turno.estado === 'completado'
                                  ? 'bg-green-500'
                                  : turno.estado === 'cancelado'
                                  ? 'bg-red-500'
                                  : 'bg-blue-500';
                              return (
                                <div
                                  key={turno.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAbrirModalTurno(turno);
                                  }}
                                  className={`${colorEstado} text-white text-[10px] sm:text-xs px-1.5 py-1 mb-0.5 rounded-md truncate cursor-pointer hover:opacity-90 font-semibold shadow-sm`}
                                  title={`${turno.pacientes.nombre} ${turno.pacientes.apellido} - ${turno.hora}`}
                                >
                                  {turno.hora} {turno.pacientes.nombre.split(' ')[0]}
                                </div>
                              );
                            })}
                            {cantidadTurnos > 3 && (
                              <div className="text-xs text-gray-700 font-bold mt-0.5">
                                +{cantidadTurnos - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Días del mes siguiente (grises) */}
            {diasSiguientes.length > 0 && (
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-1">
                {diasSiguientes.map((dia, index) => (
                  <div
                    key={`next-${index}`}
                    className="aspect-square p-1 sm:p-2 text-gray-400 text-xs sm:text-sm"
                  >
                    {format(dia, 'd')}
                  </div>
                ))}
              </div>
            )}

            {/* Leyenda */}
            <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-700">Programado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-700">Completado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-700">Cancelado</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

