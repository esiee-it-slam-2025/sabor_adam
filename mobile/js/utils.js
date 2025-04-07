/*
Vue d'ensemble du fichier :
Ce fichier contient toutes les fonctions utilitaires réutilisables dans l'application mobile des JO Paris 2024.
Il définit notamment :
- Les configurations globales (URL de l'API)
- Les fonctions de formatage (dates, cookies)
- Les fonctions pour communiquer avec l'API (avec et sans authentification)
- Les fonctions de gestion des modales (fenêtres popup)
- Les fonctions de récupération des données (événements, tickets)
Toutes ces fonctions sont exportées globalement via l'objet window pour être accessibles partout dans l'application.
*/

// Définit l'URL de base de l'API. Toutes les requêtes vers l'API utiliseront cette URL comme préfixe
const API_BASE_URL = 'http://127.0.0.1:8000/api';

/*
Cette fonction permet de récupérer la valeur d'un cookie spécifique dans le navigateur.
Elle est notamment utilisée pour récupérer le token CSRF qui protège contre les attaques CSRF.
Paramètres :
- name : le nom du cookie à récupérer
Retourne : la valeur du cookie ou null si non trouvé
*/
function getCookie(name) {
    // Initialise la valeur de retour à null
    let cookieValue = null;
    
    // Vérifie si des cookies existent dans le navigateur
    if (document.cookie && document.cookie !== '') {
        // Sépare tous les cookies (format "cookie1=valeur1; cookie2=valeur2")
        const cookies = document.cookie.split(';');
        // Parcourt chaque cookie
        for (let i = 0; i < cookies.length; i++) {
            // Enlève les espaces au début et à la fin du cookie
            const cookie = cookies[i].trim();
            // Vérifie si ce cookie correspond au nom recherché
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                // Si oui, décode la valeur du cookie (gère les caractères spéciaux)
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break; // Sort de la boucle
            }
        }
    }
    return cookieValue;
}

/*
Cette fonction formate une date en français pour l'affichage.
Paramètres :
- dateString : une chaîne représentant une date (format ISO)
Retourne : un objet avec deux propriétés :
  - date : la date formatée (ex: "25 décembre 2024")
  - time : l'heure formatée (ex: "15:30")
*/
function formatDate(dateString) {
    // Crée un objet Date à partir de la chaîne
    const date = new Date(dateString);
    
    // Retourne un objet avec la date et l'heure formatées
    return {
        // toLocaleDateString() formate la date selon les conventions françaises
        date: date.toLocaleDateString('fr-FR', {
            day: 'numeric',    // Jour en chiffres
            month: 'long',     // Mois en toutes lettres
            year: 'numeric'    // Année en chiffres
        }),
        // toLocaleTimeString() formate l'heure selon les conventions françaises
        time: date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',   // Heures sur 2 chiffres
            minute: '2-digit'  // Minutes sur 2 chiffres
        })
    };
}

/*
Fonction simple pour faire des requêtes API sans authentification.
Utilise l'API Fetch du navigateur pour envoyer des requêtes HTTP.
Paramètres :
- endpoint : le chemin de l'API à appeler (sera ajouté après API_BASE_URL)
Retourne : les données JSON de la réponse
Lance une erreur si la requête échoue
*/
async function fetchApi(endpoint) {
    try {
        // fetch() envoie une requête HTTP et retourne une Promise
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        // Vérifie si la requête a réussi (status 200-299)
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        // Convertit la réponse en JSON et la retourne
        return await response.json();
    } catch (error) {
        // Log l'erreur et la propage
        console.error(`Erreur API (${endpoint}):`, error);
        throw error;
    }
}

/*
Fonction évoluée pour faire des requêtes API avec authentification.
Gère automatiquement le token d'authentification et les erreurs de session.
Paramètres :
- endpoint : le chemin de l'API à appeler
- options : objet contenant les options de la requête (méthode, corps, etc.)
Retourne : les données JSON de la réponse
Lance une erreur si non authentifié ou si la requête échoue
*/
async function apiCall(endpoint, options = {}) {
    // Récupère le token d'authentification du stockage local du navigateur
    const token = localStorage.getItem('api_token');
    if (!token) {
        throw new Error('Non authentifié');
    }
    
    // Prépare les options par défaut de la requête
    const defaultOptions = {
        method: options.method || 'GET', // Méthode HTTP (GET par défaut)
        headers: {
            'Authorization': `Token ${token}`, // Ajoute le token dans l'en-tête
            'Content-Type': 'application/json'  // Indique que l'on envoie du JSON
        },
        credentials: 'include' // Inclut les cookies dans la requête
    };
    
    // Si un corps de requête est fourni, le convertit en JSON
    if (options.body) {
        defaultOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    
    try {
        // Envoie la requête avec fetch()
        const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
                
        // Gestion des erreurs
        if (!response.ok) {
            // Si erreur 401 (non autorisé), supprime le token et redirige vers l'accueil
            if (response.status === 401) {
                localStorage.removeItem('api_token');
                window.location.href = '/index.html';
                throw new Error('Session expirée');
            }
            
            // Tente de récupérer le message d'erreur du serveur
            try {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur serveur');
            } catch (e) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
        }
        
        // Convertit et retourne la réponse JSON
        return await response.json();
    } catch (error) {
        // Log l'erreur et la propage
        console.error('Erreur API:', error);
        throw error;
    }
}

/*
Fonctions pour gérer l'affichage/masquage des fenêtres modales (popups).
Une modale est un élément HTML avec position:fixed qui s'affiche par-dessus la page.
*/
function showModal(modal) {
    // Si la modale existe, l'affiche en flex (permet le centrage)
    if (modal) modal.style.display = 'flex';
}

function hideModal(modal) {
    // Si la modale existe, la cache
    if (modal) modal.style.display = 'none';
}

/*
Fonction qui récupère tous les événements depuis l'API.
Ne nécessite pas d'authentification.
Retourne : un tableau d'événements au format JSON
Lance une erreur si la requête échoue
*/
async function fetchEvents() {
    try {
        // Envoie une requête GET à l'endpoint /events/
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

/*
Fonction qui récupère les détails d'un événement spécifique.
Ne nécessite pas d'authentification.
Paramètres :
- eventId : l'identifiant de l'événement à récupérer
Retourne : les détails de l'événement au format JSON
Lance une erreur si la requête échoue
*/
async function fetchEvent(eventId) {
    try {
        // Envoie une requête GET à l'endpoint /events/{id}/
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

/*
Fonction qui récupère les tickets de l'utilisateur connecté.
Nécessite une authentification.
Si l'API est inaccessible, utilise les données du stockage local comme fallback.
Retourne : un tableau des tickets de l'utilisateur
*/
async function fetchTickets() {
    try {
        // Vérifie si un token d'authentification existe
        const token = localStorage.getItem('api_token');
        if (!token) {
            console.log('Utilisateur non connecté');
            return [];
        }

        // Envoie une requête authentifiée à l'endpoint des tickets
        const response = await fetch(`${API_BASE_URL}/user/tickets/`, {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        // Gestion des erreurs
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
        
        // En cas d'erreur, utilise les tickets stockés localement
        const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
        // Filtre pour ne garder que les tickets de l'utilisateur courant
        const userTickets = allTickets.filter(ticket => 
            ticket.user === localStorage.getItem('username') || 
            String(ticket.user_id) === localStorage.getItem('user_id')
        );
        return userTickets;
    }
}

// Rend toutes les fonctions accessibles globalement via l'objet window
// window est l'objet global du navigateur, accessible partout dans le code
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