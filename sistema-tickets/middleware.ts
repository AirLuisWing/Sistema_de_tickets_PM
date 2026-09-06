import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// 1. BLINDAJE CRÍTICO: No usamos "respaldos" en texto plano.
// Si no hay variable de entorno, el sistema debe avisar del fallo.
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
      return NextResponse.redirect(new URL('/', request.url))
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
        return NextResponse.redirect(new URL('/dashboard/tickets', request.url))
      }

      if (path === '/dashboard' && rol === "UsuarioFinal") {
        return NextResponse.redirect(new URL('/dashboard/tickets', request.url))
      }

      return NextResponse.next()

    } catch (error) {
      // 2. REGISTRO DE CONSOLA: Saber si el token expiró o fue alterado
      console.error("[Middleware] Token rechazado o expirado:", error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}