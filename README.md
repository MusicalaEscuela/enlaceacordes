# Guía Musicala | Enlace de acordes

Sitio web estático, didáctico e interactivo para explicar el enlace de acordes a estudiantes de música.

## Qué incluye

- `index.html`: estructura completa del sitio.
- `styles.css`: diseño visual con colores de Musicala, responsive y sin dependencias externas.
- `script.js`: mesa interactiva de tonalidades, recorridos, movimientos de voces y audio con Web Audio API.
- `assets/logo.png`: logo oficial conectado en el encabezado y el pie de página.
- `assets/favicon.svg`: ícono del sitio.

## Importante

Este proyecto **no es PWA**. No incluye `manifest.json`, `service-worker.js` ni instalación offline. Es un sitio estático normal, listo para subir manualmente a GitHub Pages.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube todos los archivos de esta carpeta al repositorio.
3. En GitHub entra a **Settings > Pages**.
4. En **Build and deployment**, elige:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Guarda los cambios.
6. GitHub te dará un enlace público cuando termine de publicar.

## Cómo editar contenido

- Textos principales: edita `index.html`.
- Colores, tamaños y apariencia: edita `styles.css`.
- Tonalidades, progresiones e interacción: edita `script.js`.
- Logo: reemplaza `assets/logo.png` conservando el mismo nombre.

## Recomendación para Musicala

La guía evita el teclado visual, el cifrado americano y los números romanos. Presenta las notas con nombres completos en tablas para que el material pueda usarse con cualquier instrumento.
