'use client';

import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { parsearFechaISO, parsearFechaISOSegura, formatearFechaISO } from '@/lib/utils-fechas';
import { createClient } from '@/lib/supabase/client';
import type { Paciente, TurnoConPaciente, TurnoConPago } from '@/lib/supabase/types';
import { X, User, FileText, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import { obtenerMensajeError, esErrorDeRed } from '@/lib/validaciones';
import { FRANJAS_HORARIAS, calcularProximaFechaSeguimiento } from '@/lib/utils';
import SelectorPaciente from './SelectorPaciente';

interface ModalTurnoProps {
  turno: TurnoConPago | null;
  pacientes: Paciente[];
  fecha: Date;
  onClose: () => void;
  onAbrirModalPaciente?: (paciente?: Paciente) => void;
  onAbrirFichaMedica?: (paciente: Paciente) => void;
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

  // Función helper para formatear fecha original
  const obtenerFechaOriginalFormateada = (): string => {
    if (!fechaOriginal) return '';
    const fechaOriginalDate = parsearFechaISOSegura(fechaOriginal);
    return fechaOriginalDate && !isNaN(fechaOriginalDate.getTime())
      ? format(fechaOriginalDate, 'dd/MM/yyyy')
      : '';
  };

  useEffect(() => {
    if (turno) {
      setPacienteId(turno.paciente_id);
      setHora(turno.hora);
      // Validar y crear la fecha de forma segura usando hora local
      let fechaTurnoDate: Date;
      if (turno.fecha) {
        try {
          fechaTurnoDate = parsearFechaISO(turno.fecha);
        } catch (error) {
          console.error('Error al parsear fecha:', error);
          fechaTurnoDate = fecha; // Usar la fecha por defecto si falla
        }
      } else {
        fechaTurnoDate = new Date();
      }
      // Verificar que la fecha sea válida
      if (isNaN(fechaTurnoDate.getTime())) {
        console.error('Fecha inválida recibida:', turno.fecha);
        setFechaTurno(fecha); // Usar la fecha por defecto si es inválida
      } else {
        setFechaTurno(fechaTurnoDate);
      }
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
      // Validar que la fecha sea válida antes de formatearla
      if (isNaN(fechaTurno.getTime())) {
        setError('La fecha seleccionada no es válida');
        return;
      }
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
        
        // Si el turno se marcó como "completado" y antes no lo estaba, crear turno de seguimiento
        const estadoAnterior = turno.estado;
        const seMarcoComoCompletado = estado === 'completado' && estadoAnterior !== 'completado';
        
        if (seMarcoComoCompletado) {
          try {
            // Calcular fecha de seguimiento (14 días después, evitando domingos)
            const fechaSeguimiento = calcularProximaFechaSeguimiento(fechaTurno);
            const fechaSeguimientoStr = formatearFechaISO(fechaSeguimiento);
            
            // Verificar que no exista ya un turno (de cualquier paciente) en esa fecha/hora
            // Esto evita conflictos con otros pacientes que puedan tener turnos en ese horario
            const { data: turnoOcupado, error: checkSeguimientoError } = await supabase
              .from('turnos')
              .select('id, paciente_id')
              .eq('fecha', fechaSeguimientoStr)
              .eq('hora', hora)
              .maybeSingle();
            
            if (checkSeguimientoError) {
              console.error('Error al verificar turno de seguimiento:', checkSeguimientoError);
            } else if (!turnoOcupado) {
              // No hay ningún turno ocupando ese horario, crear turno de seguimiento automáticamente
              const { error: insertSeguimientoError } = await supabase
                .from('turnos')
                .insert({
                  paciente_id: pacienteId,
                  fecha: fechaSeguimientoStr,
                  hora,
                  estado: 'programado',
                  pago: 'impago',
                  notas: `Turno de seguimiento automático (14 días después del ${format(fechaTurno, 'dd/MM/yyyy')})`,
                });
              
              if (insertSeguimientoError) {
                console.error('Error al crear turno de seguimiento:', insertSeguimientoError);
                // No fallar el proceso principal si hay error al crear seguimiento
              } else {
                const fechaSeguimientoFormateada = format(fechaSeguimiento, 'dd/MM/yyyy');
                showSuccess(`✅ Turno completado. Turno de seguimiento creado automáticamente para el ${fechaSeguimientoFormateada} a las ${hora}`);
              }
            } else {
              // Ya existe un turno ocupando ese horario (puede ser del mismo paciente u otro)
              const fechaSeguimientoFormateada = format(fechaSeguimiento, 'dd/MM/yyyy');
              if (turnoOcupado.paciente_id === pacienteId) {
                // Es del mismo paciente
                showSuccess(`✅ Turno completado. Ya existe un turno programado para este paciente el ${fechaSeguimientoFormateada} a las ${hora}`);
              } else {
                // Es de otro paciente - el horario está ocupado
                showSuccess(`✅ Turno completado. No se pudo crear turno de seguimiento automático: el horario ${fechaSeguimientoFormateada} a las ${hora} ya está ocupado por otro paciente. Puedes crear el turno manualmente en otro horario.`);
              }
            }
          } catch (error) {
            console.error('Error al crear turno de seguimiento:', error);
            // No fallar el proceso principal
          }
        }
        
        // Mensaje informativo si se cambió la fecha o hora (solo si no se marcó como completado)
        if ((fechaCambio || horaCambio) && !seMarcoComoCompletado) {
          const fechaOriginalFormateada = obtenerFechaOriginalFormateada();
          showSuccess(`✅ Turno actualizado exitosamente. El slot anterior (${fechaOriginalFormateada} ${horaOriginal}) quedó liberado.`);
        } else if (!seMarcoComoCompletado) {
          showSuccess('✅ Turno actualizado exitosamente');
        }
        // Si se marcó como completado, el mensaje ya se mostró arriba con información del seguimiento
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

      // Cerrar el modal después de guardar exitosamente
      // El estado de loading se reseteará en el finally block
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
    
      // Parsear fecha como hora local para evitar problemas de zona horaria
      const fechaDate = parsearFechaISOSegura(turno.fecha);
      const fechaFormateada = fechaDate && !isNaN(fechaDate.getTime())
        ? format(fechaDate, 'dd/MM/yyyy')
        : 'Fecha no disponible';
      const confirmacion = window.confirm(
        `¿Estás seguro de que deseas eliminar el turno de ${nombreCompleto}?\n\n` +
        `Fecha: ${fechaFormateada}\n` +
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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      data-testid="modal-turno-overlay"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        data-testid="modal-turno"
      >
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 
            className="text-lg sm:text-xl font-semibold text-gray-900"
            data-testid="modal-turno-titulo"
          >
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
            <SelectorPaciente
              pacientes={pacientes}
              value={pacienteId}
              onChange={setPacienteId}
              required
              disabled={loading}
            />
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
                // Parsear fecha como hora local para evitar problemas de zona horaria
                const fechaStr = e.target.value;
                if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  const [año, mes, dia] = fechaStr.split('-').map(Number);
                  const nuevaFecha = new Date(año, mes - 1, dia); // mes es 0-indexed
                  setFechaTurno(nuevaFecha);
                } else {
                  setFechaTurno(new Date(e.target.value));
                }
              }}
              min={turno ? undefined : format(fecha, 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white text-gray-900 font-semibold"
            />
            {turno && !isNaN(fechaTurno.getTime()) && format(fechaTurno, 'yyyy-MM-dd') !== fechaOriginal && (
              <p className="mt-1 text-xs text-indigo-600">
                ℹ️ El slot original ({obtenerFechaOriginalFormateada()} {horaOriginal}) quedará disponible
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
            {turno && hora !== horaOriginal && !isNaN(fechaTurno.getTime()) && format(fechaTurno, 'yyyy-MM-dd') === fechaOriginal && (
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
              <option value="programado" className="text-blue-700 font-bold">Pendiente</option>
              <option value="completado" className="text-green-700 font-bold">Atendido</option>
              <option value="cancelado" className="text-red-700 font-bold">Anulado</option>
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
              className="w-full px-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white text-gray-900 placeholder:text-gray-600 placeholder:font-medium font-medium"
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

