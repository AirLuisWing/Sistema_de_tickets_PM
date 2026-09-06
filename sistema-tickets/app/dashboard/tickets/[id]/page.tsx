import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { actualizarTicket, eliminarTicket, agregarComentario, subirEvidencia, firmarConformidad } from "@/actions/tickets"
import Link from "next/link"
import { redirect } from "next/navigation"
import { MessageSquare, History, Send, Clock, Paperclip, FileText, Download, Image as ImageIcon, CheckCircle, ShieldCheck } from "lucide-react"
import { getColorEstado, getColorPrioridad, cn } from "@/lib/utils" 
import AutoRefresh from "@/components/AutoRefresh"
import BotonConfirmacion from "@/components/BotonConfirmacion"
import FormAccion from "@/components/FormAccion"
import BotonVolver from "@/components/BotonVolver"

export const dynamic = 'force-dynamic'

export default async function DetalleTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()

  if (!sesion) redirect("/")

  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(id) },
    include: { 
      solicitante: true, 
      tecnicos: true, 
      adjuntos: { include: { subidoPor: true } },
      comentarios: { include: { autor: true }, orderBy: { fecha: 'asc' } },
      historial: { include: { usuario: true }, orderBy: { fecha: 'desc' } }
    }
  })

  if (!ticket) return <div className="p-8 text-center text-xl font-bold dark:text-white">Ticket no encontrado.</div>

  const esAdmin = sesion.rol === "Administrador"
  const esAdminOSupervisor = esAdmin || sesion.rol === "Supervisor"
  const esTecnicoAsignado = sesion.rol === "Tecnico" && ticket.tecnicos.some(t => t.id === sesion.userId)
  const esCreador = ticket.solicitanteId === sesion.userId

  if (sesion.rol === "UsuarioFinal" && !esCreador) redirect("/dashboard/tickets")
  if (sesion.rol === "Tecnico" && !esCreador && !esTecnicoAsignado) redirect("/dashboard/tickets")

  const puedeEditar = esAdminOSupervisor || esTecnicoAsignado

  let listaTecnicos: any[] = []
  if (esAdminOSupervisor) {
    listaTecnicos = await prisma.usuario.findMany({ where: { rol: "Tecnico" }, select: { id: true, nombre: true } })
  }

  const folioMostrar = ticket.folio || `#TIC-${ticket.id.toString().padStart(4, '0')}`
  const colorEstado = getColorEstado(ticket.estado)
  const colorPrioridad = getColorPrioridad(ticket.prioridad)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <AutoRefresh milisegundos={10000} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        {/* Usamos el BotonVolver que mantiene el estado de la página anterior */}
        <BotonVolver />
        
        <div className="flex gap-2">
          {esAdmin && (
            <FormAccion action={eliminarTicket}>
              <input type="hidden" name="id" value={ticket.id} />
              <BotonConfirmacion 
                variant="destructive" 
                className="font-bold shadow-md dark:bg-red-800 dark:hover:bg-red-700"
                mensaje="¿Estás absolutamente seguro de que deseas ELIMINAR este ticket por completo? Esta acción borrará el folio, la evidencia y los comentarios. No hay vuelta atrás."
              >
                Eliminar Ticket
              </BotonConfirmacion>
            </FormAccion>
          )}
          {puedeEditar && ticket.estado === 'Resuelto' && (
            <Link href={`/dashboard/tickets/${ticket.id}/imprimir`} target="_blank">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md dark:bg-emerald-700 dark:hover:bg-emerald-600">Generar Acta de Conformidad</Button>
            </Link>
          )}
        </div>
      </div>

      {!puedeEditar && ticket.estado === 'Resuelto' && !ticket.conformidadUsuario && (
        <Card className="bg-emerald-50 border-emerald-200 shadow-md dark:bg-emerald-900/20 dark:border-emerald-800">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-emerald-900 dark:text-emerald-400 font-black text-lg flex items-center gap-2">
                <CheckCircle className="h-6 w-6" /> ¡Tu problema ha sido solucionado!
              </h3>
              <p className="text-emerald-700 dark:text-emerald-500 text-sm mt-1">
                El departamento de TICs ha marcado este reporte como concluido. Por favor, confirma que el servicio fue satisfactorio para cerrar el expediente.
              </p>
            </div>
            <FormAccion action={firmarConformidad}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              <BotonConfirmacion 
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold px-8 py-6 text-lg shadow-lg whitespace-nowrap"
                mensaje="¿Confirmas que tu problema fue resuelto de manera satisfactoria? Al aceptar, el expediente será sellado digitalmente y ya no se podrán hacer modificaciones."
              >
                Confirmar Solución
              </BotonConfirmacion>
            </FormAccion>
          </CardContent>
        </Card>
      )}

      {ticket.conformidadUsuario && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 p-4 rounded-lg flex items-center gap-3 font-bold shadow-sm">
          <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-500" />
          Expediente sellado. El usuario firmó digitalmente la conformidad el {ticket.fechaConformidad ? new Date(ticket.fechaConformidad).toLocaleDateString() : ''}.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-t-4 border-t-slate-800 dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-4 bg-slate-50 dark:bg-slate-950 border-b dark:border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-white uppercase font-black tracking-tight">{folioMostrar}</CardTitle>
                  <CardDescription className="mt-1 font-medium dark:text-slate-400">Reportado el {new Date(ticket.fechaCreacion).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</CardDescription>
                </div>
                <span className={cn("px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border dark:bg-opacity-20", colorEstado)}>
                  {ticket.estado}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="mb-2 pb-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Título del Reporte</Label>
                  <p className="font-black text-2xl text-slate-900 dark:text-white mt-1">{ticket.titulo}</p>
                </div>
                <div className="text-right bg-slate-50 dark:bg-slate-950 px-5 py-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm max-w-[50%]">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-black">Técnicos Asignados</Label>
                  <p className="font-bold text-slate-900 dark:text-slate-200 mt-1 text-sm leading-snug">
                    {ticket.tecnicos.length > 0 ? ticket.tecnicos.map(t => t.nombre).join(', ') : "Sin asignar"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <div><Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Solicitante</Label><p className="font-bold text-slate-800 dark:text-slate-200 text-base mt-0.5">{ticket.solicitante?.nombre || 'Administrador'}</p></div>
                <div><Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Tipo de Solicitud</Label><p className="font-bold text-slate-800 dark:text-slate-200 text-base mt-0.5">{ticket.tipo}</p></div>
                <div><Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">Equipo / Área</Label><p className="font-bold text-slate-800 dark:text-slate-200 text-base mt-0.5">{ticket.equipoAfectado || 'No especificado'}</p></div>
                <div>
                  <Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold block mb-1">Prioridad</Label>
                  <span className={cn("px-3 py-1 rounded-md text-xs font-bold inline-block border dark:bg-opacity-20", colorPrioridad)}>
                    {ticket.prioridad}
                  </span>
                </div>
              </div>
              
              <div className="pt-2">
                <Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-2 block font-bold">Descripción del Problema</Label>
                <div className="bg-white dark:bg-slate-950 p-5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm">{ticket.descripcion}</div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                    <Paperclip className="h-4 w-4" /> Evidencias Adjuntas
                  </Label>
                  {ticket.estado !== "Resuelto" && (
                    <FormAccion action={subirEvidencia}>
                      <div className="flex gap-2">
                        <input type="hidden" name="ticketId" value={ticket.id} />
                        <Input type="file" name="archivo" required className="text-xs h-8 file:bg-slate-100 file:dark:bg-slate-800 file:border-0 file:rounded-sm file:mr-2 file:px-2 file:text-slate-700 file:dark:text-slate-300 cursor-pointer dark:bg-slate-900 dark:border-slate-700" />
                        <Button type="submit" size="sm" variant="outline" className="h-8 border-slate-300 dark:border-slate-700 font-bold dark:text-slate-200 dark:hover:bg-slate-800">Subir</Button>
                      </div>
                    </FormAccion>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ticket.adjuntos.length === 0 ? (
                    <p className="text-sm text-slate-400 italic col-span-2">No hay archivos adjuntos en este ticket.</p>
                  ) : (
                    ticket.adjuntos.map(adjunto => (
                      <a key={adjunto.id} href={adjunto.rutaArchivo} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors shadow-sm group">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm border border-slate-100 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                          {adjunto.nombre.endsWith('.pdf') ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{adjunto.nombre}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Subido por: {adjunto.subidoPor?.nombre}</p>
                        </div>
                        <Download className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </a>
                    ))
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="shadow-md border-t-4 border-t-indigo-500 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
            <CardHeader className="pb-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100"><MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />Foro de Comunicación</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col">
              <div className="max-h-96 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 flex-1">
                {ticket.comentarios.length === 0 ? (
                  <div className="text-center text-slate-400 dark:text-slate-500 text-sm italic py-8"><MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" /> Aún no hay comentarios.</div>
                ) : (
                  ticket.comentarios.map((msg) => {
                    const esMio = msg.autorId === sesion.userId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-bold tracking-wide uppercase">{msg.autor.nombre} • {new Date(msg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed ${esMio ? 'bg-indigo-600 text-white rounded-tr-sm dark:bg-indigo-700' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>{msg.texto}</div>
                      </div>
                    )
                  })
                )}
              </div>
              {ticket.estado !== "Resuelto" && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-b-xl">
                  <FormAccion action={agregarComentario}>
                    <div className="flex gap-3">
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <Input name="texto" placeholder="Escribe un mensaje..." className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 dark:text-white" required />
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-6"><Send className="h-4 w-4 mr-2" /> Enviar</Button>
                    </div>
                  </FormAccion>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md border-t-4 border-t-slate-400 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800 overflow-hidden">
            <details className="group marker:content-['']">
              <summary className="flex items-center justify-between cursor-pointer p-5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors outline-none border-b border-slate-200 dark:border-slate-800">
                <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100">
                  <History className="h-5 w-5 text-slate-600 dark:text-slate-400" /> Historial y Bitácora
                </CardTitle>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 shadow-sm group-open:bg-slate-200 group-open:dark:bg-slate-800 group-open:text-slate-800 group-open:dark:text-slate-200 transition-all">
                  <span className="group-open:hidden">Mostrar Detalles ▼</span>
                  <span className="hidden group-open:block">Ocultar Detalles ▲</span>
                </div>
              </summary>
              <CardContent className="p-8 bg-white dark:bg-slate-900">
                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-8">
                  {ticket.historial.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-[33px] bg-white dark:bg-slate-900 h-4 w-4 rounded-full border-4 border-slate-400 dark:border-slate-600 mt-1"></div>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{item.accion}</p>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                            <Clock className="h-3 w-3" /> {new Date(item.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short'})}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Por: <span className="text-slate-700 dark:text-slate-300">{item.usuario.nombre}</span></p>
                        {item.detalles && <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-100 dark:border-slate-800 italic">"{item.detalles}"</p>}
                      </div>
                    </div>
                  ))}
                  <div className="relative">
                    <div className="absolute -left-[33px] bg-slate-200 dark:bg-slate-700 h-4 w-4 rounded-full border-4 border-slate-300 dark:border-slate-600 mt-1"></div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Ticket creado.</p>
                  </div>
                </div>
              </CardContent>
            </details>
          </Card>
        </div>

        <div>
          {puedeEditar ? (
            <Card className="shadow-xl overflow-hidden sticky top-6 border dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-4 bg-blue-600 dark:bg-blue-800 text-white">
                <CardTitle className="text-lg">Panel de Gestión</CardTitle>
                <CardDescription className="text-blue-100 dark:text-blue-200">Actualiza el estado y documenta la solución.</CardDescription>
              </CardHeader>
              <FormAccion action={actualizarTicket}>
                <input type="hidden" name="id" value={ticket.id} />
                <CardContent className="space-y-4 pt-6 bg-slate-50/50 dark:bg-slate-900/50">
                  {esAdminOSupervisor && (
                    <div className="space-y-4 p-5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                      <Label className="text-slate-800 dark:text-slate-200 font-black uppercase text-xs tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 block">Modificación Administrativa</Label>
                      <div className="space-y-2">
                        <Label htmlFor="titulo" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Modificar Título</Label>
                        <Input id="titulo" name="titulo" defaultValue={ticket.titulo} className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 dark:text-white text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="tipo" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipo</Label>
                          {/* CLASES DEL SELECT ARREGLADAS (Las etiquetas options llevan la clase del modo oscuro) */}
                          <select id="tipo" name="tipo" defaultValue={ticket.tipo} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-600 text-sm">
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Soporte técnico">Soporte técnico</option>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Incidente">Incidente</option>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Mantenimiento">Mantenimiento</option>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Instalación">Instalación</option>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Solicitud de acceso">Solicitud de acceso</option>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Requerimiento">Requerimiento</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prioridad" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prioridad</Label>
                          {/* CLASES DEL SELECT ARREGLADAS */}
                          <select id="prioridad" name="prioridad" defaultValue={ticket.prioridad} className={cn("w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 text-sm font-semibold dark:bg-slate-900 dark:text-slate-200", colorPrioridad)}>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Baja">Baja</option>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Media">Media</option>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Alta">Alta</option>
                            <option className="dark:bg-slate-900 dark:text-slate-200" value="Critica">Crítica</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <Label className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider block mb-1">
                          Asignar Técnicos (Elige uno o varios)
                        </Label>
                        <div className="max-h-40 overflow-y-auto p-2 border-2 border-blue-100 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 shadow-inner space-y-1">
                          {listaTecnicos.map((tec) => {
                            const estaAsignado = ticket.tecnicos.some(t => t.id === tec.id);
                            return (
                              <label key={tec.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                                <input
                                  type="checkbox"
                                  name="tecnicoId"
                                  value={tec.id}
                                  defaultChecked={estaAsignado}
                                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 dark:bg-slate-950 focus:ring-blue-600 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{tec.nombre}</span>
                              </label>
                            );
                          })}
                          {listaTecnicos.length === 0 && (
                            <span className="text-sm text-slate-500 dark:text-slate-400 italic p-2 block">No hay técnicos registrados.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="estado" className="font-black uppercase text-xs text-slate-700 dark:text-slate-300 tracking-wider">Estado del Ticket</Label>
                    {/* CLASES DEL SELECT ARREGLADAS */}
                    <select id="estado" name="estado" defaultValue={ticket.estado} className={cn("w-full p-3 border-2 rounded-md focus:ring-2 focus:ring-blue-600 font-black shadow-sm text-base dark:bg-slate-900 dark:text-slate-200", colorEstado)}>
                      <option className="dark:bg-slate-900 dark:text-slate-200" value="Nuevo">NUEVO (Sin revisar)</option>
                      <option className="dark:bg-slate-900 dark:text-slate-200" value="En proceso">EN PROCESO (Trabajando)</option>
                      <option className="dark:bg-slate-900 dark:text-slate-200" value="Resuelto">RESUELTO (Cerrado)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcionSolucion" className="font-black uppercase text-xs text-slate-700 dark:text-slate-300 tracking-wider mt-4 block">Solución / Dictamen</Label>
                    <textarea id="descripcionSolucion" name="descripcionSolucion" rows={7} defaultValue={ticket.descripcionSolucion || ""} placeholder="Documenta el dictamen final..." className="w-full p-4 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm leading-relaxed"></textarea>
                  </div>
                </CardContent>
                <CardFooter className="bg-white dark:bg-slate-900 py-5 px-6 border-t dark:border-slate-800 z-10 relative">
                  <Button type="submit" className="w-full font-black text-base py-6 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg">GUARDAR CAMBIOS</Button>
                </CardFooter>
              </FormAccion>
            </Card>
          ) : (
            <Card className="shadow-md border-t-4 border-t-slate-400 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800 sticky top-6 bg-slate-50 dark:bg-slate-900">
              <CardHeader className="pb-4 border-b dark:border-slate-800"><CardTitle className="text-lg dark:text-slate-100">Seguimiento</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div><Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Estado</Label><p className="font-bold text-lg text-slate-800 dark:text-white mt-1">{ticket.estado}</p></div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800"><Label className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-2 block">Dictamen Técnico</Label><div className="bg-white dark:bg-slate-950 p-4 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap min-h-[100px] shadow-sm">{ticket.descripcionSolucion ? ticket.descripcionSolucion : <span className="text-slate-400 dark:text-slate-500 italic">Sin dictamen.</span>}</div></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}