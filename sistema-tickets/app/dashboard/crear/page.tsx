"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, XCircle } from "lucide-react"
import { crearTicket } from "@/actions/tickets"

export default function CrearTicketPage() {
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  
  // ESTADOS PARA MANTENER LA INFORMACIÓN Y LOS CONTADORES INTACTOS
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState("")
  const [equipoAfectado, setEquipoAfectado] = useState("")
  const [categoria, setCategoria] = useState("")
  const [subcategoria, setSubcategoria] = useState("")
  const [prioridad, setPrioridad] = useState("Media")
  const [nivelImpacto, setNivelImpacto] = useState("Medio")
  const [descripcion, setDescripcion] = useState("")
  
  const [tieneArchivo, setTieneArchivo] = useState(false)
  const archivoInputRef = useRef<HTMLInputElement>(null)

  const quitarArchivo = () => {
    if (archivoInputRef.current) {
      archivoInputRef.current.value = "" 
    }
    setTieneArchivo(false) 
  }

  const manejarEnvio = async (formData: FormData) => {
    setError(null)
    setCargando(true)

    // Validamos el archivo antes de enviar
    const archivo = formData.get("archivo") as File | null
    if (archivo && archivo.size > 0) {
      if (archivo.size > 5 * 1024 * 1024) {
        setError(`El archivo "${archivo.name}" pesa más de 5MB. Por favor comprímelo o elige otro.`)
        setCargando(false)
        return 
      }
      const permitidos = ['image/jpeg', 'image/png', 'application/pdf']
      if (!permitidos.includes(archivo.type)) {
        setError("Formato no permitido. Sube únicamente una foto (JPG/PNG) o un PDF.")
        setCargando(false)
        return 
      }
    }

    const resultado = await crearTicket(formData)
    if (resultado?.error) {
      setError(resultado.error)
      setCargando(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card className="shadow-lg border-t-4 border-t-blue-800 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">¿En qué te podemos ayudar?</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-base">
            Llena este sencillo formulario y el equipo de TICs te atenderá lo más pronto posible.
          </CardDescription>
        </CardHeader>
        
        <form action={manejarEnvio}>
          <CardContent className="space-y-6">
            
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400 p-4 rounded-md flex items-start gap-3 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500 mt-0.5" />
                <p className="font-bold leading-relaxed">{error}</p>
              </div>
            )}

            {/* 1. TÍTULO (50 Caracteres) */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label htmlFor="titulo" className="font-semibold text-slate-700 dark:text-slate-300">1. Asunto o título breve del problema</Label>
                <span className={`text-[10px] font-bold ${titulo.length >= 50 ? 'text-red-500' : 'text-slate-400'}`}>
                  {titulo.length}/50
                </span>
              </div>
              <Input 
                id="titulo" name="titulo" 
                value={titulo} onChange={(e) => setTitulo(e.target.value.slice(0, 50))} maxLength={50}
                placeholder="Ej. Mi computadora no enciende..." required 
                className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white w-full focus-visible:ring-blue-600" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. TIPO DE AYUDA (Select Controlado) */}
              <div className="space-y-2">
                <Label htmlFor="tipo" className="font-semibold text-slate-700 dark:text-slate-300">2. ¿Qué tipo de ayuda necesitas?</Label>
                <select 
                  id="tipo" name="tipo" required 
                  value={tipo} onChange={(e) => setTipo(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option className="dark:bg-slate-900" value="">Selecciona una opción...</option>
                  <option className="dark:bg-slate-900" value="Soporte técnico">Tengo un problema o falla general</option>
                  <option className="dark:bg-slate-900" value="Incidente">Algo dejó de funcionar de repente</option>
                  <option className="dark:bg-slate-900" value="Mantenimiento">Necesito una revisión o mantenimiento</option>
                  <option className="dark:bg-slate-900" value="Instalación">Quiero instalar un programa o equipo</option>
                  <option className="dark:bg-slate-900" value="Solicitud de acceso">Necesito un usuario o contraseña</option>
                  <option className="dark:bg-slate-900" value="Requerimiento">Quiero pedir un equipo nuevo</option>
                </select>
              </div>

              {/* 3. ÁREA / DEPARTAMENTO (25 Caracteres) */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label htmlFor="equipoAfectado" className="font-semibold text-slate-700 dark:text-slate-300">3. ¿En qué área/departamento estás?</Label>
                  <span className={`text-[10px] font-bold ${equipoAfectado.length >= 25 ? 'text-red-500' : 'text-slate-400'}`}>
                    {equipoAfectado.length}/25
                  </span>
                </div>
                <Input 
                  id="equipoAfectado" name="equipoAfectado" 
                  value={equipoAfectado} onChange={(e) => setEquipoAfectado(e.target.value.slice(0, 25))} maxLength={25}
                  placeholder="Ej. Asuntos internos..." required 
                  className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus-visible:ring-blue-600" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 4. CATEGORÍA (25 Caracteres) */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label htmlFor="categoria" className="font-semibold text-slate-700 dark:text-slate-300">4. ¿De qué trata el problema?</Label>
                  <span className={`text-[10px] font-bold ${categoria.length >= 25 ? 'text-red-500' : 'text-slate-400'}`}>
                    {categoria.length}/25
                  </span>
                </div>
                <Input 
                  id="categoria" name="categoria" 
                  value={categoria} onChange={(e) => setCategoria(e.target.value.slice(0, 25))} maxLength={25}
                  placeholder="Ej. Internet, Correo, Computadora..." required 
                  className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus-visible:ring-blue-600" 
                />
              </div>

              {/* 5. SUBCATEGORÍA (25 Caracteres) */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label htmlFor="subcategoria" className="font-semibold text-slate-700 dark:text-slate-300">5. ¿Algún detalle extra? (Opcional)</Label>
                  <span className={`text-[10px] font-bold ${subcategoria.length >= 25 ? 'text-red-500' : 'text-slate-400'}`}>
                    {subcategoria.length}/25
                  </span>
                </div>
                <Input 
                  id="subcategoria" name="subcategoria" 
                  value={subcategoria} onChange={(e) => setSubcategoria(e.target.value.slice(0, 25))} maxLength={25}
                  placeholder="Ej. No abre Word..." 
                  className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus-visible:ring-blue-600" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 6. PRIORIDAD (Select Controlado) */}
              <div className="space-y-2">
                <Label htmlFor="prioridad" className="font-semibold text-slate-700 dark:text-slate-300">6. ¿Qué tan urgente es?</Label>
                <select 
                  id="prioridad" name="prioridad" required 
                  value={prioridad} onChange={(e) => setPrioridad(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option className="dark:bg-slate-900" value="Baja">Baja - Puede esperar un poco</option>
                  <option className="dark:bg-slate-900" value="Media">Media - Urgencia normal</option>
                  <option className="dark:bg-slate-900" value="Alta">Alta - Necesito ayuda pronto</option>
                  <option className="dark:bg-slate-900" value="Critica">Crítica - ¡Emergencia! No puedo trabajar</option>
                </select>
              </div>

              {/* 7. NIVEL DE IMPACTO (Select Controlado) */}
              <div className="space-y-2">
                <Label htmlFor="nivelImpacto" className="font-semibold text-slate-700 dark:text-slate-300">7. ¿A cuántas personas afecta?</Label>
                <select 
                  id="nivelImpacto" name="nivelImpacto" 
                  value={nivelImpacto} onChange={(e) => setNivelImpacto(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option className="dark:bg-slate-900" value="Bajo">Solo me afecta a mí</option>
                  <option className="dark:bg-slate-900" value="Medio">A varios compañeros en mi área</option>
                  <option className="dark:bg-slate-900" value="Alto">A todo el departamento o edificio</option>
                </select>
              </div>
            </div>

            {/* 8. DESCRIPCIÓN (2000 Caracteres) */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label htmlFor="descripcion" className="font-semibold text-slate-700 dark:text-slate-300">8. Cuéntanos, ¿qué pasa exactamente?</Label>
                <span className={`text-[10px] font-bold ${descripcion.length >= 2000 ? 'text-red-500' : 'text-slate-400'}`}>
                  {descripcion.length}/2000
                </span>
              </div>
              <textarea 
                id="descripcion" name="descripcion" 
                value={descripcion} onChange={(e) => setDescripcion(e.target.value.slice(0, 2000))} maxLength={2000}
                rows={4} required placeholder="Describe el problema con tus propias palabras..."
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
              ></textarea>
            </div>

            {/* 9. EVIDENCIA (Archivo) */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Label htmlFor="archivo" className="font-semibold text-slate-700 dark:text-slate-300">9. Adjuntar evidencia (Opcional - Foto JPG/PNG o PDF)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="file" 
                  id="archivo" 
                  name="archivo" 
                  accept="image/*,.pdf"
                  ref={archivoInputRef}
                  onChange={(e) => setTieneArchivo((e.target.files?.length || 0) > 0)}
                  className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 cursor-pointer file:bg-slate-100 file:dark:bg-slate-800 file:border-0 file:rounded-sm file:mr-4 file:px-3 file:py-1 file:text-slate-700 file:dark:text-slate-300 hover:file:bg-slate-200 hover:file:dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus-visible:ring-blue-600"
                />
                
                {tieneArchivo && (
                  <Button type="button" variant="destructive" size="icon" title="Quitar archivo" onClick={quitarArchivo} className="shrink-0 h-10 w-10 animate-in fade-in zoom-in">
                    <XCircle className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 py-4 px-6 border-t dark:border-slate-800 rounded-b-lg">
            <Button type="submit" disabled={cargando} className="font-bold bg-blue-800 hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-lg px-6 py-2">
              {cargando ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</> : "Enviar mi reporte"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}