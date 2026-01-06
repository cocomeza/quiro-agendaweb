'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, getDay, isValid } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { TurnoConPaciente, Paciente } from '@/lib/supabase/types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { validarFecha, obtenerAño } from '@/lib/utils-fechas';

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
  // Validar que la fecha seleccionada sea válida
  const fechaValida = isValid(fechaSeleccionada) && validarFecha(fechaSeleccionada) 
    ? fechaSeleccionada 
    : new Date();
  
  const [mesActual, setMesActual] = useState(startOfMonth(fechaValida));

  // Sincronizar mesActual cuando cambia fechaSeleccionada
  useEffect(() => {
    if (isValid(fechaSeleccionada) && validarFecha(fechaSeleccionada)) {
      const nuevoMes = startOfMonth(fechaSeleccionada);
      if (nuevoMes.getTime() !== mesActual.getTime()) {
        setMesActual(nuevoMes);
      }
    }
  }, [fechaSeleccionada]);

  const mesAnterior = () => {
    const nuevoMes = subMonths(mesActual, 1);
    if (validarFecha(nuevoMes)) {
      setMesActual(nuevoMes);
    }
  };

  const mesSiguiente = () => {
    const nuevoMes = addMonths(mesActual, 1);
    if (validarFecha(nuevoMes)) {
      setMesActual(nuevoMes);
    }
  };

  const irAHoy = () => {
    const hoy = new Date();
    if (validarFecha(hoy)) {
      const inicioMesHoy = startOfMonth(hoy);
      setMesActual(inicioMesHoy);
      onSeleccionarFecha(hoy);
    }
  };

  // Validar que mesActual sea válido antes de continuar
  if (!isValid(mesActual) || !validarFecha(mesActual)) {
    console.error('Mes actual inválido, usando fecha actual');
    const hoy = new Date();
    if (validarFecha(hoy)) {
      setMesActual(startOfMonth(hoy));
    }
    // Continuar con el renderizado usando la fecha actual como fallback
  }

  // Obtener todos los días del mes
  const inicioMes = startOfMonth(mesActual);
  const finMes = endOfMonth(mesActual);
  const diasDelMes = eachDayOfInterval({
    start: inicioMes,
    end: finMes,
  });

  // Obtener días del mes anterior para completar la primera semana
  // getDay() devuelve: 0=Domingo, 1=Lunes, 2=Martes, etc.
  const diaSemanaPrimerDia = getDay(inicioMes); // 0=Domingo, 1=Lunes, etc.
  const diasAnteriores = [];
  
  // Si el primer día no es domingo (0), necesitamos agregar días anteriores
  // para completar la semana empezando en domingo
  // Ejemplo: Si el primer día es martes (2), necesitamos lunes (1) y domingo (0)
  for (let i = 1; i <= diaSemanaPrimerDia; i++) {
    const fecha = new Date(inicioMes);
    fecha.setDate(fecha.getDate() - i);
    if (validarFecha(fecha)) {
      diasAnteriores.unshift(fecha); // Agregar al inicio para mantener orden cronológico
    }
  }

  // Obtener días del mes siguiente para completar la última semana
  const diaSemanaUltimoDia = getDay(finMes); // 0=Domingo, 1=Lunes, etc.
  const diasSiguientes = [];
  
  // Calcular cuántos días faltan para completar la semana (hasta sábado = 6)
  const diasFaltantes = 6 - diaSemanaUltimoDia;
  for (let i = 1; i <= diasFaltantes; i++) {
    const fecha = new Date(finMes);
    fecha.setDate(fecha.getDate() + i);
    if (validarFecha(fecha)) {
      diasSiguientes.push(fecha);
    }
  }

  // Combinar todos los días en una sola lista para renderizar en una sola grilla
  const todosLosDias = [...diasAnteriores, ...diasDelMes, ...diasSiguientes];

  // Validar que el año se muestre correctamente (debug en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    const añoActual = obtenerAño(mesActual);
    if (añoActual < 2020 || añoActual > 2100) {
      console.warn(`Año fuera del rango esperado: ${añoActual}`);
    }
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate" title={`${format(mesActual, 'MMMM yyyy', { locale: es })} - Año ${obtenerAño(mesActual)}`}>
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

            {/* Todos los días del calendario en una sola grilla */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {todosLosDias
                .filter(dia => isValid(dia) && validarFecha(dia)) // Filtrar fechas inválidas
                .map((dia, index) => {
                  const turnosDelDia = obtenerTurnosDelDia(dia);
                  const cantidadTurnos = turnosDelDia.length;
                  const esHoy = isToday(dia);
                  const esSeleccionado = isSameDay(dia, fechaSeleccionada);
                  const esDelMesActual = isSameMonth(dia, mesActual);
                  
                  // Validar que el día de la semana sea correcto (solo en desarrollo)
                  // Nota: Esta validación verifica que los días estén alineados correctamente
                  if (process.env.NODE_ENV === 'development' && esDelMesActual && index < todosLosDias.length) {
                    const diaSemanaReal = getDay(dia);
                    // El primer día del mes debería estar en la posición correcta según su día de la semana
                    if (index === diasAnteriores.length) {
                      const diaSemanaEsperado = getDay(startOfMonth(mesActual));
                      if (diaSemanaReal !== diaSemanaEsperado) {
                        console.warn(`Desalineación en primer día del mes: fecha ${format(dia, 'yyyy-MM-dd')}, día semana real: ${diaSemanaReal}, esperado: ${diaSemanaEsperado}`);
                      }
                    }
                  }

                return (
                  <div
                    key={dia.toISOString()}
                    onClick={(e) => {
                      // Solo seleccionar fecha si el click no viene de un turno y es del mes actual
                      if (esDelMesActual && !(e.target as HTMLElement).closest('[data-testid^="turno-calendario-"]')) {
                        onSeleccionarFecha(dia);
                      }
                    }}
                    className={`aspect-square p-1 sm:p-2 border rounded-md transition ${
                      esDelMesActual ? 'cursor-pointer' : ''
                    } ${
                      esSeleccionado
                        ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-200'
                        : esHoy
                        ? 'bg-blue-50 border-blue-300'
                        : esDelMesActual
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-transparent'
                    } ${!esDelMesActual ? 'opacity-50' : ''}`}
                  >
                    <div className="flex flex-col h-full">
                      <div
                        className={`text-sm sm:text-base font-bold ${
                          esSeleccionado
                            ? 'text-indigo-900'
                            : esHoy
                            ? 'text-blue-900'
                            : esDelMesActual
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {format(dia, 'd')}
                      </div>
                      {cantidadTurnos > 0 && esDelMesActual && (
                        <div className="flex-1 flex items-end mt-1">
                          <div className="w-full">
                            {turnosDelDia.slice(0, 3).map((turno, idx) => {
                              // Validar que el turno tenga paciente antes de renderizar
                              if (!turno.pacientes) {
                                return null;
                              }
                              const colorEstado =
                                turno.estado === 'completado'
                                  ? 'bg-green-600 text-white border-green-700'
                                  : turno.estado === 'cancelado'
                                  ? 'bg-red-600 text-white border-red-700'
                                  : 'bg-blue-600 text-white border-blue-700';
                              const nombrePaciente = turno.pacientes.nombre || 'Sin nombre';
                              const apellidoPaciente = turno.pacientes.apellido || '';
                              // Normalizar la hora para mostrar (quitar segundos si existen)
                              const horaNormalizada = turno.hora.length > 5 
                                ? turno.hora.substring(0, 5) 
                                : turno.hora;
                              
                              const handleClickTurno = (e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Asegurar que el modal se abra correctamente
                                if (onAbrirModalTurno) {
                                  onAbrirModalTurno(turno);
                                }
                              };

                              return (
                                <div
                                  key={turno.id}
                                  onClick={handleClickTurno}
                                  onMouseDown={(e) => {
                                    // Prevenir que el click en el día se active
                                    e.stopPropagation();
                                  }}
                                  data-testid={`turno-calendario-${turno.id}`}
                                  data-turno-id={turno.id}
                                  data-turno-hora={horaNormalizada}
                                  data-turno-estado={turno.estado}
                                  className={`${colorEstado} border-2 text-[10px] sm:text-xs px-1.5 py-1 mb-0.5 rounded-md truncate cursor-pointer hover:opacity-90 hover:shadow-md font-bold shadow-sm transition-all`}
                                  title={`${nombrePaciente} ${apellidoPaciente} - ${horaNormalizada} - ${turno.estado}`}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    // Permitir abrir el modal con Enter o Espacio
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (onAbrirModalTurno) {
                                        onAbrirModalTurno(turno);
                                      }
                                    }
                                  }}
                                >
                                  {horaNormalizada} {nombrePaciente.split(' ')[0]}
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

            {/* Leyenda */}
            <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 border-2 border-blue-700 rounded shadow-sm"></div>
                  <span className="text-gray-900 font-semibold">Pendiente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 border-2 border-green-700 rounded shadow-sm"></div>
                  <span className="text-gray-900 font-semibold">Atendido</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 border-2 border-red-700 rounded shadow-sm"></div>
                  <span className="text-gray-900 font-semibold">Anulado</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

