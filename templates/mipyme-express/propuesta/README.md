# Propuesta antes / después — Cabaña del Árbol

Material para mostrarle al cliente cómo mejora su presencia en Google Search, Google Maps,
Instagram y en SEO/GEO (buscadores y asistentes de IA).

Se publica en **`/propuesta`** (`https://cabana-del-arbol-demo.vercel.app/propuesta`), con el mismo
contador de 7 días que la web: al vencer, también se bloquea. Tiene `noindex` para que Google no la
indexe, y vista previa con foto al compartir el link. Solo se sube `index.html` y `web/`; `antes/`,
`despues/` y `fuentes/` están en `.vercelignore`.

## Qué hay en la carpeta

| Carpeta / archivo | Qué es |
|---|---|
| `index.html` | Página de comparación para mostrar al cliente (se publica en `/propuesta`). |
| `antes/` | Capturas reales originales (PNG): Instagram, Google Maps y Google Search. |
| `despues/` | Simulaciones de la propuesta en alta calidad (PNG), mismos nombres que `antes/`. |
| `web/` | Las mismas imágenes en JPG livianas, las que usa `index.html` (~2,5 MB en total). |
| `fuentes/` | HTML con que se generan las simulaciones, por si hay que ajustarlas. |

No hay captura "antes" de Google Search en celular; la propuesta lo explica.

La sección **SEO y GEO** usa dos simulaciones sin "antes": `whatsapp-preview` (link compartido
por WhatsApp) y `asistente-ia` (respuesta de un asistente de IA genérico).

## Hallazgo clave

Al buscar "cabaña del árbol", Google y Maps muestran **Cabañas Los Árboles**, que es otro negocio
(tel. 0991 854746, 4.7 ★ con 119 reseñas). De ahí salían las reseñas que la web mostraba y
que ya quitamos. Las coordenadas `-25.2927706, -57.4606446` salían de esa URL de búsqueda
(eran el centro del mapa, no la cabaña); ya se quitaron de la web.

## Textos propuestos para Instagram (listos para copiar)

**Nombre** (el nombre es buscable en Instagram):

```
Cabaña del Árbol · Lago Ypacaraí
```

**Categoría:** Hotel (hoy dice "Community").

**Biografía** (145 caracteres, el límite es 150):

```
🌅 Cabaña para parejas frente al Lago Ypacaraí
🛁 Jacuzzi privado · Desayuno incluido
📍 San Bernardino, 45' de Asunción
👇 Tarifas, fotos y reservas
```

**Enlaces:** 1) la web (`cabanadelarbol.com.py`), 2) WhatsApp (`wa.me/595982957509`).

**Botón de contacto:** WhatsApp.

**Historias destacadas:** Tarifas · La Cabaña · La Casona · Desayuno · Cómo llegar · Reseñas.

**Publicaciones fijadas (3):** una de tarifas, una de la experiencia y una con comentarios de huéspedes.

## Ficha de Google (datos para crearla)

- **Nombre:** Cabaña del Árbol
- **Categoría:** Cabaña (secundaria: Alojamiento con desayuno)
- **Dirección / pin:** San Bernardino, Cordillera. Falta la ubicación exacta (ver ROADMAP).
- **Teléfono:** 0982 957509
- **Sitio web:** cabanadelarbol.com.py
- **Check-in / check-out:** 12:00 / 12:00
- **Servicios:** jacuzzi, desayuno incluido, Wi-Fi, aire acondicionado
- **Descripción:** "Cabaña para parejas frente al Lago Ypacaraí, con jacuzzi privado en deck y
  desayuno incluido. También cuenta con La Casona para grupos."
- **Fotos:** las de `images/` de la web.

En las simulaciones la ficha aparece **sin reseñas**, porque así arranca una ficha nueva.

## Regenerar las simulaciones

```bash
cd propuesta/fuentes
python3 build.py      # arma los .html a partir de los .tpl.html (inserta los íconos)
node render.mjs google-maps-desktop:1440:900:2 google-maps-mobile:402:874:3 \
  google-search-desktop:1440:1000:2 google-search-mobile:402:900:3 \
  instagram-desktop:1440:1082:2 instagram-mobile:402:874:3 \
  whatsapp-preview:402:720:3 asistente-ia:402:720:3
```

Las de Instagram, WhatsApp y el asistente se editan directo en su `.html` (no tienen plantilla). Después de
regenerar, volver a crear las JPG de `web/`.
