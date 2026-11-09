"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, CalendarPlus, ChevronDown, Gauge, Inbox, ListTodo, Lock, RotateCcw, UserCog, Users, Wrench } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { alertas, perfil, puede, ROL_LABEL, type Permiso } from "@/lib/selectors";
import { Avatar, cx } from "@/components/ui";
import { BuscadorGlobal } from "@/components/buscador-global";

const NAV: { href: string; label: string; icono: typeof Gauge; permiso?: Permiso }[] = [
  { href: "/admin", label: "Panel", icono: Gauge, permiso: "ver_panel" },
  { href: "/admin/solicitudes", label: "Solicitudes", icono: Inbox, permiso: "solicitar_visitas" },
  { href: "/admin/programar", label: "Programar tareas", icono: CalendarPlus, permiso: "programar_tareas" },
  { href: "/admin/calendario", label: "Calendario", icono: CalendarDays, permiso: "ver_calendario" },
  { href: "/admin/mantenimientos", label: "Mantenimientos", icono: Wrench, permiso: "ver_panel" },
  { href: "/admin/pendientes", label: "Pendientes", icono: ListTodo, permiso: "ver_panel" },
  { href: "/admin/clientes", label: "Clientes", icono: Building2 },
  { href: "/admin/tecnicos", label: "Técnicos", icono: Users, permiso: "ver_panel" },
  { href: "/admin/usuarios", label: "Usuarios", icono: UserCog, permiso: "gestionar_usuarios" },
];

// Rutas que requieren un permiso
const PROTEGIDAS: [string, Permiso][] = [
  ["/admin/usuarios", "gestionar_usuarios"],
  ["/admin/programar", "programar_tareas"],
  ["/admin/solicitudes", "solicitar_visitas"],
  ["/admin/calendario", "ver_calendario"],
  ["/admin/mantenimientos", "ver_panel"],
  ["/admin/pendientes", "ver_panel"],
  ["/admin/tecnicos", "ver_panel"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const s = useStore();
  const nPend = s.pendientes.filter((p) => !p.resueltoEn).length;
  const nAlertas = alertas(s.visitas, s.pendientes, s.trabajos, s.ahora).length;
  const yo = perfil(s.usuarioActualId);
  const usuariosPanel = s.perfiles.filter((p) => p.rol !== "tecnico" && p.activo !== false);
  const verSolicitudesPendientes = puede(yo.rol, "aprobar_solicitudes");
  const bloqueo = PROTEGIDAS.find(([ruta, permiso]) => path.startsWith(ruta) && !puede(yo.rol, permiso));
  const nSolicitudes = s.solicitudes.filter((x) => x.estado === "ingresada" && (!yo.ciudadesACargo?.length || yo.ciudadesACargo.includes(x.dpto))).length;
  const router = useRouter();
  // El vendedor no tiene panel: entra directo a sus solicitudes
  useEffect(() => {
    if (path === "/admin" && !puede(yo.rol, "ver_panel")) router.replace("/admin/solicitudes");
  }, [path, yo.rol, router]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-20 bg-marca-900 text-white lg:h-dvh">
        <div className="flex items-center justify-between gap-2 px-4 py-3 lg:block lg:px-5 lg:py-5">
          <Link href="/" className="block">
            <span className="block text-lg leading-tight font-bold">Optimum Service AI</span>
            <span className="block text-xs text-marca-100/80">Surmaq · {ROL_LABEL[yo.rol]}</span>
          </Link>
        </div>
        <nav aria-label="Secciones" className="overflow-x-auto lg:overflow-visible">
          <ul className="flex gap-1 px-2 pb-2 lg:flex-col lg:px-3">
            {NAV.filter((n) => !n.permiso || puede(yo.rol, n.permiso)).map(({ href, label, icono: I }) => {
              const activo = href === "/admin" ? path === href : path.startsWith(href) || (href === "/admin/clientes" && path.startsWith("/admin/equipos"));
              const cuenta = href === "/admin" ? nAlertas : href === "/admin/pendientes" ? nPend : href === "/admin/solicitudes" && verSolicitudesPendientes ? nSolicitudes : 0;
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
        <div className="hidden px-5 lg:absolute lg:inset-x-0 lg:bottom-5 lg:block">
          <div className="flex items-center gap-2">
            <Avatar nombre={yo.nombre} size={36} />
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold">{yo.nombre}</p>
              <p className="truncate text-marca-100/80">{ROL_LABEL[yo.rol]}</p>
            </div>
          </div>
          <label className="relative mt-3 flex items-center gap-1 text-xs text-marca-100/80">
            <span>Cambiar usuario:</span>
            <select value={yo.id} onChange={(e) => s.setUsuarioActual(e.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent pr-4 font-semibold text-white outline-none">
              {usuariosPanel.map((u) => <option key={u.id} value={u.id} className="text-tinta">{u.nombre} · {ROL_LABEL[u.rol]}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-0" />
          </label>
          <button type="button" onClick={s.reiniciar} className="mt-3 inline-flex items-center gap-1 text-xs text-marca-100/80 hover:text-white">
            <RotateCcw size={12} /> Reiniciar datos de la maqueta
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-x-4">
          <BuscadorGlobal />
          {/* En celular y tablet el usuario se ve aquí (en escritorio, abajo del menú) */}
          <label className="mb-4 flex items-center gap-2 text-sm lg:hidden">
            <Avatar nombre={yo.nombre} size={30} />
            <span className="sr-only">Usuario</span>
            <select value={yo.id} onChange={(e) => s.setUsuarioActual(e.target.value)} className="h-10 rounded-lg border border-borde bg-superficie px-2 text-sm font-medium">
              {usuariosPanel.map((u) => <option key={u.id} value={u.id}>{u.nombre} · {ROL_LABEL[u.rol]}</option>)}
            </select>
          </label>
        </div>
        {bloqueo ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-borde bg-superficie p-6 text-center">
            <Lock className="mx-auto text-tinta-3" size={32} />
            <h1 className="mt-3 text-lg font-semibold">Sin acceso</h1>
            <p className="mt-1 text-sm text-tinta-2">Tu perfil ({ROL_LABEL[yo.rol]}) no puede entrar a esta sección. Pídeselo a un administrador o al jefe de mantenimiento.</p>
            <Link href="/admin" className="mt-4 inline-block font-semibold text-marca-700">Ir al panel</Link>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
