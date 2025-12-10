// script.js — PUENTE LEGACY HACIA script.v3.js
// Objetivo: si alguna página vieja todavía carga /script.js,
// redirigimos toda la lógica a script.v3.js y evitamos errores tipo "cardHTML is not defined".

console.log("⚠️ script.js (legacy) cargado — redirigiendo a script.v3.js");

(function () {
  if (window.__PERSPECTIVAS_V3_LOADING__ || window.__PERSPECTIVAS_V3_LOADED__) {
    console.log("ℹ️ script.v3.js ya está cargado o en proceso de carga. No se vuelve a inyectar.");
    return;
  }

  window.__PERSPECTIVAS_V3_LOADING__ = true;

  const s = document.createElement("script");
  // Versión larga para obligar al navegador a bajar la versión nueva
  s.src = "script.v3.js?v=20251209_legacy_redirect";
  s.async = false;

  s.onload = () => {
    window.__PERSPECTIVAS_V3_LOADED__ = true;
    console.log("✅ script.v3.js cargado correctamente desde script.js (legacy).");
  };

  s.onerror = (err) => {
    console.error("❌ Error cargando script.v3.js desde script.js (legacy):", err);
  };

  document.head.appendChild(s);
})();
