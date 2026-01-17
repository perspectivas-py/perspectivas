# Rediseño Noticias Locales · Bitácora

## Fase 0 — Respaldos iniciales
- `index.html` respaldado como `index.noticias.html` el 17-01-2026.
- `style.css` respaldado como `style.noticias.css` el 17-01-2026.

## Fase 2 — Wireframe HTML
- El bloque `#noticias` en [index.noticias.html](../index.noticias.html) ahora contiene la envoltura `.noticias-locales-v2` con tres módulos:
   1. `nlv2-hero-stack` con `#nlv2-hero-main` y `#nlv2-hero-secondary` para la jerarquía principal.
   2. `nlv2-grid-layout` que conserva `#category-filters`, `#news-grid` y `#news-view-more` dentro de una columna dedicada.
   3. `nlv2-context-column` con `#nlv2-context-feed` para notas en seguimiento.
- Se añadieron placeholders y copy descriptivo, sin alterar los IDs que consumen los scripts actuales.

## Fase 3 — Estilos encapsulados
- En [style.noticias.css](../style.noticias.css) se añadieron reglas agrupadas bajo el comentario "Noticias Locales V2".
- Los estilos usan variables locales (`--nlv2-*`), `clamp()` en tipografías y grids responsivos para los módulos `nlv2-hero-stack`, `nlv2-grid-layout` y `nlv2-context-panel`.
- Se incluyeron animaciones suaves (`@keyframes nlv2CardFade`) y breakpoints a 1024 px y 640 px sin tocar el CSS existente del header.

## Fase 4 — Componentes dinámicos
- En [script.js](../script.js) se reemplazó `renderNoticiasLocales()` por una versión que puebla `#nlv2-hero-main`, `#nlv2-hero-secondary`, `#news-grid` y `#nlv2-context-feed`.
- Se agregó el helper `selectSectionHeroArticles()` para elegir la nota `is_section_featured` y dos secundarias, respetando los nuevos flags generados en Fase 1.
- Los slots existentes (`cardHTML`, IDs originales) siguen operativos, por lo que el resto de la home no se ve afectado.

## Fase 6 — Integración progresiva
- La maqueta `index.noticias.html` se promovió a [index.html](../index.html), conservando el header/lead original y dejando el layout V2 como sección por defecto.
- Los estilos encapsulados ahora viven en [style.css](../style.css); se mantiene `style.noticias.css` como respaldo para futuras comparaciones.
- Pendiente comunicar en CMS (PORTADA_PRINCIPAL_HERO) la activación de `is_section_featured` para controlar el nuevo stack.

## Fase 7 — Build & monitoreo
- Se ejecutó `npm run build`, que a su vez dispara `scripts/validate-hero.js`. El proceso detectó múltiples `is_main_featured` y se corrigió dejando solo [2026-01-16-economía-y-finanzas-expone-alcances-de-la-reforma-de-la-caja-fiscal.md](../content/noticias/posts/2026-01-16-econom%C3%ADa-y-finanzas-expone-alcances-de-la-reforma-de-la-caja-fiscal.md) como portada principal.
- Tras el ajuste, el build vuelve a pasar y genera `content.json` + `public/content.json` listos para desplegar.
- Para monitoreo, revisar métricas de scroll/engagement una vez publicada la sección y verificar que CMS mantenga solo un `is_main_featured` activo.

## Restricciones del encabezado existente
Mantener intacta la estructura y comportamiento actual descritos en [index.html](../index.html) y orquestados por [script.v3.js](../script.v3.js):

1. **Bloque `.site-header`**
   - Incluye `header-top` con controles de búsqueda y el botón `#category-drawer-toggle` (depende de listeners ya definidos).
   - El enlace `.brand` sirve como ancla principal; no mover ni reemplazar su posición relativa entre los controles izquierdos y derechos.

2. **Navegación principal `.main-nav`**
   - La lista `#nav-list` alimenta el scroll suave y los resaltados; las anclas `#hero`, `#noticias`, etc., deben seguir existiendo.
   - El contenedor `.nav-search-wrapper` aloja el widget del clima (`#weather-widget`) y el botón de tema (`#theme-toggle`). Ambos son manipulados directamente por `initWeatherWidget()` y `initThemeToggle()`.

3. **Drawer de categorías `#category-drawer`**
   - El botón `#category-drawer-toggle` abre/cierra este panel mediante `initCategoryDrawer()`.
   - El campo `#search-input` se oculta/muestra con clases `hidden` controladas desde JavaScript. No cambiar IDs ni jerarquía inmediata.

4. **Panel del clima `#weather-panel`**
   - Usa atributos `aria-*` específicos y animaciones CSS ya aplicadas; moverlo fuera del header podría romper la lógica de apertura.

5. **Scripts dependientes**
   - `script.v3.js` asume que los elementos anteriores existen al momento del `DOMContentLoaded`. Los nuevos bloques de Noticias Locales deben insertarse después del header sin modificar estos IDs o clases.

Con estas restricciones documentadas, podemos avanzar a la Fase 1 sin riesgo de alterar el lead ni el desplazamiento global.
