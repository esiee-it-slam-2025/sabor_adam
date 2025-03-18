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
            
            // Afficher le bouton login/logout approprié
            this.updateUI();
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
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erreur de connexion');
                }
                
                const data = await response.json();
                
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
                // En cas d'échec de l'API, utiliser l'authentification locale simulée
                console.error('Erreur API login:', error);
                
                // Récupérer les utilisateurs du stockage local
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.username === username && u.password === password);
                
                if (user) {
                    // Générer un token factice
                    const token = `token_${username}_${Date.now()}`;
                    localStorage.setItem('api_token', token);
                    localStorage.setItem('username', username);
                    localStorage.setItem('user_id', Date.now());
                    
                    this.token = token;
                    this.username = username;
                    this.userId = Date.now();
                    this.isLoggedIn = true;
                    this.updateUI();
                    
                    // Fermer la modal
                    hideModal(document.getElementById('login-modal'));
                    
                    // Recharger la page
                    window.location.reload();
                } else {
                    alert("Identifiants incorrects. Veuillez réessayer.");
                }
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
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erreur d\'inscription');
                }
                
                alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
                
                // Fermer la modal d'inscription et ouvrir celle de connexion
                hideModal(document.getElementById('register-modal'));
                showModal(document.getElementById('login-modal'));
                
                // Pré-remplir le champ du nom d'utilisateur
                const loginUsernameInput = document.getElementById('login-email');
                if (loginUsernameInput) {
                    loginUsernameInput.value = username;
                }
                
            } catch (error) {
                // En cas d'échec de l'API, utiliser l'inscription locale simulée
                console.error('Erreur API inscription:', error);
                
                // Récupérer les utilisateurs du stockage local
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                
                // Vérifier si l'utilisateur existe déjà
                if (users.some(u => u.username === username)) {
                    alert("Ce nom d'utilisateur est déjà utilisé");
                    return;
                }
                
                if (users.some(u => u.email === email)) {
                    alert("Cette adresse email est déjà utilisée");
                    return;
                }
                
                // Ajouter le nouvel utilisateur
                users.push({
                    username,
                    email,
                    password,
                    created_at: new Date().toISOString()
                });
                
                // Sauvegarder les utilisateurs
                localStorage.setItem('users', JSON.stringify(users));
                
                alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
                
                // Fermer la modal d'inscription et ouvrir celle de connexion
                hideModal(document.getElementById('register-modal'));
                showModal(document.getElementById('login-modal'));
                
                // Pré-remplir le champ du nom d'utilisateur
                const loginUsernameInput = document.getElementById('login-email');
                if (loginUsernameInput) {
                    loginUsernameInput.value = username;
                }
            }
        }
        
        handleLogout(event) {
            if (event) {
                event.preventDefault();
            }
            
            // Tenter de déconnecter via l'API
            if (this.token && this.token.startsWith('Token ')) {
                // Appel à l'API de déconnexion (facultatif selon configuration Django)
                fetch(`${API_BASE_URL}/user/logout/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': this.token,
                        'Content-Type': 'application/json'
                    }
                }).catch(err => console.error('Erreur de déconnexion API:', err));
            }
            
            // Nettoyer le stockage local
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
            } else {
                // Utilisateur non connecté
                if (loginLink) loginLink.style.display = 'block';
                if (registerLink) registerLink.style.display = 'block';
                if (logoutLink) logoutLink.style.display = 'none';
                if (ticketsLink) ticketsLink.style.display = 'none';
            }
        }
        
        showLoginModal() {
            showModal(document.getElementById('login-modal'));
        }
    }
    
    // Créer et exposer l'instance
    window.authManager = new AuthManager();
})();