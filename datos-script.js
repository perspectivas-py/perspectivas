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
}

function updateDashboardNumbers() {
    // Intentar sincronizar con latestFxQuotes definido en script.v3.js
    if (typeof latestFxQuotes !== 'undefined') {
        const usd = latestFxQuotes.find(q => q.code === "USD");
        const retail = latestFxQuotes.find(q => q.code === "USD MIN");

        const usdDisplay = document.getElementById("usd-price-now");
        if (usdDisplay && retail) {
            usdDisplay.textContent = retail.sell.replace("₲ ", "");
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
