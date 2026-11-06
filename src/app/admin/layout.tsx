"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, Gauge, ListTodo, RotateCcw, Users, Wrench } from "lucide-react";
import { useStore } from "@/lib/store";
import { alertas } from "@/lib/selectors";
import { Avatar, cx } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Panel", icono: Gauge },
  { href: "/admin/calendario", label: "Calendario", icono: CalendarDays },
  { href: "/admin/mantenimientos", label: "Mantenimientos", icono: Wrench },
  { href: "/admin/pendientes", label: "Pendientes", icono: ListTodo },
  { href: "/admin/clientes", label: "Clientes", icono: Building2 },
  { href: "/admin/tecnicos", label: "Técnicos", icono: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const s = useStore();
  const nPend = s.pendientes.filter((p) => !p.resueltoEn).length;
  const nAlertas = alertas(s.visitas, s.pendientes, s.trabajos, s.ahora).length;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-20 bg-marca-900 text-white lg:h-dvh">
        <div className="flex items-center justify-between gap-2 px-4 py-3 lg:block lg:px-5 lg:py-5">
          <Link href="/" className="block">
            <span className="block text-lg leading-tight font-bold">Optimum Service AI</span>
            <span className="block text-xs text-marca-100/80">Surmaq · Administración</span>
          </Link>
        </div>
        <nav aria-label="Secciones" className="overflow-x-auto lg:overflow-visible">
          <ul className="flex gap-1 px-2 pb-2 lg:flex-col lg:px-3">
            {NAV.map(({ href, label, icono: I }) => {
              const activo = href === "/admin" ? path === href : path.startsWith(href) || (href === "/admin/clientes" && path.startsWith("/admin/equipos"));
              const cuenta = href === "/admin" ? nAlertas : href === "/admin/pendientes" ? nPend : 0;
              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={activo ? "page" : undefined}
                    className={cx(
                      "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors",
                      activo ? "bg-white text-marca-900" : "text-marca-100 hover:bg-white/10",
                    )}
                  >
                    <I size={18} />
                    <span className="flex-1">{label}</span>
                    {cuenta > 0 && (
                      <span className={cx("rounded-full px-1.5 text-[11px] font-bold tabular", activo ? "bg-marca-100 text-marca-900" : "bg-white/15 text-white")}>{cuenta}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden px-5 lg:absolute lg:bottom-5 lg:block">
          <div className="flex items-center gap-2">
            <Avatar nombre="Fernando McBride" size={32} />
            <div className="text-xs">
              <p className="font-semibold">Fernando McBride</p>
              <p className="text-marca-100/80">Administrador</p>
            </div>
          </div>
          <button type="button" onClick={s.reiniciar} className="mt-3 inline-flex items-center gap-1 text-xs text-marca-100/80 hover:text-white">
            <RotateCcw size={12} /> Reiniciar datos de la maqueta
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
    </div>
  );
}
