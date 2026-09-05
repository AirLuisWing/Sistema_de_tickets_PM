"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AutoRefresh({ milisegundos = 15000 }: { milisegundos?: number }) {
  const router = useRouter()

  useEffect(() => {
    // Configuramos un temporizador que se repite
    const intervalo = setInterval(() => {
      // router.refresh() le dice a Next.js que vuelva a traer los datos del servidor 
      // pero MANTIENE intacta la pantalla (no borra lo que estás escribiendo)
      router.refresh()
    }, milisegundos)

    // Limpiamos el temporizador si cambiamos de página
    return () => clearInterval(intervalo)
  }, [router, milisegundos])

  return null // Este componente no dibuja nada en la pantalla, es 100% invisible
}