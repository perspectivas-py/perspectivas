// script.v3.js — MOTOR PRO DEFINITIVO (Corregido)
console.log("🚀 Perspectivas PRO v3 cargado");

const CONTENT_URL = "content.json";

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
  { code: "USD", label: "USD / Gs", mode: "sell" },
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
  ARS: { key: "PYGARS", pair: "PYG-ARS", inverted: true }
};
const AWESOME_PAIRS = [...new Set(Object.values(AWESOME_PAIR_MAP).map(def => def.pair))];
const AWESOME_REFERENCE = "AwesomeAPI FX · Mercado regional";

const FX_CONFIG = [
  {
    currency: "Dólar estadounidense",
    code: "USD",
    amount: "1 USD",
    units: 1,
    flagCode: "us",
    reference: "Banco Central del Paraguay",
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
  { keys: ["macro", "economia"], primary: "#38bdf8", secondary: "#2563eb" },
  { keys: ["politica", "fiscal"], primary: "#f97316", secondary: "#c2410c" },
  { keys: ["negocios", "empresas"], primary: "#14b8a6", secondary: "#0f766e" },
  { keys: ["mercado", "mercados-inversion", "inversion"], primary: "#c084fc", secondary: "#7c3aed" },
  { keys: ["programa", "podcast"], primary: "#fbbf24", secondary: "#f59e0b" },
  { keys: ["finanzas-personales", "educacion-financiera"], primary: "#22d3ee", secondary: "#0ea5e9" }
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
  sun: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <circle cx="16" cy="16" r="6"></circle>
    <path d="M16 4v3M16 25v3M4 16h3M25 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1" stroke-linecap="round"></path>
  </svg>`,
  partly: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <circle cx="12" cy="12" r="5"></circle>
    <path d="M26 22a5 5 0 0 0-5-5 6 6 0 0 0-11.7 1.5A4 4 0 0 0 9 27h12a5 5 0 0 0 5-5z" fill="none"></path>
    <path d="M6 12h2M12 4v2M4 20h2" stroke-linecap="round"></path>
  </svg>`,
  cloud: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <path d="M8 24h14a5 5 0 0 0 0-10 7 7 0 0 0-13.5 1.8A4 4 0 0 0 8 24z"></path>
  </svg>`,
  drizzle: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <path d="M8 23h14a5 5 0 0 0 0-10 7 7 0 0 0-13.5 1.8A4 4 0 0 0 8 23z"></path>
    <path d="M12 26l-1 3M18 26l-1 3M24 26l-1 3" stroke-linecap="round"></path>
  </svg>`,
  rain: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <path d="M8 22h14a5 5 0 0 0 0-10 7 7 0 0 0-13.5 1.8A4 4 0 0 0 8 22z"></path>
    <path d="M12 24l-1.5 4M18 24l-1.5 4M24 24l-1.5 4" stroke-linecap="round"></path>
  </svg>`,
  showers: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <path d="M8 21h14a5 5 0 0 0 0-10 7 7 0 0 0-13.5 1.8A4 4 0 0 0 8 21z"></path>
    <path d="M11 23l-2 5M17 23l-2 5M23 23l-2 5" stroke-linecap="round"></path>
  </svg>`,
  storm: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <path d="M8 21h14a5 5 0 0 0 0-10 7 7 0 0 0-13.5 1.8A4 4 0 0 0 8 21z"></path>
    <path d="M15 22l-2 6 4-3-1 5 4-7" stroke-linecap="round" fill="none"></path>
  </svg>`,
  snow: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <path d="M8 22h14a5 5 0 0 0 0-10 7 7 0 0 0-13.5 1.8A4 4 0 0 0 8 22z"></path>
    <path d="M12 25.5l-1.5 1.5M12 27l-1.5-1.5M18 25.5l-1.5 1.5M18 27l-1.5-1.5M24 25.5l-1.5 1.5M24 27l-1.5-1.5" stroke-linecap="round"></path>
  </svg>`,
  fog: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <path d="M8 20h14a5 5 0 0 0 0-10 7 7 0 0 0-13.5 1.8A4 4 0 0 0 8 20z"></path>
    <path d="M6 24h20M8 27h16" stroke-linecap="round"></path>
  </svg>`,
  default: `<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
    <circle cx="16" cy="16" r="6"></circle>
    <path d="M16 4v3M16 25v3M4 16h3M25 16h3" stroke-linecap="round"></path>
  </svg>`
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

  const avgBuy = totals.buy / entries.length;
  const avgSell = totals.sell / entries.length;
  if (!Number.isFinite(avgBuy) || !Number.isFinite(avgSell)) return null;

  const midValue = (avgBuy + avgSell) / 2;

  return {
    currency: spec.currency,
    code: spec.code,
    amount: spec.amount,
    flagCode: spec.flagCode || "us",
    buy: formatGuarani(avgBuy),
    sell: formatGuarani(avgSell),
    variation: usdQuote?.variation || formatVariation(0),
    reference: spec.reference || usdQuote?.reference || FX_REFERENCE_FALLBACK,
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

async function fetchGenericFxQuote(cfg, previousDate) {
  if (!cfg) return null;
  if (cfg.code === "PYG") return buildFallbackQuote(cfg);

  const units = cfg.units || 1;
  const latestUrl = `https://api.exchangerate.host/latest?base=${cfg.code}&symbols=PYG`;
  const prevUrl = `https://api.exchangerate.host/${previousDate}?base=${cfg.code}&symbols=PYG`;

  try {
    const [latestRes, prevRes] = await Promise.all([
      fetch(latestUrl),
      fetch(prevUrl)
    ]);

    if (!latestRes.ok) throw new Error(`HTTP ${latestRes.status}`);
    const latestData = await latestRes.json();
    const prevData = prevRes.ok ? await prevRes.json() : null;

    const latestRate = latestData?.rates?.PYG;
    if (!latestRate) throw new Error("Sin rate PYG");
    const prevRate = prevData?.rates?.PYG || null;

    const midValue = latestRate * units;
    const prevValue = prevRate ? prevRate * units : null;
    const spread = cfg.spread ?? FX_SPREAD;
    const halfSpread = spread / 2;
    const buyValue = midValue * (1 - halfSpread);
    const sellValue = midValue * (1 + halfSpread);
    const variationPct = prevValue ? ((midValue - prevValue) / prevValue) * 100 : 0;

    return {
      currency: cfg.currency,
      code: cfg.code,
      amount: cfg.amount,
      flagCode: cfg.flagCode,
      buy: formatGuarani(buyValue),
      sell: formatGuarani(sellValue),
      variation: formatVariation(variationPct),
      reference: cfg.reference || FX_REFERENCE_FALLBACK,
      lastUpdate: formatUpdateLabel(latestData?.date),
      midValue
    };
  } catch (error) {
    console.warn(`⚠️ Falló la cotización de ${cfg.code}`, error);
    return buildFallbackQuote(cfg);
  }
}

async function fetchCommoditySnapshot() {
  if (!MARKET_COMMODITY_SOURCES.length) return null;
  const symbolsParam = MARKET_COMMODITY_SOURCES.map(src => src.symbol).join("+");
  const url = `https://stooq.com/q/l/?s=${symbolsParam}&f=sd2t2ohlcv&h&e=json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const entries = Array.isArray(payload?.symbols) ? payload.symbols : [];
    return entries.reduce((acc, entry) => {
      const key = (entry?.symbol || "").toLowerCase();
      if (key) acc[key] = entry;
      return acc;
    }, {});
  } catch (error) {
    console.warn("⚠️ No pudimos consultar Stooq", error);
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

const analisisController = (() => {
  const state = { source: [], visible: 6 };
  let button = null;

  function render() {
    const featured = document.getElementById("analisis-featured");
    const grid = document.getElementById("analisis-grid");

    if (!featured || !grid) return;

    if (!state.source.length) {
      featured.innerHTML = "";
      grid.innerHTML = `<p class="empty-copy">No encontramos análisis disponibles.</p>`;
      if (button) button.hidden = true;
      return;
    }

    // Primera nota como miniportada
    const firstItem = state.source[0];
    featured.innerHTML = `
      <a href="/noticia.html?id=${encodeURIComponent(firstItem.slug || firstItem.id)}" class="featured-card">
        <div class="featured-card-img">
          <img src="${firstItem.thumbnail}" alt="${firstItem.title}"/>
        </div>
        <div class="featured-card-content">
          <h3>${firstItem.title}</h3>
          <small>${formatDate(firstItem.date)}</small>
        </div>
      </a>
    `;

    // Resto en grid (a partir del índice 1)
    const remaining = state.source.slice(1, state.visible);
    grid.innerHTML = remaining
      .map(item => `
        <a href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}" class="card">
          <img src="${item.thumbnail}" alt="${item.title}">
          <h3>${item.title}</h3>
          <div class="card-meta">${formatDate(item.date)}</div>
        </a>
      `)
      .join("");

    // Botón "Ver más" si hay más de lo visible
    if (button) {
      button.hidden = state.source.length <= state.visible;
    }
  }

  function setSource(items) {
    state.source = Array.isArray(items) ? items : [];
    state.visible = 6; // Mostrar la primera (featured) + 5 en grid = 6 total
    render();
  }

  function init() {
    button = document.getElementById("analisis-view-more");
    if (button && !button.dataset.bound) {
      button.addEventListener("click", () => {
        state.visible += 6;
        render();
      });
      button.dataset.bound = "true";
    }
  }

  return { init, setSource };
})();

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
         } catch(e) {}
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

const podcastController = createSectionController({
  gridId: "podcast-grid",
  buttonId: "podcast-view-more",
  renderItem: (item, idx, meta) => {
    const total = meta && typeof meta.total === "number" ? meta.total : 0;
    const episodeNumber = total ? String(total - idx).padStart(2, "0") : String(idx + 1).padStart(2, "0");
    const dateLabel = formatDate(item.date);
    return `
      <article class="podcast-card">
        <div class="podcast-cover">
          <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
          <span class="podcast-badge">EP ${episodeNumber}</span>
          <button class="podcast-play" type="button" aria-label="Reproducir episodio ${episodeNumber}">
            <span>▶</span>
          </button>
        </div>
        <div class="podcast-body">
          <p class="podcast-meta">${dateLabel || "Nuevo"}</p>
          <h3>${item.title}</h3>
          <p class="podcast-tagline">Serie Perspectivas Podcast</p>
          <div class="podcast-actions">
            <a class="podcast-listen" href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}">Escuchar ahora</a>
            <button class="podcast-share" type="button" aria-label="Compartir episodio ${episodeNumber}">
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
      </article>
    `;
  },
  emptyMessage: `<p class="empty-copy">No hay episodios del podcast para mostrar.</p>`
});

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

  const setStatus = (text, condition) => {
    const label = condition?.label || "Clima local";
    const symbol = condition?.symbol || "default";
    tempEl.textContent = text;
    if (symbolEl) {
      const svgMarkup = WEATHER_ICON_SVGS[symbol] || WEATHER_ICON_SVGS.default;
      symbolEl.innerHTML = svgMarkup;
      symbolEl.dataset.symbol = symbol;
    }
    widget.setAttribute("title", `Clima en Asunción: ${label}${text !== "--°C" ? ` · ${text}` : ""}`);
    widget.setAttribute("aria-label", `Clima en Asunción: ${label}${text !== "--°C" ? ` · ${text}` : ""}`);
  };

  const renderForecast = (daily) => {
    if (!panelContent) return;
    if (!daily?.time?.length) {
      panelContent.innerHTML = `<p class="weather-panel-empty">No hay pronóstico disponible.</p>`;
      return;
    }

    const cards = daily.time.slice(0, WEATHER_FORECAST_DAYS).map((dateStr, idx) => {
      const condition = resolveWeatherCondition(daily.weathercode?.[idx]);
      const max = daily.temperature_2m_max?.[idx];
      const min = daily.temperature_2m_min?.[idx];
      const maxLabel = typeof max === "number" ? `${Math.round(max)}°` : "--";
      const minLabel = typeof min === "number" ? `${Math.round(min)}°` : "--";
      return `
        <article class="weather-forecast-card">
          <strong>${formatForecastDay(dateStr)}</strong>
          <div class="weather-forecast-symbol" aria-hidden="true">${condition.icon}</div>
          <p class="weather-forecast-temps">${maxLabel} / ${minLabel}</p>
          <small>${condition.label}</small>
        </article>
      `;
    }).join("");

    panelContent.innerHTML = `<div class="weather-forecast-grid">${cards}</div>`;
    panelContent.dataset.hydrated = "true";
  };

  const fetchWeather = async () => {
    const params = new URLSearchParams({
      latitude: WEATHER_COORDS.latitude,
      longitude: WEATHER_COORDS.longitude,
      current_weather: "true",
      daily: "weathercode,temperature_2m_max,temperature_2m_min",
      timezone: "auto"
    });
    const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const current = payload?.current_weather;
    if (!current) throw new Error("Sin datos de current_weather");
    return {
      temperature: typeof current.temperature === "number" ? Math.round(current.temperature) : null,
      code: typeof current.weathercode === "number" ? current.weathercode : null,
      daily: payload?.daily || null
    };
  };

  const updateWeather = async () => {
    try {
      const data = await fetchWeather();
      const condition = resolveWeatherCondition(data.code);
      const tempLabel = typeof data.temperature === "number" ? `${data.temperature}°C` : "--°C";
      setStatus(tempLabel, condition);
      if (data.daily) {
        lastForecast = data.daily;
        renderForecast(lastForecast);
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
function initSearchToggle() {
  const searchToggleHeader = document.getElementById("search-toggle-header");
  const searchToggleDrawer = document.getElementById("search-toggle");
  const searchInput = document.getElementById("search-input");
  const drawer = document.getElementById("category-drawer");

  if (!searchInput) return;

  // Click en el icono de búsqueda del header
  if (searchToggleHeader && searchToggleHeader.dataset.bound !== "true") {
    searchToggleHeader.dataset.bound = "true";
    searchToggleHeader.addEventListener("click", (e) => {
      e.preventDefault();
      // Abrir drawer si está cerrado
      if (!drawer.classList.contains("open")) {
        drawer.classList.add("open");
        document.getElementById("category-drawer-toggle").setAttribute("aria-expanded", "true");
        drawer.setAttribute("aria-hidden", "false");
      }
      // Mostrar campo de búsqueda
      searchInput.classList.remove("hidden");
      setTimeout(() => searchInput.focus(), 100);
    });
  }

  // Click en el icono de búsqueda dentro del drawer
  if (searchToggleDrawer && searchToggleDrawer.dataset.bound !== "true") {
    searchToggleDrawer.dataset.bound = "true";
    searchToggleDrawer.addEventListener("click", (e) => {
      e.preventDefault();
      searchInput.classList.toggle("hidden");
      if (!searchInput.classList.contains("hidden")) {
        searchInput.focus();
      }
    });
  }

  // Filtrar noticias mientras se escribe
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterNewsBySearch(query);
  });

  // Cerrar buscador al presionar Escape
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.classList.add("hidden");
      searchInput.value = "";
      filterNewsBySearch("");
    }
  });
}

function filterNewsBySearch(query) {
  // Aquí puedes implementar la lógica de filtrado de noticias
  // Por ahora solo limpiamos o aplicamos el filtro
  console.log("Buscando:", query);
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
  console.log("🔧 initHeaderScrollState iniciado");
  const header = document.querySelector(".site-header");
  if (!header) {
    console.log("❌ Header no encontrado");
    return;
  }
  console.log("✓ Header encontrado:", header);
  
  if (header.dataset.scrollBound === "true") {
    console.log("⚠️ Scroll listener ya está bound");
    return;
  }
  header.dataset.scrollBound = "true";
  console.log("📌 Scroll listener marcado como bound");

  // Detectar la sección de Noticias Locales (solo existe en home)
  const noticiasSection = document.getElementById("noticias");
  let noticiasTop = noticiasSection ? noticiasSection.offsetTop : null;
  const SCROLL_THRESHOLD = 50;
  
  let lastScrollState = null;
  let scrollThrottleId = null;

  const handleScroll = () => {
    if (scrollThrottleId) return;
    
    scrollThrottleId = requestAnimationFrame(() => {
      const currentScroll = window.scrollY;
      let isScrolled;
      if (noticiasTop !== null) {
        // Home: activar scroll comprimido cuando llegamos a Noticias Locales
        isScrolled = currentScroll >= (noticiasTop - 50);
      } else {
        // Otras páginas: usar umbral genérico
        isScrolled = currentScroll > SCROLL_THRESHOLD;
      }
      
      // Solo actualizar si el estado cambió
      if (lastScrollState !== isScrolled) {
        lastScrollState = isScrolled;
        console.log("🔄 Scroll state cambió:", isScrolled ? "scrolled" : "top", "scrollY:", currentScroll, "noticiasTop:", noticiasTop);
        header.classList.toggle("scrolled", isScrolled);
        
        // Controlar el market-ticker top
        const topTicker = document.querySelector('.market-ticker[data-variant="top"]');
        if (topTicker) {
          topTicker.classList.toggle("hidden", isScrolled);
        }
      }
      
      scrollThrottleId = null;
    });
  };

  // Agregar el listener de scroll
  console.log("🎧 Agregando listener de scroll");
  window.addEventListener("scroll", handleScroll, { passive: true });
  console.log("✓ Listener de scroll agregado");

  let resizeRaf = null;
  window.addEventListener("resize", () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(() => {
      if (noticiasSection) {
        noticiasTop = noticiasSection.offsetTop;
      }
    });
  });
}

async function initHome() {
  console.log("🔄 Iniciando carga de datos...");

  renderMarketTicker("ticker-track-top");
  renderMarketTicker("ticker-track-bottom");
  initSearchToggle();
  initMenuToggle();
  await loadFxQuotes();
  await loadMarketQuotes();
  if (!marketTickerRefreshHandle && MARKET_TICKER_REFRESH_INTERVAL > 0) {
    marketTickerRefreshHandle = setInterval(() => {
      loadMarketQuotes();
    }, MARKET_TICKER_REFRESH_INTERVAL);
  }

  try {
    // 1. CACHE BUSTING: Agregamos timestamp para obligar a Vercel/Navegador a bajar la versión nueva
    const uniqueUrl = `${CONTENT_URL}?t=${new Date().getTime()}`;

    const res = await fetch(uniqueUrl);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log("📦 Datos frescos recibidos:", data); // Mirá la consola para confirmar fecha

    // 2. RENDERIZADO MODULAR
    const heroArticle = renderHero(data.noticias);

    // Filtrar la noticia que se usó como Hero para que no se repita en el resto de la página
    const remainingNoticias = data.noticias.filter(n => (n.slug || n.id) !== (heroArticle.slug || heroArticle.id));

    renderSecondary(remainingNoticias);
    initNoticiasLocales(remainingNoticias);
    renderCategoryFilters(remainingNoticias);
    renderTopReads(remainingNoticias);
    initAnalisisSection(data.analisis);
    initProgramaSection(data.programa);
    initPodcastSection(data.podcast);
    renderSponsors(data.sponsors);

  } catch (e) {
    console.error("❌ Error crítico cargando contenido:", e);
    const hero = document.getElementById("hero");
    if (hero) hero.innerHTML = `<p style="text-align:center; padding: 2rem; color: red;">Hubo un error cargando las noticias. Por favor recarga la página.</p>`;
  }
}
// --- GENERADOR UNIVERSAL DE TARJETAS ---
// Esta función se usa cuando se renderizan listas dinámicas
function cardHTML(item) {
  return `
    <div class="card">
      <div class="card-img-container">
        <img src="${item.thumbnail}" alt="${item.title}">
      </div>
      <h3>${item.title}</h3>
      <div class="card-meta">${formatDate(item.date)}</div>
    </div>
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
  if (!container || !n?.length) return null;

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
  if (!container || !n?.length) return;

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
  const heroSecondary = document.getElementById("nlv2-hero-secondary");
  const gridContainer = document.getElementById("news-grid");
  const contextFeed = document.getElementById("nlv2-context-feed");

  if (!gridContainer) return;

  const source = noticiasLocalesState.source || [];
  if (!source.length) {
    if (heroMain) heroMain.innerHTML = `<p class="nlv2-placeholder">Aún no hay notas destacadas para esta sección.</p>`;
    if (heroSecondary) heroSecondary.innerHTML = `<article class="nlv2-secondary-card"><p class="nlv2-placeholder">Agregá más publicaciones para ver recomendaciones.</p></article>`;
    gridContainer.innerHTML = `<p class="empty-copy">No encontramos noticias en esta categoría.</p>`;
    if (contextFeed) contextFeed.innerHTML = `<p class="nlv2-placeholder">Sin historias relacionadas por ahora.</p>`;
    updateNoticiasViewMore();
    return;
  }

  const { main, secondary, remainder } = selectSectionHeroArticles(source);

  if (heroMain && main) {
    const kickerLabel = (main.kicker || main.category || "Actualidad").toUpperCase();
    const summary = truncateCopy(main.summary_short || main.summary || main.description || "", 220);
    heroMain.style.backgroundImage = `url(${main.thumbnail || HERO_IMAGE_FALLBACK})`;
    heroMain.innerHTML = `
      <div class="nlv2-hero-kicker">${escapeHtml(kickerLabel)}</div>
      <h3>${escapeHtml(main.title || "Noticia principal")}</h3>
      ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
      <div class="nlv2-meta-row">
        <span>${escapeHtml(formatDate(main.date))}</span>
        <a class="btn-link" href="/noticia.html?id=${encodeURIComponent(main.slug || main.id)}">Leer informe →</a>
      </div>`;
  } else if (heroMain) {
    heroMain.innerHTML = `<p class="nlv2-placeholder">Seleccionaremos automáticamente la nota destacada de la sección.</p>`;
  }

  if (heroSecondary) {
    if (secondary.length) {
      heroSecondary.innerHTML = secondary.map(article => {
        const kickerLabel = (article.kicker || article.category || "Noticias").toUpperCase();
        const summary = truncateCopy(article.summary_short || article.summary || article.description || "", 160);
        return `
          <article class="nlv2-secondary-card">
            <div class="nlv2-meta-row">
              <span>${escapeHtml(kickerLabel)}</span>
              <span>·</span>
              <span>${escapeHtml(formatDate(article.date))}</span>
            </div>
            <h4>${escapeHtml(article.title || "")}</h4>
            ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
            <a class="btn-link" href="/noticia.html?id=${encodeURIComponent(article.slug || article.id)}">Ver nota</a>
          </article>`;
      }).join("");
    } else {
      heroSecondary.innerHTML = `<article class="nlv2-secondary-card"><p class="nlv2-placeholder">Espacio para notas kicker.</p></article>`;
    }
  }

  const gridLimit = Math.min(noticiasLocalesState.visible, remainder.length);
  const gridItems = remainder.slice(0, gridLimit);

  if (gridItems.length) {
    gridContainer.innerHTML = gridItems.map(item => `
      <a href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}" class="card">
        <div class="card-img-container">
          <img src="${item.thumbnail || HERO_IMAGE_FALLBACK}" alt="${escapeHtml(item.title || "Noticia")}" loading="lazy">
        </div>
        <h3>${escapeHtml(item.title || "Noticia")}</h3>
        <div class="card-meta">${escapeHtml(formatDate(item.date))}</div>
      </a>
    `).join("");
  } else {
    gridContainer.innerHTML = `<p class="empty-copy">No hay más noticias en la categoría seleccionada.</p>`;
  }

  if (contextFeed) {
    const contextItems = remainder.slice(0, 4);
    contextFeed.innerHTML = contextItems.length
      ? contextItems.map(item => `
          <div class="nlv2-context-item">
            <h4>${escapeHtml(item.title || "Noticia")}</h4>
            <p>${escapeHtml(truncateCopy(item.summary_short || item.summary || item.description || "", 150))}</p>
            <a class="btn-link" href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}">Seguir historia</a>
          </div>
        `).join("")
      : `<p class="nlv2-placeholder">Agregá más historias para ver notas en seguimiento.</p>`;
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
            <img src="${s.logo}" alt="Sponsor">
        </a>
      </div>
    `).join("");
}

// Renderizar filtros de categorías
function renderCategoryFilters(noticias) {
  noticiasFilterSource = Array.isArray(noticias) ? noticias : [];
  const containers = [
    document.getElementById("category-filters"),
    document.getElementById("category-drawer-filters")
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
  const toggle = document.getElementById("category-drawer-toggle");
  const drawer = document.getElementById("category-drawer");
  const closeBtn = document.getElementById("category-drawer-close");
  if (!toggle || !drawer) return;
  if (toggle.dataset.bound === "true") return;
  toggle.dataset.bound = "true";

  toggle.addEventListener("click", () => {
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
    const merged = [...fxItems, ...commodityItems].filter(Boolean);
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
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const previousDate = yesterday.toISOString().split("T")[0];

  const requests = FX_CONFIG.map(async (cfg) => {
    if (cfg.code === "PYG") {
      return buildFallbackQuote(cfg);
    }

    if (cfg.code === "USD") {
      const wholesale = buildDollarPyWholesaleQuote(cfg, dollarPySnapshot);
      if (wholesale) return wholesale;
    }

    const awesomeDef = AWESOME_PAIR_MAP[cfg.code];
    if (awesomeDef) {
      const awesomeQuote = buildAwesomeFxQuote(cfg, awesomeSnapshot?.[awesomeDef.key], { inverted: awesomeDef.inverted });
      if (awesomeQuote) return awesomeQuote;
    }

    return fetchGenericFxQuote(cfg, previousDate);
  });

  const quotes = await Promise.all(requests);
  const usdQuote = quotes.find(q => q?.code === "USD");
  const retailQuote = buildDollarPyRetailQuote(dollarPySnapshot, FX_RETAIL_SPEC, usdQuote)
    || buildRetailQuoteFromUsd(quotes, FX_RETAIL_SPEC);
  if (retailQuote) quotes.push(retailQuote);
  return quotes;
}

function formatGuarani(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0
  }).format(value);
}

function formatGuaraniCompact(value, decimals = 0) {
  if (!Number.isFinite(value)) return "Gs. —";
  const formatted = value.toLocaleString("es-PY", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `Gs. ${formatted}`;
}

function formatUsdTicker(value, decimals = 2, suffix = "") {
  if (!Number.isFinite(value)) return "USD —";
  const formatted = value.toLocaleString("es-PY", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `USD ${formatted}${suffix}`;
}

function formatVariation(value) {
  if (!Number.isFinite(value)) return "0,0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2).replace(".", ",")}%`;
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

function parseGuaraniValue(value) {
  if (typeof value !== "string") return Number(value) || NaN;
  const normalized = value
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return Number(normalized);
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
// --- RENDER DE NOTICIA INDIVIDUAL ---
async function renderNoticia() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return; // no estamos en página de noticia

  const container = document.getElementById("contenido-noticia");
  if (!container) return;

  try {
    const res = await fetch(`${CONTENT_URL}?t=${new Date().getTime()}`);
    const data = await res.json();
    const item = data.noticias.find(n => n.slug === id || n.id === id);

    if (!item) {
      container.innerHTML = `<p style="padding:40px;text-align:center;color:red;">
        ❌ Noticia no encontrada
      </p>`;
      return;
    }

    container.innerHTML = `
      <h1 class="article-title">${item.title}</h1>
      <div class="article-meta">
        <span>${item.category || ""}</span> — 
        <span>${formatDate(item.date)}</span>
      </div>

      <img class="article-img" src="${item.thumbnail}" alt="${item.title}"/>

      <div class="article-body">
        ${marked.parse(item.body || "")}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<p style="padding:40px;text-align:center;color:red;">
      ⚠️ Error cargando la noticia. Intentá más tarde.
    </p>`;
    console.error("Error renderNoticia()", e);
  }
}

// Ejecutar cuando el DOM esté listo
function initRouter() {
  console.log("✓ initRouter ejecutado");
  initWeatherWidget();
  initHeaderScrollState();
  console.log("✓ initHeaderScrollState ejecutado");
  initCategoryDrawer();
  const isHome = document.getElementById("hero") !== null;
  const isNoticia = document.getElementById("contenido-noticia") !== null;

  if (isHome) initHome();
  // if (isNoticia) renderNoticia(); // Deshabilitado para evitar conflicto con noticia-script.js
}

if (document.readyState === 'loading') {
  console.log("📋 readyState='loading', esperando DOMContentLoaded");
  document.addEventListener('DOMContentLoaded', initRouter);
} else {
  console.log("📋 readyState='" + document.readyState + "', ejecutando initRouter inmediatamente");
  initRouter();
}

