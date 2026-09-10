"use client"

import BotonConfirmacion from "@/components/BotonConfirmacion"
import FormAccion from "@/components/FormAccion" 
import { eliminarUsuario } from "@/actions/users"
import { useRouter } from "next/navigation"

export default function BotonEliminar({ id, nombre }: { id: number, nombre: string }) {
  const router = useRouter();

  // 🛡️ CORRECCIÓN: Envolvemos la acción para forzar el refresco de la página al terminar.
  const handleAction = async (formData: FormData) => {
    await eliminarUsuario(formData);
    router.refresh();
  }

  return (
    <FormAccion action={handleAction} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <BotonConfirmacion 
        variant="ghost"
        className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium h-9 px-3"
        mensaje={`¿Estás seguro de que deseas eliminar o desactivar al usuario "${nombre}"?`}
      >
        Eliminar
      </BotonConfirmacion>
    </FormAccion>
  )
}