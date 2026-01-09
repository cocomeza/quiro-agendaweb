/**
 * Tests unitarios para la API de login
 * Área crítica: Autenticación y seguridad
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';

// Mock de Supabase
const mockSignInWithPassword = vi.fn();
const mockCookies = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}));

describe('API Login - Validaciones Críticas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Validación de Variables de Entorno', () => {
    it('debe retornar error 500 si faltan variables de entorno', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('configuración del servidor');
    });

    it('debe retornar error 500 si falta NEXT_PUBLIC_SUPABASE_ANON_KEY', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('configuración del servidor');
    });
  });

  describe('Validación de Campos Requeridos', () => {
    it('debe retornar error 400 si falta email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('requeridos');
    });

    it('debe retornar error 400 si falta password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('requeridos');
    });

    it('debe retornar error 400 si ambos campos están vacíos', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: '', password: '' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('requeridos');
    });
  });

  describe('Manejo de Errores de Autenticación', () => {
    beforeEach(() => {
      mockCookies.mockReturnValue({
        getAll: () => [],
      });
    });

    it('debe retornar error 401 con mensaje descriptivo para credenciales incorrectas', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('incorrectos');
    });

    it('debe retornar error 403 para email no confirmado', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Email not confirmed' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('confirmado');
    });

    it('debe retornar error 429 para demasiados intentos', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Too many requests' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Demasiados intentos');
    });

    it('debe retornar error 401 si no se puede crear sesión', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('sesión');
    });
  });

  describe('Login Exitoso', () => {
    beforeEach(() => {
      mockCookies.mockReturnValue({
        getAll: () => [],
      });
    });

    it('debe retornar éxito con datos de usuario cuando las credenciales son correctas', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@test.com',
        },
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe('user-123');
      expect(data.user.email).toBe('test@test.com');
    });

    it('debe trimear espacios en email y password', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@test.com',
        },
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: '  test@test.com  ', password: '  password123  ' }),
      });

      await POST(request);

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  describe('Manejo de Errores Inesperados', () => {
    it('debe retornar error 500 para errores inesperados', async () => {
      mockCookies.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
