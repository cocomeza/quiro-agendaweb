'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PacienteConFichaMedica } from '@/lib/supabase/types';
import { X, FileText, Save, Printer } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import { obtenerMensajeError } from '@/lib/validaciones';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface FichaMedicaProps {
  paciente: PacienteConFichaMedica;
  onClose: () => void;
}

export default function FichaMedica({ paciente, onClose }: FichaMedicaProps) {
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [antecedentesMedicos, setAntecedentesMedicos] = useState('');
  const [medicamentosActuales, setMedicamentosActuales] = useState('');
  const [alergias, setAlergias] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [planTratamiento, setPlanTratamiento] = useState('');
  const [observacionesMedicas, setObservacionesMedicas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Cargar datos de la ficha médica
    if (paciente) {
      setMotivoConsulta(paciente.motivo_consulta || '');
      setAntecedentesMedicos(paciente.antecedentes_medicos || '');
      setMedicamentosActuales(paciente.medicamentos_actuales || '');
      setAlergias(paciente.alergias || '');
      setDiagnostico(paciente.diagnostico || '');
      setPlanTratamiento(paciente.plan_tratamiento || '');
      setObservacionesMedicas(paciente.observaciones_medicas || '');
    }
  }, [paciente]);

  const handleImprimir = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples submits
    if (isSubmitting || loading) return;
    
    setError(null);
    setLoading(true);
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('pacientes')
        .update({
          motivo_consulta: motivoConsulta || null,
          antecedentes_medicos: antecedentesMedicos || null,
          medicamentos_actuales: medicamentosActuales || null,
          alergias: alergias || null,
          diagnostico: diagnostico || null,
          plan_tratamiento: planTratamiento || null,
          observaciones_medicas: observacionesMedicas || null,
        })
        .eq('id', paciente.id);

      if (updateError) throw updateError;
      showSuccess('✅ Ficha médica guardada exitosamente');
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

  // Calcular edad si tiene fecha de nacimiento
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

  return (
    <>
      {/* Vista de impresión (solo visible al imprimir) */}
      <div className="print-ficha-medica hidden print:block">
        <div className="p-8">
          {/* Encabezado de impresión */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ficha Médica
            </h1>
            <p className="text-xl text-gray-700">
              {paciente.apellido}, {paciente.nombre}
            </p>
            {paciente.numero_ficha && (
              <p className="text-lg text-gray-600 mt-2">
                N° Ficha: {paciente.numero_ficha}
              </p>
            )}
          </div>

          {/* Información del paciente */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Nombre completo:</span> {paciente.apellido}, {paciente.nombre}
            </div>
            {paciente.fecha_nacimiento && (
              <div>
                <span className="font-semibold">Fecha de nacimiento:</span> {format(new Date(paciente.fecha_nacimiento), 'dd/MM/yyyy', { locale: es })}
              </div>
            )}
            {calcularEdad() !== null && (
              <div>
                <span className="font-semibold">Edad:</span> {calcularEdad()} años
              </div>
            )}
            {paciente.telefono && (
              <div>
                <span className="font-semibold">Teléfono:</span> {paciente.telefono}
              </div>
            )}
            {paciente.email && (
              <div>
                <span className="font-semibold">Email:</span> {paciente.email}
              </div>
            )}
            {paciente.dni && (
              <div>
                <span className="font-semibold">DNI:</span> {paciente.dni}
              </div>
            )}
            {paciente.direccion && (
              <div className="col-span-2">
                <span className="font-semibold">Domicilio:</span> {paciente.direccion}
              </div>
            )}
          </div>

          {/* Contenido de la ficha médica */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                Motivo de Consulta
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{motivoConsulta || 'No especificado'}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                Antecedentes Médicos
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{antecedentesMedicos || 'No especificado'}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                Medicamentos Actuales
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{medicamentosActuales || 'No especificado'}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                Alergias
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{alergias || 'No especificado'}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                Diagnóstico
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{diagnostico || 'No especificado'}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                Plan de Tratamiento
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{planTratamiento || 'No especificado'}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                Observaciones Médicas
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{observacionesMedicas || 'No especificado'}</p>
            </div>
          </div>

          {/* Pie de página */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Impreso el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
          </div>
        </div>
      </div>

      {/* Vista normal (oculta al imprimir) */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 no-print">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-indigo-50">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Ficha Médica - {paciente.apellido}, {paciente.nombre}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Puedes editar y actualizar la información médica del paciente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImprimir}
                className="p-2 hover:bg-gray-200 rounded-md transition"
                aria-label="Imprimir ficha médica"
                title="Imprimir ficha médica"
              >
                <Printer className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-md transition"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 text-red-800 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Motivo de Consulta */}
            <div>
              <label htmlFor="motivo_consulta" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Motivo de Consulta
              </label>
              <textarea
                id="motivo_consulta"
                rows={3}
                value={motivoConsulta}
                onChange={(e) => setMotivoConsulta(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describa el motivo principal de consulta..."
              />
            </div>

            {/* Antecedentes Médicos */}
            <div>
              <label htmlFor="antecedentes_medicos" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Antecedentes Médicos
              </label>
              <textarea
                id="antecedentes_medicos"
                rows={4}
                value={antecedentesMedicos}
                onChange={(e) => setAntecedentesMedicos(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enfermedades previas, cirugías, lesiones anteriores..."
              />
            </div>

            {/* Medicamentos Actuales */}
            <div>
              <label htmlFor="medicamentos_actuales" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Medicamentos Actuales
              </label>
              <textarea
                id="medicamentos_actuales"
                rows={3}
                value={medicamentosActuales}
                onChange={(e) => setMedicamentosActuales(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Lista de medicamentos que el paciente está tomando actualmente..."
              />
            </div>

            {/* Alergias */}
            <div>
              <label htmlFor="alergias" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Alergias
              </label>
              <textarea
                id="alergias"
                rows={2}
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Alergias conocidas (medicamentos, alimentos, etc.)..."
              />
            </div>

            {/* Diagnóstico */}
            <div>
              <label htmlFor="diagnostico" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Diagnóstico
              </label>
              <textarea
                id="diagnostico"
                rows={4}
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Diagnóstico establecido..."
              />
            </div>

            {/* Plan de Tratamiento */}
            <div>
              <label htmlFor="plan_tratamiento" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Plan de Tratamiento
              </label>
              <textarea
                id="plan_tratamiento"
                rows={4}
                value={planTratamiento}
                onChange={(e) => setPlanTratamiento(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Plan de tratamiento establecido..."
              />
            </div>

            {/* Observaciones Médicas */}
            <div>
              <label htmlFor="observaciones_medicas" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Observaciones Médicas
              </label>
              <textarea
                id="observaciones_medicas"
                rows={4}
                value={observacionesMedicas}
                onChange={(e) => setObservacionesMedicas(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Observaciones adicionales sobre el paciente..."
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6 mt-6 border-t">
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
              aria-label={loading ? 'Guardando ficha médica...' : 'Guardar ficha médica'}
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Ficha Médica'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || isSubmitting}
              className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50 text-base font-medium"
              aria-label="Cancelar y cerrar ficha médica"
            >
              Cancelar
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

