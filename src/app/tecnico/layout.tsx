"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarCheck, CalendarDays, ListTodo, ChevronDown } from "lucide-react";
import { Recordatorios } from "@/components/recordatorios";
import { useEffect } from "react";
import { registrarNavegacion } from "@/lib/volver";
import { useStore } from "@/lib/store";
import { tecnicos } from "@/lib/selectors";
import { cx } from "@/components/ui";

const NAV = [
  { href: "/tecnico", label: "Hoy", icono: CalendarCheck },
  { href: "/tecnico/agenda", label: "Agenda", icono: CalendarDays },
  { href: "/tecnico/clientes", label: "Clientes", icono: Building2 },
  { href: "/tecnico/pendientes", label: "Pendientes", icono: ListTodo },
];

export default function TecnicoLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { tecnicoActualId, setTecnicoActual, pendientes, trabajos } = useStore();
  useEffect(registrarNavegacion, [path]);
  const enVisita = path.startsWith("/tecnico/visita/") || path.endsWith("/nuevo");
  const misTrabajos = new Set(trabajos.filter((t) => t.asignadoId === tecnicoActualId).map((t) => t.id));
  const nPend = pendientes.filter((p) => !p.resueltoEn && misTrabajos.has(p.trabajoId)).length;

  return (
    <div className="min-h-dvh bg-[#dfe5ec] sm:py-6">
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-fondo sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:shadow-2xl">
        {/* Barra de demostración: cambiar de técnico */}
        <div className="flex items-center justify-between gap-2 bg-marca-950 px-4 py-1.5 text-[11px] text-marca-100">
          <Link href="/" className="hover:underline">← Maqueta</Link>
          <label className="relative flex items-center gap-1">
            <span className="opacity-70">Ver como</span>
            <select
              value={tecnicoActualId}
              onChange={(e) => setTecnicoActual(e.target.value)}
              className="appearance-none bg-transparent pr-4 font-semibold text-white outline-none"
            >
              {tecnicos().map((t) => (
                <option key={t.id} value={t.id} className="text-tinta">{t.nombre}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-0" />
          </label>
        </div>

        <Recordatorios />
        <main className={cx("flex-1", !enVisita && "pb-24")}>{children}</main>

        {!enVisita && (
          <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] sm:absolute">
            <ul className="grid grid-cols-4">
              {NAV.map(({ href, label, icono: I }) => {
                const activo = href === "/tecnico" ? path === href : path.startsWith(href) || (href === "/tecnico/clientes" && /^\/tecnico\/(equipos|mantenimientos)/.test(path));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cx("relative flex flex-col items-center gap-1 py-3 text-xs font-medium", activo ? "text-marca-800" : "text-tinta-3")}
                    >
                      <I size={22} strokeWidth={activo ? 2.4 : 1.8} />
                      {label}
                      {label === "Pendientes" && nPend > 0 && (
                        <span className="absolute top-2 left-1/2 ml-2 rounded-full bg-critico px-1.5 text-[10px] font-bold text-white tabular">{nPend}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
