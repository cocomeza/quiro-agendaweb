'use client';

import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { TurnoConPaciente, TurnoConPago, Paciente } from '@/lib/supabase/types';
import { Calendar, ChevronLeft, ChevronRight, Plus, Printer, Phone, Copy, AlertCircle } from 'lucide-react';
import ResumenDia from './ResumenDia';
import BusquedaRapida from './BusquedaRapida';
import VistaImpresionTurnos from './VistaImpresionTurnos';
import { copiarAlPortapapeles, esTurnoProximo, esTurnoAtrasado } from '@/lib/utils';
import { showSuccess, showError } from '@/lib/toast';

const FRANJAS_HORARIAS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

interface AgendaDiariaProps {
  fechaSeleccionada: Date;
  turnos: TurnoConPaciente[];
  pacientes: Paciente[];
  loading: boolean;
  onCambiarFecha: (dias: number) => void;
  onAbrirModalTurno: (turno?: TurnoConPaciente) => void;
  onAbrirModalPaciente: (paciente?: Paciente) => void;
}

export default function AgendaDiaria({
  fechaSeleccionada,
  turnos,
  pacientes,
  loading,
  onCambiarFecha,
  onAbrirModalTurno,
  onAbrirModalPaciente,
}: AgendaDiariaProps) {
  // Normalizar las horas a formato HH:MM para que coincidan con las franjas horarias
  const turnosPorHora = turnos.reduce((acc, turno) => {
    // Normalizar hora: convertir "08:00:00" a "08:00" o mantener "08:00"
    // También manejar casos como "8:00" -> "08:00"
    let horaNormalizada = turno.hora.trim();
    
    // Si tiene segundos, removerlos
    if (horaNormalizada.length > 5) {
      horaNormalizada = horaNormalizada.slice(0, 5);
    }
    
    // Asegurar formato HH:MM (agregar cero inicial si es necesario)
    const partes = horaNormalizada.split(':');
    if (partes.length === 2) {
      const horas = partes[0].padStart(2, '0');
      const minutos = partes[1].padStart(2, '0');
      horaNormalizada = `${horas}:${minutos}`;
    }
    
    acc[horaNormalizada] = turno;
    return acc;
  }, {} as Record<string, TurnoConPaciente>);
  
  // Debug: mostrar turnos cargados (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && turnos.length > 0) {
    console.log('Turnos cargados:', turnos.map(t => ({ hora: t.hora, paciente: `${t.pacientes.nombre} ${t.pacientes.apellido}` })));
    console.log('Turnos por hora mapeados:', Object.keys(turnosPorHora));
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'cancelado':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'programado':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const handleImprimir = () => {
    // Mostrar vista de impresión antes de imprimir
    window.print();
  };

  return (
    <>
      {/* Vista de impresión (solo visible al imprimir) */}
      <VistaImpresionTurnos turnos={turnos} fecha={fechaSeleccionada} />
      
      {/* Vista normal (oculta al imprimir) */}
      <div className="bg-white rounded-lg shadow no-print">
      {/* Resumen del día */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <ResumenDia turnos={turnos} fecha={fechaSeleccionada} />
      </div>

      {/* Búsqueda rápida */}
      <div className="px-4 sm:px-6 pb-4">
        <BusquedaRapida
          pacientes={pacientes}
          onSeleccionarPaciente={(paciente) => {
            // Buscar turnos del paciente en la fecha seleccionada
            const turnoPaciente = turnos.find(t => t.paciente_id === paciente.id);
            if (turnoPaciente) {
              onAbrirModalTurno(turnoPaciente);
            } else {
              // Si no tiene turno, abrir modal para crear uno
              onAbrirModalTurno();
            }
          }}
        />
      </div>

      {/* Controles de fecha */}
      <div className="border-b px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-3 sm:mb-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => onCambiarFecha(-1)}
              className="p-2 hover:bg-gray-100 rounded-md transition flex-shrink-0"
              aria-label="Día anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
              {isToday(fechaSeleccionada) && (
                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded flex-shrink-0">
                  Hoy
                </span>
              )}
            </div>
            <button
              onClick={() => onCambiarFecha(1)}
              className="p-2 hover:bg-gray-100 rounded-md transition flex-shrink-0"
              aria-label="Día siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => onCambiarFecha(0)}
            className="ml-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition flex-shrink-0"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="px-4 sm:px-6 py-4 border-b">
        <div className="flex gap-2">
          <button
            onClick={handleImprimir}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-sm font-medium"
            title="Imprimir agenda"
            aria-label="Imprimir agenda del día"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button
            onClick={() => onAbrirModalTurno()}
            className="flex items-center justify-center gap-2 flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
            aria-label="Crear nuevo turno"
          >
            <Plus className="w-4 h-4" />
            Nuevo Turno
          </button>
        </div>
      </div>

      {/* Agenda */}
      <div className="overflow-y-auto max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-300px)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-base">Cargando agenda...</p>
          </div>
        ) : turnos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <p className="text-gray-600 text-base">No hay turnos programados para este día</p>
            <button
              onClick={() => onAbrirModalTurno()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
            >
              Crear primer turno
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {FRANJAS_HORARIAS.map((hora) => {
              const turno = turnosPorHora[hora];
              return (
                <div
                  key={hora}
                  className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => turno ? onAbrirModalTurno(turno) : onAbrirModalTurno()}
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 lg:gap-4">
                    <div className="w-14 sm:w-16 lg:w-20 text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0 pt-1 sm:pt-0">
                      {hora}
                    </div>
                    {turno ? (
                      <div className={`flex-1 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md border ${
                        esTurnoAtrasado(turno.fecha, turno.hora, turno.estado)
                          ? 'border-red-500 bg-red-50'
                          : esTurnoProximo(turno.fecha, turno.hora)
                          ? 'border-yellow-400 bg-yellow-50'
                          : getEstadoColor(turno.estado)
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                              <p className="text-sm sm:text-base font-medium truncate">
                                {turno.pacientes.nombre} {turno.pacientes.apellido}
                              </p>
                              {esTurnoAtrasado(turno.fecha, turno.hora, turno.estado) && (
                                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-red-200 text-red-800 rounded flex items-center gap-0.5 sm:gap-1">
                                  <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  <span className="hidden xs:inline">Atrasado</span>
                                </span>
                              )}
                              {esTurnoProximo(turno.fecha, turno.hora) && !esTurnoAtrasado(turno.fecha, turno.hora, turno.estado) && (
                                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded">
                                  Próximo
                                </span>
                              )}
                              {turno.pacientes.fecha_nacimiento && (
                                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-white bg-opacity-50 rounded">
                                  {(() => {
                                    const hoy = new Date();
                                    const nacimiento = new Date(turno.pacientes.fecha_nacimiento);
                                    let edad = hoy.getFullYear() - nacimiento.getFullYear();
                                    const mes = hoy.getMonth() - nacimiento.getMonth();
                                    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                                      edad--;
                                    }
                                    return `${edad}a`;
                                  })()}
                                </span>
                              )}
                              {turno.pago && (
                                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded ${
                                  turno.pago === 'pagado' 
                                    ? 'bg-green-200 text-green-800' 
                                    : 'bg-red-200 text-red-800'
                                }`}>
                                  {turno.pago === 'pagado' ? 'Pagado' : 'Impago'}
                                </span>
                              )}
                            </div>
                            {turno.pacientes.telefono && (
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                                <p className="text-[10px] sm:text-xs opacity-75 truncate">
                                  {turno.pacientes.telefono}
                                </p>
                                <div className="flex gap-0.5 sm:gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.href = `tel:${turno.pacientes.telefono}`;
                                    }}
                                    className="p-1 sm:p-1.5 hover:bg-white hover:bg-opacity-50 rounded transition touch-manipulation"
                                    title="Llamar"
                                    aria-label="Llamar al paciente"
                                  >
                                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const copiado = await copiarAlPortapapeles(turno.pacientes.telefono || '');
                                      if (copiado) {
                                        showSuccess('✅ Teléfono copiado al portapapeles');
                                      } else {
                                        showError('❌ Error al copiar teléfono');
                                      }
                                    }}
                                    className="p-1 sm:p-1.5 hover:bg-white hover:bg-opacity-50 rounded transition touch-manipulation"
                                    title="Copiar teléfono"
                                    aria-label="Copiar teléfono al portapapeles"
                                  >
                                    <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            )}
                            {turno.notas && (
                              <p className="text-[10px] sm:text-xs mt-1 opacity-75 truncate">
                                {turno.notas}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white bg-opacity-50 rounded self-start sm:self-auto">
                            {turno.estado === 'completado' ? 'Completado' :
                             turno.estado === 'programado' ? 'Programado' :
                             turno.estado === 'cancelado' ? 'Cancelado' :
                             turno.estado}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 text-xs sm:text-sm text-gray-400 italic">
                        Disponible
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

