'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation" 
import { obtenerSesion } from "@/lib/session"
import { registrarBitacora, registrarHistorial } from "./audit"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

export async function crearTicket(formData: FormData) {
  const titulo = formData.get("titulo") as string 
  const tipo = formData.get("tipo") as string
  const equipoAfectado = formData.get("equipoAfectado") as string
  const categoria = formData.get("categoria") as string
  const subcategoria = formData.get("subcategoria") as string
  const prioridad = formData.get("prioridad") as string
  const nivelImpacto = formData.get("nivelImpacto") as string
  const descripcion = formData.get("descripcion") as string

  const sesion = await obtenerSesion()
  if (!sesion) return { error: "No tienes una sesión activa." }

  if (titulo.length > 150) return { error: "El título es demasiado largo. Máximo 150 caracteres." }
  if (descripcion.length > 2000) return { error: "La descripción es demasiado larga. Máximo 2000 caracteres." }

  if (sesion.rol === "UsuarioFinal") {
    const ticketsNuevos = await prisma.ticket.count({
      where: { solicitanteId: sesion.userId, estado: "Nuevo" }
    })
    if (ticketsNuevos >= 3) {
      return { error: "Tienes 3 tickets en estado 'Nuevo'. Por favor, espera a que los técnicos atiendan tus reportes anteriores." }
    }

    const haceDosHoras = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const ticketReciente = await prisma.ticket.findFirst({
      where: { solicitanteId: sesion.userId, categoria: categoria, fechaCreacion: { gte: haceDosHoras } }
    })
    if (ticketReciente) {
      return { error: `Ya reportaste un problema de categoría "${categoria}" recientemente. Evita duplicados.` }
    }
  }

  try {
    const nuevoTicket = await prisma.ticket.create({
      data: {
        titulo, tipo, equipoAfectado, categoria, subcategoria, prioridad, nivelImpacto, descripcion,
        estado: "Nuevo", 
        solicitanteId: sesion.userId, 
      },
    })

    const anioActual = new Date().getFullYear()
    const folioOficial = `TIC-${anioActual}-${nuevoTicket.id.toString().padStart(6, '0')}`

    await prisma.ticket.update({
      where: { id: nuevoTicket.id },
      data: { folio: folioOficial }
    })

    await registrarHistorial(nuevoTicket.id, "Creación de Ticket", `Ticket reportado con prioridad ${prioridad}.`, sesion.userId)
    await registrarBitacora("Creó ticket", "Tickets", `Se generó el ticket ${folioOficial}.`, sesion.userId)

  } catch (error) {
    return { error: "Ocurrió un error crítico al guardar el ticket en la base de datos." }
  }

  revalidatePath("/dashboard/tickets")
  redirect("/dashboard/tickets")
}

export async function actualizarTicket(formData: FormData) {
  const id = formData.get("id") as string
  const estado = formData.get("estado") as string
  let descripcionSolucion = formData.get("descripcionSolucion") as string

  if (descripcionSolucion && descripcionSolucion.length > 2000) {
    return { error: "El texto del dictamen es demasiado largo." }
  }

  const tecnicosIdsRaw = formData.getAll("tecnicoId") 
  const titulo = formData.get("titulo")
  const tipo = formData.get("tipo")
  const prioridad = formData.get("prioridad")

  const sesion = await obtenerSesion()
  if (!sesion) return { error: "No tienes una sesión activa." }

  try {
    const ticketOriginal = await prisma.ticket.findUnique({ 
      where: { id: parseInt(id) },
      include: { tecnicos: true }
    })

    if (!descripcionSolucion || descripcionSolucion.trim() === "") descripcionSolucion = ""
    const datosActualizados: any = { estado, descripcionSolucion }

    if (estado === "Resuelto" && ticketOriginal?.estado !== "Resuelto") {
      datosActualizados.fechaCierre = new Date()
    } else if (estado !== "Resuelto" && ticketOriginal?.estado === "Resuelto") {
      datosActualizados.fechaCierre = null
    }
    
    const tecnicosValidos = tecnicosIdsRaw
      .map(t => t.toString().trim())
      .filter(t => t !== "" && t !== "null" && t !== "-- Sin asignar --")
      .map(t => ({ id: parseInt(t) }))

    datosActualizados.tecnicos = { set: tecnicosValidos }
    if (titulo) datosActualizados.titulo = titulo.toString()
    if (tipo) datosActualizados.tipo = tipo.toString()
    if (prioridad) datosActualizados.prioridad = prioridad.toString()

    await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: datosActualizados
    })

    if (ticketOriginal?.estado !== estado) {
      await registrarHistorial(parseInt(id), "Cambio de Estado", `El estado pasó de '${ticketOriginal?.estado}' a '${estado}'.`, sesion.userId)
      if (estado === "Resuelto") {
        await registrarBitacora("Resolvió ticket", "Tickets", `El ticket ${ticketOriginal?.folio} fue marcado como resuelto.`, sesion.userId)
      }
    }

    if (tecnicosValidos.length > 0 && ticketOriginal?.tecnicos.length !== tecnicosValidos.length) {
      await registrarHistorial(parseInt(id), "Reasignación", `Se actualizaron los técnicos asignados al ticket.`, sesion.userId)
    }

    if (ticketOriginal?.prioridad !== prioridad && prioridad) {
      await registrarHistorial(parseInt(id), "Cambio de Prioridad", `La prioridad cambió a ${prioridad}.`, sesion.userId)
    }

  } catch (error) {
    return { error: "Error de conexión con la base de datos al actualizar el ticket." }
  }

  revalidatePath(`/dashboard/tickets/${id}`)
  revalidatePath("/dashboard/tickets")
  revalidatePath("/dashboard/asignados")
  revalidatePath("/dashboard/global")
  redirect(`/dashboard/tickets/${id}`)
}

