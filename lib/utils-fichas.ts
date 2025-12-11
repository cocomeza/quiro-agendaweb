import { createClient } from '@/lib/supabase/client';

/**
 * Obtiene el siguiente número de ficha disponible
 * Busca el máximo número de ficha numérico en la base de datos y retorna el siguiente
 */
export async function obtenerSiguienteNumeroFicha(): Promise<string> {
  const supabase = createClient();
  
  try {
    // Obtener todos los pacientes con numero_ficha
    const { data: pacientes, error } = await supabase
      .from('pacientes')
      .select('numero_ficha')
      .not('numero_ficha', 'is', null);

    if (error) {
      console.error('Error al obtener números de ficha:', error);
      // Si hay error, retornar un número por defecto
      return '1';
    }

    if (!pacientes || pacientes.length === 0) {
      // Si no hay pacientes con ficha, empezar desde 1
      return '1';
    }

    // Filtrar solo números de ficha que sean numéricos (no "0" ni strings vacíos)
    const numerosFicha = pacientes
      .map(p => p.numero_ficha)
      .filter(ficha => {
        if (!ficha || ficha.trim() === '' || ficha === '0') return false;
        // Verificar que sea un número válido
        const num = parseInt(ficha, 10);
        return !isNaN(num) && num > 0;
      })
      .map(ficha => parseInt(ficha!, 10))
      .sort((a, b) => b - a); // Ordenar descendente

    if (numerosFicha.length === 0) {
      // Si no hay números válidos, empezar desde 1
      return '1';
    }

    // El máximo número de ficha
    const maxFicha = numerosFicha[0];
    
    // Retornar el siguiente número
    return String(maxFicha + 1);
  } catch (err) {
    console.error('Error al calcular siguiente número de ficha:', err);
    // En caso de error, retornar un número por defecto
    return '1';
  }
}

