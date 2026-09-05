'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation" 
import { crearSesion, destruirSesion, obtenerSesion } from "@/lib/session"

// ==========================================
// FUNCIONES INTERNAS DE AUDITORÍA 
// ==========================================
async function registrarBitacora(accion: string, modulo: string, detalles: string, usuarioId: number) {
  try {
    await prisma.bitacora.create({
      data: { accion, modulo, detalles, usuarioId }
    })
  } catch (error) {
    console.error("Error al registrar en bitácora:", error)
  }
}

async function registrarHistorial(ticketId: number, accion: string, detalles: string, usuarioId: number) {
  try {
    await prisma.historialTicket.create({
      data: { accion, detalles, ticketId, usuarioId }
    })
  } catch (error) {
    console.error("Error al registrar en historial del ticket:", error)
  }
}

// ==========================================
// ACCIÓN 1: Inicio de Sesión
// ==========================================
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

    return { success: true }
  } catch (error) {
    return { error: "Error interno al conectar con la base de datos." }
  }
}

// ==========================================
// ACCIÓN 2: CREAR TICKET
// ==========================================
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
      return { error: "Tienes 3 tickets en estado 'Nuevo'. Por favor, espera a que los técnicos atiendan tus reportes anteriores antes de crear uno nuevo." }
    }

    const haceDosHoras = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const ticketReciente = await prisma.ticket.findFirst({
      where: {
        solicitanteId: sesion.userId,
        categoria: categoria,
        fechaCreacion: { gte: haceDosHoras }
      }
    })
    if (ticketReciente) {
      return { error: `Ya reportaste un problema de categoría "${categoria}" recientemente. Por favor, espera a que sea atendido para evitar reportes duplicados.` }
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

// ==========================================
// ACCIÓN 3: ACTUALIZAR TICKET
// ==========================================
export async function actualizarTicket(formData: FormData) {
  const id = formData.get("id") as string
  const estado = formData.get("estado") as string
  let descripcionSolucion = formData.get("descripcionSolucion") as string

  if (descripcionSolucion && descripcionSolucion.length > 2000) {
    return { error: "El texto del dictamen es demasiado largo. Máximo 2000 caracteres." }
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
      datosActualizados.fechaCierre = null // Si lo reabren, le quitamos la fecha de cierre
    }
    
    const tecnicosValidos = tecnicosIdsRaw
      .map(t => t.toString().trim())
      .filter(t => t !== "" && t !== "null" && t !== "-- Sin asignar --")
      .map(t => ({ id: parseInt(t) }))

    datosActualizados.tecnicos = { set: tecnicosValidos }

    if (titulo !== null && titulo !== "") datosActualizados.titulo = titulo.toString()
    if (tipo !== null && tipo !== "") datosActualizados.tipo = tipo.toString()
    if (prioridad !== null && prioridad !== "") datosActualizados.prioridad = prioridad.toString()

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

    if (ticketOriginal?.prioridad !== prioridad && prioridad !== null) {
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
  //return { success: true }
}

// ==========================================
// ACCIÓN: AGREGAR COMENTARIO AL CHAT 
// ==========================================
export async function agregarComentario(formData: FormData) {
  const ticketId = formData.get("ticketId") as string
  const texto = formData.get("texto") as string

  const sesion = await obtenerSesion()
  if (!sesion) return { error: "Tu sesión ha expirado." }
  if (!texto || texto.trim() === "") return { error: "El mensaje no puede estar vacío." }

  if (texto.length > 1000) return { error: "El comentario es demasiado largo. Máximo 1000 caracteres." }

  try {
    await prisma.comentario.create({
      data: {
        texto,
        ticketId: parseInt(ticketId),
        autorId: sesion.userId
      }
    })
    await registrarHistorial(parseInt(ticketId), "Nuevo Comentario", "Se agregó un mensaje al chat del ticket.", sesion.userId)
  } catch (error) {
    return { error: "No se pudo enviar el mensaje." }
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`)
}

// ==========================================
// ACCIÓN 4: REGISTRAR USUARIO 
// ==========================================
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
    return { error: "Ocurrió un error interno al guardar el usuario." }
  }

  revalidatePath("/dashboard/usuarios")
  redirect("/dashboard/usuarios")
}

// ==========================================
// ACCIÓN 5: ACTUALIZAR USUARIO 
// ==========================================
export async function actualizarUsuario(formData: FormData) {
  const sesion = await obtenerSesion()
  if (!sesion || sesion.rol !== "Administrador") return { error: "Acceso denegado. Permisos insuficientes." }

  const id = Number(formData.get("id"))
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
    return { error: "No se pudo actualizar el usuario." }
  }

  revalidatePath("/dashboard/usuarios")
  redirect("/dashboard/usuarios")
}

export async function irACrearUsuario() {
  const sesion = await obtenerSesion()
  if (!sesion || sesion.rol !== "Administrador") redirect("/dashboard")
  redirect("/dashboard/usuarios/crear")
}

// ==========================================
// ACCIÓN 6: ELIMINAR USUARIO (BORRADO LÓGICO)
// ==========================================
export async function eliminarUsuario(formData: FormData) {
  const sesion = await obtenerSesion()
  if (!sesion || sesion.rol !== "Administrador") return { error: "Acceso denegado." }

  const id = Number(formData.get("id"))
  try {
    await prisma.usuario.update({ 
      where: { id: id },
      data: { activo: false } 
    })
    await registrarBitacora("Desactivó usuario", "Directorio", `Se desactivó al usuario ID: ${id}. Mantiene su histórico.`, sesion.userId)
  } catch (error) {
    return { error: "Ocurrió un error al intentar desactivar el usuario." }
  }

  revalidatePath("/dashboard/usuarios")
  redirect("/dashboard/usuarios")
}

// ==========================================
// ACCIÓN 7: CERRAR SESIÓN
// ==========================================
export async function cerrarSesion() {
  await destruirSesion()
  redirect("/")
}

// ==========================================
// ACCIÓN 8: CAMBIAR CONTRASEÑA
// ==========================================
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
    return { error: "Error interno al actualizar la contraseña." }
  }
}

// ==========================================
// ACCIÓN 9: ACTUALIZAR DATOS DE PERFIL
// ==========================================
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
    return { error: "Error interno al actualizar el perfil." }
  }
}

// ==========================================
// ACCIÓN 10: ELIMINAR TICKET
// ==========================================
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

// ==========================================
// ACCIÓN 11: SUBIR EVIDENCIA AL TICKET
// ==========================================
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

export async function subirEvidencia(formData: FormData) {
  const archivo = formData.get("archivo") as File
  const ticketId = formData.get("ticketId") as string

  const sesion = await obtenerSesion()
  if (!sesion) return { error: "Tu sesión ha expirado." }
  if (!archivo || !ticketId || archivo.size === 0) return { error: "No se adjuntó ningún archivo válido." }

  const permitidos = ['image/jpeg', 'image/png', 'application/pdf']
  if (!permitidos.includes(archivo.type)) return { error: "Formato no permitido. Por seguridad solo se admiten JPG, PNG o PDF." }
  if (archivo.size > 5 * 1024 * 1024) return { error: "El archivo excede el límite de 5MB." }

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
        nombre: archivo.name,
        rutaArchivo: `/uploads/${nombreSeguro}`,
        ticketId: parseInt(ticketId),
        subidoPorId: sesion.userId
      }
    })

    await registrarHistorial(parseInt(ticketId), "Evidencia Agregada", `Se adjuntó el archivo: ${archivo.name}`, sesion.userId)

  } catch (error) {
    return { error: "Error en el servidor al intentar guardar el archivo físico." }
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`)
}

// ==========================================
// ACCIÓN 12: FIRMA DIGITAL DE CONFORMIDAD
// ==========================================
export async function firmarConformidad(formData: FormData) {
  const ticketId = formData.get("ticketId") as string
  const sesion = await obtenerSesion()
  
  if (!sesion) return { error: "Tu sesión ha expirado." }

  try {
    await prisma.ticket.update({
      where: { id: parseInt(ticketId) },
      data: { 
        conformidadUsuario: true,
        fechaConformidad: new Date()
      }
    })

    await registrarHistorial(
      parseInt(ticketId), 
      "Firma de Conformidad", 
      "El usuario confirmó digitalmente que su incidencia fue solucionada satisfactoriamente.", 
      sesion.userId
    )
  } catch (error) {
    return { error: "Ocurrió un error al intentar registrar la firma en la base de datos." }
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`)
}

// ==========================================
// ACCIÓN 13: ACTUALIZAR FOTO DE PERFIL
// ==========================================
export async function actualizarFotoPerfil(formData: FormData) {
  const archivo = formData.get("foto") as File
  const sesion = await obtenerSesion()

  if (!sesion) return { error: "Tu sesión ha expirado." }
  if (!archivo || archivo.size === 0) return { error: "No seleccionaste ninguna imagen." }

  const permitidos = ['image/jpeg', 'image/png', 'image/webp']
  if (!permitidos.includes(archivo.type)) return { error: "Formato no permitido. Usa JPG, PNG o WEBP." }
  if (archivo.size > 5 * 1024 * 1024) return { error: "La imagen es muy pesada (Máximo 5MB)." }

  try {
    const bytes = await archivo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const extension = archivo.name.split('.').pop()
    const nombreSeguro = `avatar_${sesion.userId}_${Date.now()}.${extension}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    try { await mkdir(uploadDir, { recursive: true }) } catch(e){}

    const filePath = path.join(uploadDir, nombreSeguro)
    await writeFile(filePath, buffer)

    await prisma.usuario.update({
      where: { id: sesion.userId },
      data: { fotoPerfil: `/uploads/avatars/${nombreSeguro}` }
    })

    await registrarBitacora("Actualizó foto", "Perfil", "El usuario actualizó su foto de perfil.", sesion.userId)

  } catch (error) {
    return { error: "Error en el servidor al intentar guardar la imagen." }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/perfil")
}

// ==========================================
export async function eliminarFotoPerfil() {
  const sesion = await obtenerSesion()
  if (!sesion) return { error: "Tu sesión ha expirado." }

  try {
    await prisma.usuario.update({
      where: { id: sesion.userId },
      data: { fotoPerfil: null } // Ponemos la foto en null (vacío)
    })
    
    await registrarBitacora("Eliminó foto", "Perfil", "El usuario eliminó su foto de perfil.", sesion.userId)
  } catch (error) {
    return { error: "Error interno al intentar eliminar la foto." }
  }

  // Refrescamos las pantallas para que los cambios se vean al instante
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/perfil")
  
  return { success: true }
}