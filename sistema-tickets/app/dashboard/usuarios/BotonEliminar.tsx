"import client"

import BotonConfirmacion from "@/components/BotonConfirmacion"
import FormAccion from "@/components/FormAccion" // <-- IMPORTAMOS NUESTRO ESCUDO
import { eliminarUsuario } from "@/app/actions"

export default function BotonEliminar({ id, nombre }: { id: number, nombre: string }) {
  return (
    <FormAccion action={eliminarUsuario} className="inline-block">
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