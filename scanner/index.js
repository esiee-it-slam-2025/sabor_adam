/*******************************************************************************
 * SCANNEUR DE BILLETS - PARIS 2024
 * 
 * Ce fichier gère la logique de scan et de vérification des billets via QR code.
 * Fonctionnalités principales :
 * - Scan de QR codes à partir d'images uploadées
 * - Vérification de la validité des billets via une API
 * - Mode hors-ligne avec stockage local (localStorage)
 * - Affichage des informations du billet et de son statut
 * - Validation des billets (marquage comme utilisés)
 ******************************************************************************/

// Import de la bibliothèque QR Scanner qui permet de lire les QR codes dans le navigateur
import QrScanner from './qr-scanner.min.js';

// URL de base de l'API backend - en développement local sur le port 8000
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Récupération de tous les éléments HTML nécessaires via leurs IDs
// document.getElementById() retourne l'élément HTML qui a l'ID spécifié
const fileInput = document.getElementById('file-input');        // Input pour uploader l'image
const result = document.getElementById('result');              // Conteneur des résultats
const ticketStatus = document.getElementById('ticket-status'); // Zone d'affichage du statut
const ticketDetails = document.getElementById('ticket-details'); // Zone des détails du billet
const validateSection = document.getElementById('validate-section'); // Section de validation
const validateButton = document.getElementById('validate-button');   // Bouton de validation
const cancelButton = document.getElementById('cancel-button');      // Bouton d'annulation
const loader = document.getElementById('loader');              // Indicateur de chargement

// Variable globale pour stocker l'identifiant unique du billet en cours de traitement
let currentTicketUuid = null;

/**
 * Fonction utilitaire pour récupérer la valeur d'un cookie par son nom
 * Utilisée notamment pour récupérer le token CSRF nécessaire pour les requêtes POST
 * @param {string} name - Nom du cookie à récupérer
 * @returns {string|null} - Valeur du cookie ou null si non trouvé
 */
