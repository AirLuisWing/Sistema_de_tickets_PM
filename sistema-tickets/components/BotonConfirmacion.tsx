"use client"

import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface Props {
  children: ReactNode
  mensaje: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export default function BotonConfirmacion({ children, mensaje, className, variant = "default" }: Props) {
  return (
    <Button 
      type="submit" 
      variant={variant} 
      className={className}
      onClick={(e) => {
        // Lanza la alerta nativa del navegador. Si el usuario cancela, detenemos el formulario.
        if (!window.confirm(mensaje)) {
          e.preventDefault()
        }
      }}
    >
      {children}
    </Button>
  )
}