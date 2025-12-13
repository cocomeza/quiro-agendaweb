'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { Paciente, TurnoConPaciente, TurnoConPago } from '@/lib/supabase/types';
import { X, User, FileText, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import { obtenerMensajeError, esErrorDeRed } from '@/lib/validaciones';

const FRANJAS_HORARIAS = [
  '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45',
];

interface ModalTurnoProps {
  turno: TurnoConPago | null;
  pacientes: Paciente[];
  fecha: Date;
  onClose: () => void;
}

export default function ModalTurno({ turno, pacientes, fecha, onClose, onAbrirModalPaciente, onAbrirFichaMedica }: ModalTurnoProps) {
  const [pacienteId, setPacienteId] = useState('');
  const [hora, setHora] = useState('');
  const [fechaTurno, setFechaTurno] = useState(fecha);
  const [estado, setEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');
  const [pago, setPago] = useState<'pagado' | 'impago'>('impago');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fechaOriginal, setFechaOriginal] = useState<string>('');
  const [horaOriginal, setHoraOriginal] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    if (turno) {
      setPacienteId(turno.paciente_id);
      setHora(turno.hora);
      setFechaTurno(new Date(turno.fecha));
      setEstado(turno.estado as 'programado' | 'completado' | 'cancelado');
      setPago(turno.pago || 'impago');
      setNotas(turno.notas || '');
      // Guardar fecha y hora originales para detectar cambios
      setFechaOriginal(turno.fecha);
      setHoraOriginal(turno.hora);
    } else {
      setPacienteId('');
      setHora('');
      setFechaTurno(fecha);
      setEstado('programado');
      setPago('impago');
      setNotas('');
      setFechaOriginal('');
      setHoraOriginal('');
    }
  }, [turno, fecha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples submits
    if (isSubmitting || loading) return;
    
    setError(null);
    
    // Validaciones del frontend
    if (!pacienteId) {
      setError('Debes seleccionar un paciente');
      return;
    }
    
    if (!hora) {
      setError('Debes seleccionar una hora');
      return;
    }
    
    setLoading(true);
    setIsSubmitting(true);

    try {
      const fechaStr = format(fechaTurno, 'yyyy-MM-dd');

      if (turno) {
        // Verificar si cambió la fecha o la hora
        const fechaCambio = fechaStr !== fechaOriginal;
        const horaCambio = hora !== horaOriginal;
        
        // Si cambió la fecha o la hora, el slot original se liberará automáticamente
        // porque el turno se moverá a la nueva fecha/hora
        
        // Validar que el nuevo horario no esté ocupado por otro turno
        const { data: turnoExistente, error: checkError } = await supabase
          .from('turnos')
          .select('id')
          .eq('fecha', fechaStr)
          .eq('hora', hora)
          .neq('id', turno.id)
          .maybeSingle();

        if (checkError) throw checkError;
        
        if (turnoExistente) {
          throw new Error('Ya existe un turno en este horario');
        }

        // Actualizar turno existente (incluyendo fecha si cambió)
        // Al actualizar, el slot original (fechaOriginal, horaOriginal) se libera automáticamente
        const { error: updateError } = await supabase
          .from('turnos')
          .update({
            paciente_id: pacienteId,
            fecha: fechaStr,
            hora,
            estado,
            pago,
            notas: notas || null,
          })
          .eq('id', turno.id);

        if (updateError) throw updateError;
        
        // Mensaje informativo si se cambió la fecha o hora
        if (fechaCambio || horaCambio) {
          showSuccess(`✅ Turno actualizado exitosamente. El slot anterior (${format(new Date(fechaOriginal), 'dd/MM/yyyy')} ${horaOriginal}) quedó liberado.`);
        } else {
          showSuccess('✅ Turno actualizado exitosamente');
        }
      } else {
        // Crear nuevo turno
        const { error: insertError } = await supabase
          .from('turnos')
          .insert({
            paciente_id: pacienteId,
            fecha: fechaStr,
            hora,
            estado,
            pago,
            notas: notas || null,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Ya existe un turno en este horario');
          }
          throw insertError;
        }
        showSuccess('✅ Turno creado exitosamente');
      }

      onClose();
    } catch (err: any) {
      const errorMessage = obtenerMensajeError(err);
      setError(errorMessage);
      showError(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!turno) return;
    
    const pacienteNombre = pacientes.find(p => p.id === turno.paciente_id);
    const nombreCompleto = pacienteNombre 
      ? `${pacienteNombre.nombre} ${pacienteNombre.apellido}`
      : 'este paciente';
    
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar el turno de ${nombreCompleto}?\n\n` +
      `Fecha: ${format(new Date(turno.fecha), 'dd/MM/yyyy')}\n` +
      `Hora: ${turno.hora}\n\n` +
      '⚠️ Esta acción NO se puede deshacer.'
    );
    
    if (!confirmacion) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('turnos')
        .delete()
        .eq('id', turno.id);

      if (error) throw error;
      showSuccess('✅ Turno eliminado exitosamente');
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Error al eliminar el turno';
      setError(errorMessage);
      showError(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {turno ? 'Editar Turno' : 'Nuevo Turno'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="paciente" className="block text-sm font-semibold text-gray-900">
                Paciente *
              </label>
              {pacienteId && onAbrirModalPaciente && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const paciente = pacientes.find(p => p.id === pacienteId);
                      if (paciente) {
                        onAbrirModalPaciente(paciente);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition"
                    title="Editar información del paciente"
                  >
                    <User className="w-3 h-3" />
                    Editar
                  </button>
                  {onAbrirFichaMedica && (
                    <button
                      type="button"
                      onClick={() => {
                        const paciente = pacientes.find(p => p.id === pacienteId);
                        if (paciente) {
                          onAbrirFichaMedica(paciente);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition"
                      title="Ver/Editar ficha médica"
                    >
                      <FileText className="w-3 h-3" />
                      Ficha
                    </button>
                  )}
                </div>
              )}
            </div>
            <select
              id="paciente"
              required
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white text-gray-900 font-medium"
            >
              <option value="">Seleccionar paciente</option>
              {pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.nombre} {paciente.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha {turno ? '(al cambiar, el slot original quedará liberado)' : ''}
            </label>
            <input
              id="fecha"
              type="date"
              value={format(fechaTurno, 'yyyy-MM-dd')}
              onChange={(e) => {
                const nuevaFecha = new Date(e.target.value);
                setFechaTurno(nuevaFecha);
              }}
              min={turno ? undefined : format(fecha, 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white text-gray-900 font-medium"
            />
            {turno && format(fechaTurno, 'yyyy-MM-dd') !== fechaOriginal && (
              <p className="mt-1 text-xs text-indigo-600">
                ℹ️ El slot original ({format(new Date(fechaOriginal), 'dd/MM/yyyy')} {horaOriginal}) quedará disponible
              </p>
            )}
          </div>

          <div>
            <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-1">
              Hora * {turno ? '(al cambiar, el slot original quedará liberado)' : ''}
            </label>
            <select
              id="hora"
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full px-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white text-gray-900 font-medium"
            >
              <option value="">Seleccionar hora</option>
              {FRANJAS_HORARIAS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            {turno && hora !== horaOriginal && format(fechaTurno, 'yyyy-MM-dd') === fechaOriginal && (
              <p className="mt-1 text-xs text-indigo-600">
                ℹ️ El slot original ({horaOriginal}) quedará disponible
              </p>
            )}
          </div>

          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
              Estado *
            </label>
            <select
              id="estado"
              required
              value={estado}
              onChange={(e) => setEstado(e.target.value as 'programado' | 'completado' | 'cancelado')}
              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white font-bold text-sm sm:text-base ${
                estado === 'completado' 
                  ? 'border-green-500 text-green-700' 
                  : estado === 'cancelado' 
                  ? 'border-red-500 text-red-700' 
                  : 'border-blue-500 text-blue-700'
              }`}
            >
              <option value="programado" className="text-blue-700 font-bold">Programado</option>
              <option value="completado" className="text-green-700 font-bold">Completado</option>
              <option value="cancelado" className="text-red-700 font-bold">Cancelado</option>
            </select>
          </div>

          <div>
            <label htmlFor="pago" className="block text-sm font-medium text-gray-700 mb-1">
              Pago *
            </label>
            <select
              id="pago"
              required
              value={pago}
              onChange={(e) => setPago(e.target.value as typeof pago)}
              className="w-full px-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white text-gray-900 font-medium"
            >
              <option value="impago">Impago</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>

          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              id="notas"
              rows={3}
              maxLength={1000}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white text-gray-900 font-medium"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation font-semibold shadow-md"
              aria-label={loading ? 'Guardando turno...' : 'Guardar turno'}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            {turno && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2.5 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation font-semibold shadow-md"
              >
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm sm:text-base bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 touch-manipulation font-semibold shadow-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

