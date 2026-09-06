"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function BotonVolver() {
  const router = useRouter()
  return (
    <Button variant="outline" onClick={() => router.back()} className="dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-white">
      ← Regresar a la bandeja
    </Button>
  )
}