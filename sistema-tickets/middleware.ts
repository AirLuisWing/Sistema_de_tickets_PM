import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.SESSION_SECRET || "secreto-super-seguro-policia-morelia-2026"
const encodedKey = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Revisar si la ruta pertenece al dashboard
  if (path.startsWith('/dashboard')) {
    const session = request.cookies.get('sesion_tics')?.value

    // Si no hay sesión, rebotar al login
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      // 2. Verificar el token y extraer el payload (donde viene el rol y el userId)
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      })

      const rol = payload.rol as string

      // 3. REGLAS DE CONTROL DE ACCESO GLOBAL (Por Roles)
      
      // Rutas exclusivas para Administradores y Supervisores (Reportes, Auditoría, Usuarios)
      const rutasJefatura = [
        '/dashboard/reportes', 
        '/dashboard/bitacora', 
        '/dashboard/usuarios',
        '/dashboard/global'
      ]

      const esRutaJefatura = rutasJefatura.some(ruta => path.startsWith(ruta))

      if (esRutaJefatura && rol !== "Administrador" && rol !== "Supervisor") {
        // Si un técnico o usuario final intenta entrar aquí, lo rebotamos a sus tickets
        return NextResponse.redirect(new URL('/dashboard/tickets', request.url))
      }

      // Si es un UsuarioFinal intentando entrar a la raíz de estadísticas (/dashboard)
      if (path === '/dashboard' && rol === "UsuarioFinal") {
        return NextResponse.redirect(new URL('/dashboard/tickets', request.url))
      }

      // Si pasa todas las validaciones, lo dejamos pasar
      return NextResponse.next()

    } catch (error) {
      // Si el token es inválido o expiró, limpiar y mandar al login
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}