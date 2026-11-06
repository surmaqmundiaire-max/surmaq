# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4. Datos de maqueta en memoria; Supabase (Postgres) más adelante. La app actual en Glide + Google Sheets sigue en uso mientras se construye esta.

## Users

- **Técnicos de mantenimiento** (Guayaquil y Quito, ~5 activos). Trabajan en planta del cliente, con celular **Android**, muchas veces de pie, con las manos sucias y **señal irregular**. Su trabajo: llegar, hacer el servicio, dejar constancia. Cada dato que deben escribir es fricción que hoy hace que no marquen entrada/salida.
- **Administradores** (Administración, Guayaquil). En computadora. Su trabajo: saber en segundos **dónde está cada técnico**, **cuántas horas y visitas** produce cada uno y **en qué estado están los trabajos**.

## Product Purpose

Gestión del servicio técnico de Surmaq (compresores, secadores, tuberías de aire, equipos de pintura): registrar cada visita del técnico sobre un equipo de un cliente y dar al administrador información confiable para controlar y medir. Éxito = horas y estados reales (hoy solo el 24 % de las visitas tiene entrada/salida y hay horas negativas).

## Positioning

Hecho a la medida del flujo real de Surmaq: Cliente → Equipo → Trabajo (Nº correlativo) → Visitas. Los datos se capturan solos (hora, GPS, técnico, cliente, equipo) en vez de escribirse.

## Operating Context

- Tipos de trabajo: Mantenimiento, Revisión, Instalación, Arranque, Ensamblaje. Lugar: en cliente / en oficina.
- Una visita registra: entrada y salida (con GPS), auto de la empresa, acompañantes, checklist, fotos, comentarios, pendientes.
- Formulario de puesta en marcha del compresor (hoy externo en Cognito Forms).
- Permisos y vacaciones del personal.
- Historial desde 2022 en Google Sheets (~500 clientes, ~730 equipos, ~1.780 trabajos, ~3.700 visitas); se migrará al final.

## Capabilities and Constraints

- Idioma: español (Ecuador).
- **Debe funcionar con señal irregular**: guardar localmente y sincronizar después (modo sin conexión).
- **El informe de visita es solo interno** por ahora: no se envía al cliente.
- Terminología: "Trabajo" (ex hoja Mantenimiento, con número de proyecto), "Visita" (ex Tasks), "Equipo" (ex hoja Projects), "Cliente" (ex Category).
- Abierto: integración IA concreta (dictado, redacción de informe, diagnóstico), envío de informes a clientes en el futuro.

## Brand Commitments

Nombre del producto: **Optimum Service AI**, de Surmaq. Color institucional azul marino (usado en la app actual).

## Evidence on Hand

- Capturas de la app Glide actual (conversación del proyecto).
- `docs/analisis-app-glide.md`: análisis de la exportación del Google Sheet. El Excel no se versiona (datos de clientes).
- Los datos de la maqueta son ficticios; no inventar métricas presentadas como reales.

## Product Principles

1. **El técnico toca, no escribe.** Todo lo que el sistema puede saber (hora, ubicación, cliente, equipo, técnico) se llena solo; lo demás se elige con toques grandes.
2. **Un paso, una acción principal.** En cada pantalla del técnico hay un único botón principal, al alcance del pulgar.
3. **Datos confiables por construcción.** El sistema impide estados imposibles (salida sin entrada, visita abierta de ayer) en lugar de corregirlos después.
4. **El administrador ve primero lo que pregunta**: dónde está cada técnico, horas y productividad, estado de los trabajos; luego las excepciones.
5. **Funciona sin señal.**

## Accessibility & Inclusion

Uso en exteriores y plantas industriales: alto contraste, objetivos táctiles ≥ 48 px, texto legible a distancia de brazo, sin depender solo del color para estados.
