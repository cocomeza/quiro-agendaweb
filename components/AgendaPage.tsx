'use client';

import { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { TurnoConPaciente, Paciente } from '@/lib/supabase/types';
import AgendaDiaria from './AgendaDiaria';
import ModalTurno from './ModalTurno';
import ModalPaciente from './ModalPaciente';
import ListaPacientes from './ListaPacientes';
import SeguimientoPacientes from './SeguimientoPacientes';
import FichaMedica from './FichaMedica';
import { Calendar, Users, LogOut, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Tipos ya importados desde @/lib/supabase/types

export default function AgendaPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [turnos, setTurnos] = useState<TurnoConPaciente[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'agenda' | 'pacientes' | 'seguimiento'>('agenda');
  const [modalTurnoAbierto, setModalTurnoAbierto] = useState(false);
  const [modalPacienteAbierto, setModalPacienteAbierto] = useState(false);
  const [fichaMedicaAbierta, setFichaMedicaAbierta] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<TurnoConPaciente | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    cargarDatos();
  }, [fechaSeleccionada]);

  // Limpiar modales cuando se cierran
  useEffect(() => {
    if (!modalTurnoAbierto) {
      setTurnoSeleccionado(null);
    }
  }, [modalTurnoAbierto]);

  useEffect(() => {
    if (!modalPacienteAbierto) {
      setPacienteSeleccionado(null);
    }
  }, [modalPacienteAbierto]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');

      // Cargar turnos del día (incluyendo campo pago y relación con pacientes)
      const { data: turnosData, error: turnosError } = await supabase
        .from('turnos')
        .select('*, pacientes(*)')
        .eq('fecha', fechaStr)
        .order('hora', { ascending: true });

      if (turnosError) throw turnosError;

      // Cargar todos los pacientes
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes')
        .select('*')
        .order('apellido', { ascending: true })
        .order('nombre', { ascending: true });

      if (pacientesError) throw pacientesError;

      // Mapear los datos correctamente: Supabase devuelve pacientes como objeto en la relación
      const turnosMapeados: TurnoConPaciente[] = (turnosData || []).map((turno: any) => ({
        ...turno,
        pacientes: Array.isArray(turno.pacientes) ? turno.pacientes[0] : turno.pacientes,
      }));

      setTurnos(turnosMapeados);
      setPacientes((pacientesData as Paciente[]) || []);
      // Logger removido para producción
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      // Error manejado silenciosamente en producción
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const abrirModalTurno = (turno?: TurnoConPaciente) => {
    setTurnoSeleccionado(turno || null);
    setModalTurnoAbierto(true);
  };

  const cerrarModalTurno = () => {
    setModalTurnoAbierto(false);
    setTurnoSeleccionado(null);
    cargarDatos();
  };

  const abrirModalPaciente = (paciente?: Paciente) => {
    setPacienteSeleccionado(paciente || null);
    setModalPacienteAbierto(true);
  };

  const cerrarModalPaciente = () => {
    setModalPacienteAbierto(false);
    setPacienteSeleccionado(null);
    cargarDatos();
  };

  const abrirFichaMedica = (paciente: Paciente) => {
    setPacienteSeleccionado(paciente);
    setFichaMedicaAbierta(true);
  };

  const cerrarFichaMedica = () => {
    setFichaMedicaAbierta(false);
    setPacienteSeleccionado(null);
    cargarDatos();
  };

  const cambiarFecha = (dias: number) => {
    setFechaSeleccionada(addDays(fechaSeleccionada, dias));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
              Gestión de Turnos
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={() => setVista('agenda')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition ${
                vista === 'agenda'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda</span>
            </button>
            <button
              onClick={() => setVista('pacientes')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition ${
                vista === 'pacientes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pacientes</span>
            </button>
            <button
              onClick={() => setVista('seguimiento')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition ${
                vista === 'seguimiento'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Seguimiento</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        {vista === 'agenda' ? (
          <AgendaDiaria
            fechaSeleccionada={fechaSeleccionada}
            turnos={turnos}
            pacientes={pacientes}
            loading={loading}
            onCambiarFecha={cambiarFecha}
            onAbrirModalTurno={abrirModalTurno}
            onAbrirModalPaciente={abrirModalPaciente}
          />
        ) : vista === 'pacientes' ? (
          <ListaPacientes
            pacientes={pacientes}
            loading={loading}
            onAbrirModalPaciente={abrirModalPaciente}
            onAbrirFichaMedica={abrirFichaMedica}
          />
        ) : (
          <SeguimientoPacientes />
        )}
      </main>

      {/* Modales */}
      {modalTurnoAbierto && (
        <ModalTurno
          turno={turnoSeleccionado}
          pacientes={pacientes}
          fecha={fechaSeleccionada}
          onClose={cerrarModalTurno}
        />
      )}

      {modalPacienteAbierto && (
        <ModalPaciente
          paciente={pacienteSeleccionado}
          onClose={cerrarModalPaciente}
          onAbrirFichaMedica={abrirFichaMedica}
        />
      )}

      {fichaMedicaAbierta && pacienteSeleccionado && (
        <FichaMedica
          paciente={pacienteSeleccionado}
          onClose={cerrarFichaMedica}
        />
      )}
    </div>
  );
}

