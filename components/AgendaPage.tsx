'use client';

import { useEffect, useState, startTransition } from 'react';
import { format, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { TurnoConPaciente, Paciente } from '@/lib/supabase/types';
import AgendaDiaria from './AgendaDiaria';
import VistaCalendario from './VistaCalendario';
import ModalTurno from './ModalTurno';
import ModalPaciente from './ModalPaciente';
import ListaPacientes from './ListaPacientes';
import SeguimientoPacientes from './SeguimientoPacientes';
import FichaMedica from './FichaMedica';
import { Calendar, Users, LogOut, TrendingUp, Grid3x3, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth } from 'date-fns';

// Tipos ya importados desde @/lib/supabase/types

export default function AgendaPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [turnos, setTurnos] = useState<TurnoConPaciente[]>([]);
  const [turnosMes, setTurnosMes] = useState<TurnoConPaciente[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'agenda' | 'pacientes' | 'seguimiento'>('agenda');
  const [vistaAgenda, setVistaAgenda] = useState<'diaria' | 'calendario'>('diaria');
  const [modalTurnoAbierto, setModalTurnoAbierto] = useState(false);
  const [modalPacienteAbierto, setModalPacienteAbierto] = useState(false);
  const [fichaMedicaAbierta, setFichaMedicaAbierta] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<TurnoConPaciente | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSeleccionada]);

  // Limpiar modales cuando se cierran
  useEffect(() => {
    if (!modalTurnoAbierto) {
      // Solo limpiar el turno seleccionado si el modal se cerró
      // No hacerlo inmediatamente para evitar conflictos con el cierre
      const timer = setTimeout(() => {
        setTurnoSeleccionado(null);
      }, 100);
      return () => clearTimeout(timer);
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
        .select(`
          *,
          pacientes (
            id,
            nombre,
            apellido,
            telefono,
            email,
            fecha_nacimiento,
            numero_ficha,
            direccion,
            dni
          )
        `)
        .eq('fecha', fechaStr)
        .order('hora', { ascending: true });

      if (turnosError) throw turnosError;

      // Cargar turnos del mes para la vista calendario
      const inicioMes = startOfMonth(fechaSeleccionada);
      const finMes = endOfMonth(fechaSeleccionada);
      const { data: turnosMesData, error: turnosMesError } = await supabase
        .from('turnos')
        .select('*, pacientes(*)')
        .gte('fecha', format(inicioMes, 'yyyy-MM-dd'))
        .lte('fecha', format(finMes, 'yyyy-MM-dd'))
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (turnosMesError) throw turnosMesError;

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

      const turnosMesMapeados: TurnoConPaciente[] = (turnosMesData || []).map((turno: any) => ({
        ...turno,
        pacientes: Array.isArray(turno.pacientes) ? turno.pacientes[0] : turno.pacientes,
      }));

      setTurnos(turnosMapeados);
      setTurnosMes(turnosMesMapeados);
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
    // Asegurar que el modal se abra correctamente
    // Establecer ambos estados de forma síncrona
    setTurnoSeleccionado(turno || null);
    setModalTurnoAbierto(true);
  };

  const cerrarModalTurno = () => {
    // Asegurar que el modal se cierre correctamente
    // Primero establecer el estado del modal como cerrado
    setModalTurnoAbierto(false);
    // Luego limpiar el turno seleccionado y recargar datos
    // Usar un pequeño delay para asegurar que React procese el cambio de estado del modal primero
    setTimeout(() => {
      setTurnoSeleccionado(null);
      cargarDatos();
    }, 50);
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

  const seleccionarFecha = (fecha: Date) => {
    setFechaSeleccionada(fecha);
    setVistaAgenda('diaria'); // Cambiar a vista diaria cuando se selecciona una fecha
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Gestión de Turnos
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold text-gray-800 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
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
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold border-b-2 transition ${
                vista === 'agenda'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
                  : 'border-transparent text-gray-600 hover:text-gray-800 font-medium'
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
                  : 'border-transparent text-gray-600 hover:text-gray-800 font-medium'
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
          <>
            {/* Selector de vista agenda */}
            <div className="mb-4 flex justify-end gap-2">
              <button
                onClick={() => setVistaAgenda('diaria')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 text-sm sm:text-base font-semibold rounded-lg transition shadow-sm ${
                  vistaAgenda === 'diaria'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Vista Diaria</span>
                <span className="sm:hidden">Diaria</span>
              </button>
              <button
                onClick={() => setVistaAgenda('calendario')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition ${
                  vistaAgenda === 'calendario'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline">Vista Calendario</span>
                <span className="sm:hidden">Calendario</span>
              </button>
            </div>
            {vistaAgenda === 'diaria' ? (
              <AgendaDiaria
                fechaSeleccionada={fechaSeleccionada}
                turnos={turnos}
                pacientes={pacientes}
                loading={loading}
                onCambiarFecha={cambiarFecha}
                onAbrirModalTurno={abrirModalTurno}
                onAbrirModalPaciente={abrirModalPaciente}
              />
            ) : (
              <VistaCalendario
                turnos={turnosMes}
                fechaSeleccionada={fechaSeleccionada}
                onSeleccionarFecha={seleccionarFecha}
                onAbrirModalTurno={abrirModalTurno}
                loading={loading}
              />
            )}
          </>
        ) : vista === 'pacientes' ? (
          <ListaPacientes
            pacientes={pacientes}
            loading={loading}
            onAbrirModalPaciente={abrirModalPaciente}
            onAbrirFichaMedica={abrirFichaMedica}
            onEliminarTurno={async (turnoId) => {
              const { error } = await supabase
                .from('turnos')
                .delete()
                .eq('id', turnoId);
              if (error) throw error;
              cargarDatos();
            }}
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
          onAbrirModalPaciente={abrirModalPaciente}
          onAbrirFichaMedica={abrirFichaMedica}
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

