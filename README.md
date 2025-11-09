# Perspectivas — Vercel (modo oscuro + ticker real + CMS en /editor)

## Publicar en Vercel
1) Subí TODO el contenido a un repo nuevo: `perspectivas-py/perspectivas-vercel`
2) En Vercel → Add New Project → elegí el repo → Framework: Other → Output directory: `/` → Deploy
3) Abrí `/editor/` para el CMS.

## GitHub OAuth (CMS)
- El backend del CMS usa GitHub con `repo: perspectivas-py/perspectivas-vercel`.
- Creá una **GitHub OAuth App**:
  - Settings → Developer settings → OAuth Apps → New OAuth App
  - Homepage URL: URL pública de Vercel (ej.: https://perspectivas.vercel.app)
  - Authorization callback URL: **https://perspectivas.vercel.app/editor/**
  - Guardá Client ID y Secret (en una segunda fase podemos integrar el flujo de OAuth si lo necesitás).

## Ticker (Finnhub)
- La clave está en `script.js` (const FINNHUB_API_KEY). Se actualiza cada 5 minutos.
- Si alguna cotización no sale, ajustá `symbol` según disponibilidad de Finnhub.

## Imágenes
- Reemplazá `/assets/img/portada.jpg` y `/assets/img/sponsor.jpg` por imágenes reales.
- El logo se invierte automáticamente en modo oscuro (CSS filter).

## Nota
- El editor está en `/editor/` (no en `/admin/`).
