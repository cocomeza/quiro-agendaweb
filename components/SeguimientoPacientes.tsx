'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Paciente } from '@/lib/supabase/types';
import { differenceInDays, format } from 'date-fns';
import { Phone, CheckCircle, XCircle } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import { obtenerMensajeError } from '@/lib/validaciones';
import { logger } from '@/lib/logger';

interface PacienteSeguimiento {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  llamado_telefono: boolean;
  fecha_ultimo_llamado: string | null;
  ultima_visita: string | null;
  turnos_cancelados_recientes: number;
  fecha_ultimo_cancelado: string | null;
}

type FiltroSeguimiento = 
  | 'recordar_visita'           // Pacientes que deberían volver (18-28 días desde última visita)
  | 'no_vienen_hace_tiempo'     // Pacientes que no vienen hace más de 30 días
  | 'cancelaron_recientemente'  // Pacientes que cancelaron turnos recientemente
  | 'sin_turno_programado'      // Pacientes activos sin turno programado
  | null;

export default function SeguimientoPacientes() {
  const [pacientes, setPacientes] = useState<PacienteSeguimiento[]>([]);
  const [filtroActivo, setFiltroActivo] = useState<FiltroSeguimiento>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pacientesConTurno, setPacientesConTurno] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const cargarPacientes = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar pacientes con información de turnos
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes')
        .select('*')
        .order('apellido', { ascending: true })
        .order('nombre', { ascending: true });

      if (pacientesError) {
        logger.error('Error cargando pacientes', pacientesError, { filtro: filtroActivo });
        setError('Error al cargar pacientes. Intenta recargar la página.');
        throw pacientesError;
      }

      // Cargar turnos completados para calcular última visita
      const { data: turnosCompletados, error: turnosError } = await supabase
        .from('turnos')
        .select('paciente_id, fecha')
        .eq('estado', 'completado')
        .order('fecha', { ascending: false });

      if (turnosError) throw turnosError;

      // Cargar turnos cancelados recientes (últimos 20 días)
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 20);
      const fechaLimiteStr = format(fechaLimite, 'yyyy-MM-dd');

      const { data: turnosCancelados, error: canceladosError } = await supabase
        .from('turnos')
        .select('paciente_id, fecha')
        .eq('estado', 'cancelado')
        .gte('fecha', fechaLimiteStr);

      if (canceladosError) throw canceladosError;

      // Procesar datos para crear estructura de seguimiento
      const ultimaVisitaPorPaciente = new Map<string, string>();
      turnosCompletados?.forEach(turno => {
        const pacienteId = turno.paciente_id;
        const fechaActual = ultimaVisitaPorPaciente.get(pacienteId);
        if (!fechaActual || turno.fecha > fechaActual) {
          ultimaVisitaPorPaciente.set(pacienteId, turno.fecha);
        }
      });

      const cancelacionesPorPaciente = new Map<string, { count: number; ultimaFecha: string }>();
      turnosCancelados?.forEach(turno => {
        const pacienteId = turno.paciente_id;
        const actual = cancelacionesPorPaciente.get(pacienteId) || { count: 0, ultimaFecha: '' };
        cancelacionesPorPaciente.set(pacienteId, {
          count: actual.count + 1,
          ultimaFecha: turno.fecha > actual.ultimaFecha ? turno.fecha : actual.ultimaFecha,
        });
      });

      // Transformar datos a formato de seguimiento
      let pacientesFiltrados: PacienteSeguimiento[] = (pacientesData || []).map(p => {
        const paciente = p as Paciente & { llamado_telefono?: boolean; fecha_ultimo_llamado?: string | null };
        return {
          id: paciente.id,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          telefono: paciente.telefono,
          email: paciente.email,
          fecha_nacimiento: paciente.fecha_nacimiento,
          llamado_telefono: paciente.llamado_telefono ?? false,
          fecha_ultimo_llamado: paciente.fecha_ultimo_llamado ?? null,
          ultima_visita: ultimaVisitaPorPaciente.get(paciente.id) || null,
          turnos_cancelados_recientes: cancelacionesPorPaciente.get(paciente.id)?.count || 0,
          fecha_ultimo_cancelado: cancelacionesPorPaciente.get(paciente.id)?.ultimaFecha || null,
        };
      });

      // Cargar turnos programados para saber quién tiene turno
      const { data: turnosProgramados } = await supabase
        .from('turnos')
        .select('paciente_id')
        .eq('estado', 'programado')
        .gte('fecha', format(new Date(), 'yyyy-MM-dd'));

      const pacientesConTurnoSet = new Set(turnosProgramados?.map(t => t.paciente_id) || []);
      setPacientesConTurno(pacientesConTurnoSet);
      
      // Guardar en variable local para usar en filtros
      const pacientesConTurno = pacientesConTurnoSet;

      // Aplicar filtros
      if (filtroActivo === 'recordar_visita') {
        // Pacientes que deberían volver (última visita hace 18-28 días)
        pacientesFiltrados = pacientesFiltrados.filter(p => {
          if (!p.ultima_visita) return false;
          const diasDesdeUltimaVisita = differenceInDays(new Date(), new Date(p.ultima_visita));
          return diasDesdeUltimaVisita >= 18 && diasDesdeUltimaVisita <= 28;
        });
      } else if (filtroActivo === 'no_vienen_hace_tiempo') {
        // Pacientes que no vienen hace más de 30 días
        pacientesFiltrados = pacientesFiltrados.filter(p => {
          if (!p.ultima_visita) return false;
          const diasDesdeUltimaVisita = differenceInDays(new Date(), new Date(p.ultima_visita));
          return diasDesdeUltimaVisita > 30;
        });
      } else if (filtroActivo === 'cancelaron_recientemente') {
        // Pacientes que cancelaron turnos en los últimos 20 días
        pacientesFiltrados = pacientesFiltrados.filter(p => p.turnos_cancelados_recientes > 0);
      } else if (filtroActivo === 'sin_turno_programado') {
        // Pacientes activos (con última visita en últimos 60 días) pero sin turno programado
        pacientesFiltrados = pacientesFiltrados.filter(p => {
          if (!p.ultima_visita) return false;
          const diasDesdeUltimaVisita = differenceInDays(new Date(), new Date(p.ultima_visita));
          return diasDesdeUltimaVisita <= 60 && !pacientesConTurnoSet.has(p.id);
        });
      }

      setPacientes(pacientesFiltrados);
      setError(null); // Limpiar error si carga exitosamente
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      logger.error('Error cargando pacientes', err, { filtro: filtroActivo });
      const mensajeError = err.message?.toLowerCase() || '';
      if (mensajeError.includes('network') || mensajeError.includes('fetch') || mensajeError.includes('conexión')) {
        setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
      } else {
        setError('Error al cargar pacientes. Intenta recargar la página.');
      }
    } finally {
      setLoading(false);
    }
  }, [filtroActivo, supabase]);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  const marcarComoLlamado = async (pacienteId: string) => {
    try {
      // Intentar actualizar con los campos de llamado
      // Si los campos no existen, solo actualizar el campo que existe
      const updateData: any = {};
      
      // Verificar si los campos existen antes de actualizarlos
      // Por ahora, intentar actualizar ambos y manejar el error si no existen
      updateData.llamado_telefono = true;
      updateData.fecha_ultimo_llamado = format(new Date(), 'yyyy-MM-dd');

      const { error } = await supabase
        .from('pacientes')
        .update(updateData)
        .eq('id', pacienteId);

      if (error) {
        // Si falla porque los campos no existen, intentar solo con llamado_telefono
        if (error.message.includes('llamado_telefono') || error.message.includes('fecha_ultimo_llamado')) {
          const { error: error2 } = await supabase
            .from('pacientes')
            .update({ llamado_telefono: true })
            .eq('id', pacienteId);
          if (error2) throw error2;
        } else {
          throw error;
        }
      }
      
      showSuccess('✅ Paciente marcado como llamado');
      logger.info('Paciente marcado como llamado', { pacienteId });
      cargarPacientes(); // Recargar lista
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      logger.error('Error marcando como llamado', err, { pacienteId });
      const mensajeError = obtenerMensajeError(err);
      showError(`❌ ${mensajeError}`);
    }
  };

  const calcularEdad = (fechaNacimiento: string | null): number | null => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const calcularDiasUltimaVisita = (fechaUltimaVisita: string | null): number | null => {
    if (!fechaUltimaVisita) return null;
    return differenceInDays(new Date(), new Date(fechaUltimaVisita));
  };

  const calcularDiasUltimoCancelado = (fechaUltimoCancelado: string | null): number | null => {
    if (!fechaUltimoCancelado) return null;
    return differenceInDays(new Date(), new Date(fechaUltimoCancelado));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
          <button
            onClick={() => cargarPacientes()}
            className="ml-2 underline hover:no-underline font-medium"
          >
            Reintentar
          </button>
        </div>
      )}
      {/* Header */}
      <div className="border-b px-4 sm:px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">📞 Seguimiento de Pacientes</h2>
        <p className="text-sm text-gray-700">
          Encuentra pacientes que necesitan atención: recordatorios de visitas, seguimiento de cancelaciones y pacientes sin turno programado.
        </p>
      </div>

      {/* Filtros */}
      <div className="border-b px-4 sm:px-6 py-4 space-y-3 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setFiltroActivo(filtroActivo === 'recordar_visita' ? null : 'recordar_visita')}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-sm ${
              filtroActivo === 'recordar_visita'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            }`}
          >
            <div className="text-base mb-1">🔄 Recordar Visita</div>
            <div className="text-xs opacity-90">Última visita hace 18-28 días</div>
          </button>
          
          <button
            onClick={() => setFiltroActivo(filtroActivo === 'no_vienen_hace_tiempo' ? null : 'no_vienen_hace_tiempo')}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-sm ${
              filtroActivo === 'no_vienen_hace_tiempo'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            <div className="text-base mb-1">⏰ No Vienen Hace Tiempo</div>
            <div className="text-xs opacity-90">Más de 30 días sin venir</div>
          </button>
          
          <button
            onClick={() => setFiltroActivo(filtroActivo === 'cancelaron_recientemente' ? null : 'cancelaron_recientemente')}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-sm ${
              filtroActivo === 'cancelaron_recientemente'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <div className="text-base mb-1">❌ Cancelaron Recientemente</div>
            <div className="text-xs opacity-90">Cancelaron en últimos 20 días</div>
          </button>
          
          <button
            onClick={() => setFiltroActivo(filtroActivo === 'sin_turno_programado' ? null : 'sin_turno_programado')}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-sm ${
              filtroActivo === 'sin_turno_programado'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <div className="text-base mb-1">📅 Sin Turno Programado</div>
            <div className="text-xs opacity-90">Activos pero sin próximo turno</div>
          </button>
        </div>
        
        {filtroActivo && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                📋 Mostrando <span className="font-bold text-indigo-600">{pacientes.length}</span> paciente{pacientes.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-600 italic">
                {filtroActivo === 'recordar_visita' && '💡 Llama para recordarles que vuelvan'}
                {filtroActivo === 'no_vienen_hace_tiempo' && '💡 Contacta para re-engancharlos'}
                {filtroActivo === 'cancelaron_recientemente' && '💡 Pregunta el motivo de la cancelación'}
                {filtroActivo === 'sin_turno_programado' && '💡 Ofrece agendar su próximo turno'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de pacientes */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-base">Cargando seguimiento...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filtroActivo ? 'No hay pacientes que coincidan con el filtro' : 'No hay pacientes registrados'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Última Visita
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turnos Anulados
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Último Anulado
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pacientes.map((paciente) => {
                const diasUltimaVisita = calcularDiasUltimaVisita(paciente.ultima_visita);
                const diasUltimoCancelado = calcularDiasUltimoCancelado(paciente.fecha_ultimo_cancelado);
                const edad = calcularEdad(paciente.fecha_nacimiento);

                return (
                  <tr key={paciente.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {paciente.apellido}, {paciente.nombre}
                      </div>
                      {edad !== null && (
                        <div className="text-xs text-gray-500">Edad: {edad} años</div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {paciente.telefono || '-'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {diasUltimaVisita !== null ? (
                        <div>
                          <span className={`text-sm font-semibold ${
                            diasUltimaVisita >= 18 && diasUltimaVisita <= 28 
                              ? 'text-green-600' 
                              : diasUltimaVisita > 30 
                              ? 'text-red-600' 
                              : 'text-gray-600'
                          }`}>
                            {diasUltimaVisita} días
                          </span>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(paciente.ultima_visita!), 'dd/MM/yyyy')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Nunca</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {paciente.turnos_cancelados_recientes > 0 ? (
                        <div>
                          <span className="text-sm font-semibold text-red-600">
                            {paciente.turnos_cancelados_recientes} cancelación{paciente.turnos_cancelados_recientes !== 1 ? 'es' : ''}
                          </span>
                          {diasUltimoCancelado !== null && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Hace {diasUltimoCancelado} días
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Ninguna</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {pacientesConTurno.has(paciente.id) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Con turno
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠ Sin turno
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {paciente.telefono && (
                        <div className="flex items-center gap-2">
                          {paciente.llamado_telefono ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Llamado
                            </span>
                          ) : (
                            <button
                              onClick={() => marcarComoLlamado(paciente.id)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                            >
                              <Phone className="w-4 h-4" />
                              Marcar como llamado
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

