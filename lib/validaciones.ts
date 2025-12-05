/**
 * Utilidades de validación para formularios
 */

/**
 * Valida formato de email
 */
export function validarEmail(email: string): boolean {
  if (!email || email.trim() === '') return true; // Opcional, solo valida si hay valor
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida formato de teléfono (básico)
 */
export function validarTelefono(telefono: string): boolean {
  if (!telefono || telefono.trim() === '') return true; // Opcional
  // Remover espacios, guiones, paréntesis
  const limpio = telefono.replace(/[\s\-\(\)]/g, '');
  // Debe tener al menos 8 dígitos y máximo 15
  return /^\d{8,15}$/.test(limpio);
}

/**
 * Normaliza teléfono removiendo caracteres especiales
 */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[\s\-\(\)]/g, '');
}

/**
 * Verifica si un error es de red/conexión
 */
export function esErrorDeRed(error: any): boolean {
  if (!error) return false;
  const mensaje = error.message?.toLowerCase() || '';
  const codigo = error.code?.toLowerCase() || '';
  
  return (
    mensaje.includes('fetch') ||
    mensaje.includes('network') ||
    mensaje.includes('conexión') ||
    mensaje.includes('connection') ||
    mensaje.includes('timeout') ||
    codigo === 'network_error' ||
    codigo === 'timeout'
  );
}

/**
 * Obtiene mensaje de error amigable según el tipo
 */
export function obtenerMensajeError(error: any): string {
  if (!error) return 'Error desconocido';
  
  // Error de red
  if (esErrorDeRed(error)) {
    return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
  }
  
  // Errores de Supabase específicos
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return 'Ya existe un registro con estos datos.';
      case '23503': // Foreign key violation
        return 'No se puede eliminar porque tiene registros relacionados.';
      case '23502': // Not null violation
        return 'Faltan campos requeridos.';
      case 'PGRST116': // No rows returned
        return 'No se encontró el registro solicitado.';
      case 'PGRST301': // JWT expired
        return 'Tu sesión expiró. Por favor inicia sesión nuevamente.';
      default:
        break;
    }
  }
  
  // Mensajes específicos por contenido
  const mensaje = error.message?.toLowerCase() || '';
  if (mensaje.includes('invalid login credentials') || mensaje.includes('incorrect')) {
    return 'Email o contraseña incorrectos.';
  }
  if (mensaje.includes('email not confirmed')) {
    return 'Tu email no está confirmado. Verifica tu correo.';
  }
  if (mensaje.includes('timeout')) {
    return 'La operación tardó demasiado. Intenta nuevamente.';
  }
  
  // Mensaje genérico
  return error.message || 'Error inesperado. Intenta nuevamente.';
}

/**
 * Valida que una fecha no sea futura
 */
export function validarFechaNoFutura(fecha: string): boolean {
  if (!fecha) return true; // Opcional
  const fechaObj = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999); // Fin del día de hoy
  return fechaObj <= hoy;
}

/**
 * Valida longitud de texto según límite
 */
export function validarLongitud(texto: string, maxLength: number): boolean {
  if (!texto) return true;
  return texto.length <= maxLength;
}

