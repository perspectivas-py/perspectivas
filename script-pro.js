// script.v3.js — MOTOR PRO DEFINITIVO (Corregido)
console.log("🚀 Perspectivas PRO v3 cargado");

// ANALYSIS_CATEGORIES is now loaded from src/constants.js

const CONTENT_URL = "content.json";
let searchDataCache = null;

const MARKET_QUOTES = [
  { label: "USD / Gs", value: "7.320", change: "+0,4%" },
  { label: "Peso Argentino", value: "Gs. 13,20", change: "-1,1%" },
  { label: "Real Brasileño", value: "Gs. 1.470", change: "+0,2%" },
  { label: "Euro", value: "Gs. 8.020", change: "+0,3%" },
  { label: "Petróleo WTI", value: "USD 72,45", change: "-0,8%" },
  { label: "Soja CME", value: "USD 13,05/bu", change: "+0,5%" },
  { label: "Carne (USDA)", value: "USD 4,85/kg", change: "+0,1%" }
];

const MARKET_FX_TICKER_SPEC = [
  { code: "USD MIN", label: "Dólar Minorista", mode: "sell" },
  { code: "ARS", label: "Peso Argentino", units: 1000, decimals: 2 },
  { code: "BRL", label: "Real Brasileño", units: 1, decimals: 0 },
  { code: "EUR", label: "Euro", units: 1, decimals: 0 }
];

const MARKET_COMMODITY_SOURCES = [
  {
    id: "wti",
    label: "Petróleo WTI",
    symbol: "cl.f",
    formatter: quote => {
      const close = Number(quote.close);
      if (!Number.isFinite(close)) return null;
      return formatUsdTicker(close, 2);
    }
  },
  {
    id: "brent",
    label: "Petróleo Brent",
    symbol: "cb.f",
    formatter: quote => {
      const close = Number(quote.close);
      if (!Number.isFinite(close)) return null;
      return formatUsdTicker(close, 2);
    }
  },
  {
    id: "soy",
    label: "Soja CME",
    symbol: "zs.f",
    formatter: quote => {
      const close = Number(quote.close);
      if (!Number.isFinite(close)) return null;
      const usdPerBushel = close / 100; // contratos en centavos por bushel
      return formatUsdTicker(usdPerBushel, 2, "/bu");
    }
  },
  {
    id: "beef",
    label: "Carne (USDA)",
    symbol: "le.f",
    formatter: quote => {
      const close = Number(quote.close);
      if (!Number.isFinite(close)) return null;
      const usdPerPound = close / 100; // contratos en centavos por libra
      const usdPerKg = usdPerPound * 2.20462;
      return formatUsdTicker(usdPerKg, 2, "/kg");
    }
  }
];
const MARKET_INDEX_SOURCES = [
  { id: "sp500", label: "S&P 500", symbol: "^spx", fallback: "5,800.00", formatter: q => formatIndexTicker(q.close) },
  { id: "dow", label: "Dow Jones", symbol: "^dji", fallback: "42,000.00", formatter: q => formatIndexTicker(q.close) },
  { id: "nasdaq", label: "Nasdaq", symbol: "^ndq", fallback: "18,500.00", formatter: q => formatIndexTicker(q.close) },
  { id: "ibov", label: "Ibovespa", symbol: "^bvsp", fallback: "125,000", formatter: q => formatIndexTicker(q.close, 0) },
  { id: "merval", label: "Merval", symbol: "^merv", fallback: "1,800,000", formatter: q => formatIndexTicker(q.close, 0) }
];

const MARKET_TICKER_REFRESH_INTERVAL = 5 * 60 * 1000;

const FX_SPREAD = 0.006; // 0.6% spread estimado
const FLAG_CDN_BASE = "https://flagcdn.com";
const FX_REFERENCE_FALLBACK = "exchangerate.host · Indicativo";
const DOLLAR_PY_API_URL = "https://dolar.melizeche.com/api/1.0/";
const DOLLAR_PY_EXCLUDED_KEYS = ["bcp", "set"];
const AWESOME_API_BASE = "https://economia.awesomeapi.com.br/last";
const AWESOME_PAIR_MAP = {
  BRL: { key: "BRLPYG", pair: "BRL-PYG", inverted: false },
  EUR: { key: "EURPYG", pair: "EUR-PYG", inverted: false },
  ARS: { key: "PYGARS", pair: "PYG-ARS", inverted: true },
  USD: { key: "USDPYG", pair: "USD-PYG", inverted: false },
  USDCLP: { key: "USDCLP", pair: "USD-CLP", inverted: false },
  USDUYU: { key: "USDUYU", pair: "USD-UYU", inverted: false }
};
const AWESOME_PAIRS = ["BRL-PYG", "EUR-PYG", "PYG-ARS", "USD-PYG", "USD-CLP", "USD-UYU"];
const AWESOME_REFERENCE = "AwesomeAPI FX · Mercado regional";

const FX_CONFIG = [
  {
    currency: "Dólar estadounidense",
    code: "USD",
    amount: "1 USD",
    units: 1,
    flagCode: "us",
    reference: "Dólar Referencial (BCP)",
    fallback: {
      buy: "₲ 7.300",
      sell: "₲ 7.360",
      variation: "+0,4%",
      lastUpdate: "08 Ene 2026 · 11:35"
    }
  },
  {
    currency: "Euro",
    code: "EUR",
    amount: "1 EUR",
    units: 1,
    flagCode: "eu",
    reference: "BCE / bancos corresponsales",
    fallback: {
      buy: "₲ 7.880",
      sell: "₲ 7.980",
      variation: "+0,3%",
      lastUpdate: "08 Ene 2026 · 11:20"
    }
  },
  {
    currency: "Real brasileño",
    code: "BRL",
    amount: "1 BRL",
    units: 1,
    flagCode: "br",
    reference: "Banco Central do Brasil",
    fallback: {
      buy: "₲ 1.430",
      sell: "₲ 1.470",
      variation: "-0,1%",
      lastUpdate: "08 Ene 2026 · 10:55"
    }
  },
  {
    currency: "Peso argentino",
    code: "ARS",
    amount: "1.000 ARS",
    units: 1000,
    flagCode: "ar",
    reference: "BCRA · dólar export",
    fallback: {
      buy: "₲ 9.600",
      sell: "₲ 9.950",
      variation: "+1,4%",
      lastUpdate: "08 Ene 2026 · 10:10"
    }
  },
  {
    currency: "Peso chileno",
    code: "CLP",
    amount: "1.000 CLP",
    units: 1000,
    flagCode: "cl",
    reference: "Banco Central de Chile",
    fallback: {
      buy: "₲ 10.020",
      sell: "₲ 10.250",
      variation: "+0,8%",
      lastUpdate: "08 Ene 2026 · 11:00"
    }
  },
  {
    currency: "Peso uruguayo",
    code: "UYU",
    amount: "1 UYU",
    units: 1,
    flagCode: "uy",
    reference: "BROU · pizarra",
    fallback: {
      buy: "₲ 178",
      sell: "₲ 185",
      variation: "+0,2%",
      lastUpdate: "08 Ene 2026 · 09:45"
    }
  },
  {
    currency: "Guaraní paraguayo",
    code: "PYG",
    amount: "1.000 PYG",
    units: 1000,
    flagCode: "py",
    reference: "Base local",
    fallback: {
      buy: "₲ 1.000",
      sell: "₲ 1.000",
      variation: "0,0%",
      lastUpdate: "08 Ene 2026 · 11:35"
    }
  }
];

const CATEGORY_LABELS = {
  "macro": "Macroeconomía",
  "mercados-inversion": "Mercados e Inversión",
  "politica-economica": "Política Económica",
  "economia": "Economía",
  "inversion": "Inversión",
  "negocios": "Negocios",
  "empresas": "Empresas",
  "empleo": "Empleo",
  "finanzas-personales": "Finanzas Personales",
  "educacion-financiera": "Educación Financiera",
  "actualidad": "Actualidad",
  "programa": "Programa",
  "podcast": "Podcast",
  "analisis": "Análisis"
};

const CATEGORY_ACCENT_PRESETS = [
  // Análisis
  { keys: ["macro", "economia", "macroeconomia"], primary: "#3b82f6", secondary: "#1e40af", name: "Azul" },
  { keys: ["politica", "politica-economica"], primary: "#f97316", secondary: "#c2410c", name: "Naranja" },
  { keys: ["regional", "analisis-regional"], primary: "#8b5cf6", secondary: "#6d28d9", name: "Violeta" },

  // Noticias
  { keys: ["agro", "commodities", "agricultura"], primary: "#10b981", secondary: "#059669", name: "Verde" },
  { keys: ["mercados", "mercados-inversion", "inversion", "mercados-financieros"], primary: "#a855f7", secondary: "#7c3aed", name: "Púrpura" },
  { keys: ["negocios", "empresas"], primary: "#14b8a6", secondary: "#0f766e", name: "Turquesa" },
  { keys: ["locales", "actualidad", "noticias-locales"], primary: "#ef4444", secondary: "#b91c1c", name: "Rojo" },

  // Otros
  { keys: ["finanzas-personales", "educacion-financiera"], primary: "#22d3ee", secondary: "#0ea5e9", name: "Cyan" },
  { keys: ["programa", "podcast"], primary: "#fbbf24", secondary: "#f59e0b", name: "Amarillo" }
];

const DEFAULT_ACCENT = { primary: "#38bdf8", secondary: "#2563eb" };
const HERO_TAGLINE = "Perspectivas · Redacción Económica";
const HERO_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=500&fit=crop&q=80";

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const WEATHER_COORDS = { latitude: -25.2827, longitude: -57.6359 };
const WEATHER_UPDATE_INTERVAL = 10 * 60 * 1000;
const WEATHER_FORECAST_DAYS = 5;
const WEATHER_CONDITIONS = [
  { codes: [0], icon: "☀️", label: "Cielo despejado", symbol: "sun" },
  { codes: [1, 2], icon: "🌤️", label: "Parcialmente nublado", symbol: "partly" },
  { codes: [3], icon: "⛅", label: "Nublado", symbol: "cloud" },
  { codes: [45, 48], icon: "🌫️", label: "Niebla", symbol: "fog" },
  { codes: [51, 53, 55], icon: "🌦️", label: "Llovizna", symbol: "drizzle" },
  { codes: [61, 63, 65], icon: "🌧️", label: "Lluvia", symbol: "rain" },
  { codes: [66, 67], icon: "🌧️", label: "Lluvia helada", symbol: "rain" },
  { codes: [71, 73, 75], icon: "🌨️", label: "Nieve", symbol: "snow" },
  { codes: [80, 81, 82], icon: "🌦️", label: "Chubascos", symbol: "showers" },
  { codes: [95], icon: "⛈️", label: "Tormentas", symbol: "storm" },
  { codes: [96, 99], icon: "⛈️", label: "Tormentas con granizo", symbol: "storm" }
];

const WEATHER_ICON_SVGS = {
  sun: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  partly: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><path d="M12 2v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="M20 12h2"></path><path d="m19.07 4.93-1.41 1.41"></path><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"></path><path d="M13 22H7a5 5 0 1 1 4.9-6H13a5 5 0 0 1 0 10Z"></path></svg>`,
  cloud: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>`,
  drizzle: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path><path d="m8 22-1 3"></path><path d="m12 22-1 3"></path><path d="m16 22-1 3"></path></svg>`,
  rain: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></svg>`,
  showers: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="m14 14-2 6"></path><path d="m8 14-2 6"></path><path d="m20 14-2 6"></path></svg>`,
  storm: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path><path d="m13 11-2 6h4l-2 6"></path></svg>`,
  snow: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path><path d="m8 22 2 2"></path><path d="m12 22 2 2"></path><path d="m16 22 2 2"></path></svg>`,
  fog: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path><path d="M5 22h14"></path></svg>`,
  default: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-v3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
};

function normalizeCategoryKey(category = "") {
  return category.toString().trim().toLowerCase();
}

function capitalize(word = "") {
  if (!word.length) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function resolveWeatherCondition(code) {
  if (typeof code !== "number") return { icon: "ℹ️", label: "Dato no disponible" };
  const match = WEATHER_CONDITIONS.find(entry => entry.codes.includes(code));
  return match || { icon: "🌡️", label: "Clima local" };
}

function formatForecastDay(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString || "--";
  return date.toLocaleDateString("es-PY", { weekday: "short", day: "numeric" });
}

function resolveCategoryLabel(category) {
  const normalized = normalizeCategoryKey(category);
  if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];

  const fallback = Object.entries(CATEGORY_LABELS)
    .find(([key]) => normalized.includes(key));

  if (fallback) return fallback[1];
  if (!normalized) return "Actualidad";
  return normalized.split(/[-_]/g).map(capitalize).join(" ");
}

function resolveCategoryAccent(category) {
  const normalized = normalizeCategoryKey(category);
  for (const preset of CATEGORY_ACCENT_PRESETS) {
    if (preset.keys.some(key => normalized.includes(key))) {
      return { primary: preset.primary, secondary: preset.secondary };
    }
  }
  return DEFAULT_ACCENT;
}

function extractHeroHighlights(article) {
  const featuredHighlights = article?.featured?.highlights;
  if (Array.isArray(featuredHighlights) && featuredHighlights.length) {
    return featuredHighlights
      .map(item => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const value = item.highlight || item.value || item.text;
          if (typeof value === "string") return value;
        }
        return String(item || "");
      })
      .map(entry => entry.toString().trim())
      .filter(Boolean)
      .slice(0, 2);
  }

  const copySource = (article?.summary || article?.description || "").replace(/\s+/g, " ").trim();
  if (!copySource) return [];

  const sentences = copySource.match(/[^.!?]+[.!?]?/g) || [];
  return sentences.map(s => s.trim()).filter(Boolean).slice(0, 2);
}

