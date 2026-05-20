import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('tejco_auth_token')?.value
  const { pathname } = request.nextUrl

  // Debug log (visible in pm2 logs)
  console.log(`[Proxy] Request: ${pathname}, Token: ${token ? 'Found' : 'Missing'}`)

  // 1. Define public paths
  const isPublicPath = 
    pathname === '/login' || 
    pathname.startsWith('/_next') || 
    pathname.includes('.') || 
    pathname.startsWith('/api')

  // 2. Redirect to Login if no token and path is protected
  if (!token && !isPublicPath) {
    console.log(`[Proxy] Redirecting to /login from ${pathname}`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
