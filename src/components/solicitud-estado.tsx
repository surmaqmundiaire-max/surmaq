import { CalendarCheck2, Hourglass, XCircle } from "lucide-react";
import type { EstadoSolicitud } from "@/lib/types";
import { Badge } from "./ui";

export function EstadoSolicitudBadge({ estado }: { estado: EstadoSolicitud }) {
  if (estado === "programada") return <Badge tono="ok" icono={<CalendarCheck2 size={12} />}>Programada</Badge>;
  if (estado === "rechazada") return <Badge tono="critico" icono={<XCircle size={12} />}>Rechazada</Badge>;
  return <Badge tono="aviso" icono={<Hourglass size={12} />}>Por revisar</Badge>;
}