function truncateCopy(copy, max = 180) {
  if (!copy) return "";
  const normalized = copy.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim().replace(/[\s,.–-]+$/, "")}…`;
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatHeroDate(dateString) {
  if (!dateString) return "";
  const formatted = formatDate(dateString).replace(/\./g, "");
  return formatted ? formatted.toUpperCase() : "";
}

function buildHeroMarkup(article) {
  if (!article) return "";

  const palette = resolveCategoryAccent(article.category);
  const categoryLabel = resolveCategoryLabel(article.category).toUpperCase();
  const title = escapeHtml(article.title || "Sin título");
  const href = `/noticia.html?id=${encodeURIComponent(article.slug || article.id)}`;
  const description = truncateCopy(article.summary || article.description || "");
  const lede = description ? `<p class="hero-lede">${escapeHtml(description)}</p>` : "";
  const highlights = extractHeroHighlights(article);
  const highlightsHtml = highlights.length
    ? `
          <aside class="hero-side-info">
            <h4 class="hero-side-title">Claves del día</h4>
            <ul class="hero-highlights">
              ${highlights.map(point => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </aside>
        `
    : "";

  const metaPieces = [];
  const heroDate = formatHeroDate(article.date);
  if (heroDate) metaPieces.push(heroDate);
  if (article.author) metaPieces.push(article.author.toUpperCase());
  const meta = metaPieces.length ? `<span class="hero-meta">${escapeHtml(metaPieces.join(" · "))}</span>` : "";

  const ctaLabel = escapeHtml(article?.featured?.cta_label || "Leer informe");
  const ctaTagline = escapeHtml(article?.featured?.cta_tagline || HERO_TAGLINE);
  const image = escapeHtml(article.thumbnail || HERO_IMAGE_FALLBACK);

  return `
    <a href="${href}" class="hero-card" style="--hero-accent:${palette.primary};--hero-accent-secondary:${palette.secondary};">
      <div class="hero-media">
        <img src="${image}" class="hero-img" alt="${title}" loading="eager" fetchpriority="high" />
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
        <div class="hero-ribbon">
          <span class="hero-badge">${escapeHtml(categoryLabel)}</span>
          ${meta}
        </div>
        <div class="hero-body">
          <div class="hero-text-block">
            <h2 class="hero-title">${title}</h2>
            ${lede}
            <div class="hero-cta">
              <span class="hero-cta-pill">${ctaLabel}</span>
              <span class="hero-tagline">${ctaTagline}</span>
            </div>
          </div>
          ${highlightsHtml}
        </div>
      </div>
    </a>
  `;
}

// ========================================
// BREADCRUMB NAVIGATION BUILDER
// ========================================

const CATEGORY_ICONS = {
  agro: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M12 2c-3 0-5 2-5 5s2 5 5 5M12 2c3 0 5 2 5 5s-2 5-5 5M12 12c-3 0-5 2-5 5s2 5 5 5M12 12c3 0 5 2 5 5s-2 5-5 5"/></svg>`,
  mercados: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  macro: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  empresas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  locales: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  politica: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  regional: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  finanzas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  programa: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  analisis: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
};

function getCategoryIcon(category) {
  const normalized = normalizeCategoryKey(category);
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (normalized.includes(key)) return icon;
  }
  return CATEGORY_ICONS.analisis; // default
}

function buildBreadcrumbs(article) {
  if (!article) return '';

  const category = article.category || 'actualidad';
  const normalizedCat = normalizeCategoryKey(category);
  const categoryLabel = resolveCategoryLabel(category);
  const categoryIcon = getCategoryIcon(category);

  // Determine parent section (Análisis or Noticias)
  const isAnalisis = ['macro', 'politica', 'regional', 'economia', 'analisis'].some(key => normalizedCat.includes(key));
  const parentSection = isAnalisis ? 'Análisis' : 'Noticias';
  const parentHref = isAnalisis ? '#analisis' : '#noticias';

  const items = [
    {
      label: 'Inicio',
      href: 'index.html',
      icon: CATEGORY_ICONS.home,
      category: 'home'
    },
    {
      label: parentSection,
      href: parentHref,
      icon: isAnalisis ? CATEGORY_ICONS.analisis : CATEGORY_ICONS.locales,
      category: normalizedCat
    },
    {
      label: categoryLabel,
      href: `categoria.html?cat=${encodeURIComponent(category)}`,
      icon: categoryIcon,
      category: normalizedCat
    }
  ];

  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const iconHtml = `<span class="breadcrumb-icon">${item.icon}</span>`;
    const separator = isLast ? '' : '<span class="breadcrumb-separator">›</span>';

    return `
      <span class="breadcrumb-item">
        <a href="${item.href}" data-category="${item.category}">
          ${iconHtml}
          ${escapeHtml(item.label)}
        </a>
        ${separator}
      </span>
    `;
  }).join('');

  return `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      ${breadcrumbItems}
      <span class="breadcrumb-current">${escapeHtml(truncateCopy(article.title || 'Artículo', 50))}</span>
    </nav>
  `;
}


const FX_RETAIL_SPEC = {
  currency: "Dólar minorista (casas de cambio)",
  code: "USD MIN",
  amount: "1 USD",
  units: 1,
  flagCode: "us",
  reference: "Casas de cambio minoristas · Asunción",
  margin: 0.018,
  fallback: {
    buy: "₲ 7.360",
    sell: "₲ 7.520",
    variation: "+0,6%",
    lastUpdate: "08 Ene 2026 · 11:35"
  }
};

const FX_FALLBACK_QUOTES = (() => {
  const base = FX_CONFIG.map(cfg => ({
    currency: cfg.currency,
    code: cfg.code,
    amount: cfg.amount,
    flagCode: cfg.flagCode,
    buy: cfg.fallback.buy,
    sell: cfg.fallback.sell,
    variation: cfg.fallback.variation,
    reference: cfg.reference,
    lastUpdate: cfg.fallback.lastUpdate,
    midValue: computeFallbackMid(cfg.fallback.buy, cfg.fallback.sell)
  }));

  const retailFallback = buildRetailFallbackQuote(base, FX_RETAIL_SPEC);
  if (retailFallback) base.push(retailFallback);
  return base;
})();

let latestFxQuotes = FX_FALLBACK_QUOTES;
let marketTickerItems = [...MARKET_QUOTES];
let marketTickerRefreshHandle = null;

async function fetchAwesomeSnapshot() {
  if (!AWESOME_PAIRS.length) return null;
  try {
    const url = `${AWESOME_API_BASE}/${AWESOME_PAIRS.join(",")}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("⚠️ No pudimos consultar AwesomeAPI", error);
    return null;
  }
}

function buildAwesomeFxQuote(cfg, data, options = {}) {
  if (!cfg || !data) return null;
  const { inverted = false } = options;
  const rawBid = Number(data.bid);
  const rawAsk = Number(data.ask);
  let buyRate = Number.isFinite(rawBid) ? rawBid : null;
  let sellRate = Number.isFinite(rawAsk) ? rawAsk : null;

  if (inverted) {
    buyRate = Number.isFinite(rawAsk) && rawAsk !== 0 ? 1 / rawAsk : null;
    sellRate = Number.isFinite(rawBid) && rawBid !== 0 ? 1 / rawBid : null;
  }

  if (!Number.isFinite(buyRate) || !Number.isFinite(sellRate)) return null;

  const units = cfg.units || 1;
  const midValue = ((buyRate + sellRate) / 2) * units;
  const pctChange = Number(data.pctChange);
  const variationPct = Number.isFinite(pctChange)
    ? (inverted ? -pctChange : pctChange)
    : null;

  const timestampStr = data?.create_date
    || (data?.timestamp ? buildIsoFromSeconds(data.timestamp) : "");

  return {
    currency: cfg.currency,
    code: cfg.code,
    amount: cfg.amount,
    flagCode: cfg.flagCode,
    buy: formatGuarani(buyRate * units),
    sell: formatGuarani(sellRate * units),
    variation: Number.isFinite(variationPct)
      ? formatVariation(variationPct)
      : cfg.fallback?.variation || "0,0%",
    reference: cfg.reference || AWESOME_REFERENCE,
    lastUpdate: formatTimestampLabel(timestampStr) || cfg.fallback?.lastUpdate || "",
    midValue
  };
}

function buildIsoFromSeconds(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return "";
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace("T", " ").slice(0, 19);
}

async function fetchDollarPySnapshot() {
  try {
    const url = `${DOLLAR_PY_API_URL}?t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("⚠️ No pudimos consultar dolarpy", error);
    return null;
  }
}

function buildDollarPyWholesaleQuote(cfg, snapshot) {
  if (!cfg || !snapshot?.dolarpy) return null;
  const bcpEntry = snapshot.dolarpy.bcp || snapshot.dolarpy.set;
  if (!bcpEntry) return null;

  const buyValue = Number(bcpEntry?.compra);
  const sellValue = Number(bcpEntry?.venta ?? bcpEntry?.compra);
  if (!Number.isFinite(buyValue) || !Number.isFinite(sellValue)) return null;

  const midValue = (buyValue + sellValue) / 2;
  const referential = Number(snapshot?.dolarpy?.bcp?.referencial_diario);
  const variationPct = Number.isFinite(referential) && referential > 0
    ? ((midValue - referential) / referential) * 100
    : 0;

  return {
    currency: cfg.currency,
    code: cfg.code,
    amount: cfg.amount,
    flagCode: cfg.flagCode,
    buy: formatGuarani(buyValue),
    sell: formatGuarani(sellValue),
    variation: formatVariation(variationPct),
    reference: cfg.reference || "Banco Central del Paraguay",
    lastUpdate: formatTimestampLabel(snapshot?.updated) || cfg.fallback?.lastUpdate || "",
    midValue
  };
}

function buildDollarPyRetailQuote(snapshot, spec, usdQuote) {
  if (!spec || !snapshot?.dolarpy) return null;

  // 1. Priorizar Cambios Chaco si está disponible
  const chaco = snapshot.dolarpy.cambioschaco;
  const hasChaco = chaco && Number.isFinite(Number(chaco.compra)) && Number.isFinite(Number(chaco.venta));

  let finalBuy, finalSell, finalReference;

  if (hasChaco) {
    finalBuy = Number(chaco.compra);
    finalSell = Number(chaco.venta);
    finalReference = "Cambios Chaco (Minorista)";
  } else {
    // 2. Fallback al promedio de casas de cambio
    const entries = Object.entries(snapshot.dolarpy)
      .filter(([key, val]) => {
        const normalizedKey = key?.toLowerCase?.() || key;
        if (DOLLAR_PY_EXCLUDED_KEYS.includes(normalizedKey)) return false;
        const buy = Number(val?.compra);
        const sell = Number(val?.venta);
        return Number.isFinite(buy) && Number.isFinite(sell);
      });

    if (!entries.length) return null;

    const totals = entries.reduce((acc, [, val]) => {
      acc.buy += Number(val.compra);
      acc.sell += Number(val.venta);
      return acc;
    }, { buy: 0, sell: 0 });

    finalBuy = totals.buy / entries.length;
    finalSell = totals.sell / entries.length;
    finalReference = spec.reference || "Promedio Casas de Cambio";
  }

  if (!Number.isFinite(finalBuy) || !Number.isFinite(finalSell)) return null;
  const midValue = (finalBuy + finalSell) / 2;

  return {
    currency: spec.currency,
    code: spec.code,
    amount: spec.amount,
    flagCode: spec.flagCode || "us",
    buy: formatGuarani(finalBuy),
    sell: formatGuarani(finalSell),
    variation: usdQuote?.variation || formatVariation(0),
    reference: finalReference,
    lastUpdate: formatTimestampLabel(snapshot?.updated) || usdQuote?.lastUpdate || spec.fallback?.lastUpdate || "",
    midValue
  };
}

function buildFallbackQuote(cfg) {
  return {
    currency: cfg.currency,
    code: cfg.code,
    amount: cfg.amount,
    flagCode: cfg.flagCode,
    buy: cfg.fallback.buy,
    sell: cfg.fallback.sell,
    variation: cfg.fallback.variation,
    reference: cfg.reference || FX_REFERENCE_FALLBACK,
    lastUpdate: cfg.fallback.lastUpdate,
    midValue: computeFallbackMid(cfg.fallback.buy, cfg.fallback.sell)
  };
}


