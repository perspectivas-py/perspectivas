/* script.js - Final para HTML actual */

const CONFIG = {
  username: 'perspectivas-py',
  repo: 'perspectivas',
  limitNews: 10,
};

// TUS RUTAS REALES
const PATHS = {
  noticias: 'content/noticias/posts',
  programa: 'content/programa/posts', 
  analisis: 'content/analisis/_posts'  
};

const BASE_API = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/contents`;
const getCacheBust = () => `?t=${Date.now()}`;

// --- Helpers ---
const formatDate = (str) => {
  if(!str) return "";
  try { return new Date(str).toLocaleDateString("es-ES", {day:"numeric", month:"short", year:"numeric"}); } 
  catch(e){ return str; }
};

const getYoutubeId = (url) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

const parseMarkdown = (text) => {
  const match = text.match(/^---([\s\S]*?)---/);
  if (!match) return { attributes: {}, body: text };
  const attributes = {};
  match[1].split('\n').forEach(line => {
    const [key, ...val] = line.split(':');
    if (key && val) attributes[key.trim()] = val.join(':').trim().replace(/^['"]|['"]$/g, '');
  });
  return { attributes, body: text.replace(match[0], '').trim() };
};

// --- Fetching ---
async function fetchCollection(path, type) {
  try {
    const res = await fetch(`${BASE_API}/${path}${getCacheBust()}`);
    if(!res.ok) return [];
    const files = await res.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    
    const items = await Promise.all(mdFiles.map(async f => {
      const r = await fetch(f.download_url);
      const t = await r.text();
      const { attributes, body } = parseMarkdown(t);
      return { ...attributes, body, slug: f.name.replace('.md',''), folder: path, category: attributes.category || 'General' };
    }));
    return items.sort((a,b) => new Date(b.date) - new Date(a.date));
  } catch(e) { console.error(e); return []; }
}

async function fetchSinglePost(folder, slug) {
  try {
    const res = await fetch(`${BASE_API}/${folder}/${slug}.md${getCacheBust()}`);
    if(!res.ok) throw new Error("Not found");
    const meta = await res.json();
    const contentRes = await fetch(meta.download_url);
    return parseMarkdown(await contentRes.text());
  } catch(e) { return null; }
}

// --- Rendering ---
const createCardHTML = (item, showVideo) => {
  const link = `post.html?id=${item.slug}&folder=${item.folder}`;
  let media = '';
  
  if (showVideo && item.embed_url && getYoutubeId(item.embed_url)) {
    media = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${getYoutubeId(item.embed_url)}" frameborder="0" allowfullscreen></iframe></div>`;
  } else {
    media = `<div class="card-img-container"><a href="${link}"><img src="${item.thumbnail || 'https://via.placeholder.com/600x400'}" loading="lazy"></a></div>`;
  }
  
  return `
    <article class="card">
      ${media}
      <div class="card-content">
        <small class="card-meta">${formatDate(item.date)} | ${item.category}</small>
        <h3><a href="${link}">${item.title}</a></h3>
      </div>
    </article>`;
};

const setupFilters = (items, gridId) => {
  const container = document.getElementById('category-filters');
  if (!container) return;
  const cats = ['Todas', ...new Set(items.map(i => i.category))];
  container.innerHTML = cats.map(c => `<button class="filter-btn ${c==='Todas'?'active':''}" data-cat="${c}">${c}</button>`).join('');
  
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      const filtered = cat === 'Todas' ? items.slice(0, CONFIG.limitNews) : items.filter(i => i.category === cat);
      document.getElementById(gridId).innerHTML = filtered.map(i => createCardHTML(i)).join('');
    });
  });
};

// --- Main Init ---
async function initHome() {
  const news = await fetchCollection(PATHS.noticias, 'noticias');
  const prog = await fetchCollection(PATHS.programa, 'programa');
  const analysis = await fetchCollection(PATHS.analisis, 'analisis');

  // 1. Hero (BBC)
  if(news.length > 0) {
    const hero = news[0];
    const heroEl = document.querySelector('.featured-card-bbc');
    if(heroEl) {
      heroEl.innerHTML = `
        <a href="post.html?id=${hero.slug}&folder=${hero.folder}">
          <img src="${hero.thumbnail || ''}">
          <h2>${hero.title}</h2>
          <p>${hero.description || ''}</p>
        </a>`;
    }
    // Sidebar
    const sideEl = document.getElementById('top-list-bbc');
    if(sideEl) {
      sideEl.innerHTML = news.slice(1,4).map(n => `
        <li><a href="post.html?id=${n.slug}&folder=${n.folder}">
          <h4>${n.title}</h4><small>${formatDate(n.date)}</small>
        </a></li>`).join('');
    }
    // Grid Noticias
    const newsGrid = document.getElementById('news-grid');
    if(newsGrid) {
      newsGrid.innerHTML = news.slice(4, 4 + CONFIG.limitNews).map(n => createCardHTML(n)).join('');
      setupFilters(news.slice(4), 'news-grid');
    }
  }

  // 2. Programa (Video)
  const progGrid = document.getElementById('program-grid');
  if(progGrid) progGrid.innerHTML = prog.slice(0,6).map(p => createCardHTML(p, true)).join('');

  // 3. Analisis
  const anaGrid = document.getElementById('analisis-grid');
  if(anaGrid) anaGrid.innerHTML = analysis.slice(0,4).map(a => createCardHTML(a)).join('');

  // Buscador
  document.getElementById('search-input')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    const grid = document.getElementById('news-grid');
    if(term.length < 2) {
       grid.innerHTML = news.slice(4, 4 + CONFIG.limitNews).map(n => createCardHTML(n)).join('');
    } else {
       grid.innerHTML = news.filter(n => n.title.toLowerCase().includes(term)).map(n => createCardHTML(n)).join('');
    }
  });
}

async function initPost() {
  const p = new URLSearchParams(window.location.search);
  const slug = p.get('id');
  const folder = p.get('folder') || PATHS.noticias;
  const el = document.getElementById('article-detail');
  if(!slug || !el) return;

  const data = await fetchSinglePost(folder, slug);
  if(!data) { el.innerHTML = "<p>Error cargando noticia</p>"; return; }
  
  document.title = data.attributes.title;
  if(typeof marked === 'undefined') await import('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
  
  let video = '';
  if(data.attributes.embed_url) {
    const vid = getYoutubeId(data.attributes.embed_url);
    if(vid) video = `<div class="video-wrapper" style="margin:2rem 0"><iframe src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen></iframe></div>`;
  }

  el.innerHTML = `
    <header class="article-header">
       <span class="article-category">${data.attributes.category || 'Noticia'}</span>
       <h1 class="article-title">${data.attributes.title}</h1>
       <time class="article-meta">${formatDate(data.attributes.date)}</time>
    </header>
    ${video}
    ${!video && data.attributes.thumbnail ? `<img src="${data.attributes.thumbnail}">` : ''}
    <div class="article-content">${marked.parse(data.body)}</div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  if(window.location.pathname.includes('post.html')) initPost();
  else initHome();
  
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-list').classList.toggle('active');
  });
});
