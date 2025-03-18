// Configuration de l'API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Fonction pour récupérer un cookie spécifique (utile pour CSRF)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Fonction pour formater une date
function formatDate(dateString) {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }),
        time: date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    };
}

// Fonction simple pour les appels API sans authentification
async function fetchApi(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erreur API (${endpoint}):`, error);
        throw error;
    }
}

// Fonction pour les appels API avec authentification
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('api_token');
    if (!token) {
        throw new Error('Non authentifié');
    }
    
    const defaultOptions = {
        method: options.method || 'GET',
        headers: {
            'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    };
    
    if (options.body) {
        defaultOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
                
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('api_token');
                window.location.href = '/index.html';
                throw new Error('Session expirée');
            }
            
            try {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur serveur');
            } catch (e) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

// Fonctions modales
function showModal(modal) {
    if (modal) modal.style.display = 'flex';
}

function hideModal(modal) {
    if (modal) modal.style.display = 'none';
}

// Fonction pour récupérer les événements depuis l'API sans authentification
async function fetchEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        throw error;
    }
}

// Fonction pour récupérer un événement spécifique sans authentification
async function fetchEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'événement ${eventId}:`, error);
        throw error;
    }
}

// Fonction pour récupérer les tickets d'un utilisateur connecté
async function fetchTickets() {
    try {
        const token = localStorage.getItem('api_token');
        if (!token) {
            console.log('Utilisateur non connecté');
            return [];
        }

        const response = await fetch(`${API_BASE_URL}/user/tickets/`, {
            headers: {
                'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('api_token');
                throw new Error('Session expirée');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des tickets:', error);
        
        // Fallback sur localStorage
        const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
        const userTickets = allTickets.filter(ticket => 
            ticket.user === localStorage.getItem('username') || 
            String(ticket.user_id) === localStorage.getItem('user_id')
        );
        return userTickets;
    }
}

// Export des fonctions
window.API_BASE_URL = API_BASE_URL;
window.getCookie = getCookie;
window.fetchApi = fetchApi;
window.apiCall = apiCall;
window.formatDate = formatDate;
window.showModal = showModal;
window.hideModal = hideModal;
window.fetchEvents = fetchEvents;
window.fetchEvent = fetchEvent;
window.fetchTickets = fetchTickets;