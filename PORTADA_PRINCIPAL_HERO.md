# 🎯 Cómo Cambiar la Portada Principal (Hero) desde Decap CMS

## El Problema Original
Antes, la **portada principal (Hero)** en tu Home siempre mostraba la noticia **más reciente**, y no había forma de cambiarla manualmente desde el gestor de contenidos.

## La Solución ✅
Ahora puedes **seleccionar qué noticia aparece en la portada principal** directamente desde Decap CMS.

## Cómo Hacerlo

### Opción 1: Seleccionar una Noticia Existente como Portada Principal

1. **Ve a Decap CMS** → **Noticias**
2. **Abre la noticia** que quieres que sea la portada principal
3. Desplázate hasta la sección **"⭐ Opciones de visibilidad"**
4. **Activa el checkbox: "🔴 ¿PORTADA PRINCIPAL (HERO)?"**
5. **Guarda los cambios**
6. ¡Listo! Tu Home se actualizará automáticamente en 2-3 minutos

### Opción 2: Crear una Nueva Noticia y Hacerla Portada Principal

1. **Ve a Decap CMS** → **Noticias** → **Nuevo**
2. Rellena los campos (título, descripción, imagen, etc.)
3. En **"⭐ Opciones de visibilidad"**, activa **"¿PORTADA PRINCIPAL (HERO)?"**
4. **Publica la noticia**
5. La página se actualizará automáticamente

## Importante ⚠️

- **Solo UNA noticia** debe tener `¿PORTADA PRINCIPAL (HERO)?` activado
- Si **no activas** este campo en ninguna noticia, se mostrará la **más reciente automáticamente** (comportamiento anterior)
- Si **dos o más** noticias tienen este campo activado, se mostrará la **primera que encuentre**

## Deshabilitar la Portada Principal Manual

Si quieres que la Home vuelva a mostrar simplemente **la noticia más reciente**:

1. Abre la noticia que tiene `¿PORTADA PRINCIPAL (HERO)?` activado
2. **Desactiva** ese checkbox
3. Guarda los cambios
4. ¡Listo! Volvará al comportamiento automático

## Ejemplo Práctico

Supongamos que tienes estas noticias:

1. "BCP mantiene tasa de interés" - 23 de noviembre (más reciente)
2. "Comercio exterior creció" - 22 de noviembre  
3. "Paraguay destaca en seminario" - 21 de noviembre

**Sin marcas especiales:** La Home mostrará #1 (la más reciente)

**Si marcas #3 como Portada Principal:** La Home mostrará #3 en el Hero

**Si desactivas la marca en #3:** Vuelve a mostrar #1

---

## Para los Desarrolladores

El código que hace esto funciona así:

```javascript
// En script.js → renderHero()
let heroArticle = n.find(noticia => 
  noticia.featured && 
  noticia.featured.is_main_featured === true
);

// Si no hay ninguna marcada, usa la más reciente
if (!heroArticle) {
  heroArticle = n[0];
}
```

Los cambios fueron realizados en:
- `script.js` - Lógica del hero
- `api/content.js` - Parsing del frontmatter YAML
- `editor/config.yml` - Mejor descripción en la UI de Decap

---

¡Ahora tienes **control total** sobre tu portada principal! 🚀
