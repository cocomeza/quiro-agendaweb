'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PacienteConFichaMedica } from '@/lib/supabase/types';
import { X, FileText, Save, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import { obtenerMensajeError } from '@/lib/validaciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface FichaMedicaProps {
  paciente: PacienteConFichaMedica;
  onClose: () => void;
}

// Tipos para la historia de salud
interface HistoriaSalud {
  nacimiento_natural?: boolean;
  nacimiento_cesarea?: boolean;
  golpes_caidas_nino?: boolean;
  accidentes_caidas_golpes?: boolean;
  hace_ejercicios?: boolean;
  tiene_estres?: boolean;
  duerme_boca_arriba?: boolean;
  duerme_de_costado?: boolean;
  duerme_boca_abajo?: boolean;
  intoxicaciones?: boolean;
  cirugias?: boolean;
  cirugias_causa?: string;
  fracturas?: boolean;
  internado?: boolean;
  internado_causa?: string;
  medico_familia?: string;
}

// Tipos para problemas médicos
interface ProblemasMedicos {
  // Enfermedades
  neumonia?: boolean;
  diabetes?: boolean;
  artritis?: boolean;
  poliomelitis?: boolean;
  asma?: boolean;
  tuberculosis?: boolean;
  cancer?: boolean;
  problema_tiroides?: boolean;
  enfermedad_cardiaca?: boolean;
  
  // Músculo-esquelético
  dolor_columna_baja?: boolean;
  dolor_entre_hombros?: boolean;
  dolor_brazo?: boolean;
  dolor_cuello?: boolean;
  debilidad_muscular?: boolean;
  problemas_caminar?: boolean;
  dolor_inmovilidad_articular?: boolean;
  restriccion_movimiento?: boolean;
  crujidos_mandibula?: boolean;
  dificultad_masticacion?: boolean;
  
  // Sistema nervioso
  nerviosismo?: boolean;
  confusion_depresion?: boolean;
  convulsiones?: boolean;
  olvidadizo?: boolean;
  paralisis?: boolean;
  adormecimiento?: boolean;
  desmayos?: boolean;
  frio?: boolean;
  hormigueo_extremidades?: boolean;
  mareo?: boolean;
  
  // General
  dolores_cabeza?: boolean;
  fiebre?: boolean;
  fatiga?: boolean;
  
  // Gastro-intestinal
  constipacion?: boolean;
  diarrea?: boolean;
  problemas_peso?: boolean;
  problemas_higado?: boolean;
  heces_negras_sangre?: boolean;
  nauseas_vomitos_frecuentes?: boolean;
  molestias_abdominales?: boolean;
  problema_vesicula?: boolean;
  
  // Genito-urinario
  problemas_vejiga?: boolean;
  orina_dolorosa_excesiva?: boolean;
  orina_colores_anormales?: boolean;
  
  // Cardio-vascular
  dolor_pecho?: boolean;
  palpitaciones_irregulares?: boolean;
  hipertension_arterial?: boolean;
  problemas_pulmonares_congestion?: boolean;
  hinchazon_tobillos?: boolean;
  falta_aire?: boolean;
  problemas_corazon?: boolean;
  accidente_cerebro_vascular?: boolean;
  varices?: boolean;
  
  // ORL
  problemas_vision?: boolean;
  molestia_garganta?: boolean;
  dificultad_audicion?: boolean;
  zumbido_oidos?: boolean;
  dolor_oidos?: boolean;
  nariz_tapada?: boolean;
  
  // Femenino
  irregularidad_menstrual?: boolean;
  molestias_menstruales?: boolean;
  tiene_hijos?: boolean;
  cantidad_hijos?: string;
  esta_embarazada?: boolean;
  no_segura_embarazada?: boolean;
}

