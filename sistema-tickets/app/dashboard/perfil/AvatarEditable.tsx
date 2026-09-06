"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { actualizarFotoPerfil, eliminarFotoPerfil } from "@/actions/profile"

export default function AvatarEditable({ urlFoto, iniciales }: { urlFoto?: string | null, iniciales: string }) {
  const [cargando, setCargando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCargando(true)
    const formData = new FormData()
    formData.append("foto", file)

    const res = await actualizarFotoPerfil(formData)
    if (res?.error) {
      alert(res.error) 
    }
    
    setCargando(false)
    // Limpiamos el input por si quieren subir la misma foto después
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleEliminar = async (e: React.MouseEvent) => {
    e.stopPropagation() // Esto evita que se abra la ventana de Windows al hacer clic en borrar
    
    if (!window.confirm("¿Estás seguro de que deseas eliminar tu foto de perfil?")) return

    setCargando(true)
    const res = await eliminarFotoPerfil()
    if (res?.error) {
      alert(res.error)
    }
    setCargando(false)
  }

  return (
    <div className="relative w-max mx-auto mb-4">
      {/* Contenedor clickeable de la imagen */}
      <div 
        className="relative group cursor-pointer rounded-full overflow-hidden" 
        onClick={() => !cargando && fileInputRef.current?.click()}
        title="Cambiar foto de perfil"
      >
        <Avatar className="h-28 w-28 border-4 border-white dark:border-slate-800 shadow-lg">
          {urlFoto && <AvatarImage src={urlFoto} alt="Foto de perfil" className="object-cover" />}
          <AvatarFallback className="bg-blue-600 text-white text-4xl font-bold">
            {iniciales}
          </AvatarFallback>
        </Avatar>

        {/* Pantalla oscura encima al pasar el mouse */}
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
          {cargando ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
      </div>

      {/* Botón flotante rojo para eliminar foto (SOLO aparece si ya tiene una foto) */}
      {urlFoto && (
        <button
          onClick={handleEliminar}
          disabled={cargando}
          title="Eliminar foto"
          className="absolute bottom-0 right-0 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md border-2 border-white dark:border-slate-900 transition-colors z-10"
        >
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}