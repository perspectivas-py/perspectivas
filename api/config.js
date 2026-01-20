// /api/config.js - Servir configuración de Decap CMS

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

export default (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'editor', 'config.yml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = YAML.parse(content);

    // Detectar el dominio actual dinámicamente
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    config.backend.base_url = baseUrl;
    config.site_url = baseUrl;
    config.display_url = baseUrl;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.statusCode = 200;
    res.end(JSON.stringify(config));
  } catch (error) {
    console.error('❌ [CONFIG] Error:', error.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load config', message: error.message }));
  }
};
              required: true, 
              options: [
                { label: "Macroeconomía", value: "macro" },
                { label: "Mercados e Inversión", value: "mercados-inversion" },
                { label: "Política Económica", value: "politica-economica" },
                { label: "Empresas", value: "empresas" },
                { label: "Empleo", value: "empleo" },
                { label: "Finanzas Personales", value: "finanzas-personales" },
                { label: "Educación Financiera", value: "educacion-financiera" },
                { label: "Actualidad", value: "actualidad" }
              ] 
            },
            {
              label: "🏷️ Etiquetas",
              name: "tags",
              widget: "select",
              multiple: true,
              options: [
                { label: "Economía", value: "economia" },
                { label: "Mercado de Valores", value: "mercado-valores" },
                { label: "Política Fiscal", value: "politica-fiscal" },
                { label: "Inversión", value: "inversion" },
                { label: "Negocios", value: "negocios" },
                { label: "Finanzas", value: "finanzas" },
                { label: "Comercio Exterior", value: "comercio-exterior" },
                { label: "Empleo", value: "empleo" },
                { label: "Inflación", value: "inflacion" },
                { label: "Banco Central", value: "banco-central" },
                { label: "Empresa", value: "empresa" },
                { label: "Mercado Laboral", value: "mercado-laboral" },
                { label: "Agricultura", value: "agricultura" },
                { label: "Commodities", value: "commodities" },
                { label: "Desarrollo", value: "desarrollo" }
              ]
            },
            { label: "🖼️ Imagen de portada", name: "thumbnail", widget: "image", required: true, hint: "Imagen que aparecerá en las listas y en el artículo" },
            { label: "📝 Pie de foto (Caption)", name: "caption", widget: "string", required: false, hint: "Texto pequeño debajo de la imagen principal" },
            {
              label: "⭐ Opciones de visibilidad",
              name: "featured",
              widget: "object",
              hint: "Controla dónde aparece la nota",
              fields: [
                { label: "¿Destacado en portada?", name: "is_featured", widget: "boolean", default: false, hint: "Aparecerá en la sección principal de la home" },
                { label: "¿PORTADA PRINCIPAL (HERO)?", name: "is_main_featured", widget: "boolean", default: false, hint: "⚠️ CRÍTICO: Solo UNA noticia puede tener esto ACTIVADO. Si la activas aquí, debes DESACTIVARLA en todas las demás." },
                {
                  label: "🟦 Claves del día (Hero)",
                  name: "highlights",
                  widget: "list",
                  required: false,
                  max: 3,
                  label_singular: "Dato clave",
                  summary: "{{fields.highlight}}",
                  hint: "Solo completa si marcas Portada Principal. Máximo 3 puntos breves para el hero.",
                  field: {
                    label: "Dato clave",
                    name: "highlight",
                    widget: "string",
                    hint: "Ej: 'Reforma recauda USD 180M en 2026'."
                  }
                },
                { label: "¿Mostrar en últimas noticias?", name: "show_in_latest", widget: "boolean", default: true, hint: "Aparecerá en la lista general de noticias" }
              ]
            },
            {
              label: "⚡ Claves del día",
              name: "key_points",
              widget: "list",
              required: false,
              max: 4,
              label_singular: "Clave",
              summary: "{{fields.key_point}}",
              hint: "2 a 4 bullets que verán los lectores debajo del cuerpo del artículo.",
              field: {
                label: "Clave",
                name: "key_point",
                widget: "string",
                hint: "Ej: 'Nuevo impuesto digital recauda USD 45M'."
              }
            },
            {
              label: "🕒 Contexto rápido",
              name: "context_timeline",
              widget: "list",
              required: false,
              max: 4,
              label_singular: "Hito",
              hint: "Historia en 3 pasos (Antes, Ahora, Lo que sigue).",
              fields: [
                { label: "Estado", name: "status", widget: "string", required: true, hint: "Ej: Antes, Ahora, Lo que sigue" },
                { label: "Fecha o periodo", name: "date", widget: "string", required: false, hint: "Ej: Enero 2026" },
                { label: "Título corto", name: "title", widget: "string", required: true },
                { label: "Detalle", name: "detail", widget: "text", required: true },
                { label: "Perspectiva / Outlook", name: "outlook", widget: "text", required: false, hint: "Opcional para agregar mirada futura" }
              ]
            },
            { label: "📝 Contenido", name: "body", widget: "markdown", required: true, hint: "Contenido completo de la noticia (Markdown)" },
            { label: "🔗 Slug personalizado", name: "slug", widget: "string", required: false, hint: "Opcional. URL personalizada de la nota" }
          ]
        },
        {
          name: "analisis",
          label: "📊 Análisis",
          folder: "content/analisis/posts",
          create: true,
          slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
          extension: "md",
          sortable_fields: ["date"],
          sort: "-date",
          fields: [
            { label: "📝 Título", name: "title", widget: "string", required: true },
            { label: "📅 Fecha de publicación", name: "date", widget: "datetime", format: "YYYY-MM-DDTHH:mm:ss.SSSZ", required: true },
            { label: "⏰ Programar publicación", name: "publish_date", widget: "datetime", format: "YYYY-MM-DDTHH:mm:ss.SSSZ", hint: "Dejar en blanco si se publica inmediatamente", required: false },
            { label: "📄 Resumen", name: "summary", widget: "text", required: true },
            { label: "✍️ Autor", name: "author", widget: "string", required: false, default: "Perspectivas", hint: "Nombre del autor del análisis" },
            { label: "👤 Foto del Autor", name: "author_image", widget: "image", required: false, media_folder: "assets/img/authors", public_folder: "/assets/img/authors", hint: "Foto de perfil del autor" },
            { 
              label: "📑 Categoría Principal", 
              name: "category", 
              widget: "select", 
              required: true, 
              options: [
                { label: "Análisis Económico", value: "analisis-economico" },
                { label: "Mercado de Valores", value: "mercado-valores" },
                { label: "Inversión", value: "inversion" },
                { label: "Tendencias", value: "tendencias" },
                { label: "Proyecciones", value: "proyecciones" },
                { label: "Reportes", value: "reportes" }
              ] 
            },
            {
              label: "🏷️ Etiquetas",
              name: "tags",
              widget: "select",
              multiple: true,
              options: [
                { label: "Análisis Económico", value: "analisis-economico" },
                { label: "Mercado de Valores", value: "mercado-valores" },
                { label: "Inversión", value: "inversion" },
                { label: "Tendencias", value: "tendencias" },
                { label: "Proyecciones", value: "proyecciones" },
                { label: "Reportes", value: "reportes" }
              ]
            },
            { label: "🖼️ Imagen de portada", name: "thumbnail", widget: "image", required: true },
            { label: "📝 Pie de foto (Caption)", name: "caption", widget: "string", required: false, hint: "Texto pequeño debajo de la imagen principal" },
            {
              label: "⭐ ¿Destacado?",
              name: "featured",
              widget: "object",
              fields: [
                { label: "¿Mostrar como análisis destacado?", name: "is_featured", widget: "boolean", default: false },
                { label: "¿Análisis principal?", name: "is_main_featured", widget: "boolean", default: false }
              ]
            },
            { label: "📝 Contenido", name: "body", widget: "markdown", required: true },
            { label: "🔗 Slug", name: "slug", widget: "string", required: false }
          ]
        },
        {
          name: "programa",
          label: "📺 Programa Perspectivas",
          folder: "content/programa/posts",
          create: true,
          slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
          extension: "md",
          sortable_fields: ["date"],
          sort: "-date",
          fields: [
            { label: "📝 Título del episodio", name: "title", widget: "string", required: true },
            { label: "📅 Fecha de transmisión", name: "date", widget: "datetime", format: "YYYY-MM-DDTHH:mm:ss.SSSZ", required: true },
            { label: "⏰ Programar publicación", name: "publish_date", widget: "datetime", format: "YYYY-MM-DDTHH:mm:ss.SSSZ", required: false },
            { label: "📄 Descripción", name: "summary", widget: "text", required: true },
            { label: "✍️ Presentador/Autor", name: "author", widget: "string", required: false, default: "Perspectivas", hint: "Nombre del presentador o equipo" },
            { label: "👤 Foto del Presentador", name: "author_image", widget: "image", required: false, media_folder: "assets/img/authors", public_folder: "/assets/img/authors" },
            {
              label: "🏷️ Categorías",
              name: "tags",
              widget: "select",
              multiple: true,
              options: [
                { label: "Economía Local", value: "economia-local" },
                { label: "Mercados Globales", value: "mercados-globales" },
                { label: "Inversionistas", value: "inversionistas" },
                { label: "Emprendimiento", value: "emprendimiento" }
              ]
            },
            { label: "🖼️ Miniatura del episodio", name: "thumbnail", widget: "image", required: true },
            { label: "📺 URL Video YouTube", name: "embed_url", widget: "string", required: true, hint: "Ej: https://www.youtube.com/embed/VIDEO_ID" },
            {
              label: "⭐ ¿Destacado?",
              name: "featured",
              widget: "object",
              fields: [
                { label: "¿Mostrar como destacado?", name: "is_featured", widget: "boolean", default: false }
              ]
            }
          ]
        },
        {
          name: "podcast",
          label: "🎙️ Podcast",
          folder: "content/podcast/posts",
          create: true,
          slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
          extension: "md",
          sortable_fields: ["date"],
          sort: "-date",
          fields: [
            { label: "🎙️ Título del episodio", name: "title", widget: "string", required: true },
            { label: "📅 Fecha de publicación", name: "date", widget: "datetime", format: "YYYY-MM-DDTHH:mm:ss.SSSZ", required: true },
            { label: "⏰ Programar publicación", name: "publish_date", widget: "datetime", format: "YYYY-MM-DDTHH:mm:ss.SSSZ", required: false },
            { label: "📄 Descripción del episodio", name: "summary", widget: "text", required: true },
            { label: "✍️ Host/Autor", name: "author", widget: "string", required: false, default: "Perspectivas", hint: "Nombre del host o conductor del podcast" },
            { label: "👤 Foto del Host", name: "author_image", widget: "image", required: false, media_folder: "assets/img/authors", public_folder: "/assets/img/authors" },
            {
              label: "📑 Categoría Principal",
              name: "category",
              widget: "select",
              required: true,
              options: [
                { label: "Economía", value: "economia" },
                { label: "Finanzas", value: "finanzas" },
                { label: "Inversión", value: "inversion" },
                { label: "Negocios", value: "negocios" },
                { label: "Entrevistas", value: "entrevistas" }
              ]
            },
            {
              label: "🏷️ Temas",
              name: "tags",
              widget: "select",
              multiple: true,
              options: [
                { label: "Economía", value: "economia" },
                { label: "Finanzas", value: "finanzas" },
                { label: "Inversión", value: "inversion" },
                { label: "Negocios", value: "negocios" },
                { label: "Entrevistas", value: "entrevistas" }
              ]
            },
            { label: "🖼️ Imagen del episodio", name: "thumbnail", widget: "image", required: true },
            { label: "🎵 URL Archivo de audio", name: "audio_url", widget: "string", required: true, hint: "Link a archivo MP3 o plataforma de streaming" },
            {
              label: "⭐ ¿Destacado?",
              name: "featured",
              widget: "object",
              fields: [
                { label: "¿Mostrar como destacado?", name: "is_featured", widget: "boolean", default: false }
              ]
            }
          ]
        },
        {
          name: "sponsors",
          label: "🤝 Patrocinadores & Aliados",
          folder: "content/sponsors",
          create: true,
          slug: "{{slug}}",
          extension: "md",
          fields: [
            { label: "🏢 Nombre de la empresa", name: "title", widget: "string", required: true },
            { label: "📝 Titular", name: "headline", widget: "string", required: true },
            { label: "📄 Descripción breve", name: "excerpt", widget: "text", required: true },
            { label: "🌐 URL Externa", name: "url", widget: "string", required: true, hint: "Web o LinkedIn de la empresa" },
            { label: "🖼️ Logo de la empresa", name: "logo", widget: "image", required: true },
            { label: "⭐ ¿Destacado?", name: "featured", widget: "boolean", default: false, hint: "Aparecerá en primer lugar en patrocinadores" },
            { label: "👁️ ¿Visible en Web?", name: "visible", widget: "boolean", default: true, hint: "Desactivar para ocultar al patrocinador sin eliminarlo" }
          ]
        }
      ]
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.statusCode = 200;
    res.end(JSON.stringify(config));
  } catch (error) {
    console.error('❌ [CONFIG] Error:', error.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load config', message: error.message }));
  }
};
