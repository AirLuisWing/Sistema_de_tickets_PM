import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { 
  Home, 
  Ticket, 
  PlusCircle, 
  BarChart3, 
  Users, 
  Search, 
  User,
  Menu,
  ClipboardList,
  ShieldCheck
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { obtenerSesion } from "@/lib/session"
import BotonCerrarSesion from "./BotonCerrarSesion"
import BotonModoOscuro from "@/components/BotonModoOscuro"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    redirect("/")
  }

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: sesion.userId }
  })

  const rol = sesion.rol
  const esAdminOSupervisor = rol === "Administrador" || rol === "Supervisor"
  const esTecnico = rol === "Tecnico"
  const esUsuarioFinal = rol === "UsuarioFinal"
  
  const nombreCorto = usuarioDB?.nombre || "Usuario"
  const iniciales = nombreCorto.substring(0, 2).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" defaultChecked />
      
      <aside className="w-0 peer-checked:w-64 transition-[width] duration-300 ease-in-out flex-shrink-0 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-800 text-white flex flex-col overflow-hidden">
        <div className="w-64 flex flex-col h-full">
          <div className="flex h-16 items-center justify-center border-b border-white/10 dark:border-slate-800 px-6 shrink-0">
            <span className="text-xl font-bold tracking-wider text-blue-400">POLICÍA MORELIA</span>
          </div>
          
          <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
            {!esUsuarioFinal && (
              <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors">
                <Home className="h-5 w-5 text-blue-400" />
                <span>Inicio</span>
              </Link>
            )}
            
            <Link href="/dashboard/tickets" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors">
              <Ticket className="h-5 w-5 text-blue-400" />
              <span>Mis Tickets</span>
            </Link>

            {esAdminOSupervisor && (
              <Link href="/dashboard/global" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors">
                <Ticket className="h-5 w-5 text-blue-400" />
                <span>Todos los Tickets</span>
              </Link>
            )}

            {esTecnico && (
              <Link href="/dashboard/asignados" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors">
                <ClipboardList className="h-5 w-5 text-blue-400" />
                <span>Tickets Asignados</span>
              </Link>
            )}

            <Link href="/dashboard/crear" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors">
              <PlusCircle className="h-5 w-5 text-blue-400" />
              <span>Crear Ticket</span>
            </Link>
            
            {esAdminOSupervisor && (
              <>
                <Link href="/dashboard/reportes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  <span>Reportes/SLA</span>
                </Link>
                <Link href="/dashboard/usuarios" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span>Usuarios</span>
                </Link>
                <Link href="/dashboard/bitacora" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 transition-colors border border-white/10 bg-black/20 mt-2">
                  <ShieldCheck className="h-5 w-5 text-red-400" />
                  <span className="font-bold">Auditoría Global</span>
                </Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/10 dark:border-slate-800 shrink-0 mt-auto">
            <BotonCerrarSesion />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-16 items-center justify-between border-b dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 shadow-sm transition-colors duration-300">
          <div className="flex flex-1 items-center gap-3 md:gap-4">
            <label htmlFor="sidebar-toggle" className="cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 transition-colors">
              <Menu className="h-5 w-5" />
            </label>

            <form action="/dashboard/tickets" method="GET" className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input 
                name="buscar" 
                type="search" 
                placeholder="Buscar ticket por número, asunto o solicitante..." 
                className="w-full bg-slate-50 dark:bg-slate-950 pl-9 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-600 dark:text-white dark:placeholder:text-slate-500 transition-colors" 
              />
            </form>

          </div>
          
          <div className="flex items-center gap-4">
            <BotonModoOscuro />
            
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 py-1 px-2 rounded-lg transition-colors">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{nombreCorto}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{rol}</p>
                </div>
                <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700 shadow-sm">
                  {usuarioDB?.fotoPerfil && (
                    <AvatarImage alt={nombreCorto} className="object-cover" src={usuarioDB.fotoPerfil} />
                  )}
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">{iniciales}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 dark:bg-slate-900 dark:border-slate-800">
                
                <div className="px-2 py-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                  Configuración de Cuenta
                </div>
                
                <DropdownMenuSeparator className="dark:bg-slate-800" />
                
                <Link href="/dashboard/perfil">
                  <DropdownMenuItem className="cursor-pointer py-2 dark:focus:bg-slate-800 dark:text-slate-200">
                    <User className="mr-2 h-4 w-4" />
                    <span className="font-medium">Ver mi perfil</span>
                  </DropdownMenuItem>
                </Link>
                
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}