export async function eliminarTicket(formData: FormData) {
  const id = formData.get("id") as string
  const sesion = await obtenerSesion()
  
  if (!sesion || sesion.rol !== "Administrador") {
    return { error: "No tienes permisos de Administrador para eliminar tickets de la base de datos." }
  }

  try {
    await prisma.ticket.delete({ where: { id: parseInt(id) } })
    await registrarBitacora("Eliminó ticket", "Tickets", `Se borró de forma permanente el ticket ID: ${id}.`, sesion.userId)
  } catch (error) {
    return { error: "Ocurrió un error de base de datos al intentar eliminar el ticket." }
  }

  revalidatePath("/dashboard/tickets")
  redirect("/dashboard/tickets")
}

export async function agregarComentario(formData: FormData) {
  const ticketId = formData.get("ticketId") as string
  const texto = formData.get("texto") as string
  const sesion = await obtenerSesion()
  if (!sesion) return { error: "Tu sesión ha expirado." }
  if (!texto || texto.trim() === "") return { error: "El mensaje no puede estar vacío." }

  try {
    await prisma.comentario.create({
      data: { texto, ticketId: parseInt(ticketId), autorId: sesion.userId }
    })
    await registrarHistorial(parseInt(ticketId), "Nuevo Comentario", "Se agregó un mensaje al chat del ticket.", sesion.userId)
  } catch (error) {
    return { error: "No se pudo enviar el mensaje." }
  }
  revalidatePath(`/dashboard/tickets/${ticketId}`)
}

export async function subirEvidencia(formData: FormData) {
  const archivo = formData.get("archivo") as File
  const ticketId = formData.get("ticketId") as string
  const sesion = await obtenerSesion()

  if (!sesion) return { error: "Tu sesión ha expirado." }
  if (!archivo || archivo.size === 0) return { error: "No se adjuntó ningún archivo válido." }

  const permitidos = ['image/jpeg', 'image/png', 'application/pdf']
  if (!permitidos.includes(archivo.type)) return { error: "Formato no permitido. Solo JPG, PNG o PDF." }
  
  try {
    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const extension = archivo.name.split('.').pop()
    const nombreSeguro = `${randomUUID()}.${extension}`
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    try { await mkdir(uploadDir, { recursive: true }) } catch(e){}

    const filePath = path.join(uploadDir, nombreSeguro)
    await writeFile(filePath, buffer)

    await prisma.adjunto.create({
      data: {
        nombre: archivo.name, rutaArchivo: `/uploads/${nombreSeguro}`,
        ticketId: parseInt(ticketId), subidoPorId: sesion.userId
      }
    })
    await registrarHistorial(parseInt(ticketId), "Evidencia Agregada", `Se adjuntó el archivo: ${archivo.name}`, sesion.userId)
  } catch (error) {
    return { error: "Error en el servidor al intentar guardar el archivo físico." }
  }
  revalidatePath(`/dashboard/tickets/${ticketId}`)
}

export async function firmarConformidad(formData: FormData) {
  const ticketId = formData.get("ticketId") as string
  const sesion = await obtenerSesion()
  if (!sesion) return { error: "Tu sesión ha expirado." }

  try {
    await prisma.ticket.update({
      where: { id: parseInt(ticketId) },
      data: { conformidadUsuario: true, fechaConformidad: new Date() }
    })
    await registrarHistorial(parseInt(ticketId), "Firma de Conformidad", "El usuario confirmó la solución.", sesion.userId)
  } catch (error) {
    return { error: "Ocurrió un error al intentar registrar la firma." }
  }
  revalidatePath(`/dashboard/tickets/${ticketId}`)
}