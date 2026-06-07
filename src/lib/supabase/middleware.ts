import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/menu', '/reserver', '/contact', '/legal', '/superadmin',
  // Endpoints API sécurisés par leur propre mécanisme (token / secret / signature)
  // → ne doivent PAS être redirigés vers /login par le middleware.
  '/api/ical', '/api/cron', '/api/webhooks'];

export async function updateSession(request: NextRequest) {
  // Expose le chemin courant aux Server Components (utilisé par le layout pour
  // verrouiller le dashboard à l'expiration tout en laissant passer /upgrade).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Filet de sécurité : si env vars manquantes, on laisse passer sans crash
  if (!url || !key) {
    console.error('[middleware] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY manquantes');
    return response;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  let user: any = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (e) {
    console.error('[middleware] auth.getUser failed:', e);
    return response;
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    // Préserver pathname + search params (ex: /reservations?filter=en_attente)
    const fullPath = path + (request.nextUrl.search || '');
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('redirect', fullPath);
    return NextResponse.redirect(redirectUrl);
  }

  // Si déjà connecté ET sur /login, redirige vers /dashboard
  // (suppression si déjà sur dashboard évite les boucles avec ?from=login)
  if (user && path === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
