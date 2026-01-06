import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Validar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[Login API] Variables de entorno faltantes');
      return NextResponse.json(
        { error: 'Error de configuración del servidor. Contacta al administrador.' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    
    // Array para almacenar las cookies que se establecerán
    const cookiesToSet: Array<{ name: string; value: string; options?: any }> = [];
    
    // Crear cliente de Supabase en el servidor
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSetFromSupabase) {
            // Almacenar las cookies para establecerlas después en la respuesta
            cookiesToSetFromSupabase.forEach(({ name, value, options }) => {
              cookiesToSet.push({ name, value, options });
            });
          },
        },
      }
    );

    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      // Proporcionar mensajes de error más descriptivos
      let errorMessage = 'Error al iniciar sesión';
      let statusCode = 401;

      if (error.message.includes('Invalid login credentials') || error.message.includes('incorrect')) {
        errorMessage = 'Email o contraseña incorrectos. Verifica tus credenciales.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Tu email no está confirmado. Verifica tu correo o contacta al administrador.';
        statusCode = 403;
      } else if (error.message.includes('User not found')) {
        errorMessage = 'Usuario no encontrado. Verifica que el email sea correcto.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.';
        statusCode = 429;
      } else {
        errorMessage = error.message || 'Error al iniciar sesión';
      }

      // Log solo en desarrollo para debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('[Login API] Error de autenticación:', {
          message: error.message,
          status: error.status,
          email: email.trim().substring(0, 3) + '***', // Solo primeros 3 caracteres para debugging
        });
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No se pudo crear la sesión' },
        { status: 401 }
      );
    }

    // Crear respuesta con éxito y establecer las cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
    });

    // Establecer todas las cookies de Supabase en la respuesta
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, {
        path: options?.path || '/',
        sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
        httpOnly: options?.httpOnly ?? false,
        secure: options?.secure ?? false,
        maxAge: options?.maxAge,
      });
    });

    return response;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Error inesperado al iniciar sesión');
    // Logger removido - el error ya se retorna en la respuesta
    return NextResponse.json(
      { error: err.message }, 
      { status: 500 }
    );
  }
}

