/**
 * Copia texto al portapapeles
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = texto;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    console.error('Error al copiar:', err);
    return false;
  }
}

/**
 * Formatea un número de teléfono para mostrar
 */
export function formatearTelefono(telefono: string | null | undefined): string {
  if (!telefono) return '';
  
  // Remover caracteres no numéricos excepto +
  const limpio = telefono.replace(/[^\d+]/g, '');
  
  // Si tiene código de país, formatear mejor
  if (limpio.startsWith('+54')) {
    const sinCodigo = limpio.slice(3);
    if (sinCodigo.length === 10) {
      // Formato: +54 11 1234-5678
      return `+54 ${sinCodigo.slice(0, 2)} ${sinCodigo.slice(2, 6)}-${sinCodigo.slice(6)}`;
    }
  }
  
  return limpio;
}

/**
 * Verifica si un turno está próximo (próximas 2 horas)
 */
export function esTurnoProximo(fecha: string, hora: string): boolean {
  const ahora = new Date();
  const fechaTurno = new Date(`${fecha}T${hora}`);
  
  const diferenciaMs = fechaTurno.getTime() - ahora.getTime();
  const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
  
  // Próximo si está entre ahora y 2 horas más tarde
  return diferenciaHoras >= 0 && diferenciaHoras <= 2;
}

/**
 * Verifica si un turno está atrasado (hora pasada pero estado programado)
 */
export function esTurnoAtrasado(fecha: string, hora: string, estado: string): boolean {
  if (estado !== 'programado') return false;
  
  const ahora = new Date();
  const fechaTurno = new Date(`${fecha}T${hora}`);
  
  return fechaTurno.getTime() < ahora.getTime();
}

/**
 * Genera franjas horarias con intervalos de 5 minutos
 * Desde las 09:00 hasta las 20:00 (8pm) inclusive
 * Solo lunes a viernes
 */
export function generarFranjasHorarias(): string[] {
  const franjas: string[] = [];
  const horaInicio = 9; // 9am
  const horaFin = 20; // 8pm (20:00)
  
  for (let hora = horaInicio; hora <= horaFin; hora++) {
    // Para la última hora (20:00), solo agregar 20:00
    if (hora === horaFin) {
      franjas.push('20:00');
      break;
    }
    
    // Para las demás horas, agregar intervalos de 5 minutos
    for (let minuto = 0; minuto < 60; minuto += 5) {
      const horaStr = hora.toString().padStart(2, '0');
      const minutoStr = minuto.toString().padStart(2, '0');
      franjas.push(`${horaStr}:${minutoStr}`);
    }
  }
  
  return franjas;
}

/**
 * Constante con las franjas horarias de 5 minutos (09:00 - 20:00)
 */
export const FRANJAS_HORARIAS = generarFranjasHorarias();

/**
 * Mapea el estado del turno (valor de BD) a su nombre de visualización
 */
export function obtenerNombreEstado(estado: string): string {
  switch (estado) {
    case 'programado':
      return 'Pendiente';
    case 'completado':
      return 'Atendido';
    case 'cancelado':
      return 'Anulado';
    default:
      return estado;
  }
}

