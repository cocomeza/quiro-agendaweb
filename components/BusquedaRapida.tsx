'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import type { Paciente } from '@/lib/supabase/types';

interface BusquedaRapidaProps {
  pacientes: Paciente[];
  onSeleccionarPaciente: (paciente: Paciente) => void;
  placeholder?: string;
}

export default function BusquedaRapida({
  pacientes,
  onSeleccionarPaciente,
  placeholder = 'Buscar paciente por nombre, apellido o teléfono...',
}: BusquedaRapidaProps) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return [];

    const termino = busqueda.toLowerCase().trim();
    return pacientes
      .filter(p => {
        const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
        const telefono = p.telefono?.toLowerCase() || '';
        return nombreCompleto.includes(termino) || telefono.includes(termino);
      })
      .slice(0, 10); // Limitar a 10 resultados
  }, [busqueda, pacientes]);

  const handleSeleccionar = (paciente: Paciente) => {
    onSeleccionarPaciente(paciente);
    setBusqueda('');
    setMostrarResultados(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setMostrarResultados(true);
          }}
          onFocus={() => setMostrarResultados(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 text-base border-2 border-gray-400 rounded-lg bg-white text-gray-900 placeholder:text-gray-600 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
        />
        {busqueda && (
          <button
            onClick={() => {
              setBusqueda('');
              setMostrarResultados(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {mostrarResultados && resultados.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {resultados.map((paciente) => (
            <button
              key={paciente.id}
              onClick={() => handleSeleccionar(paciente)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
            >
              <div className="font-medium text-gray-900">
                {paciente.apellido}, {paciente.nombre}
              </div>
              {paciente.telefono && (
                <div className="text-sm text-gray-600 mt-1">{paciente.telefono}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {mostrarResultados && busqueda && resultados.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-600 font-medium">
          No se encontraron pacientes
        </div>
      )}
    </div>
  );
}