async function fetchCommoditySnapshot() {
  const allSources = [...MARKET_COMMODITY_SOURCES, ...MARKET_INDEX_SOURCES];
  if (!allSources.length) return null;
  const symbolsParam = allSources.map(src => src.symbol).join("+");
  const stooqUrl = `https://stooq.com/q/l/?s=${symbolsParam}&f=sd2t2ohlcv&h&e=json`;

  // Usar proxy AllOrigins para evitar CORS
  const url = `https://api.allorigins.win/get?url=${encodeURIComponent(stooqUrl)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Stooq Proxy Error");
    const wrappedData = await res.json();
    const data = JSON.parse(wrappedData.contents);

    if (!data?.symbols) return null;
    const map = {};
    data.symbols.forEach(s => {
      if (s.symbol) map[s.symbol.toLowerCase()] = s;
    });
    return map;
  } catch (err) {
    console.warn("⚠️ Falló carga de Stooq via Proxy:", err);
    return null;
  }
}

function buildMarketFxItems() {
  if (!Array.isArray(latestFxQuotes)) return [];
  return MARKET_FX_TICKER_SPEC.map(spec => {
    const quote = latestFxQuotes.find(q => q.code === spec.code);
    if (!quote) return null;
    if (spec.mode === "sell") {
      return {
        label: spec.label,
        value: quote.sell,
        change: quote.variation || "0,0%"
      };
    }

    const units = spec.units || 1;
    const baseValue = Number(quote.midValue) / units;
    if (!Number.isFinite(baseValue)) return null;

    return {
      label: spec.label,
      value: formatGuaraniCompact(baseValue, spec.decimals ?? 0),
      change: quote.variation || "0,0%"
    };
  }).filter(Boolean);
}

function buildCommodityTickerItems(snapshot) {
  if (!snapshot) return [];
  return MARKET_COMMODITY_SOURCES.map(source => {
    const quote = snapshot[source.symbol.toLowerCase()];
    if (!quote) return null;
    const open = Number(quote.open);
    const close = Number(quote.close);
    const formattedValue = source.formatter?.({ ...quote, open, close });
    if (!formattedValue) return null;
    const changePct = computePercentChange(close, open);
    return {
      label: source.label,
      value: formattedValue,
      change: formatVariation(changePct)
    };
  }).filter(Boolean);
}

function buildStockTickerItems(snapshot) {
  return MARKET_INDEX_SOURCES.map(source => {
    const quote = snapshot ? snapshot[source.symbol.toLowerCase()] : null;

    // Si hay datos en el snapshot, construimos el item real
    if (quote && quote.close) {
      const open = Number(quote.open);
      const close = Number(quote.close);
      const formattedValue = source.formatter?.({ ...quote, open, close });
      const changePct = computePercentChange(close, open);
      return {
        label: source.label,
        value: formattedValue,
        change: formatVariation(changePct)
      };
    }

    // Si no hay datos, usamos el fallback
    return {
      label: source.label,
      value: source.fallback || "—",
      change: "0,0%"
    };
  }).filter(Boolean);
}

function computePercentChange(current, reference) {
  if (!Number.isFinite(current) || !Number.isFinite(reference) || reference === 0) {
    return 0;
  }
  return ((current - reference) / reference) * 100;
}

const flagIconUrl = (code = "") => {
  const normalized = (code || "").toLowerCase();
  return `${FLAG_CDN_BASE}/w40/${normalized || "un"}.png`;
};

const NOTICIAS_INITIAL_LIMIT = 8;
const NOTICIAS_INCREMENT = 8;
let noticiasLocalesState = {
  source: [],
  visible: NOTICIAS_INITIAL_LIMIT
};
let noticiasViewMoreBtn = null;
let categoryFilterContainers = [];
let noticiasFilterSource = [];
const noticiasAdvancedFilters = {
  category: "all",
  query: "",
  sort: "recent"
};
let noticiasFilterSearchInput = null;
let noticiasFilterCountLabel = null;
let noticiasFilterResetBtn = null;
let noticiasSortButtons = [];
let noticiasScrollContext = null;
let noticiasScrollUpdateHandle = null;
let noticiasScrollListenersBound = false;
let shouldResetNoticiasScroll = false;

const SECTION_LIMIT = 6;
const SECTION_INCREMENT = 6;

function selectSectionHeroArticles(items = []) {
  const collection = Array.isArray(items) ? [...items] : [];
  if (!collection.length) {
    return { main: null, secondary: [], remainder: [] };
  }

  const primary = collection.find(entry => entry?.featured?.is_section_featured) || collection[0];
  const rest = collection.filter(entry => (entry.slug || entry.id) !== (primary?.slug || primary?.id));
  const secondary = rest.slice(0, 2);
  const remainder = rest.slice(2);
  return { main: primary, secondary, remainder };
}

function createSectionController({ gridId, buttonId, limit = SECTION_LIMIT, increment = SECTION_INCREMENT, renderItem, emptyMessage }) {
  const state = { source: [], visible: limit };
  let button = null;

  function updateButton() {
    if (!button) return;
    const hasMore = state.source.length > state.visible;
    button.hidden = !hasMore;
  }

  function render() {
    const container = document.getElementById(gridId);
    if (!container) return;

    if (!state.source.length) {
      container.innerHTML = emptyMessage || `<p class="empty-copy">No hay contenido disponible.</p>`;
      updateButton();
      return;
    }

    const slice = state.source.slice(0, state.visible);
    const meta = { total: state.source.length };
    container.innerHTML = slice
      .map((item, idx) => renderItem(item, idx, meta))
      .join("");

    updateButton();
  }

  function setSource(items) {
    state.source = Array.isArray(items) ? items : [];
    state.visible = Math.min(limit, state.source.length);
    render();
  }

  function handleViewMore() {
    state.visible = Math.min(state.source.length, state.visible + increment);
    render();
  }

  function init(items) {
    button = document.getElementById(buttonId);
    if (button && !button.dataset.bound) {
      button.addEventListener("click", handleViewMore);
      button.dataset.bound = "true";
    }
    setSource(items);
  }

  return { init, setSource, render };
}

// Controller para la sección de Patrocinadores
const sponsorsController = (() => {
  const state = {
    source: []
  };

  function renderCard(item) {
    const tier = item.tier || 'Silver';
    const logoUrl = item.logo || '/assets/img/default_news.jpg';

    return `
      <div class="sponsor-item tier-${tier}" title="${item.title}">
        <a href="${item.url || '#'}" target="_blank" rel="noopener">
          <img src="${logoUrl}" alt="${item.title}" loading="lazy">
        </a>
      </div>
    `;
  }

  function render() {
    const container = document.getElementById('sponsorsGrid');
    if (!container) return;

    if (!state.source.length) {
      container.innerHTML = '<p class="empty-copy">Próximamente más aliados.</p>';
      return;
    }

    // Filtrar solo activos y visibles, y ordenar por prioridad
    const visibleSponsors = state.source
      .filter(s => s.active !== false && s.visible !== false)
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));

    container.innerHTML = visibleSponsors.map(renderCard).join('');
  }

  function init(data) {
    state.source = Array.isArray(data) ? data : [];
    render();
  }

  return { init };
})();

const analisisController = (() => {
  const state = {
    source: [],
    filtered: [],
    visible: 7, // 1 featured + 6 in grid (2 cols * 3 rows)
    currentCategory: 'all',
    searchQuery: '',
    sortOrder: 'recent'
  };
  let button = null;
  let filterContainer = null;
  let searchInput = null;
  let sortButtons = [];
  let countLabel = null;
  let resetBtn = null;

  function renderFilters() {
    if (!filterContainer) return;

    const categories = [{ key: 'all', label: 'Todos' }, ...ANALYSIS_CATEGORIES];

    filterContainer.innerHTML = categories.map(cat => `
      <button class="filter-btn ${state.currentCategory === cat.key ? 'active' : ''}" 
              data-category="${cat.key}" 
              type="button"
              aria-pressed="${state.currentCategory === cat.key}">
        ${cat.label}
      </button>
    `).join('');

    // Bind events
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.category;
        setCategory(cat);
      });
    });
  }

  function setCategory(category) {
    state.currentCategory = category;
    applyFilters();
  }

  function applyFilters() {
    let filtered = [...state.source];

    // Filter by category
    if (state.currentCategory && state.currentCategory !== 'all') {
      filtered = filtered.filter(item =>
        item.category === state.currentCategory || (item.tags && item.tags.includes(state.currentCategory))
      );
    }

    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const haystack = [
          item.title,
          item.description,
          item.summary,
          item.author,
          resolveCategoryLabel(item.category)
        ].map(v => (v || '').toString().toLowerCase()).join(' ');
        return haystack.includes(query);
      });
    }

    // Sort
    if (state.sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    } else {
      filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    state.filtered = filtered;
    state.visible = 7;
    renderFilters();
    updateFilterMeta();
    updateSortButtons();
    render();
  }

  function updateFilterMeta() {
    if (countLabel) {
      const total = state.filtered.length;
      const base = state.source.length;
      const hasActive = state.currentCategory !== 'all' || state.searchQuery || state.sortOrder !== 'recent';
      const label = hasActive && base !== total
        ? `${total} de ${base} resultados`
        : `${total} resultados`;
      countLabel.textContent = label;
    }
    if (resetBtn) {
      resetBtn.hidden = !(state.currentCategory !== 'all' || state.searchQuery || state.sortOrder !== 'recent');
    }
  }

  function updateSortButtons() {
    sortButtons.forEach(btn => {
      const isActive = (btn.dataset.sort || 'recent') === state.sortOrder;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function resetFilters() {
    state.currentCategory = 'all';
    state.searchQuery = '';
    state.sortOrder = 'recent';
    if (searchInput) searchInput.value = '';
    applyFilters();
  }

  function render() {
    const featured = document.getElementById("analisis-featured");
    const grid = document.getElementById("analisis-grid");

    if (!featured || !grid) return;

    if (!state.filtered.length) {
      featured.innerHTML = "";
      grid.innerHTML = `<p class="empty-copy">No encontramos análisis en esta categoría.</p>`;
      if (button) button.hidden = true;
      return;
    }

    // Featured Miniportada (Imagen Vertical Grande)
    const firstItem = state.filtered[0];
    const catData = ANALYSIS_CATEGORIES.find(c => c.key === firstItem.category) || { label: 'Análisis', color: 'var(--brand-primary)' };

    featured.innerHTML = `
      <a href="/noticia.html?id=${encodeURIComponent(firstItem.slug || firstItem.id)}" class="analisis-miniportada-featured">
        <div class="featured-image-wrapper">
          <img src="${firstItem.thumbnail}" alt="${firstItem.title}" loading="lazy"/>
        </div>
        <div class="featured-content">
          <span class="featured-eyebrow" style="color: ${catData.color}">${catData.label}</span>
          <h3 class="featured-title">${firstItem.title}</h3>
          <p class="featured-summary">${firstItem.description || firstItem.summary || ''}</p>
          <div class="featured-meta">
            <span>${firstItem.author || 'Redacción'}</span>
            <span>${formatDate(firstItem.date)}</span>
          </div>
        </div>
      </a>
    `;

    // Grid 2 Columnas (tarjetas horizontales compactas)
    const remaining = state.filtered.slice(1, state.visible);
    grid.innerHTML = remaining
      .map(item => {
        const itemCat = ANALYSIS_CATEGORIES.find(c => c.key === item.category) || { label: 'Análisis', color: 'var(--brand-primary)' };
        return `
          <a href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}" class="analisis-card-horizontal">
            <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
            <div class="content">
              <span class="eyebrow" style="color: ${itemCat.color}">${itemCat.label}</span>
              <h4>${item.title}</h4>
              <div class="meta">${formatDate(item.date)} · ${item.author || 'Redacción'}</div>
            </div>
          </a>
        `;
      })
      .join("");

    // Botón "Ver más"
    if (button) {
      button.hidden = state.filtered.length <= state.visible;
    }
  }

  function setSource(items) {
    state.source = Array.isArray(items) ? items : [];
    state.filtered = state.source;
    state.visible = 7;
    renderFilters();
    updateFilterMeta();
    render();
  }

  function init() {
    button = document.getElementById("analisis-view-more");
    filterContainer = document.getElementById("analisis-category-filters");
    searchInput = document.getElementById("analisis-filter-search");
    countLabel = document.getElementById("analisis-filter-count");
    resetBtn = document.getElementById("analisis-filter-reset");

    if (button && !button.dataset.bound) {
      button.addEventListener("click", () => {
        state.visible += 6;
        render();
      });
      button.dataset.bound = "true";
    }

    if (searchInput && !searchInput.dataset.bound) {
      const handleSearch = () => {
        state.searchQuery = (searchInput.value || '').toLowerCase().trim();
        applyFilters();
      };
      searchInput.addEventListener('input', handleSearch);
      searchInput.addEventListener('search', handleSearch);
      searchInput.dataset.bound = "true";
    }

    if (resetBtn && !resetBtn.dataset.bound) {
      resetBtn.addEventListener('click', resetFilters);
      resetBtn.dataset.bound = "true";
    }

    // Sort buttons
    const sortBtns = document.querySelectorAll('.analisis-sort-control .sort-pill');
    sortButtons = Array.from(sortBtns);
    sortButtons.forEach(btn => {
      if (btn.dataset.bound === "true") return;
      btn.addEventListener('click', () => {
        const targetSort = btn.dataset.sort || 'recent';
        if (state.sortOrder === targetSort) return;
        state.sortOrder = targetSort;
        applyFilters();
      });
      btn.dataset.bound = "true";
    });
  }

  return { init, setSource };
})();

// Videos Destacados Controller - Carrusel estilo Infobae
const videosDestacadosController = (() => {
  let carousel = null;
  let prevBtn = null;
  let nextBtn = null;
  let items = [];
  let modal = null;
  let playerContainer = null;
  let modalClose = null;
  let modalTitle = null;
  let modalDesc = null;

  function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function openVideoPreview(item) {
    if (!modal || !playerContainer) return;

    const videoId = getYouTubeId(item.video_url);
    if (!videoId) {
      // Fallback: abrir en pestaña nueva si no es YouTube (o manejar otros protocolos)
      window.open(item.video_url, '_blank');
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    playerContainer.innerHTML = `<iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

    if (modalTitle) modalTitle.textContent = item.title;
    if (modalDesc) modalDesc.textContent = item.summary || item.description || '';

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevenir scroll de fondo
  }

  function closeVideoPreview() {
    if (!modal || !playerContainer) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    playerContainer.innerHTML = ''; // Detener video
    document.body.style.overflow = '';
  }

  function renderCard(item) {
    const platform = item.platform || 'youtube';
    const platformLabel = {
      youtube: 'YouTube',
      tiktok: 'TikTok',
      reels: 'Reels'
    }[platform] || platform;

    return `
      <div class="video-card-vertical" data-slug="${item.slug || ''}">
        <div class="video-card-thumbnail">
          <img src="${item.thumbnail || '/assets/img/default_news.jpg'}" alt="${item.title}" loading="lazy">
          <div class="video-card-overlay"></div>
          <span class="video-card-platform ${platform}">${platformLabel}</span>
          <div class="video-card-play">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
          <span class="video-card-duration">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            ${item.duration || '00:00'}
          </span>
        </div>
        <h4 class="video-card-title">${item.title}</h4>
      </div>
    `;
  }

  function render() {
    if (!carousel) return;

    if (!items.length) {
      carousel.innerHTML = `<p class="videos-empty">No hay videos destacados disponibles.</p>`;
      return;
    }

    carousel.innerHTML = items.map(renderCard).join('');
  }

  function scrollCarousel(direction) {
    if (!carousel) return;
    const cardWidth = carousel.querySelector('.video-card-vertical')?.offsetWidth || 180;
    const scrollAmount = cardWidth * 2 + 16; // 2 cards + gap
    carousel.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }

  function init(data) {
    carousel = document.getElementById('videos-carousel');
    prevBtn = document.getElementById('videos-prev');
    nextBtn = document.getElementById('videos-next');

    items = Array.isArray(data) ? data : [];

    // Modal elements
    modal = document.getElementById('video-preview-modal');
    playerContainer = document.getElementById('video-preview-player');
    modalClose = document.getElementById('video-preview-close');
    modalTitle = document.getElementById('video-preview-title');
    modalDesc = document.getElementById('video-preview-desc');

    if (prevBtn) prevBtn.addEventListener('click', () => scrollCarousel('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollCarousel('next'));

    if (modalClose) modalClose.addEventListener('click', closeVideoPreview);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('video-preview-overlay')) {
          closeVideoPreview();
        }
      });
    }

    if (carousel) {
      carousel.addEventListener('click', (e) => {
        const card = e.target.closest('.video-card-vertical');
        if (card) {
          const slug = card.dataset.slug;
          const item = items.find(v => v.slug === slug);
          if (item) openVideoPreview(item);
        }
      });
    }

    render();
  }

  return { init };
})();

function initVideosDestacadosSection(data) {
  videosDestacadosController.init(data);
}

