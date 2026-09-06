import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"
import BotonImprimir from "./BotonImprimir"

export default async function ActaImpresionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // 1. Verificamos que haya sesión activa
  const sesion = await obtenerSesion()
  if (!sesion) redirect("/")
  
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(id) },
    include: { solicitante: true, tecnicos: true } // <-- AQUÍ: Incluimos la lista de técnicos
  })

  if (!ticket) {
    return <div>Ticket no encontrado.</div>
  }

  // ==========================================
  // BLINDAJE DE SEGURIDAD (IDOR Y ROLES)
  // ==========================================
  const esAdminOSupervisor = sesion.rol === "Administrador" || sesion.rol === "Supervisor"
  
  const esTecnicoAsignado = sesion.rol === "Tecnico" && ticket.tecnicos.some(t => t.id === sesion.userId)

  // Candado 1: Los usuarios finales NO tienen acceso a esta pantalla de impresión, nunca.
  if (sesion.rol === "UsuarioFinal") {
    redirect(`/dashboard/tickets/${id}`)
  }

  // Candado 2: Si es técnico, pero el ticket NO es suyo, lo expulsamos.
  if (sesion.rol === "Tecnico" && !esTecnicoAsignado) {
    redirect(`/dashboard/tickets/${id}`)
  }

  // Candado 3: (Opcional pero recomendado) Solo se puede imprimir si ya está resuelto.
  // Si intentan imprimir uno "Nuevo" o "En proceso", los regresamos.
  if (ticket.estado !== "Resuelto" && !esAdminOSupervisor) {
    redirect(`/dashboard/tickets/${id}`)
  }

  const fechaResolucion = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })

  // Usamos el folio oficial o generamos el visual provisorio
  const folioMostrar = ticket.folio || `#TIC-${ticket.id.toString().padStart(4, '0')}`

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page { margin: 0; } /* ESTO QUITA LA URL DE ABAJO Y LA FECHA DE ARRIBA */
            body { margin: 1cm; } /* Le damos un margen limpio a la hoja */
            body * { visibility: hidden; }
            #zona-impresion {
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important; top: 0 !important;
              width: 100% !important;
              margin: 0 !important; padding: 0 !important;
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #zona-impresion * {
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `
      }} />

      <div className="bg-white min-h-screen text-black font-sans pb-20 print:pb-0 print:bg-white">
        <div id="zona-impresion" className="max-w-4xl mx-auto p-10 mt-8 outline outline-1 outline-slate-200 shadow-sm print:outline-none print:shadow-none print:m-0 print:w-full print:p-6">
          
          <div className="flex justify-between items-end border-b-2 border-black pb-6 mb-6 print:pb-3 print:mb-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 print:text-xl">Policía Morelia</h1>
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mt-1 print:text-[10px]">Secretaría de Seguridad y Protección Ciudadana</h2>
              <h3 className="text-md font-semibold text-slate-700 mt-2 print:mt-1 print:text-sm">Departamento de TICs</h3>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-slate-900 print:text-2xl">ACTA DE LIBERACIÓN</p>
              <p className="text-lg font-bold text-slate-600 mt-1 print:text-sm">FOLIO: {folioMostrar}</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6 text-right print:text-xs">Morelia, Michoacán, a {fechaResolucion}.</p>

          <div className="space-y-4 print:space-y-3">
            <div className="bg-slate-50 p-6 border border-slate-200 rounded-lg print:bg-transparent print:border-slate-300 print:p-4">
              <h4 className="font-bold text-slate-900 uppercase text-sm border-b pb-2 mb-3 print:text-xs">I. Datos del Solicitante y Reporte</h4>
              <div className="grid grid-cols-2 gap-4 text-sm print:text-xs print:gap-2">
                <div><span className="font-semibold text-slate-600">Nombre:</span> {ticket.solicitante?.nombre || 'N/A'}</div>
                <div><span className="font-semibold text-slate-600">Área/Departamento:</span> {ticket.solicitante?.area || 'N/A'}</div>
                <div><span className="font-semibold text-slate-600">Equipo Afectado:</span> {ticket.equipoAfectado || 'No especificado'}</div>
                <div><span className="font-semibold text-slate-600">Categoría:</span> {ticket.categoria}</div>
                <div className="col-span-2 mt-1 pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-600 block mb-1">Título del Reporte:</span> 
                  <span className="font-bold text-slate-900 text-base print:text-sm">{ticket.titulo}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border border-slate-200 rounded-lg print:p-4">
              <h4 className="font-bold text-slate-900 uppercase text-sm border-b pb-2 mb-3 print:text-xs">II. Descripción de la Incidencia</h4>
              <p className="text-sm text-slate-800 whitespace-pre-wrap print:text-xs">{ticket.descripcion}</p>
            </div>

            <div className="p-6 border border-slate-200 rounded-lg bg-blue-50/30 print:bg-transparent print:p-4">
              <h4 className="font-bold text-slate-900 uppercase text-sm border-b pb-2 mb-3 print:text-xs">III. Solución Técnica Aplicada</h4>
              <p className="text-sm text-slate-800 whitespace-pre-wrap print:text-xs">
                {ticket.descripcionSolucion || "Se atendió y resolvió la incidencia técnica reportada restableciendo la operatividad del equipo/servicio."}
              </p>
            </div>
          </div>

          <div className="mt-6 text-sm text-slate-600 text-justify print:text-[11px] print:mt-4">
            <p>
              Por medio de la presente, el área solicitante certifica que el departamento de Tecnologías de la Información y Comunicaciones (TICs) ha atendido el reporte con el folio arriba mencionado, confirmando que los equipos y/o servicios operan de manera correcta y satisfactoria, dándose por concluido el servicio.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-16 text-center print:mt-12 print:gap-8">
            <div>
              <div style={{ borderTop: '2px solid black', width: '100%', marginBottom: '8px' }}></div>
              <p className="font-bold text-slate-900 text-sm uppercase print:text-xs">{ticket.solicitante?.nombre || 'Usuario Solicitante'}</p>
              <p className="text-xs text-slate-500 uppercase print:text-[10px]">Firma de Conformidad</p>
            </div>
            <div>
              <div style={{ borderTop: '2px solid black', width: '100%', marginBottom: '8px' }}></div>
              <p className="font-bold text-slate-900 text-sm uppercase print:text-xs">
                {ticket.tecnicos.length > 0 ? ticket.tecnicos.map(t => t.nombre).join(', ') : 'Soporte Técnico TICs'}
              </p>
              <p className="text-xs text-slate-500 uppercase print:text-[10px]">Atención y Cierre</p>
            </div>
          </div>

        </div>
        <BotonImprimir />
      </div>
    </>
  )
}