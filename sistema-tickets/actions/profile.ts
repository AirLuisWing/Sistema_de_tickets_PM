'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { obtenerSesion } from "@/lib/session"
import { registrarBitacora } from "./audit"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import sharp from "sharp"

export async function cambiarPassword(formData: FormData) {
  const actual = formData.get("passwordActual") as string
  const nueva = formData.get("passwordNueva") as string
  const confirmar = formData.get("passwordConfirmar") as string

  if (!actual || !nueva || !confirmar) return { error: "Completa todos los campos." }
  if (nueva !== confirmar) return { error: "Las contraseñas no coinciden." }
  if (nueva.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." }

  try {
    const sesion = await obtenerSesion()
    if (!sesion) return { error: "Sesión no válida." }

    const usuario = await prisma.usuario.findUnique({ where: { id: sesion.userId } })
    if (!usuario) return { error: "Usuario no encontrado." }

    const passwordValida = await bcrypt.compare(actual, usuario.password)
    if (!passwordValida) return { error: "La contraseña actual es incorrecta." }

    const hashedPassword = await bcrypt.hash(nueva, 10)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashedPassword }
    })

    await registrarBitacora("Cambio de contraseña", "Perfil", `El usuario actualizó su contraseña.`, sesion.userId)
    return { success: "¡Contraseña actualizada correctamente!" }
  } catch (error) {
    console.error("[Action: cambiarPassword] Error:", error)
    return { error: "Error interno al actualizar la contraseña." }
  }
}

export async function actualizarPerfil(formData: FormData) {
  const area = formData.get("area") as string
  if (!area) return { error: "El área no puede estar vacía." }

  try {
    const sesion = await obtenerSesion()
    if (!sesion) return { error: "Sesión no válida." }

    await prisma.usuario.update({
      where: { id: sesion.userId },
      data: { area: area }
    })
    return { success: "¡Área actualizada correctamente!" }
  } catch (error) {
    console.error("[Action: actualizarPerfil] Error:", error)
    return { error: "Error interno al actualizar el perfil." }
  }
}

export async function actualizarFotoPerfil(formData: FormData) {
  const archivo = formData.get("foto") as File
  const sesion = await obtenerSesion()

  if (!sesion) return { error: "Tu sesión ha expirado." }
  if (!archivo || archivo.size === 0) return { error: "No seleccionaste ninguna imagen." }

  // 🛡️ BLINDAJE OOM (Out Of Memory): Límite de 5 MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
  if (archivo.size > MAX_FILE_SIZE) {
    return { error: "El archivo es demasiado grande. El límite es de 5 MB." }
  }

  const permitidos = ['image/jpeg', 'image/png', 'image/webp']
  if (!permitidos.includes(archivo.type)) return { error: "Formato no permitido. Usa JPG, PNG o WEBP." }
  
  try {
    const usuarioActual = await prisma.usuario.findUnique({ where: { id: sesion.userId } })
    if (usuarioActual?.fotoPerfil) {
      try {
        await unlink(path.join(process.cwd(), 'public', usuarioActual.fotoPerfil.replace('/tickets', '')))
      } catch (e) {
        // Ignoramos el error si no existía el archivo
      }
    }

    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const finalBuffer = await sharp(buffer)
      .resize({ width: 400, withoutEnlargement: true }) 
      .webp({ quality: 80 }) 
      .toBuffer()

    const nombreSeguro = `avatar_${sesion.userId}_${Date.now()}.webp`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    
    try { await mkdir(uploadDir, { recursive: true }) } catch(e){}

    const filePath = path.join(uploadDir, nombreSeguro)
    await writeFile(filePath, finalBuffer)

    await prisma.usuario.update({
      where: { id: sesion.userId },
      data: { fotoPerfil: `/uploads/avatars/${nombreSeguro}` }
    })

    await registrarBitacora("Actualizó foto", "Perfil", "El usuario actualizó su foto de perfil.", sesion.userId)
  } catch (error) {
    console.error("[Action: actualizarFotoPerfil] Error:", error)
    return { error: "Error en el servidor al intentar guardar la imagen comprimida." }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/perfil")
}

export async function eliminarFotoPerfil() {
  const sesion = await obtenerSesion()
  if (!sesion) return { error: "Tu sesión ha expirado." }

  try {
    const usuarioActual = await prisma.usuario.findUnique({ where: { id: sesion.userId } })
    if (usuarioActual?.fotoPerfil) {
      try {
        await unlink(path.join(process.cwd(), 'public', usuarioActual.fotoPerfil.replace('/tickets', '')))
      } catch (e) {
        // Ignoramos si ya se había borrado
      }
    }

    await prisma.usuario.update({
      where: { id: sesion.userId },
      data: { fotoPerfil: null } 
    })
    await registrarBitacora("Eliminó foto", "Perfil", "El usuario eliminó su foto de perfil.", sesion.userId)
  } catch (error) {
    console.error("[Action: eliminarFotoPerfil] Error:", error)
    return { error: "Error interno al intentar eliminar la foto." }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/perfil")
  return { success: true }
}