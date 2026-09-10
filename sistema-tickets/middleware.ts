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
      // 🛡️ CORRECCIÓN: Agregamos /tickets
      return NextResponse.redirect(new URL('/tickets/', request.url))
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
        // 🛡️ CORRECCIÓN: Agregamos /tickets
        return NextResponse.redirect(new URL('/tickets/dashboard/tickets', request.url))
      }

      if (path === '/dashboard' && rol === "UsuarioFinal") {
        // 🛡️ CORRECCIÓN: Agregamos /tickets
        return NextResponse.redirect(new URL('/tickets/dashboard/tickets', request.url))
      }

      return NextResponse.next()

    } catch (error) {
      console.error("[Middleware] Token rechazado o expirado:", error)
      // 🛡️ CORRECCIÓN: Agregamos /tickets
      return NextResponse.redirect(new URL('/tickets/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}