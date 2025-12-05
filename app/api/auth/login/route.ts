import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    
    // Crear cliente de Supabase en el servidor
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, {
                  ...options,
                  path: '/',
                  sameSite: 'lax',
                  httpOnly: options?.httpOnly ?? false,
                  secure: options?.secure ?? false,
                });
              });
            } catch (error) {
              // Ignorar errores de cookies en Server Components
            }
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
      // Logger removido - no loggear información sensible en producción
      return NextResponse.json(
        { error: error.message || 'Error al iniciar sesión' },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No se pudo crear la sesión' },
        { status: 401 }
      );
    }

    // Crear respuesta con éxito
    // Las cookies ya fueron establecidas automáticamente por Supabase SSR en setAll
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
    });

    // Copiar las cookies establecidas por Supabase a la respuesta
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        try {
          response.cookies.set(cookie.name, cookie.value, {
            path: '/',
            sameSite: 'lax',
            httpOnly: false,
            secure: false,
          });
        } catch (err) {
          // Ignorar errores al establecer cookies silenciosamente
          // En producción, esto podría loggearse a un servicio de monitoreo
        }
      }
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

