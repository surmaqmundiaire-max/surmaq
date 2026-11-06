# Optimum Service AI

Gestión de servicio técnico de Surmaq. Reemplazo de la app actual en Glide + Google Sheets.

**Estado:** maqueta navegable con datos de ejemplo (sin base de datos todavía).

## Ejecutar

```bash
npm install
npm run dev
```

Abrir http://localhost:3000 y elegir **Técnico** (app de celular) o **Administración** (panel de escritorio).
Lo que hagas como técnico se refleja en el panel de administración (se guarda en el navegador).

## Estructura

- `src/app/tecnico` — app del técnico: Hoy, flujo de visita (llegada → checklist/fotos/notas → cierre), equipos, pendientes.
- `src/app/admin` — panel, trabajos, mantenimientos, pendientes, clientes y equipos, técnicos.
- `src/lib/mock-data.ts` — datos ficticios; `src/lib/store.tsx` — estado de la maqueta (se reemplazará por Supabase).
- `supabase/migrations/` — modelo de datos para Supabase.
- `docs/analisis-app-glide.md` — análisis de la app actual y sus datos.
- `PRODUCT.md` — contexto de producto (skill Impeccable).