const programaController = createSectionController({
  gridId: "program-grid",
  buttonId: "program-view-more",
  renderItem: (item) => {
    // Helper para obtener miniatura de YouTube si no hay thumbnail explícito
    let thumb = item.thumbnail;
    if ((!thumb || thumb.includes("default_news")) && item.embed_url && item.embed_url.includes("youtube")) {
      try {
        // asume formato embed/VIDEO_ID
        const parts = item.embed_url.split('/');
        const vid = parts.pop() || parts.pop();
        thumb = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
      } catch (e) { }
    }
    thumb = thumb || '/assets/img/default_news.jpg';

    return `
    <a href="/noticia.html?type=programa&id=${encodeURIComponent(item.slug || item.id)}" class="program-card">
      <div class="program-thumb-wrapper">
        <img src="${thumb}" alt="${item.title}" loading="lazy">
        <div class="play-overlay">
           <svg class="play-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </div>
      </div>
      <div class="program-card-content">
        <h3 class="program-card-title">${item.title}</h3>
        <p class="program-card-desc">${item.description || ''}</p>
        <span class="program-card-meta">Programa Perspectivas</span>
      </div>
    </a>
  `;
  },
  emptyMessage: `<p class="empty-copy">Aún no cargamos episodios del programa.</p>`
});

