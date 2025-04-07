/*
Vue d'ensemble du fichier :
Ce fichier gère toute l'authentification de l'application mobile des JO Paris 2024.
Il définit une classe AuthManager qui :
- Gère la connexion/déconnexion des utilisateurs
- Gère l'inscription des nouveaux utilisateurs  
- Maintient l'état de connexion (via localStorage)
- Met à jour l'interface selon l'état de connexion
- Gère les modales de connexion/inscription
*/

// On utilise une IIFE (Immediately Invoked Function Expression) pour éviter la pollution du scope global
// Cette fonction s'exécute immédiatement après sa définition
(function() {
    // Message de debug pour confirmer le chargement du script
    console.log("Initialisation du gestionnaire d'authentification...");
    
    // Définition de la classe principale qui va gérer l'authentification
    class AuthManager {
        // Le constructeur est appelé à la création d'une instance
        constructor() {
            // Récupère le token d'API stocké dans le localStorage du navigateur
            this.token = localStorage.getItem('api_token');
            // Détermine si l'utilisateur est connecté (!! convertit en booléen)
            this.isLoggedIn = !!this.token;
            // Récupère le nom d'utilisateur et l'ID stockés
            this.username = localStorage.getItem('username');
            this.userId = localStorage.getItem('user_id');
            // Configure les écouteurs d'événements et met à jour l'interface
            this.setupEventListeners();
            this.updateUI();
        }
        
        // Configure tous les écouteurs d'événements nécessaires
        setupEventListeners() {
            // Récupère le formulaire de connexion dans le DOM
            const loginForm = document.getElementById('login-form');
            // Si le formulaire existe, ajoute un écouteur sur sa soumission
            if (loginForm) {
                // La fonction fléchée permet de conserver le contexte 'this'
                loginForm.addEventListener('submit', e => this.handleLogin(e));
            }
            
            // Même chose pour le formulaire d'inscription
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', e => this.handleRegister(e));
            }
            
            // Gestion du bouton de déconnexion
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', e => this.handleLogout(e));
            }
            
            // Gestion des liens pour basculer entre les modales
            // querySelectorAll retourne tous les éléments correspondant au sélecteur
            const switchToRegister = document.querySelectorAll('#switch-to-register');
            // Pour chaque lien trouvé
            switchToRegister.forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault(); // Empêche le comportement par défaut du lien
                    hideModal(document.getElementById('login-modal')); // Cache la modale de connexion
                    showModal(document.getElementById('register-modal')); // Affiche la modale d'inscription
                });
            });
            
            // Même logique pour basculer vers la connexion
            const switchToLogin = document.querySelectorAll('#switch-to-login');
            switchToLogin.forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    hideModal(document.getElementById('register-modal'));
                    showModal(document.getElementById('login-modal'));
                });
            });
            
            // Gestion des boutons de fermeture des modales
            const closeButtons = document.querySelectorAll('.close-modal');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // closest() remonte l'arbre DOM pour trouver l'ancêtre le plus proche correspondant au sélecteur
                    const modal = button.closest('.modal');
                    if (modal) {
                        hideModal(modal);
                    }
                });
            });
            
            // Met à jour l'interface selon l'état de connexion
            this.updateUI();
            
            // Configure le lien de connexion pour ouvrir la modale
            const loginLink = document.getElementById('login-link');
            if (loginLink) {
                loginLink.addEventListener('click', e => {
                    e.preventDefault();
                    this.showLoginModal();
                });
            }
        }
        
        // Gère la soumission du formulaire de connexion
        async handleLogin(event) {
            event.preventDefault(); // Empêche le rechargement de la page
            
            // Récupère les champs du formulaire
            const usernameInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            
            // Vérifie que les champs existent
            if (!usernameInput || !passwordInput) {
                console.error("Formulaire de connexion incomplet");
                return;
            }
            
            // Récupère et nettoie les valeurs (trim() enlève les espaces début/fin)
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            
            // Vérifie que les champs sont remplis
            if (!username || !password) {
                alert("Veuillez remplir tous les champs");
                return;
            }
            
            try {
                // Récupère le token CSRF (protection contre les attaques CSRF)
                const csrftoken = getCookie('csrftoken');
                
                // Appel à l'API pour la connexion
                const response = await fetch(`${API_BASE_URL}/user/login/`, {
                    method: 'POST', // Méthode HTTP POST
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({ // Convertit l'objet en chaîne JSON
                        username: username,
                        password: password
                    }),
                    credentials: 'include' // Inclut les cookies dans la requête
                });
                
                // Attend et parse la réponse JSON
                const data = await response.json();
                
                // Vérifie si la requête a réussi
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur de connexion');
                }
                
                // Stocke les informations de connexion dans le localStorage
                localStorage.setItem('api_token', data.token);
                localStorage.setItem('username', username);
                localStorage.setItem('user_id', data.user.id);
                
                // Met à jour l'état de l'instance
                this.token = data.token;
                this.username = username;
                this.userId = data.user.id;
                this.isLoggedIn = true;
                this.updateUI();
                
                // Ferme la modale de connexion
                hideModal(document.getElementById('login-modal'));
                
                // Recharge la page pour mettre à jour l'interface
                window.location.reload();
                
            } catch (error) {
                // Gestion des erreurs
                console.error('Erreur lors de la connexion:', error);
                alert("Identifiants incorrects ou problème de connexion au serveur.");
            }
        }
        
        // Gère la soumission du formulaire d'inscription
        async handleRegister(event) {
            event.preventDefault();
            
            // Récupère tous les champs du formulaire
            const usernameInput = document.getElementById('register-username');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');
            const confirmPasswordInput = document.getElementById('register-confirm-password');
            
            // Vérifie que tous les champs existent
            if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
                console.error("Formulaire d'inscription incomplet");
                return;
            }
            
            // Récupère et nettoie les valeurs
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Vérifie que tous les champs sont remplis
            if (!username || !email || !password || !confirmPassword) {
                alert("Veuillez remplir tous les champs");
                return;
            }
            
            // Vérifie que les mots de passe correspondent
            if (password !== confirmPassword) {
                alert("Les mots de passe ne correspondent pas");
                return;
            }
            
            try {
                // Récupère le token CSRF
                const csrftoken = getCookie('csrftoken');
                
                // Appel à l'API pour l'inscription
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
                
                // Vérifie si l'inscription a réussi
                if (!response.ok || !data.success) {
                    // flat() aplatit un tableau de tableaux en un seul tableau
                    const errorMsg = data.errors ? Object.values(data.errors).flat().join('\n') : data.error;
                    throw new Error(errorMsg || 'Erreur d\'inscription');
                }
                
                // Affiche un message de succès
                alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
                
                // Si l'API renvoie un token, connecte directement l'utilisateur
                if (data.token) {
                    localStorage.setItem('api_token', data.token);
                    localStorage.setItem('username', username);
                    localStorage.setItem('user_id', data.user.id);
                    
                    this.token = data.token;
                    this.username = username;
                    this.userId = data.user.id;
                    this.isLoggedIn = true;
                    this.updateUI();
                    
                    window.location.reload();
                } else {
                    // Sinon, redirige vers la connexion
                    hideModal(document.getElementById('register-modal'));
                    showModal(document.getElementById('login-modal'));
                    
                    // Pré-remplit le champ username
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
        
        // Gère la déconnexion de l'utilisateur
        async handleLogout(event) {
            if (event) {
                event.preventDefault();
            }
            
            try {
                // Tente de déconnecter via l'API si un token existe
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
                // Dans tous les cas, nettoie le localStorage
                localStorage.removeItem('api_token');
                localStorage.removeItem('username');
                localStorage.removeItem('user_id');
                
                // Réinitialise l'état de l'instance
                this.token = null;
                this.isLoggedIn = false;
                this.username = null;
                this.userId = null;
                
                this.updateUI();
                
                // Redirige vers l'accueil si on est sur une page protégée
                if (window.location.pathname.includes('ticket.html')) {
                    window.location.href = 'index.html';
                } else {
                    window.location.reload();
                }
            }
        }
        
        // Met à jour l'interface selon l'état de connexion
        updateUI() {
            // Récupère tous les éléments à mettre à jour
            const loginLink = document.getElementById('login-link');
            const registerLink = document.getElementById('switch-to-register');
            const logoutLink = document.getElementById('logout-link');
            const ticketsLink = document.getElementById('tickets-link');
            const userDisplay = document.getElementById('user-display');
            const usernameDisplay = document.getElementById('username-display');
            
            if (this.isLoggedIn) {
                // Si connecté : cache connexion/inscription, affiche déconnexion/billets
                if (loginLink) loginLink.style.display = 'none';
                if (registerLink) registerLink.style.display = 'none';
                if (logoutLink) logoutLink.style.display = 'block';
                if (ticketsLink) ticketsLink.style.display = 'block';
                
                // Met à jour l'affichage du nom d'utilisateur
                if (userDisplay) {
                    userDisplay.style.display = 'block';
                }
                if (usernameDisplay) {
                    usernameDisplay.textContent = this.username;
                }
                
            } else {
                // Si déconnecté : affiche connexion/inscription, cache déconnexion/billets
                if (loginLink) loginLink.style.display = 'block';
                if (registerLink) registerLink.style.display = 'block';
                if (logoutLink) logoutLink.style.display = 'none';
                if (ticketsLink) ticketsLink.style.display = 'none';
                
                // Cache l'affichage du nom d'utilisateur
                if (userDisplay) {
                    userDisplay.style.display = 'none';
                }
            }
        }
        
        // Affiche la modale de connexion
        showLoginModal() {
            showModal(document.getElementById('login-modal'));
        }
    }
    
    // Crée une instance de AuthManager et l'expose globalement
    // window.authManager permet d'accéder à l'instance depuis n'importe où
    window.authManager = new AuthManager();
})();