'use client';

import type { Paciente, TurnoConPaciente } from '@/lib/supabase/types';
import { Plus, Search, Phone, Mail, FileText, Download, Copy, User, MapPin, IdCard, Calendar, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { exportarPacientesCSV, exportarPacientesJSON } from '@/lib/export-pacientes';
import { showSuccess, showError } from '@/lib/toast';
import { copiarAlPortapapeles } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface ListaPacientesProps {
  pacientes: Paciente[];
  loading: boolean;
  onAbrirModalPaciente: (paciente?: Paciente) => void;
  onAbrirFichaMedica?: (paciente: Paciente) => void;
  onEliminarTurno?: (turnoId: string) => Promise<void>;
}

export default function ListaPacientes({
  pacientes,
  loading,
  onAbrirModalPaciente,
  onAbrirFichaMedica,
  onEliminarTurno,
}: ListaPacientesProps) {
  const [busqueda, setBusqueda] = useState('');
  const [turnosPacientes, setTurnosPacientes] = useState<Record<string, TurnoConPaciente[]>>({});
  const [cargandoTurnos, setCargandoTurnos] = useState<Record<string, boolean>>({});
  const [eliminandoTurno, setEliminandoTurno] = useState<string | null>(null);
  const supabase = createClient();

  // Cargar turnos de un paciente
  const cargarTurnosPaciente = async (pacienteId: string) => {
    if (turnosPacientes[pacienteId] || cargandoTurnos[pacienteId]) return;
    
    setCargandoTurnos(prev => ({ ...prev, [pacienteId]: true }));
    try {
      const { data, error } = await supabase
        .from('turnos')
        .select('*, pacientes(*)')
        .eq('paciente_id', pacienteId)
        .gte('fecha', format(new Date(), 'yyyy-MM-dd'))
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      
      const turnosMapeados: TurnoConPaciente[] = (data || []).map((turno: any) => ({
        ...turno,
        pacientes: Array.isArray(turno.pacientes) ? turno.pacientes[0] : turno.pacientes,
      }));

      setTurnosPacientes(prev => ({ ...prev, [pacienteId]: turnosMapeados }));
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    } finally {
      setCargandoTurnos(prev => ({ ...prev, [pacienteId]: false }));
    }
  };

  const handleEliminarTurno = async (turno: TurnoConPaciente) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar el turno?\n\n` +
      `Paciente: ${turno.pacientes.nombre} ${turno.pacientes.apellido}\n` +
      `Fecha: ${format(new Date(turno.fecha), 'dd/MM/yyyy')}\n` +
      `Hora: ${turno.hora}\n\n` +
      '⚠️ Esta acción NO se puede deshacer. El slot quedará disponible.'
    );

    if (!confirmacion) return;

    setEliminandoTurno(turno.id);
    try {
      if (onEliminarTurno) {
        await onEliminarTurno(turno.id);
      } else {
        const { error } = await supabase
          .from('turnos')
          .delete()
          .eq('id', turno.id);

        if (error) throw error;
      }
      showSuccess('✅ Turno eliminado exitosamente. El slot quedó disponible.');
      
      // Actualizar lista de turnos del paciente
      if (turnosPacientes[turno.paciente_id]) {
        setTurnosPacientes(prev => ({
          ...prev,
          [turno.paciente_id]: prev[turno.paciente_id].filter(t => t.id !== turno.id)
        }));
      }
    } catch (error: any) {
      showError(`❌ Error al eliminar turno: ${error.message}`);
    } finally {
      setEliminandoTurno(null);
    }
  };

  const pacientesFiltrados = pacientes.filter((paciente) => {
    if (!busqueda.trim()) return true;
    const termino = busqueda.toLowerCase();
    return (
      paciente.nombre.toLowerCase().includes(termino) ||
      paciente.apellido.toLowerCase().includes(termino) ||
      (paciente.telefono && paciente.telefono.toLowerCase().includes(termino)) ||
      (paciente.email && paciente.email.toLowerCase().includes(termino)) ||
      (paciente.numero_ficha && paciente.numero_ficha.toLowerCase().includes(termino))
    );
  });

  const handleExportarCSV = () => {
    try {
      exportarPacientesCSV(pacientes, 'pacientes');
      showSuccess('✅ Base de datos exportada exitosamente (CSV)');
    } catch (error: any) {
      showError(`❌ Error al exportar: ${error.message}`);
    }
  };

  const handleExportarJSON = () => {
    try {
      exportarPacientesJSON(pacientes, 'pacientes');
      showSuccess('✅ Base de datos exportada exitosamente (JSON)');
    } catch (error: any) {
      showError(`❌ Error al exportar: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Pacientes</h2>
          <button
            onClick={() => onAbrirModalPaciente()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo Paciente
          </button>
        </div>
        {/* Botones de exportación */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportarCSV}
            disabled={pacientes.length === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar a CSV (Excel compatible)"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleExportarJSON}
            disabled={pacientes.length === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar a JSON"
          >
            <Download className="w-4 h-4" />
            <span>Exportar JSON</span>
          </button>
          {pacientes.length > 0 && (
            <span className="flex items-center text-sm text-gray-600 px-2">
              Total: {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Búsqueda */}
      <div className="px-4 sm:px-6 py-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, teléfono, email o número de ficha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-base">Cargando pacientes...</p>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {busqueda ? 'No se encontraron pacientes con ese criterio' : 'No hay pacientes registrados'}
            </p>
            {!busqueda && (
              <button
                onClick={() => onAbrirModalPaciente()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Crear primer paciente
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pacientesFiltrados.map((paciente) => {
              // Calcular edad
              const calcularEdad = () => {
                if (!paciente.fecha_nacimiento) return null;
                const hoy = new Date();
                const nacimiento = new Date(paciente.fecha_nacimiento);
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                  edad--;
                }
                return edad;
              };
              const edad = calcularEdad();

              return (
                <div
                  key={paciente.id}
                  className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Contenido principal */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onAbrirModalPaciente(paciente)}
                    >
                      {/* Header: Nombre y Ficha */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {paciente.apellido}, {paciente.nombre}
                            </h3>
                            {paciente.numero_ficha && (
                              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md whitespace-nowrap">
                                Ficha #{paciente.numero_ficha}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Grid de información */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ml-14">
                        {/* Columna 1: Contacto */}
                        <div className="space-y-2">
                          {paciente.telefono && (
                            <div className="flex items-center gap-2 group/item">
                              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="text-sm text-gray-700 truncate">{paciente.telefono}</span>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const copiado = await copiarAlPortapapeles(paciente.telefono || '');
                                    if (copiado) {
                                      showSuccess('✅ Teléfono copiado');
                                    } else {
                                      showError('❌ Error al copiar');
                                    }
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-gray-200 rounded transition"
                                  title="Copiar"
                                >
                                  <Copy className="w-3 h-3 text-gray-500" />
                                </button>
                                <a
                                  href={`tel:${paciente.telefono}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-blue-100 rounded transition"
                                  title="Llamar"
                                >
                                  <Phone className="w-3 h-3 text-blue-600" />
                                </a>
                              </div>
                            </div>
                          )}
                          {paciente.email && (
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{paciente.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Columna 2: Información personal */}
                        <div className="space-y-2">
                          {edad !== null && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                <span className="font-medium">Edad:</span> {edad} años
                              </span>
                            </div>
                          )}
                          {paciente.dni && (
                            <div className="flex items-center gap-2">
                              <IdCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                <span className="font-medium">DNI:</span> {paciente.dni}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Columna 3: Domicilio */}
                        <div className="space-y-2">
                          {paciente.direccion && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">
                                <span className="font-medium">Domicilio:</span> {paciente.direccion}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notas (si existen) */}
                      {paciente.notas && (
                        <div className="mt-3 ml-14 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 line-clamp-2 italic">
                            {paciente.notas}
                          </p>
                        </div>
                      )}

                      {/* Turnos del paciente */}
                      <div className="mt-3 ml-14 pt-3 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cargarTurnosPaciente(paciente.id);
                          }}
                          className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-2"
                        >
                          <CalendarIcon className="w-4 h-4" />
                          {cargandoTurnos[paciente.id] 
                            ? 'Cargando turnos...' 
                            : turnosPacientes[paciente.id] 
                              ? `Ver turnos (${turnosPacientes[paciente.id].length})` 
                              : 'Ver turnos futuros'}
                        </button>
                        {turnosPacientes[paciente.id] && turnosPacientes[paciente.id].length > 0 && (
                          <div className="space-y-2">
                            {turnosPacientes[paciente.id].map((turno) => (
                              <div
                                key={turno.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-700">
                                    {format(new Date(turno.fecha), 'dd/MM/yyyy')}
                                  </span>
                                  <span className="text-xs font-medium text-gray-600">
                                    {turno.hora.slice(0, 5)}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    turno.estado === 'completado' 
                                      ? 'bg-green-100 text-green-700' 
                                      : turno.estado === 'cancelado'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {turno.estado}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEliminarTurno(turno);
                                  }}
                                  disabled={eliminandoTurno === turno.id}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                  title="Eliminar turno"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {turnosPacientes[paciente.id] && turnosPacientes[paciente.id].length === 0 && (
                          <p className="text-xs text-gray-500 italic">No hay turnos futuros programados</p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      {onAbrirFichaMedica && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAbrirFichaMedica(paciente);
                          }}
                          className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition shadow-sm hover:shadow-md"
                          title="Ver ficha médica"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

