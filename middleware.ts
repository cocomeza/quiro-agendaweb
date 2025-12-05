import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              path: options?.path || '/',
              sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              httpOnly: options?.httpOnly ?? false,
              secure: options?.secure ?? false,
            });
          });
        },
      },
    }
  );

  // IMPORTANTE: Usar getUser() que automáticamente refresca la sesión si es necesario
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Obtener la sesión después del refresh automático
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // Usar user como fallback si session no está disponible
  const isAuthenticated = !!session || !!user;

  // Debug: Log de errores críticos (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    if (userError) {
      // Solo loggear errores críticos, no información sensible
      console.error('[Middleware] Error al obtener usuario:', userError.message);
    }
    if (sessionError && sessionError.message !== 'Auth session missing!') {
      // No loggear errores esperados como "session missing"
      console.error('[Middleware] Error de sesión:', sessionError.message);
    }
  }

  // Excluir rutas API del middleware de autenticación
  if (request.nextUrl.pathname.startsWith('/api')) {
    return response;
  }

  // Proteger rutas excepto /login
  // Usar isAuthenticated que verifica tanto session como user
  if (!isAuthenticated && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirigir a home si ya está autenticado y está en /login
  if (isAuthenticated && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (API routes should not be protected by auth middleware)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
