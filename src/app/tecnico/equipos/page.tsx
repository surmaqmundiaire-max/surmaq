import { redirect } from "next/navigation";

// La búsqueda de equipos vive ahora en Clientes (empresa → equipos).
export default function EquiposTecnico() {
  redirect("/tecnico/clientes");
}
