/**
 * auth.js - Sistema de Autenticación Premium para Perspectivas
 * Gestiona el estado del usuario, el modal de login y la integración con Google.
 */

const AuthSystem = {
    currentUser: null,
    modalId: 'premium-auth-modal',

    init() {
        this.loadSession();
        this.bindEvents();
        this.updateUI();
        console.log("🔐 Sistema de Autenticación Perspectivas inicializado.");
    },

    loadSession() {
        const savedUser = localStorage.getItem('perspectivas_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
            } catch (e) {
                localStorage.removeItem('perspectivas_user');
            }
        }
    },

    saveSession(user) {
        this.currentUser = user;
        localStorage.setItem('perspectivas_user', JSON.stringify(user));
        this.updateUI();
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('perspectivas_user');
        this.updateUI();
        window.location.reload(); // Recargar para limpiar estado
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.user-access-btn')) {
                e.preventDefault();
                if (this.currentUser) {
                    this.showUserMenu();
                } else {
                    this.showLoginModal();
                }
            }
        });
    },

    showLoginModal() {
        if (document.getElementById(this.modalId)) return;

        const modalMarkup = `
            <div id="${this.modalId}" class="auth-modal-overlay">
                <div class="auth-modal-container">
                    <button class="auth-modal-close">×</button>
                    <div class="auth-modal-content">
                        <div class="auth-modal-header">
                            <span class="auth-brand">Perspectivas</span>
                            <h2>Acceso Premium</h2>
                            <p>Únete a nuestra comunidad de lectores y accede a contenidos exclusivos.</p>
                        </div>
                        
                        <div class="auth-methods">
                            <button id="auth-google-btn" class="auth-btn-google">
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span>Continuar con Google</span>
                            </button>
                            
                            <div class="auth-divider">
                                <span>o</span>
                            </div>
                            
                            <form id="auth-email-form" class="auth-email-form">
                                <input type="email" placeholder="Correo electrónico" required>
                                <button type="submit" class="auth-btn-primary">Continuar</button>
                            </form>
                        </div>
                        
                        <div class="auth-modal-footer">
                            <p>¿No tienes cuenta? <a href="#">Regístrate</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalMarkup);

        const modal = document.getElementById(this.modalId);
        const closeBtn = modal.querySelector('.auth-modal-close');

        // Animación de entrada
        setTimeout(() => modal.classList.add('active'), 10);

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        closeBtn.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };

        // Simulación de login con Google
        document.getElementById('auth-google-btn').onclick = () => {
            this.simulateLogin('Google User', 'user@gmail.com', 'https://ui-avatars.com/api/?name=Google+User&background=3b82f6&color=fff');
            closeModal();
        };

        // Simulación de login con Email
        document.getElementById('auth-email-form').onsubmit = (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input').value;
            this.simulateLogin(email.split('@')[0], email, `https://ui-avatars.com/api/?name=${email}&background=1e293b&color=fff`);
            closeModal();
        };
    },

    simulateLogin(name, email, avatar) {
        console.log("🔑 Simulando login para:", name);
        this.saveSession({ name, email, avatar });
    },

    showUserMenu() {
        // Implementación sencilla de logout por ahora para el prototipo pro
        if (confirm(`Hola ${this.currentUser.name}, ¿quieres cerrar sesión?`)) {
            this.logout();
        }
    },

    updateUI() {
        const accessBtns = document.querySelectorAll('.user-access-btn');
        accessBtns.forEach(btn => {
            if (this.currentUser) {
                btn.innerHTML = `
                    <div class="user-avatar-premium">
                        <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}">
                    </div>
                `;
                btn.title = `Cuenta de ${this.currentUser.name}`;
            } else {
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                `;
                btn.title = "Acceso usuario";
            }
        });
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthSystem.init());
} else {
    AuthSystem.init();
}