// Podcast Controller - Premium Layout
const podcastController = (() => {
  const state = {
    source: [],
    visible: 6 // 1 featured + 5 in list
  };
  let button = null;

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  }

  function renderFeatured(item, total) {
    const featuredContainer = document.getElementById("podcast-featured");
    if (!featuredContainer) return;

    if (!item) {
      featuredContainer.innerHTML = `<p class="podcast-loading">No hay episodios disponibles.</p>`;
      return;
    }

    const episodeNumber = String(total).padStart(2, "0");
    const dateLabel = formatDate(item.date);
    const description = item.description || item.summary || "";

    featuredContainer.innerHTML = `
      <div class="podcast-featured-inner">
        <div class="podcast-featured-cover">
          <img src="${item.thumbnail || '/assets/img/default_news.jpg'}" alt="${item.title}" loading="lazy">
          <span class="podcast-featured-episode-badge">EP ${episodeNumber}</span>
          <button class="podcast-featured-play" type="button" aria-label="Reproducir episodio">
            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
          ${item.duration ? `<span class="podcast-featured-duration">${item.duration}</span>` : ''}
        </div>
        <div class="podcast-featured-body">
          <div class="podcast-featured-meta">
            <span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${dateLabel}
            </span>
            <span>Perspectivas Podcast</span>
          </div>
          <h3 class="podcast-featured-title">${item.title}</h3>
          ${description ? `<p class="podcast-featured-description">${description}</p>` : ''}
          <div class="podcast-featured-actions">
            <a href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}" class="podcast-listen-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Escuchar ahora
            </a>
            <button class="podcast-share-btn" type="button" aria-label="Compartir episodio">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.59 10.51 15.4 6.49" />
                <path d="M8.59 13.49 15.4 17.51" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderEpisodesList(items, total) {
    const listContainer = document.getElementById("podcast-episodes-scroll");
    if (!listContainer) return;

    if (!items.length) {
      listContainer.innerHTML = `<p class="podcast-loading">No hay más episodios disponibles.</p>`;
      return;
    }

    listContainer.innerHTML = items.map((item, idx) => {
      const episodeNumber = String(total - idx - 1).padStart(2, "0");
      const dateLabel = formatDate(item.date);

      return `
        <a href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}" class="podcast-episode-item">
          <div class="podcast-episode-thumb">
            <img src="${item.thumbnail || '/assets/img/default_news.jpg'}" alt="${item.title}" loading="lazy">
            <div class="podcast-episode-play-mini">
              <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>
          <div class="podcast-episode-info">
            <span class="podcast-episode-number">EP ${episodeNumber}</span>
            <h4 class="podcast-episode-title">${item.title}</h4>
            <span class="podcast-episode-meta">${dateLabel}</span>
          </div>
        </a>
      `;
    }).join("");
  }

  function updateButton() {
    if (!button) return;
    button.hidden = state.source.length <= state.visible;
  }

  function render() {
    if (!state.source.length) {
      renderFeatured(null, 0);
      renderEpisodesList([], 0);
      updateButton();
      return;
    }

    const total = state.source.length;
    const featured = state.source[0];
    const remaining = state.source.slice(1, state.visible);

    renderFeatured(featured, total);
    renderEpisodesList(remaining, total);
    updateButton();
  }

  function setSource(items) {
    state.source = Array.isArray(items) ? items : [];
    state.visible = Math.min(6, state.source.length);
    render();
  }

  function handleViewMore() {
    state.visible = Math.min(state.source.length, state.visible + 5);
    render();
  }

  function init(items) {
    button = document.getElementById("podcast-view-more");
    if (button && !button.dataset.bound) {
      button.addEventListener("click", handleViewMore);
      button.dataset.bound = "true";
    }
    setSource(items);
  }

  return { init, setSource, render };
})();

function initWeatherWidget() {
  const widget = document.getElementById("weather-widget");
  const tempEl = document.getElementById("weather-temp");
  const symbolEl = document.getElementById("weather-symbol");
  const panel = document.getElementById("weather-panel");
  const panelContent = document.getElementById("weather-panel-content");
  const panelClose = document.getElementById("weather-panel-close");

  if (!widget || !tempEl) return;
  if (widget.dataset.weatherBound === "true") return;
  widget.dataset.weatherBound = "true";

  let lastForecast = null;

  const togglePanel = (open) => {
    if (!panel) return;
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", String(!open));
    if (open && panelContent && !panelContent.dataset.hydrated) {
      panelContent.innerHTML = `<p class="weather-panel-empty">Cargando pronóstico...</p>`;
    }
  };

  const bindPanelEvents = () => {
    if (!panel) return;
    if (panel.dataset.bound === "true") return;
    panel.dataset.bound = "true";

    widget.addEventListener("click", () => togglePanel(true));
    panelClose?.addEventListener("click", () => togglePanel(false));
    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        togglePanel(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        togglePanel(false);
      }
    });
  };

  bindPanelEvents();

  const setStatus = (text, condition, extraData) => {
    const label = condition?.label || "Clima local";
    const symbol = condition?.symbol || "default";
    tempEl.textContent = text;
    if (symbolEl) {
      const svgMarkup = WEATHER_ICON_SVGS[symbol] || WEATHER_ICON_SVGS.default;
      symbolEl.innerHTML = svgMarkup;
      symbolEl.dataset.symbol = symbol;
    }
    widget.setAttribute("title", `Clima en Asunción: ${label}${text !== "--°C" ? ` · ${text}` : ""}`);

    // UI Ticker logic
    const tickerTrack = document.getElementById("weather-ticker-track");
    if (tickerTrack && extraData) {
      const humidity = extraData.humidity ? ` · Humedad: ${extraData.humidity}%` : "";
      const wind = extraData.wind ? ` · Viento: ${extraData.wind} km/h` : "";
      const pressure = extraData.pressure ? ` · Presión: ${extraData.pressure} hPa` : "";
      const conditionText = `Asunción: ${label}`;
      const fullText = `${conditionText}${humidity}${wind}${pressure}`;

      // Duplicamos el contenido para el efecto de scroll infinito si es necesario
      // O simplemente ponemos el texto
      const separator = " <span class=\"ticker-dot\">•</span> ";
      tickerTrack.innerHTML = `<span>${fullText}</span>${separator}<span>${fullText}</span>${separator}`;
    }
  };

  const renderForecast = (daily) => {
    if (!panelContent) return;
    if (!daily?.time?.length) {
      panelContent.innerHTML = `<p class="weather-panel-empty">No hay pronóstico disponible.</p>`;
      return;
    }

    // Header del panel con datos actuales más detallados si los tenemos
    let currentDetailHtml = "";
    if (lastForecast && lastForecast.current) {
      const cur = lastForecast.current;
      const cond = resolveWeatherCondition(cur.weather_code);
      currentDetailHtml = `
        <div class="weather-current-detailed-card">
          <div class="wcd-main">
            <span class="wcd-symbol">${cond.icon}</span>
            <span class="wcd-temp">${Math.round(cur.temperature_2m)}°C</span>
          </div>
          <div class="wcd-info">
            <p class="wcd-label">${cond.label}</p>
            <div class="wcd-metrics">
              <span><strong>Humedad:</strong> ${cur.relative_humidity_2m}%</span>
              <span><strong>Viento:</strong> ${cur.wind_speed_10m} km/h</span>
              <span><strong>Presión:</strong> ${Math.round(cur.surface_pressure)} hPa</span>
            </div>
          </div>
        </div>
        <h4 class="forecast-title">Próximos días</h4>
      `;
    }

    const cards = daily.time.slice(0, WEATHER_FORECAST_DAYS).map((dateStr, idx) => {
      const condition = resolveWeatherCondition(daily.weather_code?.[idx] ?? daily.weathercode?.[idx]);
      const max = daily.temperature_2m_max?.[idx];
      const min = daily.temperature_2m_min?.[idx];
      const maxLabel = typeof max === "number" ? `${Math.round(max)}°` : "--";
      const minLabel = typeof min === "number" ? `${Math.round(min)}°` : "--";
      return `
        <article class="weather-forecast-card">
          <strong>${formatForecastDay(dateStr)}</strong>
          <div class="weather-forecast-symbol" aria-hidden="true">${condition.icon}</div>
          <p class="weather-forecast-temps"><span>${maxLabel}</span> / <span class="min-t">${minLabel}</span></p>
          <small>${condition.label}</small>
        </article>
      `;
    }).join("");

    panelContent.innerHTML = `
      <div class="weather-detailed-panel">
        ${currentDetailHtml}
        <div class="weather-forecast-grid">${cards}</div>
      </div>
    `;
    panelContent.dataset.hydrated = "true";
  };

  const fetchWeather = async () => {
    const params = new URLSearchParams({
      latitude: WEATHER_COORDS.latitude,
      longitude: WEATHER_COORDS.longitude,
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "auto"
    });
    const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const current = payload?.current;
    if (!current) throw new Error("Sin datos de current");

    return {
      temperature: typeof current.temperature_2m === "number" ? Math.round(current.temperature_2m) : null,
      code: typeof current.weather_code === "number" ? current.weather_code : null,
      humidity: current.relative_humidity_2m,
      wind: current.wind_speed_10m,
      pressure: current.surface_pressure,
      current: current, // Guardamos todo para el panel
      daily: payload?.daily || null
    };
  };

  const updateWeather = async () => {
    try {
      const data = await fetchWeather();
      const condition = resolveWeatherCondition(data.code);
      const tempLabel = typeof data.temperature === "number" ? `${data.temperature}°C` : "--°C";

      const extraData = {
        humidity: data.humidity,
        wind: data.wind,
        pressure: data.pressure
      };

      setStatus(tempLabel, condition, extraData);

      if (data.daily) {
        lastForecast = {
          daily: data.daily,
          current: data.current
        };
        renderForecast(data.daily);
      }
    } catch (error) {
      console.warn("⚠️ No se pudo actualizar el clima", error);
      setStatus("--°C", { icon: "ℹ️", label: "Clima no disponible" });
      panelContent && (panelContent.innerHTML = `<p class="weather-panel-empty">No pudimos obtener el pronóstico.</p>`);
    }
  };

  updateWeather();
  setInterval(updateWeather, WEATHER_UPDATE_INTERVAL);
}

// Toggle del buscador en el drawer
// Toggle del buscador en el drawer -> AHORA OVERLAY
// Toggle del buscador premium overlay
function initSearchToggle() {
  const searchToggleHeader = document.getElementById("search-toggle-header");
  const overlay = document.getElementById("search-overlay");
  const overlayClose = document.getElementById("search-overlay-close");
  const overlayInput = document.getElementById("search-overlay-input");
  const overlayResults = document.getElementById("search-overlay-results");

  if (!overlay || !searchToggleHeader) return;

  // Cache busting y carga de datos unificada
  async function getSearchData() {
    if (searchDataCache) return searchDataCache;
    try {
      // Intentar usar CONTENT_URL definido arriba
      const res = await fetch(`${CONTENT_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();

      // Aplanar todas las colecciones para búsqueda global
      searchDataCache = [
        ...(data.noticias || []),
        ...(data.analisis || []),
        ...(data.programa || []),
        ...(data.podcast || [])
      ].map(item => ({
        ...item,
        // Pre-normalizar campos para búsqueda rápida
        _searchSource: `${item.title} ${item.description || item.summary || ""} ${item.category || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      }));

      return searchDataCache;
    } catch (e) {
      console.warn("⚠️ No se pudieron cargar datos para el buscador", e);
      return [];
    }
  }

  function renderSearchResults(results, query) {
    if (!overlayResults) return;

    if (results.length === 0) {
      overlayResults.innerHTML = `
        <div class="search-no-results">
          <p>No encontramos resultados para "<strong>${escapeHtml(query)}</strong>"</p>
          <small>Intenta con palabras más generales.</small>
        </div>`;
      return;
    }

    overlayResults.innerHTML = results.map(item => {
      const title = escapeHtml(item.title);
      const thumb = item.thumbnail || "/assets/img/default_news.jpg";
      const cat = resolveCategoryLabel(item.category || item.type || "Actualidad");
      const date = formatDate(item.date);
      const url = `/noticia.html?id=${encodeURIComponent(item.slug || item.id)}`;

      return `
        <a href="${url}" class="search-result-item">
          <img src="${thumb}" class="search-result-img" alt="${title}" loading="lazy">
          <div class="search-result-info">
            <h4>${title}</h4>
            <div class="search-result-meta">
              <span class="search-result-category">${cat}</span>
              <span class="search-result-date">${date}</span>
            </div>
          </div>
        </a>
      `;
    }).join("");
  }

  // Función para abrir/cerrar
  function toggleOverlay(show) {
    const isOpen = show ?? !overlay.classList.contains("open");
    overlay.classList.toggle("open", isOpen);
    overlay.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";

    if (isOpen) {
      if (overlayInput) {
        setTimeout(() => overlayInput.focus(), 150);
      }
      // Pre-cargar datos al abrir
      getSearchData();
    } else {
      // Limpiar al cerrar
      if (overlayInput) overlayInput.value = "";
      if (overlayResults) overlayResults.innerHTML = "";
    }
  }

  // Click en lupa header
  if (searchToggleHeader.dataset.bound !== "true") {
    searchToggleHeader.dataset.bound = "true";
    searchToggleHeader.addEventListener("click", (e) => {
      e.preventDefault();
      toggleOverlay(true);
    });
  }

  // Click en cerrar overlay
  if (overlayClose && overlayClose.dataset.bound !== "true") {
    overlayClose.dataset.bound = "true";
    overlayClose.addEventListener("click", () => toggleOverlay(false));
  }

  // Cerrar con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      toggleOverlay(false);
    }
  });

  // Listener de búsqueda real mientras se escribe
  if (overlayInput && overlayInput.dataset.bound !== "true") {
    overlayInput.dataset.bound = "true";

    let debounceTimer;
    overlayInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();

      clearTimeout(debounceTimer);
      if (!query) {
        if (overlayResults) overlayResults.innerHTML = "";
        return;
      }

      debounceTimer = setTimeout(async () => {
        const data = await getSearchData();
        const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const matched = data.filter(item => item._searchSource.includes(normalizedQuery))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 8); // Top 8 resultados

        renderSearchResults(matched, query);
      }, 250);
    });

    // También manejar Enter para ir al primer resultado si existe
    overlayInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const firstResult = overlayResults.querySelector(".search-result-item");
        if (firstResult) {
          firstResult.click();
        }
      }
    });
  }
}

function initMenuToggle() {
  const menuToggle = document.getElementById("menu-toggle");
  const navList = document.getElementById("nav-list");
  if (!menuToggle || !navList) return;
  if (menuToggle.dataset.bound === "true") return;
  menuToggle.dataset.bound = "true";

  const closeMenu = () => {
    navList.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = !navList.classList.contains("active");
    navList.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  navList.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", closeMenu)
  );

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

function initHeaderScrollState() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  if (header.dataset.scrollBound === "true") return;
  header.dataset.scrollBound = "true";

  const noticiasSection = document.getElementById("noticias");

  // Detectar si estamos en una página de contenido (Noticia o Análisis)
  // Buscamos contenedores específicos de estas páginas
  const isContentPage = document.getElementById("contenido-noticia") ||
    document.getElementById("analisis-grid") ||
    document.querySelector("main .article-container-pro") ||
    window.location.pathname.includes("noticia.html") ||
    window.location.pathname.includes("analisis.html");

  // Threshold más bajo para páginas internas para que el efecto sea más inmediato
  const SCROLL_THRESHOLD = isContentPage ? 50 : 80;

  let lastScrollState = null;
  let scrollThrottleId = null;

  const handleScroll = () => {
    if (scrollThrottleId) return;

    scrollThrottleId = requestAnimationFrame(() => {
      const currentScroll = window.scrollY;
      let baseThreshold = SCROLL_THRESHOLD;

      // Lógica dinámica SOLO para la Home (si existe sección noticias y NO es página de contenido)
      if (noticiasSection && !isContentPage) {
        const noticiasTop = noticiasSection.offsetTop;
        // El threshold base es un poco antes de llegar a la sección noticias, 
        // pero respetando un mínimo (SCROLL_THRESHOLD)
        baseThreshold = Math.max(SCROLL_THRESHOLD, noticiasTop - 100);
      } else {
        // En páginas internas, usamos el threshold fijo bajo (50px)
        baseThreshold = SCROLL_THRESHOLD;
      }

      // Hysteresis buffer to prevent flickering
      const BUFFER = 20;

      if (!lastScrollState && currentScroll > (baseThreshold + BUFFER)) {
        // Switch to Scrolled State (Hide sections)
        lastScrollState = true;
        header.classList.add("scrolled");
        const topTicker = document.querySelector('.market-ticker[data-variant="top"]');
        if (topTicker) topTicker.classList.add("hidden");
      } else if (lastScrollState && currentScroll < (baseThreshold - BUFFER)) {
        // Switch to Expanded State (Show sections)
        lastScrollState = false;
        header.classList.remove("scrolled");
        const topTicker = document.querySelector('.market-ticker[data-variant="top"]');
        if (topTicker) topTicker.classList.remove("hidden");
      }

      scrollThrottleId = null;
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // Check state on load
}

function initHeaderDate() {
  const dateEl = document.getElementById("header-date");
  if (!dateEl) return;

  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const today = new Date();
  let dateString = today.toLocaleDateString('es-ES', options);

  // Formato: "Sábado, 31 de Enero de 2026"
  // Capitalizar cada palabra importante para look editorial
  dateString = dateString.split(' ').map(word => {
    if (word.length > 2) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');

  dateEl.textContent = dateString;
}

// ========================================
// SKELETON LOADER BUILDERS
// ========================================

// Skeleton para mega menu cards
const buildSkeletonCard = () => `
  <div class="skeleton-mega-card">
    <div class="skeleton-mega-thumb skeleton"></div>
    <div class="skeleton-mega-content">
      <div class="skeleton-mega-cat skeleton"></div>
      <div class="skeleton-mega-title skeleton"></div>
      <div class="skeleton-mega-title skeleton"></div>
    </div>
  </div>
`;

// Skeleton para hero section
const buildHeroSkeleton = () => `
  <div class="skeleton-hero">
    <div class="skeleton-hero-media skeleton"></div>
    <div class="skeleton-hero-content">
      <div class="skeleton-hero-badge skeleton"></div>
      <div class="skeleton-hero-title skeleton"></div>
      <div class="skeleton-hero-title-line skeleton"></div>
      <div class="skeleton-hero-lede skeleton"></div>
      <div class="skeleton-hero-lede skeleton"></div>
      <div class="skeleton-hero-cta skeleton"></div>
    </div>
  </div>
`;

// Skeleton para secondary cards
const buildSecondaryCardSkeleton = () => `
  <div class="skeleton-secondary-card">
    <div class="skeleton-secondary-media skeleton"></div>
    <div class="skeleton-secondary-body">
      <div class="skeleton-secondary-badge skeleton"></div>
      <div class="skeleton-secondary-title skeleton"></div>
      <div class="skeleton-secondary-title skeleton"></div>
      <div class="skeleton-secondary-summary skeleton"></div>
      <div class="skeleton-secondary-summary skeleton"></div>
      <div class="skeleton-secondary-summary skeleton"></div>
      <div class="skeleton-secondary-meta skeleton"></div>
    </div>
  </div>
`;

// Skeleton para card grids
const buildCardSkeleton = () => `
  <div class="skeleton-card">
    <div class="skeleton-card-img skeleton"></div>
    <div class="skeleton-card-content">
      <div class="skeleton-card-title skeleton"></div>
      <div class="skeleton-card-title skeleton"></div>
      <div class="skeleton-card-meta skeleton"></div>
    </div>
  </div>
`;

// Cargar artículos destacados en los mega menús de Análisis y Noticias
async function initMegaMenuFeatured() {
  const megaAnalisis = document.getElementById("mega-featured-analisis");
  const megaNoticias = document.getElementById("mega-featured-noticias");

  // Si no hay mega menús en esta página, salir
  if (!megaAnalisis && !megaNoticias) return;

  // Mostrar skeletons mientras carga
  if (megaAnalisis) {
    megaAnalisis.innerHTML = Array(2).fill(buildSkeletonCard()).join('');
  }
  if (megaNoticias) {
    megaNoticias.innerHTML = Array(3).fill(buildSkeletonCard()).join('');
  }

  try {
    const res = await fetch(`${CONTENT_URL}?t=${Date.now()}`);
    if (!res.ok) return;

    const data = await res.json();
    const noticiasData = data.noticias || [];
    const analisisData = data.analisis || [];

    // Función para construir un mini card para mega menú
    const buildMegaCard = (item) => {
      const thumb = item.thumbnail || "/assets/img/default.jpg";
      const id = item.slug || item.id;
      const title = item.title || "Sin título";
      const category = item.category || "";
      const categoryLabel = category.toUpperCase();

      return `
        <a href="/noticia.html?id=${encodeURIComponent(id)}" class="mega-featured-card fade-in">
          <div class="mega-card-thumb">
             <img src="${thumb}" alt="${title}" loading="lazy">
          </div>
          <div class="mega-card-content">
             <span class="mega-card-cat" data-category="${category}">${categoryLabel}</span>
             <span class="mega-featured-title">${title}</span>
          </div>
        </a>
      `;
    };

    const updateMegaContainer = (container, items) => {
      if (!container) return;
      if (!items || !items.length) {
        container.innerHTML = `<p class="mega-empty">No hay contenido reciente.</p>`;
        return;
      }
      container.innerHTML = items.map(buildMegaCard).join("");
    };

    // 1. Carga Inicial (Default: Más recientes)
    if (megaAnalisis) updateMegaContainer(megaAnalisis, analisisData.slice(0, 2));
    if (megaNoticias) updateMegaContainer(megaNoticias, noticiasData.slice(0, 3));

    // 2. Agregar Event Listeners para Hover (Dinámico)

    // > Lógica para Análisis
    if (megaAnalisis) {
      const container = megaAnalisis.closest('.mega-menu-inner');
      const links = container.querySelectorAll('.mega-menu-list a');

      links.forEach(link => {
        link.addEventListener('mouseenter', () => {
          const href = link.getAttribute('href') || "";
          let filtered = [];

          if (href.includes('analisis.html')) {
            // "Opinión Editorial" - busco tags específicos o uso default
            filtered = analisisData.filter(n => n.category === 'opinion' || n.category === 'editorial');
          } else if (href.includes('cat=')) {
            const cat = href.split('cat=')[1];
            filtered = analisisData.filter(n => (n.category || "").includes(cat));
          }

          // Fallback a recientes si no hay matches
          if (!filtered.length) filtered = analisisData;

          updateMegaContainer(megaAnalisis, filtered.slice(0, 2));
        });
      });

      // Restaurar al salir del menú completo (opcional, o dejar la última selección)
      // container.addEventListener('mouseleave', () => updateMegaContainer(megaAnalisis, analisisData.slice(0, 2))); 
    }

    // > Lógica para Noticias
    if (megaNoticias) {
      const container = megaNoticias.closest('.mega-menu-inner');
      const links = container.querySelectorAll('.mega-menu-list a');

      links.forEach(link => {
        link.addEventListener('mouseenter', () => {
          const href = link.getAttribute('href') || "";
          let filtered = [];

          if (href.includes('cat=')) {
            // Better parsing
            const urlParts = href.split('?');
            if (urlParts.length > 1) {
              const urlParams = new URLSearchParams(urlParts[1]);
              const catParam = urlParams.get('cat');
              if (catParam) {
                filtered = noticiasData.filter(n => (n.category || "").includes(catParam));
              }
            }
          }

          if (!filtered.length) {
            // Try heuristic based on text content if URL param fails? No, simpler to stick to 'cat' param.
            // Fallback to recent
            filtered = noticiasData;
          }

          updateMegaContainer(megaNoticias, filtered.slice(0, 3));
        });
      });
    }

    console.log("✅ Mega menús dinámicos activados");
  } catch (e) {
    console.warn("No se pudieron cargar los mega menús:", e);
  }
}


async function initHome() {
  console.log("🔄 Iniciando carga de datos...");

  renderMarketTicker("ticker-track-top");
  renderMarketTicker("ticker-track-bottom");
  initSearchToggle();
  initMenuToggle();
  loadFxQuotes();
  loadMarketQuotes();
  if (!marketTickerRefreshHandle && MARKET_TICKER_REFRESH_INTERVAL > 0) {
    marketTickerRefreshHandle = setInterval(async () => {
      loadFxQuotes();
      loadMarketQuotes();
    }, MARKET_TICKER_REFRESH_INTERVAL);
  }

  try {
    // 1. CACHE BUSTING: Usamos un buster de 5 minutos para permitir caché del navegador
    const vBuster = Math.floor(Date.now() / 300000);
    const uniqueUrl = `${CONTENT_URL}?v=${vBuster}`;

    const res = await fetch(uniqueUrl);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log("📦 Datos frescos recibidos:", data);

    // Pre-poblar caché de búsqueda
    searchDataCache = [
      ...(data.noticias || []),
      ...(data.analisis || []),
      ...(data.programa || []),
      ...(data.podcast || [])
    ].map(item => ({
      ...item,
      _searchSource: `${item.title} ${item.description || item.summary || ""} ${item.category || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }));

    // 2. RENDERIZADO MODULAR
    const heroArticle = renderHero(data.noticias);

    // Filtrar la noticia que se usó como Hero para que no se repita en el resto de la página
    const remainingNoticias = data.noticias.filter(n => (n.slug || n.id) !== (heroArticle.slug || heroArticle.id));

    renderSecondary(remainingNoticias);

    // Renderizar tapas digitales en sidebar (desde content.json si existen)
    renderDigitalCoversSidebar(data.tapas);

    initNoticiasLocales(remainingNoticias);
    renderCategoryFilters(remainingNoticias);
    renderTopReads(remainingNoticias);
    initAnalisisSection(data.analisis);
    initProgramaSection(data.programa);
    initVideosDestacadosSection(data.videos_destacados || []);
    initPodcastSection(data.podcast);
    if (Array.isArray(data.sponsors)) {
      sponsorsController.init(data.sponsors);
    }

  } catch (e) {
    console.error("❌ Error crítico cargando contenido:", e);
    const hero = document.getElementById("hero");
    if (hero) hero.innerHTML = `<p style="text-align:center; padding: 2rem; color: red;">Hubo un error cargando las noticias. Por favor recarga la página.</p>`;
  }
}
// --- GENERADOR UNIVERSAL DE TARJETAS ---
function buildNoticiaCard(item, variant = 'standard') {
  if (!item) return '';
  const kicker = (item.kicker || item.category || "Noticia").toUpperCase();
  const summary = truncateCopy(item.summary || item.description || "", 120);
  const href = `/noticia.html?id=${encodeURIComponent(item.slug || item.id)}`;

  return `
    <article class="card ${variant === 'large' ? 'card-large' : ''}" data-category="${item.category}">
      <a href="${href}" class="card-link-wrapper">
        <div class="card-img-container">
          <img src="${item.thumbnail || HERO_IMAGE_FALLBACK}" alt="${escapeHtml(item.title)}" loading="lazy">
        </div>
        <div class="card-body">
          ${variant === 'large' ? `<span class="card-kicker">${escapeHtml(kicker)}</span>` : ''}
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          ${variant === 'large' ? `<p class="card-excerpt">${escapeHtml(summary)}</p>` : ''}
          ${variant === 'large' ? `
          <div class="card-meta">
            <time>${formatDate(item.date)}</time>
          </div>` : ''}
        </div>
      </a>
    </article>
  `;
}

// --- FUNCIONES DE RENDERIZADO ---

async function renderHeroFromFile() {
  const container = document.getElementById("hero");
  if (!container) return;

  try {
    // Cargar el archivo markdown más reciente
    const filePath = "content/noticias/posts/2025-11-22-bcp-mantiene-anclada-la-tasa-de-interes.md?t=" + new Date().getTime();
    const res = await fetch(filePath);
    const markdown = await res.text();

    // Extraer frontmatter
    const match = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (!match) throw new Error("No frontmatter found");

    const frontmatter = match[1];

    // Parser simple de YAML frontmatter
    const title = frontmatter.match(/title:\s*(.+)/)?.[1]?.trim() || "Sin título";
    const summary = frontmatter.match(/summary:\s*(.+)/)?.[1]?.trim() || "Sin resumen";
    const slug = frontmatter.match(/slug:\s*(.+)/)?.[1]?.trim() || "default";
    let thumbnail = frontmatter.match(/thumbnail:\s*(.+)/)?.[1]?.trim() || "";
    const category = frontmatter.match(/category:\s*(.+)/)?.[1]?.trim() || "Actualidad";
    const date = frontmatter.match(/date:\s*(.+)/)?.[1]?.trim() || "";
    const author = frontmatter.match(/author:\s*(.+)/)?.[1]?.trim() || "";

    // Si la ruta es relativa, convertirla a URL completa
    if (thumbnail.startsWith('/')) {
      thumbnail = window.location.origin + thumbnail;
    }

    // Fallback si no hay thumbnail válido
    if (!thumbnail || thumbnail.startsWith('/')) {
      thumbnail = HERO_IMAGE_FALLBACK;
    }

    // Cambiar la clase del contenedor a hero
    container.className = 'hero';
    container.innerHTML = buildHeroMarkup({
      id: slug,
      slug,
      title,
      summary,
      description: summary,
      thumbnail,
      category,
      date,
      author
    });
  } catch (e) {
    console.error("Error cargando hero desde archivo:", e);
    // Fallback completo
    const container = document.getElementById("hero");
    if (container) {
      container.className = 'hero';
      container.innerHTML = buildHeroMarkup({
        id: "2025-11-22-bcp-mantiene-anclada-la-tasa-de-interes",
        slug: "2025-11-22-bcp-mantiene-anclada-la-tasa-de-interes",
        title: "BCP mantiene \"anclada\" la tasa de interés con una inflación a la baja",
        summary: "El Comité de Política Monetaria decidió, por unanimidad, mantener la tasa de interés de política monetaria (TPM) en 6,0% anual.",
        description: "El Comité de Política Monetaria decidió, por unanimidad, mantener la tasa de interés de política monetaria (TPM) en 6,0% anual.",
        thumbnail: HERO_IMAGE_FALLBACK,
        category: "macro",
        date: "2025-11-22T12:00:00-03:00",
        author: "Perspectivas",
        featured: {
          cta_label: "Ver detalle",
          cta_tagline: HERO_TAGLINE
        }
      });
    }
  }
}

function renderHero(n) {
  const container = document.getElementById("hero");
  if (!container) return null;

  // Mostrar skeleton mientras no hay datos
  if (!n?.length) {
    container.className = 'hero';
    container.innerHTML = buildHeroSkeleton();
    return null;
  }

  // 🎯 Buscar la noticia marcada como is_main_featured
  let heroArticle = n.find(noticia => {
    const featured = noticia.featured;
    return featured &&
      typeof featured === 'object' &&
      featured.is_main_featured === true;
  });

  // Si no hay ninguna marcada como principal, usa la más reciente
  if (!heroArticle) {
    heroArticle = n[0];
  }

  // Cambiar la clase del contenedor a hero
  container.className = 'hero';

  container.innerHTML = buildHeroMarkup(heroArticle);

  console.log("📰 Hero actualizado con:", heroArticle.title, "(is_main_featured:",
    (typeof heroArticle.featured === 'object' && heroArticle.featured?.is_main_featured) || false, ")");

  return heroArticle;
}

function renderSecondary(n) {
  const container = document.getElementById("secondary-news");
  if (!container) return;

  // Mostrar skeleton mientras no hay datos
  if (!n?.length) {
    container.innerHTML = Array(2).fill(buildSecondaryCardSkeleton()).join('');
    return;
  }

  // Tomamos los primeros 3 de la lista recibida (ya viene sin la Hero)
  const cardsHtml = n.slice(0, 2)
    .map(article => {
      const palette = resolveCategoryAccent(article.category);
      const categoryLabel = resolveCategoryLabel(article.category).toUpperCase();
      const summary = truncateCopy(article.summary || article.description || "", 140);
      const metaLabel = formatHeroDate(article.date);
      const title = escapeHtml(article.title || "Noticia destacada");
      const image = escapeHtml(article.thumbnail || HERO_IMAGE_FALLBACK);
      const summaryHtml = summary ? `<p class="secondary-card-summary">${escapeHtml(summary)}</p>` : "";
      const metaHtml = metaLabel ? `<span class="secondary-card-meta">${escapeHtml(metaLabel)}</span>` : "";

      return `
        <a href="/noticia.html?id=${encodeURIComponent(article.slug || article.id)}" class="secondary-card" style="--secondary-accent:${palette.primary};--secondary-accent-secondary:${palette.secondary};">
          <div class="secondary-card-media">
            <img src="${image}" alt="${title}" loading="lazy" />
            <span class="secondary-card-badge">${escapeHtml(categoryLabel)}</span>
            <div class="secondary-card-overlay"></div>
          </div>
          <div class="secondary-card-body">
            <h3 class="secondary-card-title">${title}</h3>
            ${summaryHtml}
            ${metaHtml}
          </div>
        </a>
      `;
    })
    .join("");

  container.innerHTML = cardsHtml;
}

function initNoticiasLocales(noticias) {
  noticiasViewMoreBtn = document.getElementById("news-view-more");
  if (noticiasViewMoreBtn && !noticiasViewMoreBtn.dataset.bound) {
    noticiasViewMoreBtn.addEventListener("click", handleNoticiasViewMore);
    noticiasViewMoreBtn.dataset.bound = "true";
  }
  setNoticiasLocalesSource(noticias);
  initNoticiasHorizontalScroll();
}

function setNoticiasLocalesSource(list) {
  noticiasLocalesState.source = Array.isArray(list) ? list : [];
  noticiasLocalesState.visible = Math.min(
    NOTICIAS_INITIAL_LIMIT,
    noticiasLocalesState.source.length
  );
  shouldResetNoticiasScroll = true;
  renderNoticiasLocales();
  updateNoticiasViewMore();
}

function handleNoticiasViewMore() {
  noticiasLocalesState.visible = Math.min(
    noticiasLocalesState.source.length,
    noticiasLocalesState.visible + NOTICIAS_INCREMENT
  );
  renderNoticiasLocales();
  updateNoticiasViewMore();
}

function updateNoticiasViewMore() {
  if (!noticiasViewMoreBtn) return;
  const hasMore = noticiasLocalesState.source.length > noticiasLocalesState.visible;
  noticiasViewMoreBtn.hidden = !hasMore;
}

function renderNoticiasLocales() {
  const heroMain = document.getElementById("nlv2-hero-main");
  const gridContainer = document.getElementById("news-grid");
  const contextFeed = document.getElementById("nlv2-context-feed");

  if (!gridContainer) return;

  const source = noticiasLocalesState.source || [];
  if (!source.length) {
    if (heroMain) heroMain.innerHTML = `<p class="nlv2-placeholder">No hay noticias locales disponibles.</p>`;
    gridContainer.innerHTML = `<p class="empty-copy">No encontramos noticias en esta categoría.</p>`;
    if (contextFeed) contextFeed.innerHTML = `<p class="nlv2-placeholder">Sin historias relacionadas.</p>`;
    updateNoticiasViewMore();
    return;
  }

  // 1. Seleccionar destacados
  const { main, secondary, remainder } = selectSectionHeroArticles(source);
  const featured = main;

  // En el grid mostramos el resto. En el nuevo diseño no hay "secondary" aparte,
  // así que unimos secondary y remainder para el grid.
  const gridSource = [...secondary, ...remainder];
  const gridItems = gridSource.slice(0, noticiasLocalesState.visible);

  // 2. Renderizar Artículo Destacado (65% Column)
  if (heroMain && featured) {
    const kicker = (featured.kicker || featured.category || "Destacado").toUpperCase();
    const summary = truncateCopy(featured.summary || featured.description || "", 260);

    heroMain.innerHTML = `
      <div class="card-image-wrapper">
        <img src="${featured.thumbnail || HERO_IMAGE_FALLBACK}" alt="${escapeHtml(featured.title)}" loading="lazy" />
      </div>
      <div class="card-content">
        <span class="card-kicker">${escapeHtml(kicker)}</span>
        <h2 class="card-title">${escapeHtml(featured.title)}</h2>
        <p class="card-excerpt">${escapeHtml(summary)}</p>
        <div class="card-meta">
          <time>${formatDate(featured.date)}</time>
          <a href="/noticia.html?id=${encodeURIComponent(featured.slug || featured.id)}" class="btn-read-more">Ver reporte completo</a>
        </div>
      </div>
    `;
  }

  // 3. Renderizar Grid de Noticias (Abajo)
  gridContainer.innerHTML = gridItems
    .map((noticia, idx) => buildNoticiaCard(noticia, 'standard'))
    .join('');

  // 4. Renderizar Context Feed (Sidebar)
  if (contextFeed) {
    // Usar una muestra de noticias para el contexto
    const contextItems = source.slice(1, 4); // Ignoramos el principal para el contexto
    if (contextItems.length) {
      contextFeed.innerHTML = contextItems.map(item => `
        <article class="context-mini-card">
          <div class="context-mini-dot"></div>
          <div class="context-mini-body">
            <h4 class="context-mini-title">
              <a href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}">${escapeHtml(item.title)}</a>
            </h4>
            <time class="context-mini-date">${formatDate(item.date)}</time>
          </div>
        </article>
      `).join('');
    } else {
      contextFeed.innerHTML = `<p class="nlv2-placeholder">Sin historias por el momento.</p>`;
    }
  }

  refreshNoticiasScroller();
}

function initNoticiasHorizontalScroll() {
  const scroller = document.getElementById("news-grid");
  const wrapper = scroller?.closest(".nlv2-scroll-wrapper");
  if (!scroller || !wrapper) return;

  const prevBtn = wrapper.querySelector('[data-scroll="prev"]');
  const nextBtn = wrapper.querySelector('[data-scroll="next"]');
  const indicator = wrapper.parentElement?.querySelector(".nlv2-scroll-indicator span") || null;
  noticiasScrollContext = { scroller, prevBtn, nextBtn, indicator };

  if (prevBtn && !prevBtn.dataset.bound) {
    prevBtn.dataset.bound = "true";
    prevBtn.addEventListener("click", () => scrollNoticiasCarousel(-1));
  }

  if (nextBtn && !nextBtn.dataset.bound) {
    nextBtn.dataset.bound = "true";
    nextBtn.addEventListener("click", () => scrollNoticiasCarousel(1));
  }

  if (!noticiasScrollListenersBound) {
    scroller.addEventListener("scroll", handleNoticiasScrollChange, { passive: true });
    window.addEventListener("resize", handleNoticiasScrollChange);
    noticiasScrollListenersBound = true;
  }

  handleNoticiasScrollChange();
}

function scrollNoticiasCarousel(direction = 1) {
  if (!noticiasScrollContext?.scroller) return;
  const { scroller } = noticiasScrollContext;
  const step = Math.max(280, scroller.clientWidth * 0.75);
  scroller.scrollBy({ left: step * direction, behavior: "smooth" });
}

function handleNoticiasScrollChange() {
  if (noticiasScrollUpdateHandle) cancelAnimationFrame(noticiasScrollUpdateHandle);
  noticiasScrollUpdateHandle = requestAnimationFrame(updateNoticiasScrollControls);
}

function updateNoticiasScrollControls() {
  if (!noticiasScrollContext?.scroller) return;
  const { scroller, prevBtn, nextBtn, indicator } = noticiasScrollContext;
  const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  const scrollLeft = scroller.scrollLeft;
  const atStart = maxScroll === 0 || scrollLeft <= 8;
  const atEnd = maxScroll === 0 || scrollLeft >= (maxScroll - 8);

  if (prevBtn) prevBtn.disabled = atStart;
  if (nextBtn) nextBtn.disabled = atEnd;

  if (indicator) {
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    indicator.style.setProperty("--nlv2-scroll-progress", `${(progress * 100).toFixed(2)}%`);
    indicator.parentElement?.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
  }
}

function refreshNoticiasScroller() {
  if (!noticiasScrollContext?.scroller) return;
  if (shouldResetNoticiasScroll) {
    noticiasScrollContext.scroller.scrollLeft = 0;
    shouldResetNoticiasScroll = false;
  }
  handleNoticiasScrollChange();
}

function initAnalisisSection(items) {
  analisisController.init();
  analisisController.setSource(items);
}

function initProgramaSection(items) {
  programaController.init(items);
  initProgramCarousel();
}

function initProgramCarousel() {
  const carousel = document.getElementById("program-grid");
  const prevBtn = document.getElementById("program-prev");
  const nextBtn = document.getElementById("program-next");

  if (!carousel || !prevBtn || !nextBtn) return;

  const scrollAmount = 350; // Ancho de tarjeta + gap

  prevBtn.addEventListener("click", () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
  });
}

