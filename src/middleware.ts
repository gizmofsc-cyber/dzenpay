import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Публичные маршруты, которые не требуют аутентификации
  const publicRoutes = ['/login', '/register', '/pending', '/blocked']
  const isPublicRoute = publicRoutes.includes(pathname)

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Проверяем наличие токена сессии
  const sessionToken = request.cookies.get('session-token')?.value

  if (!sessionToken) {
    console.log('No session token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  console.log('Session token found:', sessionToken ? 'present' : 'missing')

  // В middleware мы только проверяем наличие токена
  // Детальная проверка будет происходить в API endpoints
  return NextResponse.next()
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
}
