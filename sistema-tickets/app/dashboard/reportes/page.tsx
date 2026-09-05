import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertOctagon, CheckCircle, Clock, ShieldCheck } from "lucide-react"
import BotonExportar from "../BotonExportar"
import FiltroReportes from "./FiltroReportes"

export const dynamic = 'force-dynamic'

const HORAS_SLA = { "Critica": 4, "Alta": 12, "Media": 48, "Baja": 120 }

export default async function ReportesSLAPage({ searchParams }: { searchParams: Promise<{ filtro?: string, fecha?: string }> }) {
  const sesion = await obtenerSesion()
  if (!sesion) redirect("/")
  
  if (sesion.rol !== "Administrador" && sesion.rol !== "Supervisor") {
    redirect("/dashboard/tickets")
  }

  const resolvedParams = await searchParams
  const filtro = resolvedParams.filtro || "mes"
  const fechaEspecifica = resolvedParams.fecha
  let whereClause: any = {}
  let textoFiltro = filtro
  let periodoRedactado = ""

  if (fechaEspecifica) {
    if (fechaEspecifica.length === 10) { 
      const inicioDia = new Date(`${fechaEspecifica}T00:00:00`)
      const finDia = new Date(`${fechaEspecifica}T23:59:59`)
      whereClause = { fechaCreacion: { gte: inicioDia, lte: finDia } }
      periodoRedactado = `el día ${fechaEspecifica}`
    } else if (fechaEspecifica.includes('-W')) {
      const [year, week] = fechaEspecifica.split('-W')
      const simple = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
      const dow = simple.getDay()
      const inicioSemana = new Date(simple)
      inicioSemana.setDate(simple.getDate() - dow + (dow === 0 ? -6 : 1)) 
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(inicioSemana.getDate() + 6)
      finSemana.setHours(23,59,59)
      whereClause = { fechaCreacion: { gte: inicioSemana, lte: finSemana } }
      periodoRedactado = `la semana ${week} del año ${year}`
    } else if (fechaEspecifica.length === 7) { 
      const [year, month] = fechaEspecifica.split('-')
      const inicioMes = new Date(parseInt(year), parseInt(month) - 1, 1)
      const finMes = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      whereClause = { fechaCreacion: { gte: inicioMes, lte: finMes } }
      periodoRedactado = `el mes de ${month}/${year}`
    } else if (fechaEspecifica.length === 4) { 
      const inicioAno = new Date(parseInt(fechaEspecifica), 0, 1)
      const finAno = new Date(parseInt(fechaEspecifica), 11, 31, 23, 59, 59)
      whereClause = { fechaCreacion: { gte: inicioAno, lte: finAno } }
      periodoRedactado = `el año ${fechaEspecifica}`
    }
  } else {
    let fechaInicio = new Date()
    fechaInicio.setHours(0, 0, 0, 0)
    if (filtro === "hoy") periodoRedactado = "el día de hoy"
    else if (filtro === "semana") {
      const dia = fechaInicio.getDay()
      const diff = fechaInicio.getDate() - dia + (dia === 0 ? -6 : 1)
      fechaInicio.setDate(diff)
      periodoRedactado = "la presente semana"
    } else if (filtro === "mes") {
      fechaInicio.setDate(1)
      periodoRedactado = "el presente mes"
    } else if (filtro === "año") {
      fechaInicio.setMonth(0, 1)
      periodoRedactado = "el presente año"
    } else {
      fechaInicio = new Date("2000-01-01")
      periodoRedactado = "todo el histórico registrado"
    }
    whereClause = { fechaCreacion: { gte: fechaInicio } }
  }

  const ticketsResueltos = await prisma.ticket.findMany({
    where: { ...whereClause, estado: 'Resuelto' },
    include: { historial: true } 
  })
  
  const totalResueltos = ticketsResueltos.length
  let brechas = 0
  let horasTotales = 0

  ticketsResueltos.forEach(ticket => {
    let fechaFin = ticket.fechaCierre
    if (!fechaFin) {
      const registroResolucion = ticket.historial.find(h => h.accion === "Cambio de Estado" && h.detalles?.includes("'Resuelto'"))
      fechaFin = registroResolucion ? registroResolucion.fecha : new Date() 
    }
    const horasTardadas = (fechaFin.getTime() - ticket.fechaCreacion.getTime()) / (1000 * 60 * 60)
    horasTotales += horasTardadas
    const limiteSLA = HORAS_SLA[ticket.prioridad as keyof typeof HORAS_SLA] || 24
    if (horasTardadas > limiteSLA) brechas++
  })

  const porcentajeCumplimiento = totalResueltos > 0 ? (((totalResueltos - brechas) / totalResueltos) * 100).toFixed(1) : "0"
  const tiempoPromedioResolucion = totalResueltos > 0 ? (horasTotales / totalResueltos).toFixed(1) : "0"

  const fechaHoy = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page { margin: 0; } 
            body { margin: 1cm; background: white !important; }
            body * { visibility: hidden; }
            #zona-impresion-reporte {
              visibility: visible !important; position: absolute !important;
              left: 0 !important; top: 0 !important; width: 100% !important; 
              margin: 0 !important; padding: 0 !important; box-sizing: border-box !important;
              background: white !important; overflow: hidden !important;
            }
            #zona-impresion-reporte * { visibility: visible !important; color: black !important; border-color: black !important; }
            .print\\:hidden { display: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:border-none { border: none !important; }
          }
        `
      }} />

      <div className="p-8 max-w-5xl mx-auto min-h-screen bg-slate-50/50 dark:bg-slate-950 print:bg-white print:p-0">
        <div id="zona-impresion-reporte" className="space-y-8 print:space-y-4 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 print:border-none print:shadow-none print:p-0">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-800 dark:border-slate-700 pb-6 print:pb-3">
            <div>
              <h1 className="text-3xl print:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Policía Morelia</h1>
              <h2 className="text-sm print:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-1">Secretaría de Seguridad y Protección Ciudadana</h2>
              <h3 className="text-md print:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 print:mt-1">Departamento de TICs</h3>
            </div>
            
            <div className="flex flex-col items-end gap-4 print:hidden">
              <FiltroReportes filtroActual={filtro} />
              <BotonExportar />
            </div>
            
            <div className="hidden print:block text-right">
              <p className="text-xl font-black text-slate-900 uppercase">Resumen Ejecutivo</p>
              <p className="text-xs font-bold text-slate-600 uppercase mt-1">Reporte de Desempeño</p>
            </div>
          </div>

          <p className="text-sm print:text-xs text-slate-600 dark:text-slate-400 text-right print:block hidden mb-8 print:mb-4">
            Morelia, Michoacán, a {fechaHoy}.
          </p>

          <div className="grid gap-4 print:gap-2 md:grid-cols-4 grid-cols-2 print:grid-cols-4">
            <Card className="shadow-sm border-t-4 border-t-emerald-500 dark:bg-slate-950 dark:border-x-slate-800 dark:border-b-slate-800 print:shadow-none print:border print:border-t-4">
              <CardContent className="pt-4 print:pt-3 print:pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs print:text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Cumplimiento SLA</p>
                    <div className="text-2xl print:text-xl font-bold text-emerald-600 dark:text-emerald-500">{porcentajeCumplimiento}%</div>
                  </div>
                  <ShieldCheck className="h-5 w-5 print:h-4 print:w-4 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-blue-500 dark:bg-slate-950 dark:border-x-slate-800 dark:border-b-slate-800 print:shadow-none print:border print:border-t-4">
              <CardContent className="pt-4 print:pt-3 print:pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs print:text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Tiempo Promedio</p>
                    <div className="text-2xl print:text-xl font-bold text-slate-900 dark:text-white">{tiempoPromedioResolucion} hrs</div>
                  </div>
                  <Clock className="h-5 w-5 print:h-4 print:w-4 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-slate-800 dark:border-t-slate-500 dark:bg-slate-950 dark:border-x-slate-800 dark:border-b-slate-800 print:shadow-none print:border print:border-t-4">
              <CardContent className="pt-4 print:pt-3 print:pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs print:text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Resueltos</p>
                    <div className="text-2xl print:text-xl font-bold text-slate-900 dark:text-white">{totalResueltos}</div>
                  </div>
                  <CheckCircle className="h-5 w-5 print:h-4 print:w-4 text-slate-800 dark:text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-red-500 dark:bg-slate-950 dark:border-x-slate-800 dark:border-b-slate-800 print:shadow-none print:border print:border-t-4">
              <CardContent className="pt-4 print:pt-3 print:pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs print:text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Brechas SLA</p>
                    <div className="text-2xl print:text-xl font-bold text-red-600 dark:text-red-500">{brechas}</div>
                  </div>
                  <AlertOctagon className="h-5 w-5 print:h-4 print:w-4 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 print:mt-4 text-slate-800 dark:text-slate-300 text-justify leading-relaxed print:leading-snug space-y-6 print:space-y-3 print:text-sm">
            <h4 className="font-bold text-lg print:text-base border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 print:mb-2 uppercase tracking-wide">Síntesis de Resultados Operativos</h4>
            <p><strong className="dark:text-white">A quien corresponda:</strong></p>
            <p>Por medio del presente documento, se rinde el informe oficial de resultados y métricas operativas correspondientes a las labores ejecutadas por el departamento de Tecnologías de la Información y Comunicaciones (TICs) durante <strong className="dark:text-white">{periodoRedactado}</strong>.</p>
            <p>Durante el periodo evaluado, el equipo técnico logró la resolución satisfactoria y el cierre de <strong className="dark:text-white">{totalResueltos} incidentes tecnológicos</strong>. Estas intervenciones fueron fundamentales para garantizar la continuidad operativa de los sistemas, la infraestructura de red y los equipos de cómputo que dan soporte a las labores críticas de la corporación.</p>
            <p>En relación a nuestros estándares de calidad, se reporta un nivel de cumplimiento de los Acuerdos de Nivel de Servicio (SLA) del <strong className="dark:text-white">{porcentajeCumplimiento}%</strong>. El departamento mantuvo un destacado tiempo promedio de atención y solución de <strong className="dark:text-white">{tiempoPromedioResolucion} horas</strong> por cada incidencia reportada.</p>
            <p>
              {brechas === 0 
                ? "Es importante destacar que, durante este periodo, el 100% de los servicios requeridos se resolvieron dentro del tiempo límite establecido, sin registrarse ninguna brecha de atención. Esto refleja la rápida capacidad de respuesta del equipo ante las eventualidades técnicas de las instalaciones." 
                : `Cabe mencionar que se identificaron ${brechas} incidencia(s) que excedieron el margen de tiempo estimado. Dichos casos han sido debidamente documentados para optimizar nuestras estrategias de diagnóstico y agilizar la atención en eventos futuros de naturaleza similar.`
              }
            </p>
            <p>Estos indicadores refrendan el compromiso constante del área de TICs por salvaguardar la integridad operativa y tecnológica de la dependencia. Sin más por el momento, quedo a su entera disposición para cualquier aclaración respecto a las métricas presentadas.</p>

            <div className="mt-20 print:mt-12 flex flex-col items-center justify-center text-center">
              <div className="border-b border-slate-800 dark:border-slate-500 w-72 mb-2"></div>
              <p className="font-bold text-slate-900 dark:text-white text-sm print:text-xs uppercase">Nombre y Firma del Responsable</p>
              <p className="text-xs print:text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-1">Coordinación de TICs</p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}