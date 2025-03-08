document.addEventListener('DOMContentLoaded', function() {
    // Configuration de l'API
    const API_URL = 'http://127.0.0.1:8000/api/v1';
    
    // Variables d'état pour gérer la connexion utilisateur
    let isLoggedIn = false;
    let currentUser = null;

    // Récupération des éléments du DOM nécessaires
    const matchesContainer = document.getElementById('matches-container');
    const loginModal = document.getElementById('login-modal');
    const ticketModal = document.getElementById('ticket-modal');
    const loginForm = document.getElementById('login-form');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const ticketForm = document.getElementById('ticket-form');

    // Fonctions de gestion des modales (popups)
    function showModal(modal) {
        modal.style.display = 'flex';
    }

    function hideModal(modal) {
        modal.style.display = 'none';
    }

    // Ferme les modales si on clique en dehors
    window.onclick = function(event) {
        if (event.target === loginModal) {
            hideModal(loginModal);
        }
        if (event.target === ticketModal) {
            hideModal(ticketModal);
        }
    }

    // Récupère le token CSRF depuis les cookies
    // Nécessaire pour les requêtes POST vers Django
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Fonction utilitaire pour faire des requêtes authentifiées
    // Gère automatiquement les tokens d'auth et CSRF
    async function authenticatedFetch(url, options = {}) {
        const authToken = localStorage.getItem('authToken');
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Ajoute le token d'authentification s'il existe
        if (authToken) {
            headers['Authorization'] = `Token ${authToken}`;
        }

        // Ajoute le token CSRF pour les requêtes POST
        if (options.method === 'POST') {
            headers['X-CSRFToken'] = getCookie('csrftoken');
        }

        const fetchOptions = {
            ...options,
            headers,
            credentials: 'include' // Nécessaire pour CORS
        };

        return fetch(url, fetchOptions);
    }

    // Gère la soumission du formulaire de connexion
    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
    
        try {
            // Envoi des identifiants au serveur
            const response = await authenticatedFetch(`${API_URL}/login/`, {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
    
            if (!response.ok) throw new Error('Identifiants invalides');
    
            const data = await response.json();
            // Stocke le token d'authentification
            localStorage.setItem('authToken', data.token);
            isLoggedIn = true;
            hideModal(loginModal);
            await checkLoginStatus();
        } catch (error) {
            alert('Erreur de connexion: ' + error.message);
        }
    }

    // Vérifie si l'utilisateur est connecté au chargement
    async function checkLoginStatus() {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            isLoggedIn = false;
            currentUser = null;
            updateUIForLoggedInUser();
            return;
        }

        try {
            // Vérifie la validité du token
            const response = await authenticatedFetch(`${API_URL}/user/`);
            
            if (!response.ok) {
                throw new Error('Token invalide');
            }

            const data = await response.json();
            isLoggedIn = true;
            currentUser = data;
            updateUIForLoggedInUser();
        } catch (error) {
            console.error('Erreur de vérification du token:', error);
            // Supprime le token invalide
            localStorage.removeItem('authToken');
            isLoggedIn = false;
            currentUser = null;
            updateUIForLoggedInUser();
        }
    }

    // Met à jour l'interface selon l'état de connexion
    function updateUIForLoggedInUser() {
        document.querySelectorAll('.buy-button').forEach(button => {
            button.textContent = isLoggedIn ? 'Acheter un billet' : 'Connectez-vous pour acheter';
        });
    }

    // Crée une carte de match avec toutes les informations
    function createMatchCard(match) {
        const card = document.createElement('div');
        card.className = 'match-card';
        
        // Formatage de la date en français
        const matchDate = new Date(match.start);
        const formattedDate = new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(matchDate);

        // Structure HTML de la carte
        card.innerHTML = `
            <div class="match-header">
                <div class="date">${formattedDate}</div>
            </div>
            <div class="vs-container">
                <div class="team">${match.team_home_name}</div>
                <div class="vs">VS</div>
                <div class="team">${match.team_away_name}</div>
            </div>
            <div class="match-info">
                <div>🏟️ ${match.stadium_name}</div>
                <div class="score">${match.score_team_home} - ${match.score_team_away}</div>
            </div>
            <button class="buy-button" data-match-id="${match.id}">
                ${isLoggedIn ? 'Acheter un billet' : 'Connectez-vous pour acheter'}
            </button>
        `;

        // Gestion du clic sur le bouton d'achat
        const buyButton = card.querySelector('.buy-button');
        buyButton.addEventListener('click', () => {
            if (isLoggedIn) {
                handleBuyTicket(match);
            } else {
                showModal(loginModal);
            }
        });

        return card;
    }

    // Filtre les matchs selon la recherche et le filtre sélectionné
    function filterMatches(matches) {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        
        return matches.filter(match => {
            const matchesSearch = 
                match.team_home_name.toLowerCase().includes(searchTerm) ||
                match.team_away_name.toLowerCase().includes(searchTerm) ||
                match.stadium_name.toLowerCase().includes(searchTerm);
                
            // Filtre selon la date
            if (filterValue === 'a-venir') {
                return matchesSearch && new Date(match.start) > new Date();
            } else if (filterValue === 'termines') {
                return matchesSearch && new Date(match.start) < new Date();
            }
            
            return matchesSearch;
        });
    }

    // Récupère et affiche les matchs depuis l'API
    async function displayMatches() {
        try {
            const response = await authenticatedFetch(`${API_URL}/events/`);

            if (!response.ok) throw new Error('Erreur lors de la récupération des matchs');

            const matches = await response.json();
            const filteredMatches = filterMatches(matches);
            
            matchesContainer.innerHTML = '';
            if (filteredMatches.length === 0) {
                matchesContainer.innerHTML = '<p class="no-results">Aucun match trouvé</p>';
                return;
            }
            
            filteredMatches.forEach(match => {
                matchesContainer.appendChild(createMatchCard(match));
            });
        } catch (error) {
            matchesContainer.innerHTML = `
                <div class="error-message">
                    Une erreur est survenue: ${error.message}
                </div>
            `;
        }
    }

    // Calcule le prix total selon la catégorie et la quantité
    function updateTotalPrice() {
        const category = document.getElementById('category').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const prices = {
            'silver': 100,
            'gold': 200,
            'platinum': 300
        };
        const total = prices[category] * quantity;
        document.getElementById('total-price').textContent = total;
    }

    // Prépare la modale d'achat de billet
    async function handleBuyTicket(match) {
        if (!isLoggedIn) {
            showModal(loginModal);
            return;
        }

        // Mise à jour des informations du match dans la modale
        const matchInfo = ticketModal.querySelector('.match-info');
        matchInfo.innerHTML = `
            <h3>${match.team_home_name} vs ${match.team_away_name}</h3>
            <p>Stade: ${match.stadium_name}</p>
            <p>Date: ${new Date(match.start).toLocaleString('fr-FR')}</p>
        `;

        ticketForm.reset();
        updateTotalPrice();
        showModal(ticketModal);
        ticketForm.dataset.matchId = match.id;
    }

    // Gère l'achat effectif du billet
    async function purchaseTicket(e) {
        e.preventDefault();
        const matchId = ticketForm.dataset.matchId;
        const category = document.getElementById('category').value;
        const quantity = document.getElementById('quantity').value;

        try {
            const response = await authenticatedFetch(`${API_URL}/tickets/purchase/`, {
                method: 'POST',
                body: JSON.stringify({
                    match_id: matchId,
                    category: category,
                    quantity: quantity
                })
            });

            if (!response.ok) throw new Error('Erreur lors de l\'achat');

            const data = await response.json();
            alert('Achat réussi ! Retrouvez vos billets dans votre espace personnel.');
            hideModal(ticketModal);
        } catch (error) {
            alert('Erreur lors de l\'achat: ' + error.message);
        }
    }

    // Configuration des écouteurs d'événements
    loginForm.addEventListener('submit', handleLogin);
    ticketForm.addEventListener('submit', purchaseTicket);
    searchInput.addEventListener('input', displayMatches);
    filterSelect.addEventListener('change', displayMatches);
    document.getElementById('category').addEventListener('change', updateTotalPrice);
    document.getElementById('quantity').addEventListener('input', updateTotalPrice);

    // Initialisation de l'application
    checkLoginStatus();
    displayMatches();
});


