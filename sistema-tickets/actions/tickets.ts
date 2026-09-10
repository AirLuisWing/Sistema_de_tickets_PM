'use server'

import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client" 
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation" 
import { obtenerSesion } from "@/lib/session"
import { registrarBitacora, registrarHistorial } from "./audit"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import sharp from "sharp"

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

    const archivo = formData.get("archivo") as File | null
    
    // 🛡️ CORRECCIÓN: Comprobamos que el archivo existe ANTES de leer su tamaño
    if (archivo && archivo.size > 0) {
      
      // 🛡️ BLINDAJE OOM: Límite de 20MB
      const MAX_FILE_SIZE = 20 * 1024 * 1024; 
      if (archivo.size > MAX_FILE_SIZE) {
        return { error: "El archivo es demasiado grande. El límite para evidencias es de 20 MB." }
      }

      try {
        const bytes = await archivo.arrayBuffer()
        const buffer = Buffer.from(bytes)
        let finalBuffer = buffer
        let nombreSeguro = ""

        if (archivo.type.startsWith('image/')) {
          finalBuffer = await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
          nombreSeguro = `${randomUUID()}.webp`
        } else {
          nombreSeguro = `${randomUUID()}.pdf`
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        try { await mkdir(uploadDir, { recursive: true }) } catch(e){}

        const filePath = path.join(uploadDir, nombreSeguro)
        await writeFile(filePath, finalBuffer)

        await prisma.adjunto.create({
          data: {
            nombre: archivo.name, rutaArchivo: `/uploads/${nombreSeguro}`,
            ticketId: nuevoTicket.id, subidoPorId: sesion.userId
          }
        })
        await registrarHistorial(nuevoTicket.id, "Evidencia Agregada", `Se adjuntó evidencia inicial: ${archivo.name}`, sesion.userId)
      } catch (err) {
        console.error("Error guardando archivo inicial:", err)
      }
    }

  } catch (error) {
    console.error("[Action: crearTicket] Error crítico en BD:", error) 
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

  const sesion = await obtenerSesion()
  if (!sesion) return { error: "No tienes una sesión activa." }

  try {
    const ticketOriginal = await prisma.ticket.findUnique({ 
      where: { id: parseInt(id) },
      include: { tecnicos: true }
    })

    if (!descripcionSolucion || descripcionSolucion.trim() === "") descripcionSolucion = ""
    
    const datosActualizados: Prisma.TicketUpdateInput = { 
      estado, 
      descripcionSolucion 
    }

    if (estado === "Resuelto" && ticketOriginal?.estado !== "Resuelto") {
      datosActualizados.fechaCierre = new Date()
    } else if (estado !== "Resuelto" && ticketOriginal?.estado === "Resuelto") {
      datosActualizados.fechaCierre = null
    }
    
    const esAdminOSupervisor = sesion.rol === "Administrador" || sesion.rol === "Supervisor"
    let tecnicosValidos: { id: number }[] = []

    if (esAdminOSupervisor) {
      const tecnicosIdsRaw = formData.getAll("tecnicoId") 
      const titulo = formData.get("titulo") as string | null
      const tipo = formData.get("tipo") as string | null
      const prioridad = formData.get("prioridad") as string | null

      tecnicosValidos = tecnicosIdsRaw
        .map(t => t.toString().trim())
        .filter(t => t !== "" && t !== "null" && t !== "-- Sin asignar --")
        .map(t => ({ id: parseInt(t) }))

      datosActualizados.tecnicos = { set: tecnicosValidos }
      if (titulo) datosActualizados.titulo = titulo
      if (tipo) datosActualizados.tipo = tipo
      if (prioridad) datosActualizados.prioridad = prioridad
    }

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

    if (esAdminOSupervisor && tecnicosValidos.length > 0 && ticketOriginal?.tecnicos.length !== tecnicosValidos.length) {
      await registrarHistorial(parseInt(id), "Reasignación", `Se actualizaron los técnicos asignados al ticket.`, sesion.userId)
    }

    const prioridadForm = formData.get("prioridad") as string | null
    if (esAdminOSupervisor && ticketOriginal?.prioridad !== prioridadForm && prioridadForm) {
      await registrarHistorial(parseInt(id), "Cambio de Prioridad", `La prioridad cambió a ${prioridadForm}.`, sesion.userId)
    }

  } catch (error) {
    console.error("[Action: actualizarTicket] Error:", error) 
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
    const ticketId = parseInt(id)

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { adjuntos: true }
    })

    if (!ticket) {
        return { error: "El ticket que intentas eliminar ya no existe." }
    }

    if (ticket.adjuntos.length > 0) {
      for (const adjunto of ticket.adjuntos) {
        try {
          const rutaRelativa = adjunto.rutaArchivo.replace(/^\/uploads\//, '')
          const filePath = path.join(process.cwd(), 'public', 'uploads', rutaRelativa)
          
          await unlink(filePath) 
        } catch (fileError) {
          console.error(`No se pudo borrar el archivo físico: ${adjunto.rutaArchivo}`, fileError)
        }
      }
    }

    await prisma.ticket.delete({ where: { id: ticketId } })
    await registrarBitacora("Eliminó ticket", "Tickets", `Se borró de forma permanente el ticket ID: ${id} y sus archivos.`, sesion.userId)
  
  } catch (error) {
    console.error("[Action: eliminarTicket] Error:", error)
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
    const ticketIdNum = parseInt(ticketId)
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketIdNum }, include: { tecnicos: true } })
    if (!ticket) return { error: "Ticket no encontrado." }

    const esAdminOSupervisor = sesion.rol === "Administrador" || sesion.rol === "Supervisor"
    const esCreador = ticket.solicitanteId === sesion.userId
    const esTecnico = sesion.rol === "Tecnico" && ticket.tecnicos.some(t => t.id === sesion.userId)

    if (!esAdminOSupervisor && !esCreador && !esTecnico) {
      return { error: "Acceso denegado. No tienes permisos en este ticket." }
    }
    if (ticket.estado === "Resuelto" && !esAdminOSupervisor) {
      return { error: "El ticket está cerrado, no se pueden agregar más comentarios." }
    }

    await prisma.comentario.create({
      data: { texto, ticketId: ticketIdNum, autorId: sesion.userId }
    })
    await registrarHistorial(ticketIdNum, "Nuevo Comentario", "Se agregó un mensaje al chat del ticket.", sesion.userId)
  } catch (error) {
    console.error("[Action: agregarComentario] Error:", error) 
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

  // 🛡️ BLINDAJE OOM: Límite de 20MB
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  if (archivo.size > MAX_FILE_SIZE) {
    return { error: "El archivo es demasiado grande. El límite para evidencias es de 20 MB." }
  }

  const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
  if (!permitidos.includes(archivo.type)) return { error: "Formato no permitido. Solo imágenes o PDF." }
  
  try {
    const ticketIdNum = parseInt(ticketId)
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketIdNum }, include: { tecnicos: true } })
    if (!ticket) return { error: "Ticket no encontrado." }

    const esAdminOSupervisor = sesion.rol === "Administrador" || sesion.rol === "Supervisor"
    const esCreador = ticket.solicitanteId === sesion.userId
    const esTecnico = sesion.rol === "Tecnico" && ticket.tecnicos.some(t => t.id === sesion.userId)

    if (!esAdminOSupervisor && !esCreador && !esTecnico) {
      return { error: "Acceso denegado. No tienes permisos en este ticket." }
    }
    if (ticket.estado === "Resuelto" && !esAdminOSupervisor) {
      return { error: "El ticket está cerrado, no se pueden agregar evidencias." }
    }

    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    let finalBuffer = buffer
    let nombreSeguro = ""

    if (archivo.type.startsWith('image/')) {
      finalBuffer = await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
      nombreSeguro = `${randomUUID()}.webp`
    } else {
      nombreSeguro = `${randomUUID()}.pdf`
    }
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    try { await mkdir(uploadDir, { recursive: true }) } catch(e){}

    const filePath = path.join(uploadDir, nombreSeguro)
    await writeFile(filePath, finalBuffer)

    await prisma.adjunto.create({
      data: {
        nombre: archivo.name, rutaArchivo: `/uploads/${nombreSeguro}`,
        ticketId: ticketIdNum, subidoPorId: sesion.userId
      }
    })
    await registrarHistorial(ticketIdNum, "Evidencia Agregada", `Se adjuntó el archivo: ${archivo.name}`, sesion.userId)
  } catch (error) {
    console.error("[Action: subirEvidencia] Error:", error) 
    return { error: "Error en el servidor al intentar guardar el archivo." }
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
    console.error("[Action: firmarConformidad] Error:", error) 
    return { error: "Ocurrió un error al intentar registrar la firma." }
  }
  revalidatePath(`/dashboard/tickets/${ticketId}`)
}