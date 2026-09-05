import { prisma } from "@/lib/prisma"

export async function registrarBitacora(accion: string, modulo: string, detalles: string, usuarioId: number) {
  try {
    await prisma.bitacora.create({
      data: { accion, modulo, detalles, usuarioId }
    })
  } catch (error) {
    console.error("Error al registrar en bitácora:", error)
  }
}

export async function registrarHistorial(ticketId: number, accion: string, detalles: string, usuarioId: number) {
  try {
    await prisma.historialTicket.create({
      data: { accion, detalles, ticketId, usuarioId }
    })
  } catch (error) {
    console.error("Error al registrar en historial del ticket:", error)
  }
}