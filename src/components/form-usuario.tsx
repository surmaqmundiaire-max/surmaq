"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ROL_LABEL } from "@/lib/selectors";
import type { Perfil, Rol } from "@/lib/types";
import { BarraGuardar, Campo, Chips, claseCampo } from "./formularios";
import { ROL_VISUAL } from "./visual";
import { useAviso } from "./aviso";
import { cx } from "./ui";

const CIUDADES: [string, string][] = [["Guayaquil", "Guayaquil"], ["Quito", "Quito"]];
const DESCRIPCION: Record<Rol, string> = {
  admin: "Todo, incluidos los usuarios.",
  jefe: "Programa tareas a todos los técnicos, gestiona usuarios y aprueba permisos.",
  coordinador: "Programa tareas a los técnicos de sus ciudades.",
  tecnico: "Usa la app del celular y marca sus tareas.",
};

/** Crear o editar un usuario con su perfil y rol. */
export function FormUsuario({ inicial, onGuardado }: { inicial?: Perfil; onGuardado: (id: string) => void }) {
  const s = useStore();
  const aviso = useAviso();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [email, setEmail] = useState(inicial?.email ?? "");
  const [telefono, setTelefono] = useState(inicial?.telefono ?? "");
  const [rol, setRol] = useState<Rol>(inicial?.rol ?? "tecnico");
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? "Guayaquil");
  const [aCargo, setACargo] = useState<string[]>(inicial?.ciudadesACargo ?? [inicial?.ciudad ?? "Guayaquil"]);
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const duplicado = s.perfiles.some((p) => p.email.toLowerCase() === email.toLowerCase() && p.id !== inicial?.id);
  const listo = nombre.trim().length > 2 && emailOk && !duplicado;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre completo"><input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" className={claseCampo} /></Campo>
        <Campo label="Correo">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} autoComplete="email" aria-invalid={!!email && (!emailOk || duplicado)} className={claseCampo} />
          {email && !emailOk && <span className="mt-1 block text-xs text-critico">Revisa el correo (ej. nombre@surmaq.com)</span>}
          {duplicado && <span className="mt-1 block text-xs text-critico">Ya existe un usuario con este correo</span>}
        </Campo>
        <Campo label="Teléfono" opcional><input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" className={claseCampo} /></Campo>
        <div>
          <p className="text-sm font-medium text-tinta-2">Ciudad</p>
          <Chips etiqueta="Ciudad" opciones={CIUDADES} valor={ciudad} onChange={setCiudad} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-tinta-2">Perfil</p>
        <div role="radiogroup" aria-label="Perfil" className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {(Object.keys(ROL_LABEL) as Rol[]).map((k) => {
            const I = ROL_VISUAL[k].icono;
            const activo = rol === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={activo}
                onClick={() => setRol(k)}
                className={cx("flex min-h-16 items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors", activo ? "border-marca-800 bg-marca-50" : "border-borde bg-superficie hover:bg-fondo")}
              >
                <span className={cx("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", ROL_VISUAL[k].chip)}><I size={18} /></span>
                <span>
                  <span className="block font-semibold">{ROL_LABEL[k]}</span>
                  <span className="block text-sm text-tinta-2">{DESCRIPCION[k]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {rol === "coordinador" && (
        <div>
          <p className="text-sm font-medium text-tinta-2">Coordina técnicos de</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {CIUDADES.map(([c]) => {
              const on = aCargo.includes(c);
              return (
                <button key={c} type="button" aria-pressed={on} onClick={() => setACargo(on ? aCargo.filter((x) => x !== c) : [...aCargo, c])}
                  className={cx("min-h-11 rounded-full border px-4 text-sm font-medium", on ? "border-marca-800 bg-marca-800 text-white" : "border-borde bg-superficie")}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <BarraGuardar
        texto={inicial ? "Guardar cambios" : "Crear usuario"}
        deshabilitado={!listo || (rol === "coordinador" && aCargo.length === 0)}
        ayuda={!nombre.trim() ? "Escribe el nombre" : !emailOk || duplicado ? "Revisa el correo" : "Elige al menos una ciudad a cargo"}
        onClick={() => {
          const datos = {
            nombre: nombre.trim(),
            email,
            telefono,
            rol,
            ciudad,
            area: rol === "admin" ? "Administración" : "Mantenimiento",
            ciudadesACargo: rol === "coordinador" ? aCargo : undefined,
          };
          if (inicial) {
            s.actualizarPerfil(inicial.id, datos);
            aviso("Usuario actualizado");
            onGuardado(inicial.id);
          } else {
            const id = s.agregarPerfil(datos);
            aviso(`Usuario ${datos.nombre} creado · ${ROL_LABEL[rol]}`);
            onGuardado(id);
          }
        }}
      />
    </div>
  );
}
