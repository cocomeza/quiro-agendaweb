'use client';

import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { TurnoConPaciente, TurnoConPago, Paciente } from '@/lib/supabase/types';
import { Calendar, ChevronLeft, ChevronRight, Plus, Phone, Copy, AlertCircle, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ResumenDia from './ResumenDia';
import BusquedaRapida from './BusquedaRapida';
import ListaPacientesDia from './ListaPacientesDia';
import { copiarAlPortapapeles, esTurnoProximo, esTurnoAtrasado, FRANJAS_HORARIAS } from '@/lib/utils';
import { showSuccess, showError } from '@/lib/toast';
import { generarPDFTurnos } from '@/lib/pdf';

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
  // Solo procesar turnos que tengan pacientes válidos
  const turnosPorHora = turnos
    .filter(turno => turno && turno.pacientes && turno.hora)
    .reduce((acc, turno) => {
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
    console.log('Turnos cargados:', turnos.map(t => ({ 
      hora: t.hora, 
      paciente: t.pacientes ? `${t.pacientes.nombre || ''} ${t.pacientes.apellido || ''}` : 'Sin paciente' 
    })));
    console.log('Turnos por hora mapeados:', Object.keys(turnosPorHora));
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-50 border-green-500 text-green-900';
      case 'cancelado':
        return 'bg-red-50 border-red-500 text-red-900';
      case 'programado':
        return 'bg-blue-50 border-blue-500 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-900';
    }
  };

  const supabase = createClient();
  const [mostrarSelectorFechaPDF, setMostrarSelectorFechaPDF] = useState(false);
  const [fechaParaPDF, setFechaParaPDF] = useState(fechaSeleccionada);
  const [cargandoPDF, setCargandoPDF] = useState(false);

  const handleDescargarPDF = async () => {
    // Si no hay selector visible, descargar directamente el día actual
    if (!mostrarSelectorFechaPDF) {
      try {
        const turnosParaPDF = turnos.filter(t => 
          t.pacientes && 
          t.pacientes.nombre && 
          t.pacientes.apellido
        );
        
        if (turnosParaPDF.length === 0) {
          showError('❌ No hay turnos para descargar en este día');
          return;
        }

        generarPDFTurnos(turnosParaPDF, fechaSeleccionada);
        showSuccess('✅ PDF descargado exitosamente');
      } catch (error) {
        console.error('Error al generar PDF:', error);
        showError('❌ Error al generar el PDF');
      }
      return;
    }
    // Si ya se seleccionó la fecha, descargar en handleDescargarPDFFecha
  };

  const handleDescargarPDFOtraFecha = () => {
    // Mostrar selector para elegir otra fecha
    setMostrarSelectorFechaPDF(true);
  };

  const handleDescargarPDFFecha = async () => {
    setCargandoPDF(true);
    try {
      const fechaStr = format(fechaParaPDF, 'yyyy-MM-dd');
      const { data: turnosData, error: turnosError } = await supabase
        .from('turnos')
        .select(`
          *,
          pacientes (
            id,
            nombre,
            apellido,
            telefono,
            email,
            fecha_nacimiento,
            numero_ficha,
            direccion,
            dni
          )
        `)
        .eq('fecha', fechaStr)
        .order('hora', { ascending: true });

      if (turnosError) throw turnosError;

      // Mapear correctamente los datos de pacientes
      const turnosMapeados: TurnoConPaciente[] = (turnosData || []).map((turno: any) => {
        const paciente = Array.isArray(turno.pacientes) ? turno.pacientes[0] : turno.pacientes;
        return {
          ...turno,
          pacientes: paciente || null,
        };
      }).filter((turno: TurnoConPaciente) => turno.pacientes !== null);

      if (turnosMapeados.length === 0) {
        showError('❌ No hay turnos para descargar en la fecha seleccionada');
        setMostrarSelectorFechaPDF(false);
        return;
      }

      generarPDFTurnos(turnosMapeados, fechaParaPDF);
      showSuccess('✅ PDF descargado exitosamente');
      setMostrarSelectorFechaPDF(false);
    } catch (error) {
      console.error('Error al cargar turnos para PDF:', error);
      showError('❌ Error al cargar turnos de la fecha seleccionada');
    } finally {
      setCargandoPDF(false);
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-lg">
        {/* Header con resumen y controles */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200 px-4 sm:px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            {/* Título y fecha */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })}
                  </h2>
                  {isToday(fechaSeleccionada) && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold bg-indigo-600 text-white rounded-full">
                      Hoy
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navegación de fecha */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCambiarFecha(-1)}
                className="p-2.5 hover:bg-white hover:shadow-md rounded-lg transition-all"
                aria-label="Día anterior"
                title="Día anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => onCambiarFecha(0)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-all shadow-sm"
                title="Ir a hoy"
              >
                Hoy
              </button>
              <button
                onClick={() => onCambiarFecha(1)}
                className="p-2.5 hover:bg-white hover:shadow-md rounded-lg transition-all"
                aria-label="Día siguiente"
                title="Día siguiente"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Resumen del día compacto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{turnos.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500 opacity-60" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Completados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {turnos.filter(t => t.estado === 'completado').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-60" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {turnos.filter(t => t.estado === 'programado').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500 opacity-60" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Cancelados</p>
                  <p className="text-2xl font-bold text-red-600">
                    {turnos.filter(t => t.estado === 'cancelado').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 opacity-60" />
              </div>
            </div>
          </div>
        </div>

        {/* Búsqueda rápida y acciones */}
        <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <BusquedaRapida
                pacientes={pacientes}
                onSeleccionarPaciente={(paciente) => {
                  const turnoPaciente = turnos.find(t => t.paciente_id === paciente.id);
                  if (turnoPaciente) {
                    onAbrirModalTurno(turnoPaciente);
                  } else {
                    onAbrirModalTurno();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDescargarPDF}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow-sm"
                title="Descargar lista en PDF del día actual"
                aria-label="Descargar lista de turnos en PDF"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Descargar PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <button
                onClick={handleDescargarPDFOtraFecha}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-xs font-semibold shadow-sm border border-green-200"
                title="Descargar PDF de otra fecha"
                aria-label="Seleccionar otra fecha para descargar PDF"
              >
                <Calendar className="w-3 h-3" />
                <span className="hidden lg:inline">Otra fecha</span>
              </button>
              <button
                onClick={() => onAbrirModalTurno()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold shadow-md hover:shadow-lg"
                aria-label="Crear nuevo turno"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Turno</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selector de fecha para descargar PDF */}
        {mostrarSelectorFechaPDF && (
          <div className="px-4 sm:px-6 py-4 border-b bg-green-50 border-green-200">
            <div className="p-4 bg-white border-2 border-green-200 rounded-lg shadow-sm">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                📅 Seleccionar fecha para descargar PDF:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  value={format(fechaParaPDF, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    try {
                      if (e.target.value) {
                        const nuevaFecha = new Date(e.target.value + 'T00:00:00');
                        if (!isNaN(nuevaFecha.getTime())) {
                          setFechaParaPDF(nuevaFecha);
                        }
                      }
                    } catch (error) {
                      console.error('Error al cambiar fecha:', error);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-600 text-sm font-medium"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDescargarPDFFecha}
                    disabled={cargandoPDF}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {cargandoPDF ? 'Cargando...' : 'Descargar'}
                  </button>
                  <button
                    onClick={() => {
                      setFechaParaPDF(fechaSeleccionada);
                      setMostrarSelectorFechaPDF(false);
                    }}
                    className="px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agenda de turnos */}
        <div className="overflow-y-auto max-h-[calc(100vh-400px)] sm:max-h-[calc(100vh-450px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 text-base font-medium">Cargando agenda...</p>
            </div>
          ) : turnos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 text-lg font-semibold mb-2">No hay turnos programados</p>
              <p className="text-gray-500 text-sm mb-6">Comienza agregando un turno para este día</p>
              <button
                onClick={() => onAbrirModalTurno()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Crear primer turno
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
            {FRANJAS_HORARIAS.map((hora) => {
              const turno = turnosPorHora[hora];
              return (
                <div
                  key={hora}
                  className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                  onClick={() => {
                    try {
                      if (turno && turno.pacientes) {
                        onAbrirModalTurno(turno);
                      } else {
                        onAbrirModalTurno();
                      }
                    } catch (error) {
                      console.error('Error al abrir modal de turno:', error);
                      onAbrirModalTurno();
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 sm:w-20 text-sm sm:text-base font-bold text-gray-600 flex-shrink-0 pt-1 group-hover:text-indigo-600 transition-colors">
                      {hora}
                    </div>
                    {turno && turno.pacientes ? (
                      <div className={`flex-1 px-4 py-3 rounded-lg border-2 shadow-sm transition-all group-hover:shadow-md ${
                        esTurnoAtrasado(turno.fecha, turno.hora, turno.estado)
                          ? 'border-red-500 bg-red-50'
                          : esTurnoProximo(turno.fecha, turno.hora)
                          ? 'border-yellow-400 bg-yellow-50'
                          : getEstadoColor(turno.estado)
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                              <p className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                {turno.pacientes?.nombre || 'Sin nombre'} {turno.pacientes?.apellido || ''}
                              </p>
                              {esTurnoAtrasado(turno.fecha, turno.hora, turno.estado) && (
                                <span className="text-xs sm:text-sm px-2 sm:px-2.5 py-1 bg-red-600 text-white rounded-md flex items-center gap-1 font-semibold shadow-sm">
                                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span className="hidden xs:inline">Atrasado</span>
                                </span>
                              )}
                              {esTurnoProximo(turno.fecha, turno.hora) && !esTurnoAtrasado(turno.fecha, turno.hora, turno.estado) && (
                                <span className="text-xs sm:text-sm px-2 sm:px-2.5 py-1 bg-yellow-500 text-yellow-900 rounded-md font-semibold shadow-sm">
                                  Próximo
                                </span>
                              )}
                              {turno.pacientes?.fecha_nacimiento && (
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
                                <span className={`text-xs sm:text-sm px-2 sm:px-2.5 py-1 rounded-md font-semibold shadow-sm ${
                                  turno.pago === 'pagado' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-red-600 text-white'
                                }`}>
                                  {turno.pago === 'pagado' ? 'Pagado' : 'Impago'}
                                </span>
                              )}
                            </div>
                            {turno.pacientes?.telefono && (
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                                <p className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                                  {turno.pacientes.telefono}
                                </p>
                                <div className="flex gap-0.5 sm:gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (turno.pacientes?.telefono) {
                                        window.location.href = `tel:${turno.pacientes.telefono}`;
                                      }
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
                                      const copiado = await copiarAlPortapapeles(turno.pacientes?.telefono || '');
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
                              <p className="text-xs sm:text-sm mt-1 text-gray-700 truncate">
                                {turno.notas}
                              </p>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 bg-white rounded-md self-start sm:self-auto shadow-sm border border-gray-200">
                            {turno.estado === 'completado' ? 'Completado' :
                             turno.estado === 'programado' ? 'Programado' :
                             turno.estado === 'cancelado' ? 'Cancelado' :
                             turno.estado}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 px-4 py-3 text-sm sm:text-base text-gray-400 font-medium border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                        Disponible - Click para agregar turno
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de pacientes con turno del día */}
      <div className="mt-6">
        <ListaPacientesDia turnos={turnos} fecha={fechaSeleccionada} />
      </div>
    </div>
  );
}