function initPodcastSection(items) {
  podcastController.init(items);
}

function renderSponsors(items) {
  const container = document.getElementById("sponsorsGrid");
  if (!container || !items?.length) return;

  // Filtrar solo los visibles (visible !== false para dar soporte a los que no tienen el campo)
  const visibleItems = items.filter(s => s.visible !== false);

  if (visibleItems.length === 0) {
    container.parentElement.style.display = 'none'; // Ocultar sección si no hay nada
    return;
  } else {
    container.parentElement.style.display = 'block';
  }

  container.innerHTML = visibleItems.map(s => `
      <div class="sponsor-item">
        <a href="${s.url}" target="_blank" rel="noopener noreferrer">
            <img src="${s.logo}" alt="Sponsor" loading="lazy">
        </a>
      </div>
    `).join("");
}

// Renderizar filtros de categorías
function renderCategoryFilters(noticias) {
  noticiasFilterSource = Array.isArray(noticias) ? noticias : [];
  const containers = [
    document.getElementById("category-filters")
  ].filter(Boolean);

  if (!containers.length || !noticiasFilterSource.length) return;

  // Obtener categorías disponibles y normalizarlas
  const availableCategories = [...new Set(noticiasFilterSource.map(n => n.category).filter(Boolean))];

  // Crear lista ordenada de categorías con sus etiquetas
  const categories = availableCategories
    .map(key => ({ key, label: resolveCategoryLabel(key) }))
    .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

  const html = [
    '<button class="filter-btn active" type="button" data-category="all" aria-pressed="true">Todas</button>',
    ...categories.map(cat => `<button class="filter-btn" type="button" data-category="${cat.key}" aria-pressed="false">${cat.label}</button>`)
  ].join("");

  categoryFilterContainers = containers;

  containers.forEach(container => {
    container.innerHTML = html;
    container.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", (event) => {
        const category = btn.dataset.category || "all";
        applyCategoryFilter(category, event);
      });
    });
  });

  initNoticiasFilterControls();
  applyNoticiasFilters();
}

