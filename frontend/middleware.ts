import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from '@/lib/supabaseEnv';

const authPages = ['/login', '/register', '/forgot-password'];
const protectedRoutes = [
  '/dashboard',
  '/bookings',
  '/my-bookings',
  '/my-trips',
  '/profile',
  '/payment',
  '/qr',
  '/qr-code',
  '/notifications',
  '/admin',
  '/driver',
];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;
  const response = NextResponse.next();

  const { url: supabaseUrl, key: supabaseKey } = getSupabasePublicConfig();
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => {
          if (options) {
            response.cookies.set(name, value, options);
          } else {
            response.cookies.set(name, value);
          }
        });
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const role = (user?.user_metadata as any)?.role as string | undefined;
  const status = (user?.user_metadata as any)?.status as string | undefined;

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isAuthPage = authPages.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isAdminRoute = pathname.startsWith('/admin');
  const isDriverRoute = pathname.startsWith('/driver');

  if (!user && isProtected) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    if (status === 'pending') {
      url.pathname = '/pending-approval';
    } else if (role === 'admin') {
      url.pathname = '/admin';
    } else if (role === 'driver') {
      url.pathname = '/driver';
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  if (user && status === 'pending' && pathname !== '/pending-approval') {
    url.pathname = '/pending-approval';
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute && role !== 'admin') {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (user && isDriverRoute && role !== 'driver') {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/my-bookings',
    '/my-trips',
    '/profile',
    '/payment',
    '/qr',
    '/qr-code',
    '/notifications',
    '/admin/:path*',
    '/driver/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/pending-approval',
    '/auth/verify-email',
    '/auth/reset-password',
  ],
};
