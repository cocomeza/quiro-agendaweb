'use client';

import type { Paciente } from '@/lib/supabase/types';
import { Plus, Search, Phone, Mail, FileText, Download, Copy } from 'lucide-react';
import { useState } from 'react';
import { exportarPacientesCSV, exportarPacientesJSON } from '@/lib/export-pacientes';
import { showSuccess, showError } from '@/lib/toast';
import { copiarAlPortapapeles } from '@/lib/utils';

interface ListaPacientesProps {
  pacientes: Paciente[];
  loading: boolean;
  onAbrirModalPaciente: (paciente?: Paciente) => void;
  onAbrirFichaMedica?: (paciente: Paciente) => void;
}

export default function ListaPacientes({
  pacientes,
  loading,
  onAbrirModalPaciente,
  onAbrirFichaMedica,
}: ListaPacientesProps) {
  const [busqueda, setBusqueda] = useState('');

  const pacientesFiltrados = pacientes.filter((paciente) => {
    const termino = busqueda.toLowerCase();
    return (
      paciente.nombre.toLowerCase().includes(termino) ||
      paciente.apellido.toLowerCase().includes(termino) ||
      paciente.telefono?.toLowerCase().includes(termino) ||
      paciente.email?.toLowerCase().includes(termino)
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
            placeholder="Buscar por nombre, apellido, teléfono o email..."
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
          <div className="divide-y">
            {pacientesFiltrados.map((paciente) => (
              <div
                key={paciente.id}
                className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onAbrirModalPaciente(paciente)}
                  >
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      {paciente.nombre} {paciente.apellido}
                    </h3>
                    <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      {paciente.telefono && (
                        <div className="flex items-center gap-1 group">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="break-all">{paciente.telefono}</span>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const copiado = await copiarAlPortapapeles(paciente.telefono || '');
                              if (copiado) {
                                showSuccess('✅ Teléfono copiado al portapapeles');
                              } else {
                                showError('❌ Error al copiar teléfono');
                              }
                            }}
                            className="ml-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition"
                            title="Copiar teléfono"
                          >
                            <Copy className="w-3 h-3 text-gray-600" />
                          </button>
                          <a
                            href={`tel:${paciente.telefono}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-100 rounded transition"
                            title="Llamar"
                          >
                            <Phone className="w-3 h-3 text-blue-600" />
                          </a>
                        </div>
                      )}
                      {paciente.email && (
                        <div className="flex items-center gap-1 min-w-0">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="break-all truncate">{paciente.email}</span>
                        </div>
                      )}
                      {paciente.fecha_nacimiento && (
                        <div>
                          Nacimiento: {new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR')}
                        </div>
                      )}
                    </div>
                    {paciente.notas && (
                      <p className="mt-2 text-xs sm:text-sm text-gray-500 line-clamp-2">
                        {paciente.notas}
                      </p>
                    )}
                  </div>
                  {onAbrirFichaMedica && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbrirFichaMedica(paciente);
                      }}
                      className="flex-shrink-0 p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                      title="Ver ficha médica"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

