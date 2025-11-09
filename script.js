const FINNHUB_API_KEY="d47vpo1r01qk80bip1s0d47vpo1r01qk80bip1sg";
const MARKET_ITEMS=[
  {label:"USD/GS",symbol:"OANDA:USD_PYG"},
  {label:"EUR/GS",symbol:"OANDA:EUR_PYG"},
  {label:"EUR/USD",symbol:"OANDA:EUR_USD"},
  {label:"Petróleo",symbol:"OANDA:BCO_USD"},
  {label:"Soja",symbol:"CBOT:ZS1"},
  {label:"Bitcoin",symbol:"BINANCE:BTCUSDT"}
];
const REFRESH_MS=5*60*1000;
document.addEventListener("DOMContentLoaded",()=>{
  const btn=document.getElementById("themeToggle");
  const saved=localStorage.getItem("theme");
  if(saved==="dark") document.body.classList.add("dark");
  btn.addEventListener("click",()=>{
    document.body.classList.toggle("dark");
    localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light");
    updateThemeIcon();
  });
  function updateThemeIcon(){
    const icon=document.querySelector("#themeToggle .icon");
    if(icon) icon.textContent=document.body.classList.contains("dark")?"☀️":"🌙";
  }
  updateThemeIcon();
  loadTicker();
  setInterval(loadTicker,REFRESH_MS);
});
async function fetchQuote(s){const u=`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${FINNHUB_API_KEY}`;const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const d=await r.json();return{price:d.c??null,change:d.d??null,changePct:d.dp??null};}
function fmt(n){if(n===null||n===undefined)return"—";const v=Number(n);if(!isFinite(v))return"—";return(Math.abs(v)>=1000)?v.toLocaleString(undefined,{maximumFractionDigits:2}):v.toFixed(2);}
async function loadTicker(){const wrap=document.querySelector(".ticker");const meta=document.querySelector(".ticker-meta");if(!wrap)return;wrap.textContent="Cargando cotizaciones…";try{const rows=await Promise.all(MARKET_ITEMS.map(async item=>{try{const q=await fetchQuote(item.symbol);const dir=(q.change??0)>=0?"up":"down";const arrow=(q.change??0)>=0?"▲":"▼";return `<span class="item"><strong>${item.label}:</strong> ${fmt(q.price)} <span class="${dir}">${arrow} ${fmt(q.changePct)}%</span></span>`}catch(e){console.warn("Error item",item,e);return `<span class="item"><strong>${item.label}:</strong> —</span>`}}));wrap.innerHTML=rows.join('<span class="sep">•</span>');meta.textContent="Actualizado "+(new Date()).toLocaleTimeString();}catch(err){console.error(err);wrap.textContent="No se pudieron cargar cotizaciones.";}}
