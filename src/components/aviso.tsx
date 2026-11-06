"use client";

// Avisos breves de confirmación («Entrada marcada 15:10») con acción opcional (Deshacer).
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface Aviso {
  id: number;
  texto: string;
  accion?: { texto: string; onClick: () => void };
}

const Ctx = createContext<(texto: string, accion?: Aviso["accion"]) => void>(() => {});

export const useAviso = () => useContext(Ctx);

export function AvisoProvider({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mostrar = useCallback((texto: string, accion?: Aviso["accion"]) => {
    clearTimeout(timer.current);
    setAviso({ id: Date.now(), texto, accion });
    timer.current = setTimeout(() => setAviso(null), accion ? 6000 : 3500);
  }, []);

  return (
    <Ctx.Provider value={mostrar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-6">
        {aviso && (
          <div key={aviso.id} className="aviso-entrada pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-tinta px-4 py-3 text-sm text-white shadow-[0_8px_24px_rgba(6,26,48,0.3)]">
            <CheckCircle2 size={18} className="shrink-0 text-[#7ee2b0]" />
            <span className="flex-1">{aviso.texto}</span>
            {aviso.accion && (
              <button
                type="button"
                onClick={() => {
                  aviso.accion!.onClick();
                  setAviso(null);
                }}
                className="min-h-10 shrink-0 rounded-lg px-3 font-semibold text-[#9ec5f0] hover:bg-white/10"
              >
                {aviso.accion.texto}
              </button>
            )}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
