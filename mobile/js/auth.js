// Gestionnaire d'authentification
(function() {
    console.log("Initialisation du gestionnaire d'authentification...");
    
    class AuthManager {
        constructor() {
            this.token = localStorage.getItem('api_token');
            this.isLoggedIn = !!this.token;
            this.username = localStorage.getItem('username');
            this.userId = localStorage.getItem('user_id');
            this.setupEventListeners();
            this.updateUI();
        }
        
        setupEventListeners() {
            // Formulaire de connexion
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', e => this.handleLogin(e));
            }
            
            // Formulaire d'inscription
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', e => this.handleRegister(e));
            }
            
            // Bouton de déconnexion
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', e => this.handleLogout(e));
            }
            
            // Changer entre les modals
            const switchToRegister = document.querySelectorAll('#switch-to-register');
            switchToRegister.forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    hideModal(document.getElementById('login-modal'));
                    showModal(document.getElementById('register-modal'));
                });
            });
            
            const switchToLogin = document.querySelectorAll('#switch-to-login');
            switchToLogin.forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    hideModal(document.getElementById('register-modal'));
                    showModal(document.getElementById('login-modal'));
                });
            });
            
            // Fermer les modals
            const closeButtons = document.querySelectorAll('.close-modal');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const modal = button.closest('.modal');
                    if (modal) {
                        hideModal(modal);
                    }
                });
            });
            
            // Afficher les liens appropriés selon l'état de connexion
            this.updateUI();
            
            // Ouvrir le modal de connexion au clic sur le lien
            const loginLink = document.getElementById('login-link');
            if (loginLink) {
                loginLink.addEventListener('click', e => {
                    e.preventDefault();
                    this.showLoginModal();
                });
            }
        }
        
        async handleLogin(event) {
            event.preventDefault();
            
            const usernameInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            
            if (!usernameInput || !passwordInput) {
                console.error("Formulaire de connexion incomplet");
                return;
            }
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            
            if (!username || !password) {
                alert("Veuillez remplir tous les champs");
                return;
            }
            
            try {
                // Obtenir le token CSRF
                const csrftoken = getCookie('csrftoken');
                
                // Appel API pour la connexion
                const response = await fetch(`${API_BASE_URL}/user/login/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur de connexion');
                }
                
                // Sauvegarder le token et les infos utilisateur
                localStorage.setItem('api_token', data.token);
                localStorage.setItem('username', username);
                localStorage.setItem('user_id', data.user.id);
                
                this.token = data.token;
                this.username = username;
                this.userId = data.user.id;
                this.isLoggedIn = true;
                this.updateUI();
                
                // Fermer la modal
                hideModal(document.getElementById('login-modal'));
                
                // Recharger la page
                window.location.reload();
                
            } catch (error) {
                console.error('Erreur lors de la connexion:', error);
                alert("Identifiants incorrects ou problème de connexion au serveur.");
            }
        }
        
        async handleRegister(event) {
            event.preventDefault();
            
            const usernameInput = document.getElementById('register-username');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');
            const confirmPasswordInput = document.getElementById('register-confirm-password');
            
            if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
                console.error("Formulaire d'inscription incomplet");
                return;
            }
            
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (!username || !email || !password || !confirmPassword) {
                alert("Veuillez remplir tous les champs");
                return;
            }
            
            if (password !== confirmPassword) {
                alert("Les mots de passe ne correspondent pas");
                return;
            }
            
            try {
                // Obtenir le token CSRF
                const csrftoken = getCookie('csrftoken');
                
                // Appel API pour l'inscription
                const response = await fetch(`${API_BASE_URL}/user/register/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                        password_confirm: confirmPassword
                    }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    const errorMsg = data.errors ? Object.values(data.errors).flat().join('\n') : data.error;
                    throw new Error(errorMsg || 'Erreur d\'inscription');
                }
                
                // Si l'inscription est réussie, on peut soit connecter automatiquement l'utilisateur
                // soit afficher un message de succès et rediriger vers la connexion
                alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
                
                if (data.token) {
                    // Auto-connexion
                    localStorage.setItem('api_token', data.token);
                    localStorage.setItem('username', username);
                    localStorage.setItem('user_id', data.user.id);
                    
                    this.token = data.token;
                    this.username = username;
                    this.userId = data.user.id;
                    this.isLoggedIn = true;
                    this.updateUI();
                    
                    // Recharger la page
                    window.location.reload();
                } else {
                    // Rediriger vers la connexion
                    hideModal(document.getElementById('register-modal'));
                    showModal(document.getElementById('login-modal'));
                    
                    // Pré-remplir le champ du nom d'utilisateur
                    const loginUsernameInput = document.getElementById('login-email');
                    if (loginUsernameInput) {
                        loginUsernameInput.value = username;
                    }
                }
                
            } catch (error) {
                console.error('Erreur lors de l\'inscription:', error);
                alert(`Erreur: ${error.message}`);
            }
        }
        
        async handleLogout(event) {
            if (event) {
                event.preventDefault();
            }
            
            try {
                // Tenter de déconnecter via l'API
                if (this.token) {
                    await fetch(`${API_BASE_URL}/user/logout/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Token ${this.token}`,
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include'
                    });
                }
            } catch (err) {
                console.error('Erreur de déconnexion API:', err);
            } finally {
                // Nettoyer le stockage local quoi qu'il arrive
                localStorage.removeItem('api_token');
                localStorage.removeItem('username');
                localStorage.removeItem('user_id');
                
                this.token = null;
                this.isLoggedIn = false;
                this.username = null;
                this.userId = null;
                
                this.updateUI();
                
                // Rediriger vers la page d'accueil si on est sur une page protégée
                if (window.location.pathname.includes('ticket.html')) {
                    window.location.href = 'index.html';
                } else {
                    window.location.reload();
                }
            }
        }
        
        updateUI() {
            const loginLink = document.getElementById('login-link');
            const registerLink = document.getElementById('switch-to-register');
            const logoutLink = document.getElementById('logout-link');
            const ticketsLink = document.getElementById('tickets-link');
            
            if (this.isLoggedIn) {
                // Utilisateur connecté
                if (loginLink) loginLink.style.display = 'none';
                if (registerLink) registerLink.style.display = 'none';
                if (logoutLink) logoutLink.style.display = 'block';
                if (ticketsLink) ticketsLink.style.display = 'block';
                
                // Mettre à jour d'autres éléments UI si nécessaire
                const userDisplay = document.getElementById('user-display');
                if (userDisplay) {
                    userDisplay.textContent = `Bonjour, ${this.username}`;
                    userDisplay.style.display = 'block';
                }
                
            } else {
                // Utilisateur non connecté
                if (loginLink) loginLink.style.display = 'block';
                if (registerLink) registerLink.style.display = 'block';
                if (logoutLink) logoutLink.style.display = 'none';
                if (ticketsLink) ticketsLink.style.display = 'none';
                
                // Masquer d'autres éléments UI si nécessaire
                const userDisplay = document.getElementById('user-display');
                if (userDisplay) {
                    userDisplay.style.display = 'none';
                }
            }
        }
        
        showLoginModal() {
            showModal(document.getElementById('login-modal'));
        }
    }
    
    // Créer et exposer l'instance
    window.authManager = new AuthManager();
})();