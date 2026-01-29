# DecapCMS Integration for Digital Covers

## Overview
To enable content editors to upload and manage digital covers through DecapCMS, you'll need to add a new collection to your DecapCMS configuration.

## Configuration

Add this collection to your `config.yml` file:

```yaml
collections:
  - name: "digital_covers"
    label: "Tapas Digitales"
    folder: "content/tapas"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - {label: "ID", name: "id", widget: "string", hint: "Identificador único (ej: tapa-2026-01-29)"}
      - {label: "Imagen de Portada", name: "image", widget: "image", hint: "La imagen de la tapa digital (3:4 aspect ratio recomendado)"}
      - {label: "Edición", name: "edition", widget: "string", hint: "Ej: Miércoles, 29 de Enero de 2026"}
      - {label: "Fecha de Publicación", name: "date", widget: "datetime"}
      - {label: "Activa", name: "active", widget: "boolean", default: true, hint: "Mostrar o ocultar esta tapa"}
      - {label: "Orden", name: "order", widget: "number", default: 0, hint: "Orden de aparición (menor = primero)"}
```

## Data Structure

Each digital cover file will be saved as a markdown file with frontmatter:

```markdown
---
id: tapa-2026-01-29
image: /uploads/tapa_perspectivas_2026_01_29.png
edition: Miércoles, 29 de Enero de 2026
date: 2026-01-29T00:00:00-03:00
active: true
order: 1
---
```

## JavaScript Integration

Update `script.v3.js` to fetch covers from the CMS:

```javascript
async function loadDigitalCoversFromCMS() {
  try {
    const response = await fetch('/api/digital-covers'); // Your API endpoint
    const covers = await response.json();
    
    // Filter active covers and sort by order
    const activeCovers = covers
      .filter(cover => cover.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return activeCovers;
  } catch (error) {
    console.error('Error loading digital covers:', error);
    return DIGITAL_COVERS_SAMPLE; // Fallback to sample data
  }
}
```

## Media Upload Configuration

Ensure your `config.yml` has media folder configured:

```yaml
media_folder: "public/uploads"
public_folder: "/uploads"
```

## Next Steps

1. Create the `/content/tapas` directory
2. Add the collection to your DecapCMS config
3. Update `script.v3.js` to fetch from CMS instead of using hardcoded data
4. Test uploading a cover through the CMS admin panel
5. Verify covers appear correctly in the carousel
