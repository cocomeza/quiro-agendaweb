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

