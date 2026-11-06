"use client";

import { useRouter } from "next/navigation";

// Cuenta las navegaciones dentro de la app para que «volver» regrese a la pantalla anterior
// (p. ej. a la Agenda o al mantenimiento desde donde se abrió una tarea) y no a una fija.
let navegaciones = 0;
export const registrarNavegacion = () => {
  navegaciones++;
};

export function useVolver(respaldo: string) {
  const router = useRouter();
  return () => (navegaciones > 1 ? router.back() : router.push(respaldo));
}
