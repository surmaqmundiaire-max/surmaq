# Análisis de la app actual (Glide + Google Sheets)

Fuente: capturas de pantalla de la app y exportación `Optimum_Service_2023_1.xlsx`
(el Excel **no** se versiona en el repositorio porque contiene datos de clientes).

## Equivalencia hojas → conceptos

| Hoja en Google Sheets | Qué es realmente | Filas | Tabla nueva |
|---|---|---|---|
| `Category` | Clientes (RUC, dirección, ciudad, contacto, industria, GPS) | 496 | `clientes` |
| `Projects` | **Equipos** (marca, modelo, serie, año, línea de producto, fotos) | 732 | `equipos` |
| `Mantenimiento` | **Trabajos / proyectos** sobre un equipo (el "Proyecto Nº 2781") | 1.779 | `trabajos` |
| `Tasks` | **Visitas** del técnico dentro de un trabajo (check-in/out, comentarios) | 3.719 | `visitas` |
| `Check INOut` | Marcaciones de entrada/salida con GPS | 3.718 | dentro de `visitas` |
| `Users` | Usuarios (Admin / Employee, departamento, ciudad) | 15 | `perfiles` |
| `Leave Tracker` | Permisos y vacaciones | 11 | `permisos` |
| `Vendedores` | Asesores comerciales | 16 | `perfiles` (rol vendedor) |
| `Choices`, `LineaProductos`, `Industria`, `Ciudad`, `TipoVisita` | Listas de opciones | — | enums / tablas de catálogo |
| `Links Importantes`, `Noticias`, `Catalogo` | Enlaces a Cognito Forms, catálogos en Drive | — | (fase posterior) |
| `App Logins`, `App Comments`, `App Metadata` | Internos de Glide | — | no se migran |

Nota: los nombres de las hojas están cruzados (la hoja "Projects" guarda equipos y la hoja
"Mantenimiento" guarda los proyectos). En la app nueva cada cosa tiene su nombre.

## Flujo actual

```
Cliente → Equipo → Trabajo (Mantenimiento / Revisión / Instalación / Arranque / Ensamblaje)
                         → Visitas (Tasks): fecha programada, check-in, check-out,
                           acompañantes, auto de la empresa, comentarios
```

- Tipos de trabajo usados: Mantenimiento 1.086 · Revisión 317 · Instalación 214 · Arranque 123 · Ensamblaje 39.
- Líneas de producto principales: Compresores de tornillo (416 equipos), de pistón (89),
  tratamiento de aire (78), tuberías (44), pintura en polvo (41).
- Técnicos con más visitas: enoboa, jalvear, alopez, aharo, jvera.
- Datos desde febrero 2022 hasta hoy.

## Problemas detectados en los datos

1. **Horas trabajadas inválidas**: de 887 visitas con check-in, 48 tienen horas **negativas**
   y 42 más de 16 h (check-out olvidado o hecho en otro día). Esto distorsiona las métricas de "HOY".
2. **Solo 887 de 3.719 visitas tienen check-in** (24 %). El resto no deja registro real de horas.
3. **Cierre inconsistente**: 972 trabajos tienen fecha de cierre pero no están marcados como "Cerrado".
4. **% de avance manual y poco fiable**: el valor más frecuente es 10 % (584 trabajos).
5. **Próximo chequeo casi no se usa** (3 registros): no hay mantenimiento programado real.
6. **Equipos sin cliente vinculado correctamente**: el cliente se guarda como texto (columna `Category`),
   no como relación. 410 RUC distintos para 496 clientes → clientes duplicados.
7. **Listas duplicadas** (p. ej. "Plasticos" e "Industria de Alimentos" aparecen dos veces).
8. **Formulario de puesta en marcha externo** (Cognito Forms): el número se copia a mano (solo 4 registros).
9. Muchas columnas vacías o de prueba (`New Column A`, `Distancia`, `ALERTAS`, coordenadas separadas, etc.).

## Propuesta para Optimum Service AI

### Técnico (móvil)
- "Mis visitas de hoy" con botón grande **Iniciar / Finalizar** (hora + GPS automáticos).
- Validación: no permite cerrar sin check-out; alerta si la visita supera X horas o si el GPS está lejos del cliente.
- Fotos antes/después, checklist según tipo de trabajo, firma del cliente.
- Pendientes estructurados (p. ej. "Falta punto de 220 V") en vez de texto libre.
- Formulario de puesta en marcha **dentro** de la app.
- Informe de servicio PDF enviado al cliente (WhatsApp / correo).

### Administrador (escritorio)
- Panel HOY en tiempo real: quién está en qué cliente, horas, visitas abiertas.
- Indicadores: horas por técnico, visitas por día, tiempo promedio por tipo de trabajo,
  trabajos abiertos vs. cerrados, pendientes sin resolver, por ciudad.
- Asignación y agenda de visitas; aprobación de permisos.
- Mantenimientos programados por fecha y alertas de vencimiento.

### IA
- Dictado por voz → informe técnico redactado.
- Sugerencias de diagnóstico según marca/modelo e historial del equipo.
- Resumen semanal automático para administración.

### Migración
Script de importación desde el Excel/Google Sheets que limpie duplicados, convierta el
cliente-texto en relación y marque las horas inválidas para revisión.
