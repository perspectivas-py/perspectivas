// comments-script.js - Sistema de Comentarios con Firebase
// v1.0 - Integración no intrusiva

console.log("💬 Sistema de Comentarios Iniciando...");

// ==========================================
// CONFIGURACIÓN DE FIREBASE (PLACEHOLDERS)
// ==========================================
const firebaseConfig = {
    apiKey: "API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Variables de estado
let currentUser = null;
let comments = [];

// Elementos del DOM (se inicializan al cargar el DOM)
let commentsContainer, authSection, commentFormSection, commentsList;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initCommentsSystem();
});

function initCommentsSystem() {
    const section = document.getElementById("comments-section");
    if (!section) return; // Si no hay container, no hacemos nada

    // 1. Renderizar estructura básica
    renderCommentsStructure(section);

    // 2. Inicializar Referencias al DOM
    authSection = document.getElementById("auth-ui");
    commentFormSection = document.getElementById("comment-form-ui");
    commentsList = document.getElementById("comments-list");

    // 3. Simular estado de Auth (Para demo visual si no hay keys reales)
    // En producción, aquí iría `onAuthStateChanged` de Firebase
    checkAuthState();

    // 4. Cargar comentarios (Simulados inicialmente)
    loadMockComments();
}

// ==========================================
// LÓGICA DE UI
// ==========================================

function renderCommentsStructure(container) {
    container.innerHTML = `
        <div class="comments-wrapper">
            <h3 class="comments-title">Comentarios <span id="comments-count">(0)</span></h3>
            
            <!-- Sección de Autenticación -->
            <div id="auth-ui" class="auth-section">
                <p>Inicia sesión para participar en la conversación</p>
                <div class="auth-buttons">
                    <button class="btn-auth btn-google" onclick="handleGoogleLogin()">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G">
                        Continuar con Google
                    </button>
                    <button class="btn-auth btn-facebook" onclick="handleFacebookLogin()">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="F">
                        Continuar con Facebook
                    </button>
                </div>
            </div>

            <!-- Formulario de Comentarios (Oculto si no hay login) -->
            <div id="comment-form-ui" class="comment-form-section" style="display: none;">
                <div class="user-profile-mini">
                    <img id="current-user-avatar" src="" alt="Avatar">
                    <span id="current-user-name">Usuario</span>
                    <button class="btn-logout" onclick="handleLogout()">(Cerrar sesión)</button>
                </div>
                <textarea id="comment-input" placeholder="Escribe tu opinión... (Sé respetuoso)" rows="3"></textarea>
                <div class="form-actions">
                    <button class="btn-submit-comment" onclick="handleSubmitComment()">Publicar comentario</button>
                </div>
            </div>

            <!-- Lista de Comentarios -->
            <div id="comments-list" class="comments-list">
                <div class="loading-comments">Cargando opiniones...</div>
            </div>
        </div>
    `;
}

// ==========================================
// LÓGICA DE AUTENTICACIÓN (MOCK / PREPARADO PARA FIREBASE)
// ==========================================

function checkAuthState() {
    // Aquí verificaríamos firebase.auth().currentUser
    // Por ahora, iniciamos como "no logueado"
    updateAuthUI(null);
}

function handleGoogleLogin() {
    console.log("🔘 Intentando login con Google...");
    // Simulación de login exitoso para demostración UI
    // En producción: firebase.auth().signInWithPopup(provider)...
    const mockUser = {
        uid: "user_123",
        displayName: "Lector Invitado",
        photoURL: "https://ui-avatars.com/api/?name=Lector+Invitado&background=random"
    };
    loginSuccess(mockUser);
}

function handleFacebookLogin() {
    console.log("🔘 Intentando login con Facebook...");
    // Simulación
    const mockUser = {
        uid: "user_456",
        displayName: "Usuario Facebook",
        photoURL: "https://ui-avatars.com/api/?name=Usuario+FB&background=1877F2&color=fff"
    };
    loginSuccess(mockUser);
}

function handleLogout() {
    console.log("👋 Cerrando sesión...");
    currentUser = null;
    updateAuthUI(null);
}

function loginSuccess(user) {
    currentUser = user;
    updateAuthUI(user);
}

function updateAuthUI(user) {
    if (user) {
        authSection.style.display = "none";
        commentFormSection.style.display = "block";
        document.getElementById("current-user-name").textContent = user.displayName;
        document.getElementById("current-user-avatar").src = user.photoURL;
    } else {
        authSection.style.display = "block";
        commentFormSection.style.display = "none";
    }
}

// ==========================================
// GETIÓN DE COMENTARIOS
// ==========================================

function loadMockComments() {
    // Simular retraso de red
    setTimeout(() => {
        comments = [
            {
                id: 1,
                user: "Ana González",
                avatar: "https://ui-avatars.com/api/?name=Ana+G&background=random",
                text: "Excelente análisis sobre la economía local. Coincido en que la inflación debe ser controlada.",
                date: new Date(Date.now() - 86400000).toISOString() // Ayer
            },
            {
                id: 2,
                user: "Carlos Benítez",
                avatar: "https://ui-avatars.com/api/?name=Carlos+B&background=random",
                text: "¿Se sabe cuándo publicarían los nuevos datos del BCP?",
                date: new Date(Date.now() - 3600000).toISOString() // Hace 1 hora
            }
        ];
        renderComments();
    }, 800);
}

function handleSubmitComment() {
    const input = document.getElementById("comment-input");
    const text = input.value.trim();

    if (!text) return alert("Por favor escribe un comentario.");
    if (!currentUser) return alert("Debes iniciar sesión.");

    // Crear nuevo comentario (Optimistic UI)
    const newComment = {
        id: Date.now(),
        user: currentUser.displayName,
        avatar: currentUser.photoURL,
        text: text,
        date: new Date().toISOString()
    };

    comments.unshift(newComment); // Agregar al inicio
    input.value = ""; // Limpiar input
    renderComments();

    // Aquí iría: db.collection("comments").add(...)
    console.log("✅ Comentario enviado:", newComment);
}

function renderComments() {
    if (!commentsList) return;

    document.getElementById("comments-count").textContent = `(${comments.length})`;

    if (comments.length === 0) {
        commentsList.innerHTML = `<p class="no-comments">Sé el primero en comentar.</p>`;
        return;
    }

    commentsList.innerHTML = comments.map(c => `
        <div class="comment-item">
            <div class="comment-avatar">
                <img src="${c.avatar}" alt="${c.user}" loading="lazy">
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${c.user}</span>
                    <span class="comment-date">${formatRelativeTime(c.date)}</span>
                </div>
                <div class="comment-body">
                    ${escapeHtml(c.text)}
                </div>
            </div>
        </div>
    `).join("");
}

// Utilidades
function formatRelativeTime(dateIso) {
    const date = new Date(dateIso);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // segundos

    if (diff < 60) return "hace un momento";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString("es-PY");
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Hacer funciones globales accesibles para onclick en HTML inyectado
window.handleGoogleLogin = handleGoogleLogin;
window.handleFacebookLogin = handleFacebookLogin;
window.handleLogout = handleLogout;
window.handleSubmitComment = handleSubmitComment;
