// Importez QrScanner au début de votre fichier
import QrScanner from './qr-scanner.min.js';

// Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Éléments DOM
const fileInput = document.getElementById('file-input');
const result = document.getElementById('result');
const ticketStatus = document.getElementById('ticket-status');
const ticketDetails = document.getElementById('ticket-details');
const validateSection = document.getElementById('validate-section');
const validateButton = document.getElementById('validate-button');
const cancelButton = document.getElementById('cancel-button');
const loader = document.getElementById('loader');

// Variable pour stocker l'UUID du ticket
let currentTicketUuid = null;

// Récupérer un cookie (pour CSRF)
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

document.addEventListener('DOMContentLoaded', function() {
    // Scanner via un fichier image
    fileInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (!file) return;
        
        resetResults();
        loader.classList.remove('hidden');
        
        QrScanner.scanImage(file)
            .then(result => handleScanResult(result))
            .catch(error => {
                loader.classList.add('hidden');
                displayError(`Impossible de lire le QR code : ${error.message}`, "N/A");
                console.error('Erreur scan:', error);
            });
    });
    
    // Gérer la validation du billet
    validateButton.addEventListener('click', () => {
        if (!currentTicketUuid) return;
        validateTicket(currentTicketUuid);
    });
    
    // Annuler la validation
    cancelButton.addEventListener('click', () => {
        validateSection.classList.add('hidden');
    });
});

// Réinitialiser les résultats
function resetResults() {
    result.classList.add('hidden');
    result.classList.remove('valid', 'invalid');
    ticketStatus.innerHTML = '';
    ticketDetails.innerHTML = '';
    validateSection.classList.add('hidden');
    currentTicketUuid = null;
}

// Fonction pour gérer le résultat du scan
function handleScanResult(scanResult) {
    console.log('QR Code scanné:', scanResult);
    
    // Vérifier si c'est une chaîne ou un objet
    const qrContent = typeof scanResult === 'string' ? scanResult : scanResult.data;
    
    // Vérifier si le ticket existe dans le système
    verifyTicket(qrContent);
}

// Fonction pour vérifier la validité du ticket via l'API
function verifyTicket(ticketUuid) {
    console.log('Vérification du ticket:', ticketUuid);
    currentTicketUuid = ticketUuid;
    
    // Faire l'appel API pour vérifier le ticket
    fetch(`${API_BASE_URL}/tickets/verify/${ticketUuid}/`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Billet non trouvé dans le système');
                }
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayTicketResult(data, ticketUuid);
        })
        .catch(error => {
            console.error('Erreur API:', error);
            
            // Fallback vers le stockage local
            simulateVerifyTicket(ticketUuid);
        })
        .finally(() => {
            loader.classList.add('hidden');
        });
}

// Fonction pour simuler la vérification sans backend
function simulateVerifyTicket(ticketUuid) {
    // Récupérer les billets du localStorage
    const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
    
    // Rechercher le billet par son UUID
    const ticket = allTickets.find(t => 
        t.ticket_uuid === ticketUuid || 
        t.id === ticketUuid || 
        String(t.id) === ticketUuid
    );
    
    if (ticket) {
        // Vérifier si le billet a déjà été utilisé
        if (ticket.status === 'USED') {
            const data = {
                valid: false,
                message: "Ce billet a déjà été utilisé.",
                ticket: ticket,
                used_at: ticket.used_at
            };
            displayTicketResult(data, ticketUuid);
        } else {
            // Simuler la réponse API avec un billet valide
            const data = {
                valid: true,
                message: "Billet valide.",
                ticket: ticket
            };
            displayTicketResult(data, ticketUuid);
        }
    } else {
        // Simuler la réponse API avec un billet invalide
        const data = {
            valid: false,
            message: "Billet non trouvé dans le système.",
        };
        displayTicketResult(data, ticketUuid);
    }
    
    loader.classList.add('hidden');
}

// Fonction pour valider un billet (le marquer comme utilisé)
function validateTicket(ticketUuid) {
    // Afficher le loader
    loader.classList.remove('hidden');
    validateSection.classList.add('hidden');
    
    // Appel API pour marquer le billet comme utilisé
    fetch(`${API_BASE_URL}/tickets/verify/${ticketUuid}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include'
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
                // Recharger les informations du billet
                verifyTicket(ticketUuid);
            } else {
                alert(`❌ Erreur: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Erreur API:', error);
            
            // Fallback vers le stockage local
            simulateValidateTicket(ticketUuid);
        })
        .finally(() => {
            loader.classList.add('hidden');
        });
}

// Fonction pour simuler la validation du billet sans backend
function simulateValidateTicket(ticketUuid) {
    // Récupérer les billets du localStorage
    const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
    
    // Trouver l'index du billet
    const ticketIndex = allTickets.findIndex(t => 
        t.ticket_uuid === ticketUuid || 
        t.id === ticketUuid || 
        String(t.id) === ticketUuid
    );
    
    if (ticketIndex !== -1) {
        // Marquer le billet comme utilisé
        allTickets[ticketIndex].status = 'USED';
        allTickets[ticketIndex].used_at = new Date().toISOString();
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('user_tickets', JSON.stringify(allTickets));
        
        alert("✅ Billet marqué comme utilisé avec succès!");
        validateSection.classList.add('hidden');
        
        // Mettre à jour l'affichage
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

// Fonction pour afficher le résultat de la vérification
function displayTicketResult(data, ticketUuid) {
    result.classList.remove('hidden');
    
    if (data.valid) {
        // Ticket valide
        result.classList.add('valid');
        result.classList.remove('invalid');
        ticketStatus.innerHTML = `
            <div class="ticket-status status-valid">
                <h3>✓ BILLET VALIDE</h3>
                <p>${data.message}</p>
            </div>
        `;
        
        // Afficher l'option de validation
        validateSection.classList.remove('hidden');
        
        // Détails du ticket
        const ticket = data.ticket;
        const eventDetails = ticket.event_details;
        
        // Vérifier si les détails de l'événement existent
        if (eventDetails && eventDetails.time) {
            const matchDate = new Date(eventDetails.time);
            
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
            // Gérer le cas où les détails de l'événement sont manquants
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
        // Ticket invalide
        result.classList.add('invalid');
        result.classList.remove('valid');
        
        // Messages spécifiques selon le type d'erreur
        let statusMessage = `
            <div class="ticket-status status-invalid">
                <h3>✗ BILLET INVALIDE</h3>
                <p>${data.message}</p>
        `;
        
        if (data.used_at) {
            const usedDate = new Date(data.used_at);
            statusMessage += `<p>Utilisé le: ${usedDate.toLocaleDateString('fr-FR')} à ${usedDate.toLocaleTimeString('fr-FR')}</p>`;
        }
        
        statusMessage += `<p>ID scanné: ${ticketUuid}</p></div>`;
        
        ticketStatus.innerHTML = statusMessage;
        ticketDetails.innerHTML = '';
        
        // Cacher l'option de validation
        validateSection.classList.add('hidden');
    }
}

// Fonction pour afficher une erreur
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