function initNoticiasFilterControls() {
  if (!noticiasFilterSearchInput) {
    noticiasFilterSearchInput = document.getElementById("nlv2-filter-search");
  }

  if (noticiasFilterSearchInput && noticiasFilterSearchInput.dataset.bound !== "true") {
    const handleInput = (event) => {
      noticiasAdvancedFilters.query = (event.target.value || "").toLowerCase().trim();
      applyNoticiasFilters();
    };
    noticiasFilterSearchInput.dataset.bound = "true";
    noticiasFilterSearchInput.addEventListener("input", handleInput);
    noticiasFilterSearchInput.addEventListener("search", handleInput);
  }

  noticiasFilterCountLabel = document.getElementById("nlv2-filter-count");
  noticiasFilterResetBtn = document.getElementById("nlv2-filter-reset");
  if (noticiasFilterResetBtn && noticiasFilterResetBtn.dataset.bound !== "true") {
    noticiasFilterResetBtn.dataset.bound = "true";
    noticiasFilterResetBtn.addEventListener("click", resetNoticiasFilters);
  }

  const sortButtons = document.querySelectorAll(".nlv2-sort-control .sort-pill");
  noticiasSortButtons = Array.from(sortButtons);
  noticiasSortButtons.forEach(btn => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      const targetSort = btn.dataset.sort || "recent";
      if (noticiasAdvancedFilters.sort === targetSort) return;
      noticiasAdvancedFilters.sort = targetSort;
      applyNoticiasFilters();
    });
  });
}

function applyCategoryFilter(category, event) {
  if (!category) return;
  const normalized = category || "all";
  if (noticiasAdvancedFilters.category === normalized) {
    if (event?.currentTarget && event.currentTarget.closest("#category-drawer-filters")) {
      closeCategoryDrawer();
    }
    return;
  }
  noticiasAdvancedFilters.category = normalized;
  if (event?.currentTarget && event.currentTarget.closest("#category-drawer-filters")) {
    closeCategoryDrawer();
  }
  applyNoticiasFilters();
}

function applyNoticiasFilters() {
  const filtered = buildFilteredNoticias();
  syncCategoryFilterState();
  updateSortButtonsState();
  updateFilterMeta(filtered.length);
  setNoticiasLocalesSource(filtered);
}

function buildFilteredNoticias() {
  if (!Array.isArray(noticiasFilterSource)) return [];
  let filtered = [...noticiasFilterSource];
  const activeCategory = noticiasAdvancedFilters.category;
  const query = noticiasAdvancedFilters.query;

  if (activeCategory && activeCategory !== "all") {
    filtered = filtered.filter(item => item.category === activeCategory);
  }

  if (query) {
    filtered = filtered.filter(item => {
      const haystack = [
        item.title,
        item.summary_short,
        item.summary,
        item.description,
        item.kicker,
        resolveCategoryLabel(item.category)
      ].map(normalizeFilterText).join(" ");
      return haystack.includes(query);
    });
  }

  const sorter = noticiasAdvancedFilters.sort === "oldest"
    ? (a, b) => getDateValue(a.date) - getDateValue(b.date)
    : (a, b) => getDateValue(b.date) - getDateValue(a.date);

  return filtered.sort(sorter);
}

function updateFilterMeta(total) {
  if (noticiasFilterCountLabel) {
    const base = noticiasFilterSource.length;
    const hasActive = hasActiveNoticiasFilters();
    const label = hasActive && base !== total
      ? `${total} de ${base} resultados`
      : `${total} resultados`;
    noticiasFilterCountLabel.textContent = label;
  }
  if (noticiasFilterResetBtn) {
    noticiasFilterResetBtn.hidden = !hasActiveNoticiasFilters();
  }
}

function updateSortButtonsState() {
  if (!noticiasSortButtons.length) return;
  noticiasSortButtons.forEach(btn => {
    const isActive = (btn.dataset.sort || "recent") === noticiasAdvancedFilters.sort;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
}

function syncCategoryFilterState() {
  if (!categoryFilterContainers.length) return;
  const activeCategory = noticiasAdvancedFilters.category || "all";
  categoryFilterContainers.forEach(container => {
    container.querySelectorAll(".filter-btn").forEach(btn => {
      const target = btn.dataset.category || "all";
      const isActive = target === activeCategory;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  });
}

function hasActiveNoticiasFilters() {
  return noticiasAdvancedFilters.category !== "all"
    || Boolean(noticiasAdvancedFilters.query)
    || noticiasAdvancedFilters.sort !== "recent";
}

function resetNoticiasFilters() {
  noticiasAdvancedFilters.category = "all";
  noticiasAdvancedFilters.query = "";
  noticiasAdvancedFilters.sort = "recent";
  if (noticiasFilterSearchInput) {
    noticiasFilterSearchInput.value = "";
  }
  applyNoticiasFilters();
}

function getDateValue(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeFilterText(value) {
  return (value || "").toString().toLowerCase();
}

function setCategoryDrawerState(open) {
  const drawer = document.getElementById("category-drawer");
  const toggle = document.getElementById("category-drawer-toggle");
  if (!drawer || !toggle) return;
  drawer.classList.toggle("open", !!open);
  toggle.setAttribute("aria-expanded", String(!!open));
  drawer.setAttribute("aria-hidden", String(!open));
}

function closeCategoryDrawer() {
  setCategoryDrawerState(false);
}

function initCategoryDrawer() {
  const toggle = document.querySelector(".menu-pill-toggle");
  const drawer = document.getElementById("category-drawer");
  const closeBtn = document.getElementById("category-drawer-close");
  if (!toggle || !drawer) return;
  if (toggle.dataset.bound === "true") return;
  toggle.dataset.bound = "true";

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = drawer.classList.contains("open");
    setCategoryDrawerState(!isOpen);
  });

  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = "true";
    closeBtn.addEventListener("click", () => setCategoryDrawerState(false));
  }

  if (!drawer.dataset.bound) {
    drawer.dataset.bound = "true";
    document.addEventListener("click", (event) => {
      if (!drawer.classList.contains("open")) return;
      if (drawer.contains(event.target) || toggle.contains(event.target)) return;
      setCategoryDrawerState(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setCategoryDrawerState(false);
      }
    });
  }

  // Inicializar buscador interno del drawer
  initDrawerSearch();

  // Renderizar secciones fijas de la Home
  renderDrawerSections();
}

/**
 * Renderiza los enlaces a las secciones principales de la Home en el menú hamburguesa.
 */
function renderDrawerSections() {
  const container = document.getElementById("category-drawer-filters");
  if (!container) return;

  const sections = [
    { label: "Noticias", link: "index.html#noticias", icon: "newspaper" },
    { label: "Análisis & Opinión", link: "index.html#analisis", icon: "trending-up" },
    { label: "Podcast", link: "index.html#podcast", icon: "mic" },
    { label: "Programa TV", link: "index.html#programa", icon: "tv" },
    { label: "Videos", link: "index.html#videos-destacados", icon: "play-circle" },
    { label: "Datos & Visualizaciones", link: "datos.html", icon: "bar-chart-2" },
    { label: "Cotizaciones", link: "index.html#cotizaciones", icon: "dollar-sign" }
  ];

  const icons = {
    "newspaper": '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>',
    "trending-up": '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
    "mic": '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line></svg>',
    "tv": '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>',
    "play-circle": '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>',
    "bar-chart-2": '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    "dollar-sign": '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
  };

  container.innerHTML = sections.map(sec => `
    <li class="drawer-nav-item">
      <a href="${sec.link}" class="drawer-nav-link">
        <span class="drawer-nav-icon">${icons[sec.icon] || ''}</span>
        <span class="drawer-nav-text">${sec.label}</span>
      </a>
    </li>
  `).join("");

  // Añadir eventos de cierre al hacer click en un link
  container.querySelectorAll(".drawer-nav-link").forEach(link => {
    link.addEventListener("click", () => {
      closeCategoryDrawer();
    });
  });
}

// Lógica para el buscador expandible del drawer (Menú Hamburguesa)
function initDrawerSearch() {
  const searchBox = document.getElementById("drawer-search-box");
  const searchToggle = document.getElementById("drawer-search-toggle");
  const searchClose = document.getElementById("drawer-search-close");
  const searchInput = document.getElementById("drawer-search-input");

  if (!searchBox || !searchToggle || !searchClose || !searchInput) return;

  // Abrir buscador
  searchToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    searchBox.classList.add("expanded");
    setTimeout(() => searchInput.focus(), 100);
  });

  // Cerrar buscador
  searchClose.addEventListener("click", (e) => {
    e.stopPropagation();
    searchBox.classList.remove("expanded");
    searchInput.value = "";
  });

  // Ejecutar búsqueda al presionar Enter
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        // Redirigir a la página de categorías con el tag buscado
        window.location.href = `/categoria.html?tag=${encodeURIComponent(query)}`;
      }
    }
  });

  // Evitar que el click en el input cierre el drawer
  searchInput.addEventListener("click", (e) => e.stopPropagation());
}


// Renderizar top 5 de más leídas en grid
function renderTopReads(noticias) {
  const container = document.getElementById("top-reads-grid");
  if (!container || !noticias?.length) return;

  // Ordenar por views (descendente) y tomar top 5
  const withViews = noticias.filter(n => !Number.isNaN(Number(n.views)));
  const source = withViews.length ? withViews : [...noticias];

  const topReads = source
    .sort((a, b) => {
      if (withViews.length) {
        return Number(b.views) - Number(a.views);
      }
      return new Date(b.date || 0) - new Date(a.date || 0);
    })
    .slice(0, 5);

  container.innerHTML = topReads.map((n, idx) => {
    const thumb = n.thumbnail || "/assets/img/nasdaq.avif";
    const rank = idx + 1;
    const metaPieces = [
      formatDate(n.date),
      n.views ? `${Number(n.views).toLocaleString("es-PY")} lecturas` : null
    ].filter(Boolean);

    return `
      <a href="/noticia.html?id=${encodeURIComponent(n.slug || n.id)}" class="top-read-card">
        <div class="top-read-thumb">
          <img src="${thumb}" alt="${n.title}" loading="lazy" />
          <span class="top-read-rank">${rank}</span>
        </div>
        <div class="top-read-info">
          <p class="top-read-category">${n.category || "Noticias"}</p>
          <h3>${n.title}</h3>
          ${metaPieces.length ? `<p class="top-read-meta">${metaPieces.join(" · ")}</p>` : ""}
        </div>
      </a>
    `;
  }).join("");
}

async function loadFxQuotes() {
  try {
    const quotes = await fetchFxQuotes();
    latestFxQuotes = quotes;
    renderQuotes(quotes);
  } catch (error) {
    console.warn("⚠️ No pudimos traer cotizaciones en vivo, usamos fallback.", error);
    latestFxQuotes = FX_FALLBACK_QUOTES;
    renderQuotes(FX_FALLBACK_QUOTES);
  }
}

async function loadMarketQuotes() {
  try {
    const commoditySnapshot = await fetchCommoditySnapshot();
    const fxItems = buildMarketFxItems();
    const commodityItems = buildCommodityTickerItems(commoditySnapshot);
    const indexItems = buildStockTickerItems(commoditySnapshot);
    let merged = [...fxItems, ...commodityItems, ...indexItems].filter(Boolean);
    if (!merged.length) throw new Error("Sin datos para mercado hoy");
    marketTickerItems = merged;
  } catch (error) {
    console.warn("⚠️ No pudimos actualizar Mercado Hoy, usamos fallback.", error);
    marketTickerItems = [...MARKET_QUOTES];
  } finally {
    renderMarketTicker("ticker-track-top");
    renderMarketTicker("ticker-track-bottom");
  }
}

async function fetchFxQuotes() {
  const [dollarPySnapshot, awesomeSnapshot] = await Promise.all([
    fetchDollarPySnapshot(),
    fetchAwesomeSnapshot()
  ]);

  // fallback results array
  const results = [];

  const usdAwesome = awesomeSnapshot?.USDPYG;
  const usdPygRate = usdAwesome ? (Number(usdAwesome.bid) + Number(usdAwesome.ask)) / 2 : 7400;

  for (const cfg of FX_CONFIG) {
    // 1. PYG is constant
    if (cfg.code === "PYG") {
      results.push(buildFallbackQuote(cfg));
      continue;
    }

    // 2. USD (Wholesale) preferred from DolarPy
    if (cfg.code === "USD") {
      const wholesale = buildDollarPyWholesaleQuote(cfg, dollarPySnapshot);
      if (wholesale) {
        results.push(wholesale);
        continue;
      }
      // awesome fallback
      const wholesaleAwesome = buildAwesomeFxQuote(cfg, usdAwesome);
      if (wholesaleAwesome) {
        results.push(wholesaleAwesome);
        continue;
      }
    }

    // 3. Direct AwesomeAPI pairs (BRL, EUR, ARS)
    const awesomeDef = AWESOME_PAIR_MAP[cfg.code];
    if (awesomeDef && !cfg.code.includes("CLP") && !cfg.code.includes("UYU")) {
      const q = buildAwesomeFxQuote(cfg, awesomeSnapshot?.[awesomeDef.key], { inverted: awesomeDef.inverted });
      if (q) {
        results.push(q);
        continue;
      }
    }

    // 4. Triangulated pairs (CLP, UYU)
    if (cfg.code === "CLP" || cfg.code === "UYU") {
      const triKey = cfg.code === "CLP" ? "USDCLP" : "USDUYU";
      const triData = awesomeSnapshot?.[triKey];
      if (triData && usdPygRate) {
        const usdToForeign = (Number(triData.bid) + Number(triData.ask)) / 2;
        const rate = (usdPygRate / usdToForeign); // Gs per 1 unit of foreign

        const midValue = rate * cfg.units;
        const spread = 0.02; // 2% spread for regional cash
        const buy = midValue * (1 - (spread / 2));
        const sell = midValue * (1 + (spread / 2));

        results.push({
          currency: cfg.currency,
          code: cfg.code,
          amount: cfg.amount,
          flagCode: cfg.flagCode,
          buy: formatGuarani(buy),
          sell: formatGuarani(sell),
          variation: triData.pctChange ? formatVariation(Number(triData.pctChange)) : "0,0%",
          reference: "AwesomeAPI (triangulado)",
          lastUpdate: formatTimestampLabel(triData.create_date) || "",
          midValue
        });
        continue;
      }
    }

    // Fallback if everything else fails
    results.push(buildFallbackQuote(cfg));
  }

  // Add Retail (Calculated or Average from DolarPy)
  const usdQuote = results.find(q => q.code === "USD");
  const retailQuote = buildDollarPyRetailQuote(dollarPySnapshot, FX_RETAIL_SPEC, usdQuote)
    || buildRetailQuoteFromUsd(results, FX_RETAIL_SPEC);
  if (retailQuote) results.unshift(retailQuote);

  return results;
}