// Vérifier si l'utilisateur est connecté
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const authButtons = document.getElementById('authButtons');
    
    if (isLoggedIn === 'true') {
        const userEmail = localStorage.getItem('userEmail');
        authButtons.innerHTML = `
            <span>Bienvenue ${userEmail}</span>
            <button onclick="logout()">Déconnexion</button>
        `;
    }
}

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.reload();
}

// Exécuter la vérification au chargement de la page
checkAuth();

class ApiService {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:8000/api/v1';
        this.token = localStorage.getItem('authToken');
    }

    // Gestion de l'authentification
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                return data;
            } else {
                throw new Error(data.error || 'Erreur de connexion');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    }

    // Headers avec authentification
    get headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Token ${this.token}` : '',
        };
    }

    // Récupération des événements
    async getEvents() {
        try {
            const response = await fetch(`${this.baseUrl}/events/`, {
                headers: this.headers
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des matchs:', error);
            throw error;
        }
    }

    // Récupération des équipes
    async getTeams() {
        try {
            const response = await fetch(`${this.baseUrl}/teams/`, {
                headers: this.headers
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des équipes:', error);
            throw error;
        }
    }

    // Récupération des stades
    async getStadiums() {
        try {
            const response = await fetch(`${this.baseUrl}/stadiums/`, {
                headers: this.headers
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des stades:', error);
            throw error;
        }
    }

    // Achat de ticket
    async purchaseTicket(eventId, category) {
        try {
            const response = await fetch(`${this.baseUrl}/tickets/purchase/`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    event_id: eventId,
                    category: category
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'achat du ticket:', error);
            throw error;
        }
    }

    // Récupération des tickets de l'utilisateur
    async getUserTickets() {
        try {
            const response = await fetch(`${this.baseUrl}/user/tickets/`, {
                headers: this.headers
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des tickets:', error);
            throw error;
        }
    }

    // Déconnexion
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        this.token = null;
    }
}

// Exemple d'utilisation:
/*
const api = new ApiService();

// Connexion
api.login('username', 'password')
    .then(response => console.log('Connecté:', response))
    .catch(error => console.error('Erreur:', error));

// Récupération des événements
api.getEvents()
    .then(events => console.log('Événements:', events))
    .catch(error => console.error('Erreur:', error));
*/

class AuthService {
    constructor() {
        this.API_URL = 'http://localhost:3000/api';
        this.isLoggedIn = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Formulaire de connexion
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Formulaire d'inscription
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Bouton de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de l\'inscription');
            }

            const data = await response.json();
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            hideModal(document.getElementById('register-modal'));
            showModal(document.getElementById('login-modal'));
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${this.API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Identifiants invalides');
            }

            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            this.isLoggedIn = true;
            this.currentUser = data.user;
            this.updateUI();
            hideModal(document.getElementById('login-modal'));
        } catch (error) {
            alert('Erreur de connexion: ' + error.message);
        }
    }

    async handleLogout() {
        localStorage.removeItem('authToken');
        this.isLoggedIn = false;
        this.currentUser = null;
        this.updateUI();
        window.location.reload();
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            this.isLoggedIn = false;
            this.updateUI();
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/user/`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (!response.ok) throw new Error();

            const userData = await response.json();
            this.isLoggedIn = true;
            this.currentUser = userData;
            this.updateUI();
        } catch {
            localStorage.removeItem('authToken');
            this.isLoggedIn = false;
            this.updateUI();
        }
    }

    updateUI() {
        const authSection = document.getElementById('auth-section');
        const userSection = document.getElementById('user-section');
        const buyButtons = document.querySelectorAll('.buy-button');

        if (this.isLoggedIn && this.currentUser) {
            authSection.style.display = 'none';
            userSection.style.display = 'block';
            userSection.innerHTML = `
                <div class="user-info">
                    <span>Bienvenue ${this.currentUser.username}</span>
                    <button id="my-tickets-btn">Mes billets</button>
                    <button id="logout-btn">Déconnexion</button>
                </div>
            `;
            buyButtons.forEach(btn => {
                btn.disabled = false;
                btn.textContent = 'Acheter un billet';
            });
        } else {
            authSection.style.display = 'block';
            userSection.style.display = 'none';
            buyButtons.forEach(btn => {
                btn.disabled = true;
                btn.textContent = 'Connectez-vous pour acheter';
            });
        }
    }
}

