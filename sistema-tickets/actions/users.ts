'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation" 
import { obtenerSesion } from "@/lib/session"
import { registrarBitacora } from "./audit"

export async function registrarUsuario(formData: FormData) {
  const sesion = await obtenerSesion()
  if (!sesion || sesion.rol !== "Administrador") {
    return { error: "Acceso denegado. Solo el Administrador puede registrar usuarios." }
  }

  const nombre = formData.get("nombre") as string
  const area = formData.get("area") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const rol = formData.get("rol") as string

  try {
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email: email } })
    if (usuarioExistente) return { error: "El correo electrónico ya está registrado." }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.usuario.create({
      data: { nombre, area, email, password: hashedPassword, rol },
    })

    await registrarBitacora("Alta de usuario", "Directorio", `Se creó el usuario ${nombre} con rol de ${rol}.`, sesion.userId)

  } catch (error: any) {
    console.error(error)
    return { error: "Ocurrió un error interno al guardar el usuario." }
  }

  revalidatePath("/dashboard/usuarios")
  redirect("/dashboard/usuarios")
}

export async function actualizarUsuario(formData: FormData) {
  const sesion = await obtenerSesion()
  if (!sesion || sesion.rol !== "Administrador") return { error: "Acceso denegado. Permisos insuficientes." }

  const id = Number(formData.get("id"))
  
  //BLINDAJE: Prevenir que el admin se modifique a sí mismo y pierda permisos
  if (id === sesion.userId) {
    return { error: "Por seguridad, no puedes modificar tu propio nivel de acceso desde aquí." }
  }

  const nombre = formData.get("nombre") as string
  const area = formData.get("area") as string
  const email = formData.get("email") as string
  const rol = formData.get("rol") as string

  try {
    await prisma.usuario.update({
      where: { id: id },
      data: { nombre, area, email, rol },
    })
    await registrarBitacora("Modificó usuario", "Directorio", `Se actualizaron los datos del usuario ID: ${id}.`, sesion.userId)
  } catch (error) {
    console.error(error)
    return { error: "No se pudo actualizar el usuario." }
  }

  revalidatePath("/dashboard/usuarios")
  redirect("/dashboard/usuarios")
}

export async function eliminarUsuario(formData: FormData) {
  const sesion = await obtenerSesion()
  if (!sesion || sesion.rol !== "Administrador") return { error: "Acceso denegado." }

  const id = Number(formData.get("id"))
  
  //BLINDAJE: Prevenir que el admin se borre a sí mismo
  if (id === sesion.userId) {
    return { error: "Por seguridad, no puedes eliminar ni desactivar tu propia cuenta." }
  }

  try {
    await prisma.usuario.update({ 
      where: { id: id },
      data: { activo: false } 
    })
    await registrarBitacora("Desactivó usuario", "Directorio", `Se desactivó al usuario ID: ${id}. Mantiene su histórico.`, sesion.userId)
  } catch (error) {
    console.error(error)
    return { error: "Ocurrió un error al intentar desactivar el usuario." }
  }

  revalidatePath("/dashboard/usuarios")
  redirect("/dashboard/usuarios")
}