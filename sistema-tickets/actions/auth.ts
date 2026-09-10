'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { crearSesion, destruirSesion } from "@/lib/session"
import { registrarBitacora } from "./audit"
import { redirect } from "next/navigation"

export async function iniciarSesion(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) return { error: "Por favor completa todos los campos." }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return { error: "Correo o contraseña incorrectos." }

    if (usuario.activo === false) return { error: "Esta cuenta ha sido desactivada del sistema." }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosFaltantes = Math.ceil((usuario.bloqueadoHasta.getTime() - Date.now()) / 60000)
      return { error: `Cuenta bloqueada por seguridad. Intenta de nuevo en ${minutosFaltantes} minuto(s).` }
    }

    const passwordValida = await bcrypt.compare(password, usuario.password)
    
    if (!passwordValida) {
      const nuevosIntentos = usuario.intentosFallidos + 1
      if (nuevosIntentos >= 5) {
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { intentosFallidos: nuevosIntentos, bloqueadoHasta: new Date(Date.now() + 15 * 60000) }
        })
        return { error: "Has fallado 5 veces. Cuenta bloqueada por 15 minutos." }
      } else {
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { intentosFallidos: nuevosIntentos }
        })
        return { error: `Contraseña incorrecta. Intento ${nuevosIntentos} de 5.` }
      }
    }

    if (usuario.intentosFallidos > 0) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null }
      })
    }

    await crearSesion(usuario.id, usuario.rol)
    await registrarBitacora("Inicio de sesión", "Autenticación", `El usuario ingresó al sistema exitosamente.`, usuario.id)

  } catch (error) {
    console.error("[Auth] Error en inicio de sesión:", error)
    return { error: "Error interno al conectar con la base de datos." }
  }

  // ✅ CORRECCIÓN CRÍTICA: El redirect debe ir SIEMPRE fuera del bloque try/catch
  // Next.js automáticamente le agregará el prefijo "/tickets"
  redirect("/dashboard")
}

export async function cerrarSesion() {
  await destruirSesion()
  redirect("/")
}