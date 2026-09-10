import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.SESSION_SECRET
if (!secretKey) {
  throw new Error("¡PELIGRO CRÍTICO! Falta la variable de entorno SESSION_SECRET. El sistema no puede operar de forma segura.")
}

const encodedKey = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith('/dashboard')) {
    const session = request.cookies.get('sesion_tics')?.value

    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/' // Next.js le agregará el /tickets automáticamente
      return NextResponse.redirect(url)
    }

    try {
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      })

      const rol = payload.rol as string

      const rutasJefatura = [
        '/dashboard/reportes', 
        '/dashboard/bitacora', 
        '/dashboard/usuarios',
        '/dashboard/global'
      ]

      const esRutaJefatura = rutasJefatura.some(ruta => path.startsWith(ruta))

      if (esRutaJefatura && rol !== "Administrador" && rol !== "Supervisor") {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/tickets'
        return NextResponse.redirect(url)
      }

      if (path === '/dashboard' && rol === "UsuarioFinal") {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/tickets'
        return NextResponse.redirect(url)
      }

      return NextResponse.next()

    } catch (error) {
      console.error("[Middleware] Token rechazado o expirado:", error)
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}