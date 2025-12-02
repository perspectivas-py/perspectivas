// === PERSPECTIVAS - script.js PRO ===
// Versión 2025 - Sistema dinámico de contenidos desde content.json

const CONTENT_URL = "/content.json";

document.addEventListener("DOMContentLoaded", initSite);

async function initSite() {
  showLoading();
  try {
    const data = await fetchContent();
    hideLoading();
    renderHome(data);
  } catch (err) {
    showError(err);
  }
}

// Fetch del JSON
async function fetchContent() {
  const res = await fetch(CONTENT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar content.json");
  return res.json();
}

// Renderizado portada
function renderHome(data) {
  if (!data?.noticias?.length) {
    return renderEmpty("#home-news", "No hay noticias cargadas");
  }

  const container = document.querySelector("#home-news");
  const latest = data.noticias.slice(0, 5); // primeras 5 noticias

  container.innerHTML = latest
    .map(
      item => `
      <article class="news-card">
        <img src="${item.thumbnail}" alt="${item.title}" class="news-thumb"/>
        <div class="news-body">
          <h2 class="news-title">${item.title}</h2>
          <p class="news-meta">${formatDate(item.date)} | ${item.category}</p>
          <p class="news-desc">${item.description ?? ""}</p>
        </div>
      </article>
    `
    )
    .join("");
}

// Mostrar mensaje si no hay nada
function renderEmpty(selector, text) {
  document.querySelector(selector).innerHTML =
    `<p class="empty">${text}</p>`;
}

// LOADING
function showLoading() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="loading">Cargando contenido...</div>`
  );
}

function hideLoading() {
  document.querySelector("#loading")?.remove();
}

// Error
function showError(err) {
  console.error("❌ ERROR CARGANDO CONTENIDO:", err);
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="error-box">
       Error al cargar el contenido.
       <button onclick="location.reload()">Reintentar</button>
     </div>`
  );
}

// Formato fecha
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
