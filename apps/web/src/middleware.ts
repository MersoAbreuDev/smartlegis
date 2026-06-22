import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_PREFIXES = ['/api', '/_next', '/favicon.ico'];
const PORTAL_SECTIONS = ['noticias', 'sessoes', 'institucional', 'organograma', 'vereadores', 'leis', 'transparencia'];

function isTenantHost(hostname: string) {
  const host = hostname.toLowerCase();
  return Boolean(host && host !== 'localhost' && host !== '127.0.0.1' && host !== '::1');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isTenantHost(request.nextUrl.hostname)) return NextResponse.next();
  if (INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = '/publico';
    return NextResponse.rewrite(url);
  }
  const section = pathname.replace(/^\//, '');
  if (PORTAL_SECTIONS.includes(section)) {
    const url = request.nextUrl.clone();
    url.pathname = `/publico/${section}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*).*)']
};