function getCookie(name) {
    let cookieValue = null;
    // Vérifie si des cookies existent
    if (document.cookie && document.cookie !== '') {
        // Découpe la chaîne des cookies en tableau (séparés par des points-virgules)
        const cookies = document.cookie.split(';');
        // Parcourt chaque cookie
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim(); // Enlève les espaces
            // Vérifie si ce cookie correspond au nom recherché
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                // Extrait et décode la valeur du cookie
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Initialisation des écouteurs d'événements quand le DOM est chargé
 * DOMContentLoaded est déclenché quand le HTML est complètement chargé et analysé
 */
document.addEventListener('DOMContentLoaded', function() {
    // Écouteur pour détecter quand un fichier est sélectionné
    fileInput.addEventListener('change', event => {
        // Récupère le premier fichier sélectionné (files[0])
        const file = event.target.files[0];
        if (!file) return; // Sort si aucun fichier n'est sélectionné
        
        resetResults(); // Réinitialise l'affichage
        loader.classList.remove('hidden'); // Affiche le loader
        
        // Tente de scanner l'image avec QrScanner
        QrScanner.scanImage(file)
            .then(result => handleScanResult(result)) // Si succès, traite le résultat
            .catch(error => {
                loader.classList.add('hidden'); // Cache le loader
                // Affiche l'erreur à l'utilisateur
                displayError(`Impossible de lire le QR code : ${error.message}`, "N/A");
                console.error('Erreur scan:', error);
            });
    });
    
    // Écouteur pour le bouton de validation
    validateButton.addEventListener('click', () => {
        if (!currentTicketUuid) return;
        validateTicket(currentTicketUuid);
    });
    
    // Écouteur pour le bouton d'annulation
    cancelButton.addEventListener('click', () => {
        validateSection.classList.add('hidden'); // Cache la section de validation
    });
});

/**
 * Réinitialise l'interface utilisateur à son état initial
 * Appelée avant chaque nouveau scan
 */
function resetResults() {
    // Cache et réinitialise toutes les zones d'affichage
    result.classList.add('hidden');
    result.classList.remove('valid', 'invalid');
    ticketStatus.innerHTML = '';
    ticketDetails.innerHTML = '';
    validateSection.classList.add('hidden');
    currentTicketUuid = null;
}

/**
 * Traite le résultat du scan du QR code
 * @param {string|object} scanResult - Résultat du scan (peut être une chaîne ou un objet)
 */
function handleScanResult(scanResult) {
    console.log('QR Code scanné:', scanResult);
    
    // Extrait le contenu du QR code, qui peut être soit directement une chaîne
    // soit un objet avec une propriété 'data'
    const qrContent = typeof scanResult === 'string' ? scanResult : scanResult.data;
    
    // Lance la vérification du ticket avec l'UUID extrait
    verifyTicket(qrContent);
}

/**
 * Vérifie la validité d'un ticket auprès de l'API
 * @param {string} ticketUuid - Identifiant unique du ticket
 */
function verifyTicket(ticketUuid) {
    console.log('Vérification du ticket:', ticketUuid);
    currentTicketUuid = ticketUuid; // Stocke l'UUID pour utilisation ultérieure
    
    // Appel à l'API de vérification
    fetch(`${API_BASE_URL}/tickets/verify/${ticketUuid}/`)
        .then(response => {
            // Vérifie si la réponse est OK (status 200-299)
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Billet non trouvé dans le système');
                }
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json(); // Parse la réponse en JSON
        })
        .then(data => {
            displayTicketResult(data, ticketUuid); // Affiche le résultat
        })
        .catch(error => {
            console.error('Erreur API:', error);
            
            // En cas d'erreur, utilise le mode hors-ligne
            simulateVerifyTicket(ticketUuid);
        })
        .finally(() => {
            loader.classList.add('hidden'); // Cache toujours le loader à la fin
        });
}

/**
 * Version hors-ligne de la vérification des tickets
 * Utilise le localStorage comme base de données locale
 * @param {string} ticketUuid - Identifiant unique du ticket
 */
function simulateVerifyTicket(ticketUuid) {
    // Récupère les tickets stockés localement
    // localStorage.getItem retourne une chaîne qu'il faut parser en JSON
    const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
    
    // Recherche le ticket par son UUID
    // Gère plusieurs formats possibles d'identifiants
    const ticket = allTickets.find(t => 
        t.ticket_uuid === ticketUuid || 
        t.id === ticketUuid || 
        String(t.id) === ticketUuid
    );
    
    if (ticket) {
        // Si le ticket est trouvé, vérifie son statut
        if (ticket.status === 'USED') {
            // Ticket déjà utilisé
            const data = {
                valid: false,
                message: "Ce billet a déjà été utilisé.",
                ticket: ticket,
                used_at: ticket.used_at
            };
            displayTicketResult(data, ticketUuid);
        } else {
            // Ticket valide et non utilisé
            const data = {
                valid: true,
                message: "Billet valide.",
                ticket: ticket
            };
            displayTicketResult(data, ticketUuid);
        }
    } else {
        // Ticket non trouvé dans le stockage local
        const data = {
            valid: false,
            message: "Billet non trouvé dans le système.",
        };
        displayTicketResult(data, ticketUuid);
    }
    
    loader.classList.add('hidden');
}

/**
 * Marque un ticket comme utilisé via l'API
 * @param {string} ticketUuid - Identifiant unique du ticket
 */
function validateTicket(ticketUuid) {
    loader.classList.remove('hidden');
    validateSection.classList.add('hidden');
    
    // Appel POST à l'API pour valider le ticket
    fetch(`${API_BASE_URL}/tickets/verify/${ticketUuid}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') // Token CSRF pour sécurité
        },
        credentials: 'include' // Inclut les cookies dans la requête
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("✅ Billet marqué comme utilisé avec succès!");
                verifyTicket(ticketUuid); // Recharge les infos du ticket
            } else {
                alert(`❌ Erreur: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Erreur API:', error);
            
            // Fallback vers le mode hors-ligne
            simulateValidateTicket(ticketUuid);
        })
        .finally(() => {
            loader.classList.add('hidden');
        });
}

/**
 * Version hors-ligne de la validation des tickets
 * @param {string} ticketUuid - Identifiant unique du ticket
 */
function simulateValidateTicket(ticketUuid) {
    // Récupère les tickets du localStorage
    const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
    
    // Trouve l'index du ticket dans le tableau
    const ticketIndex = allTickets.findIndex(t => 
        t.ticket_uuid === ticketUuid || 
        t.id === ticketUuid || 
        String(t.id) === ticketUuid
    );
    
    if (ticketIndex !== -1) {
        // Marque le ticket comme utilisé avec la date actuelle
        allTickets[ticketIndex].status = 'USED';
        allTickets[ticketIndex].used_at = new Date().toISOString();
        
        // Sauvegarde les modifications dans le localStorage
        localStorage.setItem('user_tickets', JSON.stringify(allTickets));
        
        alert("✅ Billet marqué comme utilisé avec succès!");
        validateSection.classList.add('hidden');
        
        // Met à jour l'affichage
        const data = {
            valid: false,
            message: "Ce billet a déjà été utilisé.",
            ticket: allTickets[ticketIndex],
            used_at: allTickets[ticketIndex].used_at
        };
        displayTicketResult(data, ticketUuid);
    } else {
        alert("❌ Erreur: Billet non trouvé.");
    }
    
    loader.classList.add('hidden');
}

