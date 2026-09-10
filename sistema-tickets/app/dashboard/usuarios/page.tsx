import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, UserPlus, ShieldAlert, ShieldCheck, Wrench, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import BotonEliminar from "./BotonEliminar"
import Link from "next/link"
import ControlesPaginacion from "@/components/ControlesPaginacion"

export const dynamic = 'force-dynamic'

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ buscar?: string, pagina?: string, limite?: string }> }) {
  const sesion = await obtenerSesion()
  if (!sesion) redirect("/")

  const esAdmin = sesion.rol === "Administrador"

  const resolvedParams = await searchParams
  const buscar = resolvedParams.buscar || ""
  const paginaActual = Number(resolvedParams.pagina) || 1
  const ITEMS_POR_PAGINA = Number(resolvedParams.limite) || 10

  // 🛡️ CORRECCIÓN: Forzamos a que SOLO busque usuarios con activo = true. 
  // ¡Los eliminados desaparecerán por completo de la tabla!
  const baseWhere: any = { activo: true }
  
  const whereClause = buscar 
    ? { ...baseWhere, OR: [ { nombre: { contains: buscar } }, { area: { contains: buscar } } ] } 
    : baseWhere

  const totalUsuarios = await prisma.usuario.count({ where: whereClause })
  const totalPaginas = Math.ceil(totalUsuarios / ITEMS_POR_PAGINA)

  const usuarios = await prisma.usuario.findMany({
    where: whereClause,
    select: { id: true, nombre: true, area: true, rol: true, email: true },
    orderBy: { nombre: 'asc' },
    skip: (paginaActual - 1) * ITEMS_POR_PAGINA,
    take: ITEMS_POR_PAGINA
  })

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'Administrador': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 flex items-center gap-1 w-max"><ShieldAlert className="h-3 w-3" /> Administrador</span>
      case 'Supervisor': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 flex items-center gap-1 w-max"><ShieldCheck className="h-3 w-3" /> Supervisor</span>
      case 'Tecnico': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 flex items-center gap-1 w-max"><Wrench className="h-3 w-3" /> Técnico</span>
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex items-center gap-1 w-max"><User className="h-3 w-3" /> Usuario Final</span>
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Directorio de Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión del personal y niveles de acceso al sistema.</p>
        </div>
        {esAdmin && (
          <Link href="/dashboard/usuarios/crear" className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-800 hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md h-10 px-4 py-2 transition-colors">
            <UserPlus className="mr-2 h-4 w-4" /> Nuevo Usuario
          </Link>
        )}
      </div>

      <Card className="shadow-sm border-t-4 border-t-slate-800 dark:border-t-slate-500 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
        <CardHeader className="pb-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="dark:text-slate-100">Personal Registrado</CardTitle>
              <CardDescription className="dark:text-slate-400">Mostrando {usuarios.length} de {totalUsuarios} usuario(s).</CardDescription>
            </div>
            <form method="GET" className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Input name="buscar" type="search" defaultValue={buscar} placeholder="Buscar por nombre o área..." className="pl-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 focus-visible:ring-blue-800" />
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nombre Completo</th>
                  <th className="px-6 py-4 font-semibold">Área / Departamento</th>
                  <th className="px-6 py-4 font-semibold">Rol</th>
                  {esAdmin && <th className="px-6 py-4 font-semibold text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No se encontraron usuarios activos.</td></tr>
                ) : (
                  usuarios.map((user) => (
                    <tr key={user.id} className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <Link href={`/dashboard/usuarios/${user.id}/perfil`} className="flex items-center gap-3 hover:text-blue-700 dark:hover:text-blue-400 transition-colors group w-max">
                          <div className="bg-slate-200 dark:bg-slate-800 p-2 rounded-full text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 group-hover:dark:bg-blue-900/30 group-hover:text-blue-700 group-hover:dark:text-blue-400"><User className="h-4 w-4" /></div>
                          <span className="underline-offset-4 group-hover:underline">{user.nombre}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 dark:text-slate-300">{user.area || 'No especificada'}</td>
                      <td className="px-6 py-4">{getRolBadge(user.rol)}</td>
                      {esAdmin && (
                        <td className="px-6 py-4 text-right whitespace-nowrap flex items-center justify-end gap-2">
                          <Link href={`/dashboard/usuarios/${user.id}/editar`} className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 h-9 px-3">
                            Editar
                          </Link>
                          <BotonEliminar id={user.id} nombre={user.nombre} />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ControlesPaginacion paginaActual={paginaActual} totalPaginas={totalPaginas} rutaBase="/dashboard/usuarios" />
        </CardContent>
      </Card>
    </div>
  )
}