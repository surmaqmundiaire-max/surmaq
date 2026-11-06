"use client";

import { useEffect, useRef } from "react";
import { Eraser } from "lucide-react";

export function Firma({ valor, onChange }: { valor?: string; onChange: (dataUrl?: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);

  useEffect(() => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0b2a4a";
    if (valor) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.offsetWidth, c.offsetHeight);
      img.src = valor;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={ref}
          aria-label="Área de firma"
          className="h-36 w-full touch-none rounded-xl border border-borde bg-superficie"
          onPointerDown={(e) => {
            dibujando.current = true;
            ref.current!.setPointerCapture(e.pointerId);
            const ctx = ref.current!.getContext("2d")!;
            ctx.beginPath();
            ctx.moveTo(...pos(e));
          }}
          onPointerMove={(e) => {
            if (!dibujando.current) return;
            const ctx = ref.current!.getContext("2d")!;
            ctx.lineTo(...pos(e));
            ctx.stroke();
          }}
          onPointerUp={() => {
            dibujando.current = false;
            onChange(ref.current!.toDataURL("image/png"));
          }}
        />
        {!valor && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-tinta-3">Firme aquí con el dedo</span>}
      </div>
      {valor && (
        <button
          type="button"
          onClick={() => {
            const c = ref.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            onChange(undefined);
          }}
          className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-marca-700"
        >
          <Eraser size={16} /> Borrar firma
        </button>
      )}
    </div>
  );
}
