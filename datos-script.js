// datos-script.js - Dashboard Económico Interactivo
console.log("📊 Dashboard Económico Iniciado");

document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
});

async function initDashboard() {
    // 1. Cargar cotizaciones actuales (reutilizando lógica de script.v3.js)
    // Nota: script.v3.js ya está cargado, así que podemos usar sus variables globales si se cargan después

    // Si loadFxQuotes no ha terminado, esperamos un poco o la llamamos aquí
    if (typeof loadFxQuotes === 'function') {
        await loadFxQuotes();
        updateDashboardNumbers();
    }

    // 2. Inicializar Gráfico Principal
    initMainChart();

    // 3. Inicializar Sparklines (Pequeños gráficos laterales)
    initSparklines();

    // 4. Renderizar Índices Bursátiles Globales
    renderStockIndices();
}

function updateDashboardNumbers() {
    // Intentar sincronizar con latestFxQuotes definido en script.v3.js
    // Intentar sincronizar con latestFxQuotes definido en script.v3.js
    if (typeof latestFxQuotes !== 'undefined') {
        const usd = latestFxQuotes.find(q => q.code === "USD");
        const retail = latestFxQuotes.find(q => q.code === "USD MIN");

        const usdDisplay = document.getElementById("usd-price-now");
        if (usdDisplay && retail) {
            usdDisplay.textContent = retail.sell.replace("₲ ", "");
        }

        // --- LÓGICA SALARIO MÍNIMO ---
        const minimumWagePYG = 2899048;
        const minWageUsdDisplay = document.getElementById("minimum-wage-usd");

        // Usamos la cotización de venta minorista o la genérica como fallback
        // Prioridad: Retail Sell -> USD Sell -> Fallback
        let rateToUse = 7300;
        let rateSource = "Estimado";

        if (retail) {
            rateToUse = parseFloat(retail.sell.replace(/\./g, '').replace(',', '.').replace("₲ ", ""));
            rateSource = "Dólar Cambio";
        } else if (usd) {
            rateToUse = parseFloat(usd.sell.replace(/\./g, '').replace(',', '.').replace("₲ ", ""));
            rateSource = "Dólar Interbancario";
        }

        if (minWageUsdDisplay && rateToUse) {
            const usdValue = (minimumWagePYG / rateToUse).toFixed(2);
            // Formatear display: "USD 395.23 (Cambio: 7.350)"
            minWageUsdDisplay.innerHTML = `USD ${usdValue} <span style="font-size:0.85em; opacity:0.8; display:block; font-weight:400;">(Tipo de cambio: Gs. ${rateToUse.toLocaleString('es-PY')})</span>`;
        }
    }
}

function initMainChart() {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    // Generar datos ficticios realistas para el histórico (últimos 30 días)
    const labels = [];
    const dataValues = [];
    let currentVal = 7280;

    const now = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString("es-PY", { day: 'numeric', month: 'short' }));

        // Variación aleatoria controlada
        currentVal += (Math.random() - 0.45) * 15;
        dataValues.push(currentVal.toFixed(0));
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'USD / PYG',
                data: dataValues,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1e293b',
                    titleColor: '#94a3b8',
                    bodyColor: '#f8fafc',
                    borderColor: '#334155',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => `Gs. ${context.parsed.y}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    position: 'right'
                }
            }
        }
    });

    // Event Listeners para botones de rango (solo visual por ahora)
    document.querySelectorAll('.btn-time').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-time').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Aquí iría la lógica para pedir datos históricos reales
        });
    });
}

function initSparklines() {
    const sparkConfigs = [
        { id: 'spark-inflation', color: '#ef4444', data: [3.2, 3.4, 3.5, 3.6, 3.8, 3.7, 3.8] },
        { id: 'spark-pib', color: '#10b981', data: [3.5, 3.8, 4.0, 4.2, 4.1, 4.2, 4.3] }
    ];

    sparkConfigs.forEach(config => {
        const canvas = document.getElementById(config.id);
        if (!canvas) return;

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: config.data.map((_, i) => i),
                datasets: [{
                    data: config.data,
                    borderColor: config.color,
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                events: [], // Deshabilitar interacciones
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    });
}

function renderStockIndices() {
    const container = document.getElementById("stocks-indices-grid");
    if (!container) return;

    if (typeof marketTickerItems === 'undefined' || !marketTickerItems.length) {
        setTimeout(renderStockIndices, 1000);
        return;
    }

    const indicesLabels = ["S&P 500", "Dow Jones", "Nasdaq", "Ibovespa", "Merval"];
    const indicesData = marketTickerItems.filter(item => indicesLabels.includes(item.label));

    if (!indicesData.length) {
        container.innerHTML = `<p class="muted">Datos bursátiles no disponibles.</p>`;
        return;
    }

    container.innerHTML = indicesData.map(item => {
        const change = item.change || "";
        const trend = change.includes("-") ? "negative" : "positive";

        return `
            <div class="stock-item">
                <div class="stock-info">
                    <span class="stock-label">${item.label}</span>
                    <span class="stock-value">${item.value}</span>
                </div>
                <div class="stock-trend ${trend}">${change}</div>
            </div>
        `;
    }).join("");
}
