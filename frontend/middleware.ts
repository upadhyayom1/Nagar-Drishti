import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const pathname = request.nextUrl.pathname;

  // Protect dashboard routes
  const protectedRoutes = [
    '/dashboard',
    '/blacklist',
    '/cameras',
    '/vehicles',
    '/alerts',
    '/analytics',
    '/system',
    '/network',
    '/detect'
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If trying to access a protected route without auth token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access login page while already authenticated
  if (pathname === '/login' && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
