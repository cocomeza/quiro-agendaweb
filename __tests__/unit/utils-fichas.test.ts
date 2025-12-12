import { describe, it, expect, vi, beforeEach } from 'vitest';
import { obtenerSiguienteNumeroFicha } from '@/lib/utils-fichas';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('obtenerSiguienteNumeroFicha', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      not: vi.fn(),
    };
    (createClient as any).mockReturnValue(mockSupabase);
  });

  it('debe retornar "1" si no hay pacientes', async () => {
    mockSupabase.not.mockResolvedValue({ data: [], error: null });
    const resultado = await obtenerSiguienteNumeroFicha();
    expect(resultado).toBe('1');
  });

  it('debe retornar siguiente número cuando hay fichas válidas', async () => {
    mockSupabase.not.mockResolvedValue({
      data: [
        { numero_ficha: '100' },
        { numero_ficha: '200' },
        { numero_ficha: '150' },
      ],
      error: null,
    });
    const resultado = await obtenerSiguienteNumeroFicha();
    expect(resultado).toBe('201');
  });

  it('debe ignorar fichas con valor "0"', async () => {
    mockSupabase.not.mockResolvedValue({
      data: [
        { numero_ficha: '0' },
        { numero_ficha: '100' },
        { numero_ficha: '200' },
      ],
      error: null,
    });
    const resultado = await obtenerSiguienteNumeroFicha();
    expect(resultado).toBe('201');
  });

  it('debe retornar "1" si hay error', async () => {
    mockSupabase.not.mockResolvedValue({ data: null, error: { message: 'Error' } });
    const resultado = await obtenerSiguienteNumeroFicha();
    expect(resultado).toBe('1');
  });
});