/**
 * Affiche les informations du ticket et son statut dans l'interface
 * @param {Object} data - Données du ticket et son statut
 * @param {string} ticketUuid - Identifiant unique du ticket
 */
function displayTicketResult(data, ticketUuid) {
    result.classList.remove('hidden');
    
    if (data.valid) {
        // Affichage pour un ticket valide
        result.classList.add('valid');
        result.classList.remove('invalid');
        ticketStatus.innerHTML = `
            <div class="ticket-status status-valid">
                <h3>✓ BILLET VALIDE</h3>
                <p>${data.message}</p>
            </div>
        `;
        
        validateSection.classList.remove('hidden');
        
        const ticket = data.ticket;
        const eventDetails = ticket.event_details;
        
        // Vérifie si les détails complets de l'événement sont disponibles
        if (eventDetails && eventDetails.time) {
            const matchDate = new Date(eventDetails.time);
            
            // Affiche tous les détails du match
            ticketDetails.innerHTML = `
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Match:</div>
                    <div class="ticket-info-value">${eventDetails.team_home_name} vs ${eventDetails.team_away_name}</div>
                </div>
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Date:</div>
                    <div class="ticket-info-value">${matchDate.toLocaleDateString('fr-FR')}</div>
                </div>
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Heure:</div>
                    <div class="ticket-info-value">${matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Stade:</div>
                    <div class="ticket-info-value">${eventDetails.stadium_name || 'Non précisé'}</div>
                </div>
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Catégorie:</div>
                    <div class="ticket-info-value">${ticket.ticket_type || ticket.category}</div>
                </div>
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Place:</div>
                    <div class="ticket-info-value">${ticket.seat || ticket.seat_number || 'Non assignée'}</div>
                </div>
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Référence:</div>
                    <div class="ticket-info-value">${ticket.id}</div>
                </div>
            `;
        } else {
            // Affichage minimal si les détails sont incomplets
            ticketDetails.innerHTML = `
                <div class="ticket-info-row">
                    <div class="ticket-info-label">ID du billet:</div>
                    <div class="ticket-info-value">${ticket.id || ticketUuid}</div>
                </div>
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Catégorie:</div>
                    <div class="ticket-info-value">${ticket.ticket_type || ticket.category || 'Non précisée'}</div>
                </div>
                <div class="ticket-info-row">
                    <div class="ticket-info-label">Informations:</div>
                    <div class="ticket-info-value">Détails complets non disponibles</div>
                </div>
            `;
        }
    } else {
        // Affichage pour un ticket invalide
        result.classList.add('invalid');
        result.classList.remove('valid');
        
        let statusMessage = `
            <div class="ticket-status status-invalid">
                <h3>✗ BILLET INVALIDE</h3>
                <p>${data.message}</p>
        `;
        
        // Ajoute la date d'utilisation si le ticket a déjà été utilisé
        if (data.used_at) {
            const usedDate = new Date(data.used_at);
            statusMessage += `<p>Utilisé le: ${usedDate.toLocaleDateString('fr-FR')} à ${usedDate.toLocaleTimeString('fr-FR')}</p>`;
        }
        
        statusMessage += `<p>ID scanné: ${ticketUuid}</p></div>`;
        
        ticketStatus.innerHTML = statusMessage;
        ticketDetails.innerHTML = '';
        validateSection.classList.add('hidden');
    }
}

/**
 * Affiche un message d'erreur dans l'interface
 * @param {string} errorMessage - Message d'erreur à afficher
 * @param {string} ticketUuid - Identifiant du ticket concerné
 */
function displayError(errorMessage, ticketUuid) {
    result.classList.remove('hidden');
    result.classList.add('invalid');
    result.classList.remove('valid');
    
    ticketStatus.innerHTML = `
        <div class="ticket-status status-invalid">
            <h3>✗ ERREUR</h3>
            <p>${errorMessage}</p>
            <p>ID scanné: ${ticketUuid}</p>
        </div>
    `;
    
    ticketDetails.innerHTML = '';
    validateSection.classList.add('hidden');
}