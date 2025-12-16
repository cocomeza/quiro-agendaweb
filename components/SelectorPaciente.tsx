'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import type { Paciente } from '@/lib/supabase/types';

interface SelectorPacienteProps {
  pacientes: Paciente[];
  value: string; // ID del paciente seleccionado
  onChange: (pacienteId: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function SelectorPaciente({
  pacientes,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = 'Buscar paciente por nombre, apellido o teléfono...',
}: SelectorPacienteProps) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Obtener el paciente seleccionado
  const pacienteSeleccionado = useMemo(() => {
    return pacientes.find(p => p.id === value);
  }, [pacientes, value]);

  // Filtrar pacientes según la búsqueda
  const resultados = useMemo(() => {
    if (!busqueda.trim()) {
      // Si no hay búsqueda, mostrar todos los pacientes (limitado a 20 para rendimiento)
      return pacientes.slice(0, 20);
    }

    const termino = busqueda.toLowerCase().trim();
    return pacientes
      .filter(p => {
        const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
        const telefono = p.telefono?.toLowerCase() || '';
        const nombre = p.nombre?.toLowerCase() || '';
        const apellido = p.apellido?.toLowerCase() || '';
        
        return nombreCompleto.includes(termino) || 
               telefono.includes(termino) ||
               nombre.includes(termino) ||
               apellido.includes(termino);
      })
      .slice(0, 15); // Limitar a 15 resultados
  }, [busqueda, pacientes]);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSeleccionar = (paciente: Paciente) => {
    onChange(paciente.id);
    setBusqueda('');
    setMostrarResultados(false);
  };

  const handleLimpiar = () => {
    onChange('');
    setBusqueda('');
    setMostrarResultados(false);
  };

  // Actualizar búsqueda cuando cambia el paciente seleccionado
  useEffect(() => {
    if (pacienteSeleccionado && !busqueda) {
      setBusqueda(`${pacienteSeleccionado.nombre} ${pacienteSeleccionado.apellido}`);
    } else if (!value && busqueda && !mostrarResultados) {
      // Si se deseleccionó, limpiar búsqueda
      setBusqueda('');
    }
  }, [value, pacienteSeleccionado]);

  return (
    <div ref={contenedorRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setMostrarResultados(true);
            // Si hay búsqueda pero no hay selección, limpiar selección
            if (value && e.target.value !== `${pacienteSeleccionado?.nombre} ${pacienteSeleccionado?.apellido}`) {
              onChange('');
            }
          }}
          onFocus={() => {
            setMostrarResultados(true);
            // Si hay un paciente seleccionado, mostrar su nombre en la búsqueda
            if (pacienteSeleccionado && !busqueda) {
              setBusqueda(`${pacienteSeleccionado.nombre} ${pacienteSeleccionado.apellido}`);
            }
          }}
          placeholder={pacienteSeleccionado ? `${pacienteSeleccionado.nombre} ${pacienteSeleccionado.apellido}` : placeholder}
          required={required}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 bg-white text-gray-900 font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {(busqueda || value) && !disabled && (
          <button
            type="button"
            onClick={handleLimpiar}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            aria-label="Limpiar selección"
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
              type="button"
              onClick={() => handleSeleccionar(paciente)}
              className={`w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition ${
                value === paciente.id ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {paciente.apellido}, {paciente.nombre}
                  </div>
                  {paciente.telefono && (
                    <div className="text-sm text-gray-600 mt-0.5">{paciente.telefono}</div>
                  )}
                </div>
                {value === paciente.id && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0"></div>
                )}
              </div>
            </button>
          ))}
          {resultados.length === 15 && busqueda && (
            <div className="px-4 py-2 text-xs text-gray-500 text-center border-t border-gray-100">
              Mostrando 15 resultados. Refina tu búsqueda para más opciones.
            </div>
          )}
        </div>
      )}

      {mostrarResultados && busqueda && resultados.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No se encontraron pacientes
        </div>
      )}

      {/* Input hidden para validación HTML5 */}
      <input
        type="hidden"
        value={value}
        required={required}
      />
    </div>
  );
}
