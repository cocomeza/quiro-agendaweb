'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { Paciente, TurnoConPaciente, TurnoConPago } from '@/lib/supabase/types';
import { X } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import { obtenerMensajeError, esErrorDeRed } from '@/lib/validaciones';

const FRANJAS_HORARIAS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

interface ModalTurnoProps {
  turno: TurnoConPago | null;
  pacientes: Paciente[];
  fecha: Date;
  onClose: () => void;
}

export default function ModalTurno({ turno, pacientes, fecha, onClose }: ModalTurnoProps) {
  const [pacienteId, setPacienteId] = useState('');
  const [hora, setHora] = useState('');
  const [estado, setEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');
  const [pago, setPago] = useState<'pagado' | 'impago'>('impago');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (turno) {
      setPacienteId(turno.paciente_id);
      setHora(turno.hora);
      setEstado(turno.estado as 'programado' | 'completado' | 'cancelado');
      setPago(turno.pago || 'impago');
      setNotas(turno.notas || '');
    } else {
      setPacienteId('');
      setHora('');
      setEstado('programado');
      setPago('impago');
      setNotas('');
    }
  }, [turno]);

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
      const fechaStr = format(fecha, 'yyyy-MM-dd');

      if (turno) {
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

        // Actualizar turno existente
        const { error: updateError } = await supabase
          .from('turnos')
          .update({
            paciente_id: pacienteId,
            hora,
            estado,
            pago,
            notas: notas || null,
          })
          .eq('id', turno.id);

        if (updateError) throw updateError;
        showSuccess('✅ Turno actualizado exitosamente');
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
            <label htmlFor="paciente" className="block text-sm font-medium text-gray-700 mb-1">
              Paciente *
            </label>
            <select
              id="paciente"
              required
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              Fecha
            </label>
            <input
              id="fecha"
              type="text"
              value={format(fecha, 'dd/MM/yyyy')}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-1">
              Hora *
            </label>
            <select
              id="hora"
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccionar hora</option>
              {FRANJAS_HORARIAS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            >
              <option value="programado">Programado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
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
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              aria-label={loading ? 'Guardando turno...' : 'Guardar turno'}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            {turno && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50 touch-manipulation"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