// Fonctions utilitaires pour la gestion des modals
function showLoginModal() {
    hideModal(document.getElementById('register-modal'));
    showModal(document.getElementById('login-modal'));
}

function showRegisterModal() {
    hideModal(document.getElementById('login-modal'));
    showModal(document.getElementById('register-modal'));
}

class TicketService {
    constructor(authService) {
        this.API_URL = 'http://127.0.0.1:8000/api/v1';
        this.authService = authService;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', e => {
            if (e.target.matches('.buy-button')) {
                const matchId = e.target.dataset.matchId;
                if (this.authService.isLoggedIn) {
                    this.showTicketModal(matchId);
                } else {
                    showModal(document.getElementById('login-modal'));
                }
            }
        });

        const ticketForm = document.getElementById('ticket-form');
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => this.handleTicketPurchase(e));
        }
    }

    async showTicketModal(matchId) {
        const modal = document.getElementById('ticket-modal');
        const match = await this.getMatchDetails(matchId);
        
        modal.querySelector('.match-details').innerHTML = `
            <h3>${match.team_home_name} vs ${match.team_away_name}</h3>
            <p>Date: ${new Date(match.date).toLocaleDateString('fr-FR')}</p>
            <p>Stade: ${match.stadium_name}</p>
        `;
        
        modal.dataset.matchId = matchId;
        showModal(modal);
    }

    async handleTicketPurchase(e) {
        e.preventDefault();
        const form = e.target;
        const matchId = form.dataset.matchId;
        const quantity = form.querySelector('#quantity').value;
        const category = form.querySelector('#category').value;

        try {
            const response = await fetch(`${this.API_URL}/tickets/purchase/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    match_id: matchId,
                    quantity: quantity,
                    category: category
                })
            });

            if (!response.ok) throw new Error('Erreur lors de l\'achat');

            const data = await response.json();
            alert('Achat réussi ! Consultez vos billets dans votre profil.');
            hideModal(document.getElementById('ticket-modal'));
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    }

    async getMyTickets() {
        try {
            const response = await fetch(`${this.API_URL}/tickets/my-tickets/`, {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) throw new Error('Erreur de chargement des billets');

            const tickets = await response.json();
            this.displayMyTickets(tickets);
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    }

    displayMyTickets(tickets) {
        const container = document.getElementById('my-tickets-container');
        if (!container) return;

        container.innerHTML = tickets.length ? tickets.map(ticket => `
            <div class="ticket-card">
                <h4>${ticket.match.team_home_name} vs ${ticket.match.team_away_name}</h4>
                <p>Date: ${new Date(ticket.match.date).toLocaleDateString('fr-FR')}</p>
                <p>Catégorie: ${ticket.category}</p>
                <p>Quantité: ${ticket.quantity}</p>
                <p>Référence: ${ticket.reference}</p>
            </div>
        `).join('') : '<p>Vous n\'avez pas encore de billets</p>';
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const authService = new AuthService();
    const ticketService = new TicketService(authService);
});
