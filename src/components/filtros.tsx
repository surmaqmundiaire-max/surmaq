import { Search } from "lucide-react";

export function Buscador({ valor, onChange, placeholder }: { valor: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block min-w-56 flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-3" />
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-borde bg-superficie pr-3 pl-9 text-sm outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
      />
    </label>
  );
}

export function Selector({ etiqueta, valor, onChange, opciones }: { etiqueta: string; valor: string; onChange: (v: string) => void; opciones: [string, string][] }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-tinta-2">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-borde bg-superficie px-2 text-sm outline-none focus:border-marca-600 focus:ring-2 focus:ring-marca-600/20"
      >
        {opciones.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  );
}

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
