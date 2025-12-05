import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Verificar que estamos en el cliente
          if (typeof document === 'undefined') {
            return [];
          }
          return document.cookie.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=');
            return { name, value: decodeURIComponent(rest.join('=')) };
          }).filter(c => c.name);
        },
        setAll(cookiesToSet) {
          // Verificar que estamos en el cliente
          if (typeof document === 'undefined') {
            return;
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`;
            if (options?.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
            if (options?.domain) cookieString += `; Domain=${options.domain}`;
            cookieString += `; Path=${options?.path || '/'}`;
            if (options?.secure) cookieString += `; Secure`;
            cookieString += `; SameSite=${options?.sameSite || 'Lax'}`;
            document.cookie = cookieString;
          });
        },
      },
    }
  );
}

