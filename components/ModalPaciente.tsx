'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Paciente } from '@/lib/supabase/types';
import { X, FileText } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import { validarEmail, validarTelefono, obtenerMensajeError, esErrorDeRed } from '@/lib/validaciones';

interface ModalPacienteProps {
  paciente: Paciente | null;
  onClose: () => void;
  onAbrirFichaMedica?: (paciente: Paciente) => void;
}

export default function ModalPaciente({ paciente, onClose, onAbrirFichaMedica }: ModalPacienteProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (paciente) {
      setNombre(paciente.nombre);
      setApellido(paciente.apellido);
      setTelefono(paciente.telefono || '');
      setEmail(paciente.email || '');
      setFechaNacimiento(paciente.fecha_nacimiento || '');
      setNotas(paciente.notas || '');
    } else {
      setNombre('');
      setApellido('');
      setTelefono('');
      setEmail('');
      setFechaNacimiento('');
      setNotas('');
    }
  }, [paciente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples submits
    if (isSubmitting || loading) return;
    
    setError(null);
    
    // Validaciones del frontend
    if (!nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    
    if (!apellido.trim()) {
      setError('El apellido es requerido');
      return;
    }
    
    if (email && !validarEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }
    
    if (telefono && !validarTelefono(telefono)) {
      setError('Por favor ingresa un teléfono válido (mínimo 8 dígitos)');
      return;
    }
    
    setLoading(true);
    setIsSubmitting(true);

    try {
      if (paciente) {
        // Actualizar paciente existente
        const { error: updateError } = await supabase
          .from('pacientes')
          .update({
            nombre,
            apellido,
            telefono: telefono || null,
            email: email || null,
            fecha_nacimiento: fechaNacimiento || null,
            notas: notas || null,
          })
          .eq('id', paciente.id);

        if (updateError) throw updateError;
        showSuccess('✅ Paciente actualizado exitosamente');
      } else {
        // Crear nuevo paciente
        const { error: insertError } = await supabase
          .from('pacientes')
          .insert({
            nombre,
            apellido,
            telefono: telefono || null,
            email: email || null,
            fecha_nacimiento: fechaNacimiento || null,
            notas: notas || null,
          });

        if (insertError) throw insertError;
        showSuccess('✅ Paciente creado exitosamente');
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
    if (!paciente) return;
    
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${paciente.nombre} ${paciente.apellido}?\n\n` +
      '⚠️ ADVERTENCIA: Esto también eliminará TODOS los turnos asociados a este paciente.\n\n' +
      'Esta acción NO se puede deshacer.'
    );
    
    if (!confirmacion) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', paciente.id);

      if (error) throw error;
      showSuccess('✅ Paciente eliminado exitosamente');
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Error al eliminar el paciente';
      setError(errorMessage);
      showError(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {paciente ? 'Editar Paciente' : 'Nuevo Paciente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              id="nombre"
              type="text"
              required
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              id="apellido"
              type="text"
              required
              maxLength={100}
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              maxLength={20}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento
            </label>
            <input
              id="fechaNacimiento"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              id="notas"
              rows={4}
              maxLength={1000}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Notas sobre el paciente..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="flex gap-3 flex-1">
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
                aria-label={loading ? 'Guardando paciente...' : 'Guardar paciente'}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              {paciente && onAbrirFichaMedica && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAbrirFichaMedica(paciente);
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 text-base font-medium"
                  title="Ver ficha médica"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Ficha Médica</span>
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {paciente && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
                >
                  Eliminar
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50 text-base font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