function formatUpdateLabel(dateStr) {
  const now = new Date();
  const baseDate = dateStr ? new Date(`${dateStr}T12:00:00Z`) : now;
  const dateLabel = baseDate.toLocaleDateString("es-PY", { day: "2-digit", month: "short" });
  const timeLabel = now.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateLabel} · ${timeLabel}`;
}

function formatTimestampLabel(timestamp) {
  if (!timestamp) return "";
  const normalized = timestamp.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  const dateLabel = date.toLocaleDateString("es-PY", { day: "2-digit", month: "short" });
  const timeLabel = date.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateLabel} · ${timeLabel}`;
}

function formatGuaraniCompact(value) {
  const num = typeof value === "string" ? parseGuaraniValue(value) : value;
  if (!Number.isFinite(num)) return "—";

  if (num >= 1000000) {
    return (num / 1000000).toLocaleString("es-PY", { maximumFractionDigits: 1 }) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toLocaleString("es-PY", { maximumFractionDigits: 1 }) + "K";
  }
  return num.toLocaleString("es-PY");
}

function formatGuarani(value) {
  const num = typeof value === "string" ? parseGuaraniValue(value) : value;
  if (!Number.isFinite(num)) return "—";

  // Si es un valor entero grande (como Gs. 7.500)
  if (num >= 100 || num <= -100) {
    return "₲ " + Math.round(num).toLocaleString("es-PY");
  }

  // Si es un valor decimal (como una tasa o variación)
  return "₲ " + num.toLocaleString("es-PY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function parseGuaraniValue(value) {
  if (typeof value !== "string") return Number(value) || NaN;
  const normalized = value
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return Number(normalized);
}

function formatVariation(pct) {
  if (!Number.isFinite(pct)) return "0,0%";
  const sign = pct > 0 ? "+" : "";
  // Formato: +1,2% (estilo paraguayo con coma decimal)
  return `${sign}${pct.toLocaleString("es-PY", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function formatIndexTicker(val, decimals = 2) {
  const num = Number(val);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatUsdTicker(val, decimals = 2, suffix = "") {
  const num = Number(val);
  if (!Number.isFinite(num)) return "—";
  return "USD " + num.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
}

function computeFallbackMid(buy, sell) {
  const buyNum = parseGuaraniValue(buy);
  const sellNum = parseGuaraniValue(sell);
  if (Number.isFinite(buyNum) && Number.isFinite(sellNum)) {
    return (buyNum + sellNum) / 2;
  }
  if (Number.isFinite(buyNum)) return buyNum;
  if (Number.isFinite(sellNum)) return sellNum;
  return NaN;
}

function buildRetailQuoteFromUsd(quotes, spec) {
  if (!spec) return null;
  const usdQuote = quotes?.find(q => q.code === "USD");
  if (!usdQuote || !Number.isFinite(usdQuote.midValue)) {
    const fallbackMid = computeFallbackMid(spec.fallback?.buy, spec.fallback?.sell);
    return {
      currency: spec.currency,
      code: spec.code,
      amount: spec.amount,
      flagCode: spec.flagCode || "us",
      buy: spec.fallback?.buy || "—",
      sell: spec.fallback?.sell || "—",
      variation: spec.fallback?.variation || "0,0%",
      reference: spec.reference || FX_REFERENCE_FALLBACK,
      lastUpdate: spec.fallback?.lastUpdate || "",
      midValue: fallbackMid
    };
  }

  const margin = spec.margin ?? 0.018;
  const buyValue = usdQuote.midValue * (1 - margin);
  const sellValue = usdQuote.midValue * (1 + margin);

  return {
    currency: spec.currency,
    code: spec.code,
    amount: spec.amount,
    flagCode: spec.flagCode || usdQuote.flagCode || "us",
    buy: formatGuarani(buyValue),
    sell: formatGuarani(sellValue),
    variation: usdQuote.variation,
    reference: spec.reference || usdQuote.reference,
    lastUpdate: usdQuote.lastUpdate,
    midValue: usdQuote.midValue
  };
}

function buildRetailFallbackQuote(baseQuotes, spec) {
  if (!spec) return null;
  const usdFallback = baseQuotes?.find(q => q.code === "USD");
  const fallbackMid = computeFallbackMid(spec.fallback?.buy, spec.fallback?.sell);
  return {
    currency: spec.currency,
    code: spec.code,
    amount: spec.amount,
    flagCode: spec.flagCode || usdFallback?.flagCode || "us",
    buy: spec.fallback?.buy || usdFallback?.buy || "—",
    sell: spec.fallback?.sell || usdFallback?.sell || "—",
    variation: spec.fallback?.variation || usdFallback?.variation || "0,0%",
    reference: spec.reference || usdFallback?.reference || FX_REFERENCE_FALLBACK,
    lastUpdate: spec.fallback?.lastUpdate || usdFallback?.lastUpdate || "",
    midValue: Number.isFinite(fallbackMid) ? fallbackMid : usdFallback?.midValue
  };
}

function renderQuotes(quotes = FX_FALLBACK_QUOTES) {
  const container = document.getElementById("quotes-grid");
  if (!container) return;

  const source = Array.isArray(quotes) && quotes.length ? quotes : FX_FALLBACK_QUOTES;

  container.innerHTML = source.map(item => {
    const change = (item.variation || "").trim();
    const trend = change.startsWith("-") ? "down" : change.startsWith("+") ? "up" : "neutral";
    const flagSrc = flagIconUrl(item.flagCode);
    const referenceLabel = item.reference || FX_REFERENCE_FALLBACK;
    const updateLabel = item.lastUpdate ? ` · ${item.lastUpdate}` : "";

    return `
      <article class="quote-card">
        <div class="quote-flag-row">
          <img class="quote-flag" src="${flagSrc}" alt="Bandera ${item.currency}" loading="lazy" width="48" height="32">
          <div>
            <p class="quote-country">${item.currency}</p>
            <p class="quote-currency">${item.amount}</p>
          </div>
        </div>
        <div class="quote-book">
          <div class="quote-field">
            <p class="quote-label">Compra</p>
            <p class="quote-price">${item.buy}</p>
          </div>
          <div class="quote-field">
            <p class="quote-label">Venta</p>
            <p class="quote-price">${item.sell}</p>
          </div>
        </div>
        ${change ? `<p class="quote-variation">Tendencia <span class="quote-change ${trend}">${change}</span></p>` : ""}
        <p class="quote-meta">
          <span class="quote-code">${item.code}</span> · ${referenceLabel}${updateLabel}
        </p>
      </article>
    `;
  }).join("");
}

function renderMarketTicker(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;
  const source = marketTickerItems.length ? marketTickerItems : MARKET_QUOTES;
  if (!source.length) return;

  const itemsHtml = source.map(item => {
    const change = item.change || "";
    const trimmed = change.trim();
    const trend = trimmed.startsWith("-") ? "down" : trimmed.startsWith("+") ? "up" : "";

    return `
      <span class="ticker-item">
        <span class="ticker-label-mini">${item.label}</span>
        <span class="ticker-value">${item.value}</span>
        ${change ? `<span class="ticker-change ${trend}">${change}</span>` : ""}
      </span>
    `;
  }).join("");

  track.innerHTML = itemsHtml + itemsHtml;
}

// Utilidad de fecha
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  // Ajuste simple para zona horaria si la fecha viene en UTC y querés evitar desfase de día
  return date.toLocaleDateString("es-PY", {
    day: "2-digit", month: "short", year: "numeric"
  });
}
// function renderNoticia() es manejada por noticia-script.js (Module PRO)

// Ejecutar cuando el DOM esté listo
function initRouter() {
  console.log("✓ initRouter ejecutado");
  initHeaderDate();
  initWeatherWidget();
  initHeaderScrollState();
  initCategoryDrawer();
  initMegaMenuFeatured(); // Cargar mega menús en todas las páginas
  const isHome = document.getElementById("hero") !== null;
  const isNoticia = document.getElementById("contenido-noticia") !== null;

  if (isHome) initHome();
  // if (isNoticia) renderNoticia(); // Deshabilitado para evitar conflicto con noticia-script.js
}

// ========================================
// TAPA DIGITAL - SIDEBAR WIDGET (Horizontal)
// ========================================

// Datos de muestra para tapas digitales (NO artículos reales)
const DIGITAL_COVERS_SAMPLE = [
  {
    id: 'tapa-2026-01-27',
    date: '2026-01-27',
    title: 'Economía Verde en el Chaco',
    image: 'assets/tapa_perspectivas_01_1769691542717.png',
    edition: 'Lunes, 27 de Enero de 2026'
  },
  {
    id: 'tapa-2026-01-28',
    date: '2026-01-28',
    title: 'Estrategias de Ahorro',
    image: 'assets/tapa_perspectivas_02_1769691601592.png',
    edition: 'Martes, 28 de Enero de 2026'
  },
  {
    id: 'tapa-2026-01-29',
    date: '2026-01-29',
    title: 'Nueva Ley Bancaria',
    image: 'assets/tapa_perspectivas_03_1769691626948.png',
    edition: 'Miércoles, 29 de Enero de 2026'
  }
];

function buildDigitalCoverHorizontalCard(cover) {
  if (!cover) return '';

  const image = escapeHtml(cover.image || HERO_IMAGE_FALLBACK);
  const edition = escapeHtml(cover.edition || '');

  return `
    <article class="digital-cover-card-horizontal" data-cover-id="${cover.id}">
      <div class="digital-cover-image-wrapper">
        <img src="${image}" alt="Tapa ${edition}" class="digital-cover-image" loading="lazy" />
      </div>
      <div class="digital-cover-info">
        <time class="digital-cover-date">${edition}</time>
      </div>
    </article>
  `;
}

function renderDigitalCoversSidebar(cmsCovers = []) {
  const container = document.getElementById('digital-covers-horizontal');
  if (!container) return;

  // Priorizar CMS, fallback a sample si está vacío
  const activeCovers = (cmsCovers && cmsCovers.length > 0)
    ? cmsCovers.filter(c => c.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0))
    : DIGITAL_COVERS_SAMPLE;

  if (!activeCovers.length) {
    const parent = container.closest('.digital-covers-sidebar-widget');
    if (parent) parent.style.display = 'none';
    return;
  }

  container.innerHTML = activeCovers
    .map(buildDigitalCoverHorizontalCard)
    .join('');

  // Agregar event listeners para modal
  container.querySelectorAll('.digital-cover-card-horizontal').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const coverId = card.dataset.coverId;
      const cover = activeCovers.find(c => (c.slug || c.id) === coverId);
      if (cover) {
        openCoverModal(cover);
      }
    });
  });

  // Inicializar controles de navegación horizontal
  initDigitalCoversSidebarNavigation();
}

function initDigitalCoversSidebarNavigation() {
  const track = document.querySelector('.digital-covers-track');
  const prevBtn = document.querySelector('.digital-covers-nav .dc-prev');
  const nextBtn = document.querySelector('.digital-covers-nav .dc-next');
  const widget = document.querySelector('.digital-covers-sidebar-widget');

  if (!track || !prevBtn || !nextBtn || !widget) return;

  const cards = Array.from(track.querySelectorAll('.digital-cover-card-horizontal'));
  let currentIndex = 0;

  // Create pagination dots
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'digital-covers-pagination';

  cards.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'dc-pagination-dot';
    dot.setAttribute('aria-label', `Ver tapa ${index + 1}`);
    if (index === 0) dot.classList.add('active');

    dot.addEventListener('click', () => {
      currentIndex = index;
      scrollToIndex(currentIndex);
    });

    paginationContainer.appendChild(dot);
  });

  widget.appendChild(paginationContainer);

  function scrollToIndex(index) {
    const cardWidth = track.clientWidth;
    track.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
  }

  function updateActiveState() {
    const cardWidth = track.clientWidth;
    const scrollPosition = track.scrollLeft;
    currentIndex = Math.round(scrollPosition / cardWidth);

    // Update pagination dots
    const dots = paginationContainer.querySelectorAll('.dc-pagination-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });

    // Update navigation buttons
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= cards.length - 1;
  }

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      scrollToIndex(currentIndex);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < cards.length - 1) {
      currentIndex++;
      scrollToIndex(currentIndex);
    }
  });

  track.addEventListener('scroll', updateActiveState);
  updateActiveState();
}


function openCoverModal(cover) {
  const modal = document.createElement('div');
  modal.className = 'cover-modal';
  modal.innerHTML = `
    <div class="cover-modal-overlay"></div>
    <div class="cover-modal-content">
      <button class="cover-modal-close" aria-label="Cerrar">×</button>
      <img src="${escapeHtml(cover.image)}" alt="Tapa ${escapeHtml(cover.edition)}" loading="lazy" />
      <p class="cover-modal-caption">${escapeHtml(cover.edition)}</p>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.cover-modal-close');
  const overlay = modal.querySelector('.cover-modal-overlay');

  const closeModal = () => modal.remove();

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}


if (document.readyState === 'loading') {
  console.log("📋 readyState='loading', esperando DOMContentLoaded");
  document.addEventListener('DOMContentLoaded', initRouter);
} else {
  console.log("📋 readyState='" + document.readyState + "', ejecutando initRouter inmediatamente");
  initRouter();
}

