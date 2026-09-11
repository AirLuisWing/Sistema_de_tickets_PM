import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

// En producción, esto debería ir en tu archivo .env, pero por ahora lo definimos aquí.
const secretKey = process.env.SESSION_SECRET || "secreto-super-seguro-policia-morelia-2026"
const encodedKey = new TextEncoder().encode(secretKey)

// 1. Función para CREAR la sesión (Dar el gafete)
export async function crearSesion(userId: number, rol: string) {
  // CAMBIO DE SEGURIDAD: La sesión ahora dura solo 1 HORA de inactividad
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) 

  const session = await new SignJWT({ userId, rol })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h") // 1 hora
    .sign(encodedKey)

  const cookieStore = await cookies()
  
  cookieStore.set("sesion_tics", session, {
    httpOnly: true,
    // ✅ CORRECCIÓN CRÍTICA: Permitir cookies en HTTP local (IP del servidor)
    secure: false, 
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

// 2. Función para LEER la sesión (Checar el gafete)
export async function obtenerSesion() {
  // AWAIT obligatorio en Next.js 15
  const cookieStore = await cookies()
  const session = cookieStore.get("sesion_tics")?.value
  
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as { userId: number; rol: string }
  } catch (error) {
    console.error("Error validando sesión:", error)
    return null
  }
}

// 3. Función para CERRAR sesión (Quitar el gafete)
export async function destruirSesion() {
  // AWAIT obligatorio en Next.js 15
  const cookieStore = await cookies()
  cookieStore.delete("sesion_tics")
}