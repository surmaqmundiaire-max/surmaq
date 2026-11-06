"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { ROL_LABEL } from "@/lib/selectors";
import type { Rol } from "@/lib/types";
import { Avatar, cx } from "@/components/ui";
import { ROL_VISUAL } from "@/components/visual";

const GRUPOS: { rol: Rol; titulo: string; destino: string }[] = [
  { rol: "tecnico", titulo: "Técnicos · app del celular", destino: "/tecnico" },
  { rol: "coordinador", titulo: "Coordinación de mantenimiento", destino: "/admin" },
  { rol: "jefe", titulo: "Jefatura de mantenimiento", destino: "/admin" },
  { rol: "vendedor", titulo: "Ventas", destino: "/admin/solicitudes" },
  { rol: "admin", titulo: "Administración", destino: "/admin" },
];

/** Entrada a la maqueta: cada persona elige su perfil (en producción será inicio de sesión con su correo). */
export default function Inicio() {
  const s = useStore();
  const router = useRouter();
  const entrar = (id: string, rol: Rol, destino: string) => {
    if (rol === "tecnico") s.setTecnicoActual(id);
    else s.setUsuarioActual(id);
    router.push(destino);
  };
  return (
    <main className="min-h-dvh bg-marca-900 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Optimum Service AI</h1>
        <p className="mt-2 text-marca-100/90">¿Quién eres? Elige tu perfil para entrar. Cada uno ve lo que le corresponde.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {GRUPOS.map(({ rol, titulo, destino }) => {
            const usuarios = s.perfiles.filter((p) => p.rol === rol && p.activo !== false);
            if (!usuarios.length) return null;
            const I = ROL_VISUAL[rol].icono;
            return (
              <section key={rol} className={cx("rounded-2xl bg-white p-4 text-tinta shadow-lg", rol === "tecnico" && "md:row-span-2")}>
                <h2 className="mb-2 flex items-center gap-2 font-semibold">
                  <span className={cx("inline-flex h-8 w-8 items-center justify-center rounded-lg", ROL_VISUAL[rol].chip)}><I size={17} /></span>
                  {titulo}
                </h2>
                <ul className="divide-y divide-borde">
                  {usuarios.map((u) => (
                    <li key={u.id}>
                      <button type="button" onClick={() => entrar(u.id, rol, destino)} className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-fondo active:bg-marca-50">
                        <Avatar nombre={u.nombre} size={36} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{u.nombre}</span>
                          <span className="block truncate text-sm text-tinta-2">{ROL_LABEL[u.rol]} · {u.ciudadesACargo?.join(" y ") ?? u.ciudad}</span>
                        </span>
                        <ChevronRight size={18} className="text-tinta-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        <p className="mt-8 text-xs text-marca-100/70">Maqueta con datos de ejemplo: los cambios se guardan solo en este navegador. En la versión final cada persona entra con su correo y contraseña.</p>
      </div>
    </main>
  );
}