export default function FichaMedica({ paciente, onClose }: FichaMedicaProps) {
  const supabase = createClient();
  
  // Estados para información general
  const [estadoCivil, setEstadoCivil] = useState('');
  const [recomendadoPor, setRecomendadoPor] = useState('');
  const [barrio, setBarrio] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [obraSocial, setObraSocial] = useState('');
  const [telefonoLaboral, setTelefonoLaboral] = useState('');
  const [ocupacionActual, setOcupacionActual] = useState('');
  const [ocupacionesPrevias, setOcupacionesPrevias] = useState('');
  const [hobbiesDeportes, setHobbiesDeportes] = useState('');
  
  // Estados para historia de salud
  const [historiaSalud, setHistoriaSalud] = useState<HistoriaSalud>({});
  
  // Estados para problemas médicos
  const [problemasMedicos, setProblemasMedicos] = useState<ProblemasMedicos>({});
  
  // Estados para campos adicionales existentes
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [antecedentesMedicos, setAntecedentesMedicos] = useState('');
  const [medicamentosActuales, setMedicamentosActuales] = useState('');
  const [alergias, setAlergias] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [planTratamiento, setPlanTratamiento] = useState('');
  const [observacionesMedicas, setObservacionesMedicas] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    informacionGeneral: true,
    historiaSalud: true,
    problemasMedicos: true,
    informacionClinica: false,
  });

  useEffect(() => {
    if (paciente) {
      // Cargar información general
      setEstadoCivil((paciente as any).estado_civil || '');
      setRecomendadoPor((paciente as any).recomendado_por || '');
      setBarrio((paciente as any).barrio || '');
      setCiudad((paciente as any).ciudad || '');
      setProvincia((paciente as any).provincia || '');
      setObraSocial((paciente as any).obra_social || '');
      setTelefonoLaboral((paciente as any).telefono_laboral || '');
      setOcupacionActual((paciente as any).ocupacion_actual || '');
      setOcupacionesPrevias((paciente as any).ocupaciones_previas || '');
      setHobbiesDeportes((paciente as any).hobbies_deportes || '');
      
      // Cargar historia de salud
      if ((paciente as any).historia_salud) {
        setHistoriaSalud((paciente as any).historia_salud);
      }
      
      // Cargar problemas médicos
      if ((paciente as any).problemas_medicos) {
        setProblemasMedicos((paciente as any).problemas_medicos);
      }
      
      // Cargar campos existentes
      setMotivoConsulta(paciente.motivo_consulta || '');
      setAntecedentesMedicos(paciente.antecedentes_medicos || '');
      setMedicamentosActuales(paciente.medicamentos_actuales || '');
      setAlergias(paciente.alergias || '');
      setDiagnostico(paciente.diagnostico || '');
      setPlanTratamiento(paciente.plan_tratamiento || '');
      setObservacionesMedicas(paciente.observaciones_medicas || '');
    }
  }, [paciente]);

  const toggleSeccion = (seccion: string) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

  const actualizarHistoriaSalud = (campo: keyof HistoriaSalud, valor: any) => {
    setHistoriaSalud(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const actualizarProblemasMedicos = (campo: keyof ProblemasMedicos, valor: boolean | string) => {
    setProblemasMedicos(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

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

  const handleImprimir = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || loading) return;
    
    setError(null);
    setLoading(true);
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('pacientes')
        .update({
          estado_civil: estadoCivil || null,
          recomendado_por: recomendadoPor || null,
          barrio: barrio || null,
          ciudad: ciudad || null,
          provincia: provincia || null,
          obra_social: obraSocial || null,
          telefono_laboral: telefonoLaboral || null,
          ocupacion_actual: ocupacionActual || null,
          ocupaciones_previas: ocupacionesPrevias || null,
          hobbies_deportes: hobbiesDeportes || null,
          historia_salud: historiaSalud,
          problemas_medicos: problemasMedicos,
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

  return (
    <>
      {/* Vista de impresión (solo visible al imprimir) */}
      <div className="print-ficha-medica hidden print:block">
        <div className="p-8">
          {/* Encabezado de impresión */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              QUIROPRAXIA RAMALLO
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              Quiropraxia para el Mundo
            </p>
            <p className="text-lg text-gray-600">
              {paciente.apellido}, {paciente.nombre}
            </p>
            {paciente.numero_ficha && (
              <p className="text-base text-gray-600 mt-2">
                N° Ficha: {paciente.numero_ficha}
              </p>
            )}
          </div>

          {/* Información del paciente para impresión */}
          <div className="mb-6 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Apellido y nombre:</strong> {paciente.apellido}, {paciente.nombre}</div>
              <div><strong>Edad:</strong> {calcularEdad() !== null ? `${calcularEdad()} años` : 'N/A'}</div>
              <div><strong>Fecha de nacimiento:</strong> {paciente.fecha_nacimiento ? format(new Date(paciente.fecha_nacimiento), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</div>
              <div><strong>Estado civil:</strong> {estadoCivil || 'N/A'}</div>
              <div><strong>Recomendado por:</strong> {recomendadoPor || 'N/A'}</div>
              <div><strong>D.N.I:</strong> {paciente.dni || 'N/A'}</div>
              <div className="col-span-2"><strong>Dirección:</strong> {paciente.direccion || 'N/A'}</div>
              <div><strong>Barrio:</strong> {barrio || 'N/A'}</div>
              <div><strong>Ciudad:</strong> {ciudad || 'N/A'}</div>
              <div><strong>Provincia:</strong> {provincia || 'N/A'}</div>
              <div><strong>O.S.:</strong> {obraSocial || 'N/A'}</div>
              <div><strong>Teléfono particular:</strong> {paciente.telefono || 'N/A'}</div>
              <div><strong>Teléfono laboral:</strong> {telefonoLaboral || 'N/A'}</div>
              <div><strong>Ocupación actual:</strong> {ocupacionActual || 'N/A'}</div>
              <div><strong>Ocupaciones previas:</strong> {ocupacionesPrevias || 'N/A'}</div>
              <div><strong>Hobbies / Deportes:</strong> {hobbiesDeportes || 'N/A'}</div>
              <div><strong>Mail:</strong> {paciente.email || 'N/A'}</div>
            </div>
          </div>

          {/* Historia de salud para impresión */}
          {Object.keys(historiaSalud).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2">HISTORIA DE SALUD</h3>
              <div className="space-y-2 text-sm">
                <div>1- Nacimiento: {historiaSalud.nacimiento_natural ? 'Natural ☑' : ''} {historiaSalud.nacimiento_cesarea ? 'Cesárea ☑' : ''}</div>
                <div>2- ¿Tuvo golpes/caídas de niño? {historiaSalud.golpes_caidas_nino ? 'SI ☑' : 'NO ☑'}</div>
                <div>3- ¿Tuvo accidentes, caídas, golpes? {historiaSalud.accidentes_caidas_golpes ? 'SI ☑' : 'NO ☑'}</div>
                <div>4- ¿Hace ejercicios regularmente? {historiaSalud.hace_ejercicios ? 'SI ☑' : 'NO ☑'}</div>
                <div>5- ¿Tiene o siente estrés físico, mental o emocional? {historiaSalud.tiene_estres ? 'SI ☑' : 'NO ☑'}</div>
                <div>6- ¿Cómo duerme? {historiaSalud.duerme_boca_arriba ? 'Boca arriba ☑' : ''} {historiaSalud.duerme_de_costado ? 'De costado ☑' : ''} {historiaSalud.duerme_boca_abajo ? 'Boca abajo ☑' : ''}</div>
                <div>7- ¿Tuvo intoxicaciones? {historiaSalud.intoxicaciones ? 'SI ☑' : 'NO ☑'}</div>
                <div>8- ¿Se realizó cirugías? {historiaSalud.cirugias ? 'SI ☑' : 'NO ☑'} {historiaSalud.cirugias_causa && `Causa: ${historiaSalud.cirugias_causa}`}</div>
                <div>¿Tuvo fracturas? {historiaSalud.fracturas ? 'SI ☑' : 'NO ☑'}</div>
                <div>9- ¿Estuvo internado? {historiaSalud.internado ? 'SI ☑' : 'NO ☑'} {historiaSalud.internado_causa && `Causa: ${historiaSalud.internado_causa}`}</div>
                <div>10- Médico de familia o de cabecera: {historiaSalud.medico_familia || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Problemas médicos para impresión */}
          {Object.keys(problemasMedicos).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2">PROBLEMAS MÉDICOS</h3>
              <div className="text-sm space-y-1">
                {problemasMedicos.neumonia && <div>☑ Neumonía</div>}
                {problemasMedicos.diabetes && <div>☑ Diabetes</div>}
                {problemasMedicos.artritis && <div>☑ Artritis</div>}
                {/* Agregar más según sea necesario */}
              </div>
            </div>
          )}

          {/* Información clínica para impresión */}
          {(motivoConsulta || diagnostico || planTratamiento) && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2">INFORMACIÓN CLÍNICA</h3>
              {motivoConsulta && (
                <div className="mb-3">
                  <strong>Motivo de Consulta:</strong>
                  <p className="whitespace-pre-wrap">{motivoConsulta}</p>
                </div>
              )}
              {diagnostico && (
                <div className="mb-3">
                  <strong>Diagnóstico:</strong>
                  <p className="whitespace-pre-wrap">{diagnostico}</p>
                </div>
              )}
              {planTratamiento && (
                <div>
                  <strong>Plan de Tratamiento:</strong>
                  <p className="whitespace-pre-wrap">{planTratamiento}</p>
                </div>
              )}
            </div>
          )}

          {/* Pie de página */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Impreso el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
          </div>
        </div>
      </div>

      {/* Vista normal (oculta al imprimir) */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 no-print overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col my-4">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  Ficha Médica - {paciente.apellido}, {paciente.nombre}
                </h2>
                <p className="text-sm text-indigo-100 font-medium mt-1">
                  ✏️ Completa la información médica del paciente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImprimir}
                className="p-2 hover:bg-indigo-800 rounded-md transition"
                aria-label="Imprimir ficha médica"
                title="Imprimir ficha médica"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-indigo-800 rounded-md transition"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 text-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Sección: Información General */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSeccion('informacionGeneral')}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-indigo-50 hover:bg-indigo-100 transition rounded-t-lg"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    INFORMACIÓN GENERAL
                  </h3>
                  {seccionesAbiertas.informacionGeneral ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {seccionesAbiertas.informacionGeneral && (
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido y nombre
                      </label>
                      <input
                        type="text"
                        value={`${paciente.apellido}, ${paciente.nombre}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Edad
                      </label>
                      <input
                        type="text"
                        value={calcularEdad() !== null ? `${calcularEdad()} años` : 'N/A'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de nacimiento
                      </label>
                      <input
                        type="text"
                        value={paciente.fecha_nacimiento ? format(new Date(paciente.fecha_nacimiento), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado civil
                      </label>
                      <select
                        value={estadoCivil}
                        onChange={(e) => setEstadoCivil(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Soltero/a">Soltero/a</option>
                        <option value="Casado/a">Casado/a</option>
                        <option value="Divorciado/a">Divorciado/a</option>
                        <option value="Viudo/a">Viudo/a</option>
                        <option value="Unión libre">Unión libre</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recomendado por
                      </label>
                      <input
                        type="text"
                        value={recomendadoPor}
                        onChange={(e) => setRecomendadoPor(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Persona o medio que recomendó"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        D.N.I.
                      </label>
                      <input
                        type="text"
                        value={paciente.dni || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={paciente.direccion || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barrio
                      </label>
                      <input
                        type="text"
                        value={barrio}
                        onChange={(e) => setBarrio(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Barrio"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ciudad"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provincia
                      </label>
                      <input
                        type="text"
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Provincia"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        O.S. (Obra Social)
                      </label>
                      <input
                        type="text"
                        value={obraSocial}
                        onChange={(e) => setObraSocial(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Obra social o seguro médico"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono particular
                      </label>
                      <input
                        type="text"
                        value={paciente.telefono || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono laboral
                      </label>
                      <input
                        type="text"
                        value={telefonoLaboral}
                        onChange={(e) => setTelefonoLaboral(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Teléfono laboral"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ocupación actual
                      </label>
                      <input
                        type="text"
                        value={ocupacionActual}
                        onChange={(e) => setOcupacionActual(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ocupación actual"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ocupaciones previas
                      </label>
                      <input
                        type="text"
                        value={ocupacionesPrevias}
                        onChange={(e) => setOcupacionesPrevias(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ocupaciones previas"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hobbies / Deportes
                      </label>
                      <input
                        type="text"
                        value={hobbiesDeportes}
                        onChange={(e) => setHobbiesDeportes(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Hobbies y deportes"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mail
                      </label>
                      <input
                        type="email"
                        value={paciente.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sección: Historia de Salud */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSeccion('historiaSalud')}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-green-50 hover:bg-green-100 transition rounded-t-lg"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    HISTORIA DE SALUD
                  </h3>
                  {seccionesAbiertas.historiaSalud ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {seccionesAbiertas.historiaSalud && (
                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Pregunta 1 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        1- Nacimiento
                      </label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={historiaSalud.nacimiento_natural || false}
                            onChange={(e) => {
                              actualizarHistoriaSalud('nacimiento_natural', e.target.checked);
                              if (e.target.checked) actualizarHistoriaSalud('nacimiento_cesarea', false);
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Natural</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={historiaSalud.nacimiento_cesarea || false}
                            onChange={(e) => {
                              actualizarHistoriaSalud('nacimiento_cesarea', e.target.checked);
                              if (e.target.checked) actualizarHistoriaSalud('nacimiento_natural', false);
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Cesárea</span>
                        </label>
                      </div>
                    </div>

                    {/* Pregunta 2 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        2- ¿Tuvo golpes o caídas de niño?
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="golpes_caidas_nino"
                            checked={historiaSalud.golpes_caidas_nino === true}
                            onChange={() => actualizarHistoriaSalud('golpes_caidas_nino', true)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">SI</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="golpes_caidas_nino"
                            checked={historiaSalud.golpes_caidas_nino === false}
                            onChange={() => actualizarHistoriaSalud('golpes_caidas_nino', false)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                    </div>

                    {/* Pregunta 3 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        3- ¿Tuvo accidentes, caídas, golpes?
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="accidentes_caidas_golpes"
                            checked={historiaSalud.accidentes_caidas_golpes === true}
                            onChange={() => actualizarHistoriaSalud('accidentes_caidas_golpes', true)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">SI</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="accidentes_caidas_golpes"
                            checked={historiaSalud.accidentes_caidas_golpes === false}
                            onChange={() => actualizarHistoriaSalud('accidentes_caidas_golpes', false)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                    </div>

                    {/* Pregunta 4 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        4- ¿Hace ejercicios regularmente?
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hace_ejercicios"
                            checked={historiaSalud.hace_ejercicios === true}
                            onChange={() => actualizarHistoriaSalud('hace_ejercicios', true)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">SI</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hace_ejercicios"
                            checked={historiaSalud.hace_ejercicios === false}
                            onChange={() => actualizarHistoriaSalud('hace_ejercicios', false)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                    </div>

                    {/* Pregunta 5 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        5- ¿Tiene o siente estrés físico, mental o emocional?
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="tiene_estres"
                            checked={historiaSalud.tiene_estres === true}
                            onChange={() => actualizarHistoriaSalud('tiene_estres', true)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">SI</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="tiene_estres"
                            checked={historiaSalud.tiene_estres === false}
                            onChange={() => actualizarHistoriaSalud('tiene_estres', false)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                    </div>

                    {/* Pregunta 6 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        6- ¿Cómo duerme?
                      </label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={historiaSalud.duerme_boca_arriba || false}
                            onChange={(e) => actualizarHistoriaSalud('duerme_boca_arriba', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Boca arriba</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={historiaSalud.duerme_de_costado || false}
                            onChange={(e) => actualizarHistoriaSalud('duerme_de_costado', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">De costado</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={historiaSalud.duerme_boca_abajo || false}
                            onChange={(e) => actualizarHistoriaSalud('duerme_boca_abajo', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Boca abajo</span>
                        </label>
                      </div>
                    </div>

                    {/* Pregunta 7 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        7- ¿Tuvo intoxicaciones (comidas - remedios - insecticidas - drogas)?
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="intoxicaciones"
                            checked={historiaSalud.intoxicaciones === true}
                            onChange={() => actualizarHistoriaSalud('intoxicaciones', true)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">SI</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="intoxicaciones"
                            checked={historiaSalud.intoxicaciones === false}
                            onChange={() => actualizarHistoriaSalud('intoxicaciones', false)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                    </div>

                    {/* Pregunta 8 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        8- ¿Se realizó cirugías?
                      </label>
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="cirugias"
                            checked={historiaSalud.cirugias === true}
                            onChange={() => actualizarHistoriaSalud('cirugias', true)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">SI</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="cirugias"
                            checked={historiaSalud.cirugias === false}
                            onChange={() => actualizarHistoriaSalud('cirugias', false)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          ¿Tuvo fracturas?
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="fracturas"
                              checked={historiaSalud.fracturas === true}
                              onChange={() => actualizarHistoriaSalud('fracturas', true)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">SI</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="fracturas"
                              checked={historiaSalud.fracturas === false}
                              onChange={() => actualizarHistoriaSalud('fracturas', false)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">NO</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Pregunta 9 */}
                    <div className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        9- ¿Estuvo internado?
                      </label>
                      <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="internado"
                            checked={historiaSalud.internado === true}
                            onChange={() => actualizarHistoriaSalud('internado', true)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">SI</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="internado"
                            checked={historiaSalud.internado === false}
                            onChange={() => actualizarHistoriaSalud('internado', false)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">NO</span>
                        </label>
                      </div>
                      {historiaSalud.internado && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={historiaSalud.internado_causa || ''}
                            onChange={(e) => actualizarHistoriaSalud('internado_causa', e.target.value)}
                            placeholder="Causa de la internación"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Pregunta 10 */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        10- Médico de familia o de cabecera
                      </label>
                      <input
                        type="text"
                        value={historiaSalud.medico_familia || ''}
                        onChange={(e) => actualizarHistoriaSalud('medico_familia', e.target.value)}
                        placeholder="Nombre del médico de familia o de cabecera"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sección: Problemas Médicos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSeccion('problemasMedicos')}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-red-50 hover:bg-red-100 transition rounded-t-lg"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600" />
                    PROBLEMAS MÉDICOS
                  </h3>
                  <span className="text-sm text-gray-600 font-medium">
                    Por favor marque si tuvo o tiene alguno de los siguientes problemas
                  </span>
                  {seccionesAbiertas.problemasMedicos ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {seccionesAbiertas.problemasMedicos && (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* ENFERMEDADES */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        ENFERMEDADES
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'neumonia', label: 'Neumonía' },
                          { key: 'diabetes', label: 'Diabetes' },
                          { key: 'artritis', label: 'Artritis' },
                          { key: 'poliomelitis', label: 'Poliomelitis' },
                          { key: 'asma', label: 'Asma' },
                          { key: 'tuberculosis', label: 'Tuberculosis' },
                          { key: 'cancer', label: 'Cáncer' },
                          { key: 'problema_tiroides', label: 'Problema de tiroides' },
                          { key: 'enfermedad_cardiaca', label: 'Enfermedad cardiaca' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={typeof problemasMedicos[item.key as keyof ProblemasMedicos] === 'boolean' ? (problemasMedicos[item.key as keyof ProblemasMedicos] as boolean) : false}
                              onChange={(e) => actualizarProblemasMedicos(item.key as keyof ProblemasMedicos, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* MÚSCULO - ESQUELETAL */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        MÚSCULO - ESQUELETAL
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'dolor_columna_baja', label: 'Dolor de columna baja' },
                          { key: 'dolor_entre_hombros', label: 'Dolor entre los hombros' },
                          { key: 'dolor_brazo', label: 'Dolor de brazo' },
                          { key: 'dolor_cuello', label: 'Dolor de cuello' },
                          { key: 'debilidad_muscular', label: 'Debilidad muscular' },
                          { key: 'problemas_caminar', label: 'Problemas al caminar' },
                          { key: 'dolor_inmovilidad_articular', label: 'Dolor o inmovilidad articular' },
                          { key: 'restriccion_movimiento', label: 'Restricción de movimiento' },
                          { key: 'crujidos_mandibula', label: 'Crujidos en mandíbula' },
                          { key: 'dificultad_masticacion', label: 'Dificultad con la masticación' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={typeof problemasMedicos[item.key as keyof ProblemasMedicos] === 'boolean' ? (problemasMedicos[item.key as keyof ProblemasMedicos] as boolean) : false}
                              onChange={(e) => actualizarProblemasMedicos(item.key as keyof ProblemasMedicos, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* SISTEMA NERVIOSO */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        SISTEMA NERVIOSO
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'nerviosismo', label: 'Nerviosismo' },
                          { key: 'confusion_depresion', label: 'Confusión / Depresión' },
                          { key: 'convulsiones', label: 'Convulsiones' },
                          { key: 'olvidadizo', label: 'Olvidadizo' },
                          { key: 'paralisis', label: 'Parálisis' },
                          { key: 'adormecimiento', label: 'Adormecimiento' },
                          { key: 'desmayos', label: 'Desmayos' },
                          { key: 'frio', label: 'Frío' },
                          { key: 'hormigueo_extremidades', label: 'Hormigueo en extremidades' },
                          { key: 'mareo', label: 'Mareo' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={typeof problemasMedicos[item.key as keyof ProblemasMedicos] === 'boolean' ? (problemasMedicos[item.key as keyof ProblemasMedicos] as boolean) : false}
                              onChange={(e) => actualizarProblemasMedicos(item.key as keyof ProblemasMedicos, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* GENERAL */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        GENERAL
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'dolores_cabeza', label: 'Dolores de cabeza' },
                          { key: 'fiebre', label: 'Fiebre' },
                          { key: 'fatiga', label: 'Fatiga' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={typeof problemasMedicos[item.key as keyof ProblemasMedicos] === 'boolean' ? (problemasMedicos[item.key as keyof ProblemasMedicos] as boolean) : false}
                              onChange={(e) => actualizarProblemasMedicos(item.key as keyof ProblemasMedicos, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* GASTRO - INTESTINAL */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        GASTRO - INTESTINAL
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'constipacion', label: 'Constipación' },
                          { key: 'diarrea', label: 'Diarrea' },
                          { key: 'problemas_peso', label: 'Problemas de peso' },
                          { key: 'problemas_higado', label: 'Problemas de hígado' },
                          { key: 'heces_negras_sangre', label: 'Heces negras / con sangre' },
                          { key: 'nauseas_vomitos_frecuentes', label: 'Náuseas y vómitos frecuentes' },
                          { key: 'molestias_abdominales', label: 'Molestias abdominales' },
                          { key: 'problema_vesicula', label: 'Problema de vesícula' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={typeof problemasMedicos[item.key as keyof ProblemasMedicos] === 'boolean' ? (problemasMedicos[item.key as keyof ProblemasMedicos] as boolean) : false}
                              onChange={(e) => actualizarProblemasMedicos(item.key as keyof ProblemasMedicos, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* GENITO - URINARIO */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        GENITO - URINARIO
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'problemas_vejiga', label: 'Problemas de vejiga' },
                          { key: 'orina_dolorosa_excesiva', label: 'Orina dolorosa / excesiva' },
                          { key: 'orina_colores_anormales', label: 'Orina con colores anormales' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={typeof problemasMedicos[item.key as keyof ProblemasMedicos] === 'boolean' ? (problemasMedicos[item.key as keyof ProblemasMedicos] as boolean) : false}
                              onChange={(e) => actualizarProblemasMedicos(item.key as keyof ProblemasMedicos, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* CARDIO - VASCULAR */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        CARDIO - VASCULAR
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'dolor_pecho', label: 'Dolor de pecho' },
                          { key: 'palpitaciones_irregulares', label: 'Palpitaciones irregulares' },
                          { key: 'hipertension_arterial', label: 'Hipertensión arterial' },
                          { key: 'problemas_pulmonares_congestion', label: 'Problemas pulmonares / congestión' },
                          { key: 'hinchazon_tobillos', label: 'Hinchazón de los tobillos' },
                          { key: 'falta_aire', label: 'Falta de aire' },
                          { key: 'problemas_corazon', label: 'Problemas de corazón' },
                          { key: 'accidente_cerebro_vascular', label: 'Accidente cerebro-vascular' },
                          { key: 'varices', label: 'Várices' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={typeof problemasMedicos[item.key as keyof ProblemasMedicos] === 'boolean' ? (problemasMedicos[item.key as keyof ProblemasMedicos] as boolean) : false}
                              onChange={(e) => actualizarProblemasMedicos(item.key as keyof ProblemasMedicos, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* ORL */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        ORL (Oído, Nariz, Garganta)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { key: 'problemas_vision', label: 'Problemas de visión' },
                          { key: 'molestia_garganta', label: 'Molestia en garganta' },
                          { key: 'dificultad_audicion', label: 'Dificultad de audición' },
                          { key: 'zumbido_oidos', label: 'Zumbido de oídos' },
                          { key: 'dolor_oidos', label: 'Dolor de oídos' },
                          { key: 'nariz_tapada', label: 'Nariz tapada' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={typeof problemasMedicos[item.key as keyof ProblemasMedicos] === 'boolean' ? (problemasMedicos[item.key as keyof ProblemasMedicos] as boolean) : false}
                              onChange={(e) => actualizarProblemasMedicos(item.key as keyof ProblemasMedicos, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* FEMENINO */}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                        FEMENINO
                      </h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={problemasMedicos.irregularidad_menstrual || false}
                              onChange={(e) => actualizarProblemasMedicos('irregularidad_menstrual', e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Irregularidad menstrual</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition">
                            <input
                              type="checkbox"
                              checked={problemasMedicos.molestias_menstruales || false}
                              onChange={(e) => actualizarProblemasMedicos('molestias_menstruales', e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Molestias menstruales</span>
                          </label>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={problemasMedicos.tiene_hijos || false}
                              onChange={(e) => actualizarProblemasMedicos('tiene_hijos', e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Tiene hijos, ¿cuántos?</span>
                          </label>
                          {problemasMedicos.tiene_hijos && (
                            <input
                              type="text"
                              value={problemasMedicos.cantidad_hijos || ''}
                              onChange={(e) => actualizarProblemasMedicos('cantidad_hijos', e.target.value)}
                              placeholder="Cantidad"
                              className="px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            ¿Está usted embarazada?
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="embarazada"
                                checked={problemasMedicos.esta_embarazada === true}
                                onChange={() => {
                                  actualizarProblemasMedicos('esta_embarazada', true);
                                  actualizarProblemasMedicos('no_segura_embarazada', false);
                                }}
                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">SI</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="embarazada"
                                checked={problemasMedicos.esta_embarazada === false}
                                onChange={() => {
                                  actualizarProblemasMedicos('esta_embarazada', false);
                                  actualizarProblemasMedicos('no_segura_embarazada', false);
                                }}
                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">NO</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="embarazada"
                                checked={problemasMedicos.no_segura_embarazada === true}
                                onChange={() => {
                                  actualizarProblemasMedicos('no_segura_embarazada', true);
                                  actualizarProblemasMedicos('esta_embarazada', false);
                                }}
                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">No estoy segura</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección: Información Clínica */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSeccion('informacionClinica')}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-purple-50 hover:bg-purple-100 transition rounded-t-lg"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    INFORMACIÓN CLÍNICA
                  </h3>
                  {seccionesAbiertas.informacionClinica ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {seccionesAbiertas.informacionClinica && (
                  <div className="p-4 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo de Consulta
                      </label>
                      <textarea
                        rows={3}
                        value={motivoConsulta}
                        onChange={(e) => setMotivoConsulta(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Describa el motivo principal de consulta..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Antecedentes Médicos
                      </label>
                      <textarea
                        rows={4}
                        value={antecedentesMedicos}
                        onChange={(e) => setAntecedentesMedicos(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enfermedades previas, cirugías, lesiones anteriores..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medicamentos Actuales
                      </label>
                      <textarea
                        rows={3}
                        value={medicamentosActuales}
                        onChange={(e) => setMedicamentosActuales(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Lista de medicamentos que el paciente está tomando actualmente..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alergias
                      </label>
                      <textarea
                        rows={2}
                        value={alergias}
                        onChange={(e) => setAlergias(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Alergias conocidas (medicamentos, alimentos, etc.)..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diagnóstico
                      </label>
                      <textarea
                        rows={4}
                        value={diagnostico}
                        onChange={(e) => setDiagnostico(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Diagnóstico establecido..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan de Tratamiento
                      </label>
                      <textarea
                        rows={4}
                        value={planTratamiento}
                        onChange={(e) => setPlanTratamiento(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Plan de tratamiento establecido..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones Médicas
                      </label>
                      <textarea
                        rows={4}
                        value={observacionesMedicas}
                        onChange={(e) => setObservacionesMedicas(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Observaciones adicionales sobre el paciente..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t bg-white p-4 rounded-lg shadow-sm">
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium shadow-md"
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
