/*
Vue d'ensemble du fichier :
Ce fichier gère tout ce qui concerne les billets (tickets) dans l'application mobile.
Il permet de :
- Acheter des billets pour des matchs
- Afficher les billets achetés
- Télécharger et supprimer des billets
- Gérer le fallback en mode hors-ligne via le stockage local

Le code est organisé en une classe TicketManager qui encapsule toute cette logique.
*/

// Utilisation d'une IIFE (Immediately Invoked Function Expression) pour éviter la pollution du scope global
// Cette fonction s'exécute immédiatement après sa définition
(function() {
    // Log de débogage pour confirmer le chargement du gestionnaire
    console.log("Initialisation du gestionnaire de billets...");
    
    // Définition de la classe principale qui va gérer toutes les opérations liées aux billets
    class TicketManager {
        // Le constructeur est appelé quand on crée une nouvelle instance de TicketManager
        constructor() {
            console.log("Initialisation du gestionnaire de tickets...");
            // Configure les écouteurs d'événements dès la création
            this.setupEventListeners();
            // Stocke le match actuellement sélectionné (null par défaut)
            this.currentMatch = null;
        }
        
        // Configure tous les écouteurs d'événements nécessaires
        setupEventListeners() {
            // Récupère le formulaire d'achat dans le DOM
            const purchaseForm = document.getElementById('purchase-form');
            // Si le formulaire existe, ajoute un écouteur sur sa soumission
            if (purchaseForm) {
                purchaseForm.addEventListener('submit', (e) => this.handlePurchase(e));
            }
            
            // Écouteur global pour les clics sur les boutons d'achat
            document.addEventListener('click', (e) => {
                // Vérifie si l'élément cliqué a la classe 'buy-button'
                if (e.target.classList.contains('buy-button')) {
                    // Vérifie si l'utilisateur est connecté via le gestionnaire d'authentification
                    if (!window.authManager || !window.authManager.isLoggedIn) {
                        alert('Veuillez vous connecter pour acheter des billets');
                        // Affiche la modale de connexion (showModal est une fonction définie ailleurs)
                        showModal(document.getElementById('login-modal'));
                        return;
                    }
                    // Récupère l'ID du match depuis l'attribut data-match-id du bouton
                    const matchId = e.target.dataset.matchId;
                    if (matchId) {
                        this.handleBuyButtonClick(matchId);
                    }
                }
            });
            
            // Gestion du calcul dynamique du prix total
            // Récupération des éléments du DOM nécessaires
            const categorySelect = document.getElementById('purchase-category');
            const quantityInput = document.getElementById('purchase-quantity');
            const totalPrice = document.getElementById('total-price');
            
            // Si tous les éléments existent
            if (categorySelect && quantityInput && totalPrice) {
                // Fonction pour mettre à jour le prix total
                const updateTotalPrice = () => {
                    // Définition des prix par catégorie
                    const prices = {
                        'STANDARD': 50,
                        'VIP': 100,
                        'PREMIUM': 150
                    };
                    // Récupère le prix de la catégorie sélectionnée (50 par défaut)
                    const price = prices[categorySelect.value] || 50;
                    // Convertit la quantité en nombre (1 par défaut)
                    const quantity = parseInt(quantityInput.value) || 1;
                    // Met à jour l'affichage du prix total
                    totalPrice.textContent = price * quantity;
                };
                
                // Ajoute les écouteurs pour mettre à jour le prix quand la catégorie ou la quantité change
                categorySelect.addEventListener('change', updateTotalPrice);
                quantityInput.addEventListener('input', updateTotalPrice);
            }
            
            // Si on est sur la page des tickets, charge les tickets de l'utilisateur
            if (window.location.pathname.includes('ticket.html')) {
                this.loadUserTickets();
            }
        }
        
        // Gère le clic sur un bouton d'achat
        async handleBuyButtonClick(matchId) {
            try {
                // Tente de récupérer les détails du match depuis l'API
                // fetch est une fonction native qui permet de faire des requêtes HTTP
                const response = await fetch(`${API_BASE_URL}/events/${matchId}/`);
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des détails du match");
                }
                
                // Convertit la réponse en JSON
                const match = await response.json();
                
                if (!match) {
                    throw new Error("Match non trouvé");
                }
                
                // Stocke le match courant
                this.currentMatch = match;
                
                // Met à jour l'ID de l'événement dans le formulaire
                const eventIdInput = document.getElementById('purchase-event-id');
                if (eventIdInput) {
                    eventIdInput.value = matchId;
                }
                
                // Met à jour l'affichage des détails du match dans la modal
                const matchDetails = document.querySelector('.match-details');
                if (matchDetails) {
                    // formatDate est une fonction utilitaire définie ailleurs qui formate les dates
                    const formattedDate = formatDate(match.time);
                    // Utilise un template literal pour créer le HTML
                    matchDetails.innerHTML = `
                        <h3>${match.name || 'Match'}</h3>
                        <p>${match.team_home_name} vs ${match.team_away_name}</p>
                        <p>Date: ${formattedDate.date} à ${formattedDate.time}</p>
                        <p>Stade: ${match.stadium_name}</p>
                    `;
                }
                
                // Affiche la modal d'achat
                showModal(document.getElementById('ticket-modal'));
                
            } catch (error) {
                // En cas d'erreur avec l'API
                console.error("Erreur:", error);
                
                // Fallback : tente de récupérer les données localement
                // fetchEvent est une fonction définie ailleurs qui récupère les données en local
                fetchEvent(matchId).then(match => {
                    this.currentMatch = match;
                    
                    // Même logique que précédemment mais avec les données locales
                    const eventIdInput = document.getElementById('purchase-event-id');
                    if (eventIdInput) {
                        eventIdInput.value = matchId;
                    }
                    
                    const matchDetails = document.querySelector('.match-details');
                    if (matchDetails) {
                        const formattedDate = formatDate(match.time);
                        matchDetails.innerHTML = `
                            <h3>${match.name || 'Match'}</h3>
                            <p>${match.team_home_name} vs ${match.team_away_name}</p>
                            <p>Date: ${formattedDate.date} à ${formattedDate.time}</p>
                            <p>Stade: ${match.stadium_name}</p>
                        `;
                    }
                    
                    showModal(document.getElementById('ticket-modal'));
                }).catch(error => {
                    alert(`Erreur lors de la récupération du match: ${error.message}`);
                });
            }
        }
        
        // Gère la soumission du formulaire d'achat
        async handlePurchase(event) {
            // Empêche le comportement par défaut du formulaire (rechargement de la page)
            event.preventDefault();
            console.log("Formulaire soumis");
            
            try {
                // Vérifie si l'utilisateur est connecté
                if (!window.authManager || !window.authManager.isLoggedIn) {
                    alert("Veuillez vous connecter pour acheter un billet");
                    if (window.authManager) {
                        window.authManager.showLoginModal();
                    }
                    return;
                }
                
                // Récupère les données du formulaire
                const form = event.target;
                // L'opérateur ?. (optional chaining) permet d'éviter les erreurs si l'élément n'existe pas
                const eventId = form.querySelector('[name="event_id"]')?.value;
                const category = form.querySelector('[name="category"]')?.value;
                const quantity = parseInt(form.querySelector('[name="quantity"]')?.value || 1);
                
                console.log("Données du formulaire:", { eventId, category, quantity });
                
                // Vérifie que les données requises sont présentes
                if (!eventId || !category) {
                    console.error('Données du formulaire manquantes', { eventId, category, quantity });
                    alert('Erreur: Données du formulaire incomplètes. Veuillez réessayer.');
                    return;
                }
                
                // Récupère le token d'authentification du stockage local
                const token = localStorage.getItem('api_token');
                if (!token) {
                    throw new Error('Non authentifié');
                }
                
                // Récupère le token CSRF (protection contre les attaques CSRF)
                // getCookie est une fonction utilitaire définie ailleurs
                const csrftoken = getCookie('csrftoken');
                
                // Prépare les données pour l'API
                const purchaseData = {
                    event_id: eventId,
                    category: category,
                    quantity: quantity
                };
                
                // Envoie la requête d'achat à l'API
                const response = await fetch(`${API_BASE_URL}/tickets/purchase/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify(purchaseData),
                    credentials: 'include' // Inclut les cookies dans la requête
                });
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Réponse de l\'API achat:', data);
                
                alert("Achat réussi ! Vous pouvez consulter votre billet dans la section 'Mes billets'.");
                
                // Ferme la modale d'achat
                hideModal(document.getElementById('ticket-modal'));
                
                // Redirige vers la page des billets
                window.location.href = 'ticket.html';
                
            } catch (error) {
                console.error("Erreur lors de l'achat:", error);
                
                // En cas d'erreur avec l'API, tente un achat local (fallback)
                try {
                    // Définit les prix localement
                    const prices = {
                        'STANDARD': 50,
                        'VIP': 100,
                        'PREMIUM': 150
                    };
                    const price = prices[form.querySelector('[name="category"]').value] || 50;
                    const eventId = form.querySelector('[name="event_id"]').value;
                    const category = form.querySelector('[name="category"]').value;
                    const quantity = parseInt(form.querySelector('[name="quantity"]').value || 1);
                    
                    // Appelle la méthode de fallback
                    this.handleLocalPurchase(eventId, category, quantity, price);
                } catch (fallbackError) {
                    console.error("Erreur lors du fallback local:", fallbackError);
                    alert(`Erreur lors de l'achat: ${error.message}. Veuillez réessayer.`);
                }
            }
        }
        
        // Gère l'achat en mode hors-ligne (stockage local)
        async handleLocalPurchase(eventId, category, quantity, price) {
            try {
                // Récupère les détails du match localement
                const match = await fetchEvent(eventId);
                
                // Récupère les tickets existants du stockage local
                const tickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
                
                // Crée un ticket individuel pour chaque place achetée
                for (let i = 0; i < quantity; i++) {
                    // Crée un ID unique basé sur le timestamp et l'index
                    const ticketId = Date.now().toString() + '-' + i;
                    
                    // Crée l'objet ticket avec toutes ses propriétés
                    const newTicket = {
                        id: ticketId,
                        user: window.authManager.username,
                        user_id: window.authManager.userId,
                        event: eventId,
                        event_details: match,
                        category: category,
                        ticket_type: category,
                        quantity: 1, // Un ticket par place
                        price: price,
                        purchase_date: new Date().toISOString(),
                        status: 'ACTIVE',
                        ticket_uuid: `TICKET-${ticketId}-${eventId}`,
                        // Génère un numéro de siège aléatoire pour plus de réalisme
                        seat: `SECTION-${category}-${Math.floor(Math.random() * 100) + 1}`
                    };
                    
                    // Ajoute le nouveau ticket à la liste
                    tickets.push(newTicket);
                }
                
                // Sauvegarde la liste mise à jour dans le stockage local
                localStorage.setItem('user_tickets', JSON.stringify(tickets));
                
                alert("Achat réussi ! Vous pouvez consulter votre billet dans la section 'Mes billets'.");
                
                // Ferme la modale d'achat
                hideModal(document.getElementById('ticket-modal'));
                
                // Redirige vers la page des billets
                window.location.href = 'ticket.html';
                
            } catch (error) {
                console.error("Erreur lors de l'achat local:", error);
                alert(`Erreur lors de l'achat: ${error.message}`);
            }
        }
        
        // Charge et affiche les tickets de l'utilisateur
        async loadUserTickets() {
            try {
                // Vérifie si l'utilisateur est connecté
                if (!window.authManager || !window.authManager.isLoggedIn) {
                    window.location.href = 'index.html';
                    return;
                }
                
                // Vérifie si le token est présent
                const token = localStorage.getItem('api_token');
                if (!token) {
                    throw new Error('Non authentifié');
                }
                
                // Récupère le conteneur des tickets
                const ticketsContainer = document.getElementById('tickets-container');
                if (!ticketsContainer) return;
                
                // Affiche un message de chargement
                ticketsContainer.innerHTML = '<div class="loading">Chargement de vos billets...</div>';
                
                // Récupère les tickets depuis l'API
                const response = await fetch(`${API_BASE_URL}/user/tickets/`, {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                const tickets = await response.json();
                console.log('Tickets récupérés:', tickets);
                
                // Si aucun ticket n'est trouvé
                if (tickets.length === 0) {
                    ticketsContainer.innerHTML = `
                        <div class="no-tickets">
                            <p>Vous n'avez pas encore de billets.</p>
                            <a href="index.html" class="btn">Acheter des billets</a>
                        </div>
                    `;
                    return;
                }
                
                // Affiche les tickets
                this.displayTickets(tickets);
                
            } catch (error) {
                console.error('Erreur lors du chargement des tickets:', error);
                
                // Fallback : récupère les tickets du stockage local
                const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
                // Filtre les tickets pour ne garder que ceux de l'utilisateur courant
                const userTickets = allTickets.filter(ticket => 
                    ticket.user === window.authManager.username || 
                    String(ticket.user_id) === String(window.authManager.userId)
                );
                
                const ticketsContainer = document.getElementById('tickets-container');
                if (ticketsContainer) {
                    if (userTickets.length === 0) {
                        ticketsContainer.innerHTML = `
                            <div class="no-tickets">
                                <p>Vous n'avez pas encore de billets.</p>
                                <a href="index.html" class="btn">Acheter des billets</a>
                            </div>
                        `;
                    } else {
                        this.displayTickets(userTickets);
                    }
                }
            }
        }
        
        // Affiche les tickets dans l'interface
        displayTickets(tickets) {
            const ticketsContainer = document.getElementById('tickets-container');
            if (!ticketsContainer) return;
            
            // Si aucun ticket n'est trouvé
            if (!tickets || tickets.length === 0) {
                ticketsContainer.innerHTML = `
                    <div class="no-tickets">
                        <p>Vous n'avez pas encore de billets.</p>
                        <a href="index.html" class="btn">Voir les matches disponibles</a>
                    </div>`;
                return;
            }
            
            // Regroupe les tickets par événement pour un affichage organisé
            const ticketsByEvent = {};
            tickets.forEach(ticket => {
                const eventId = ticket.event || (ticket.event_details ? ticket.event_details.id : null);
                if (!eventId) return;
                
                if (!ticketsByEvent[eventId]) {
                    ticketsByEvent[eventId] = [];
                }
                ticketsByEvent[eventId].push(ticket);
            });
            
            let html = '';
            
            // Génère le HTML pour chaque groupe de tickets
            Object.keys(ticketsByEvent).forEach(eventId => {
                const eventTickets = ticketsByEvent[eventId];
                const firstTicket = eventTickets[0];
                const eventDetails = firstTicket.event_details || firstTicket;
                
                // Crée l'en-tête du groupe de tickets
                html += `
                    <div class="ticket-group">
                        <div class="ticket-event-header">
                            <h3>${eventDetails.team_home_name} vs ${eventDetails.team_away_name}</h3>
                            <p>${formatDate(eventDetails.time).date} à ${formatDate(eventDetails.time).time}</p>
                            <p>${eventDetails.stadium_name || 'Stade non précisé'}</p>
                        </div>
                        <div class="tickets-list">
                `;
                
                // Génère le HTML pour chaque ticket individuel
                eventTickets.forEach(ticket => {
                    html += `
                        <div class="ticket-card">
                            <div class="ticket-info">
                                <p><strong>Type:</strong> ${ticket.ticket_type || ticket.category}</p>
                                <p><strong>Prix:</strong> ${ticket.price} €</p>
                                <p><strong>Place:</strong> ${ticket.seat || ticket.seat_number || 'Non assignée'}</p>
                                <p><strong>Date d'achat:</strong> ${formatDate(ticket.purchase_date).date}</p>
                                <p><strong>Statut:</strong> ${ticket.status || 'ACTIVE'}</p>
                                <p><strong>Référence:</strong> #${typeof ticket.id === 'string' ? ticket.id.substring(0, 8) : ticket.id}</p>
                            </div>
                            <div class="ticket-qr">
                                <canvas id="qrcode-${ticket.id}" width="100" height="100"></canvas>
                                <div class="ticket-actions">
                                    <button class="download-btn" data-ticket-id="${ticket.id}">
                                        Télécharger ce billet
                                    </button>
                                    <button class="delete-btn" data-ticket-id="${ticket.id}" onclick="deleteTicketDirectly('${ticket.id}')">
                                        Supprimer ce billet
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            // Insère le HTML généré dans le conteneur
            ticketsContainer.innerHTML = html;
            
            // Génère les QR codes et configure les boutons après un court délai
            // Le délai permet d'assurer que le DOM est bien mis à jour
            setTimeout(() => {
                // Génère un QR code pour chaque ticket
                tickets.forEach(ticket => {
                    const canvasId = `qrcode-${ticket.id}`;
                    const canvas = document.getElementById(canvasId);
                    if (canvas) {
                        try {
                            // QRious est une bibliothèque externe pour générer des QR codes
                            new QRious({
                                element: canvas,
                                value: ticket.ticket_uuid || String(ticket.id),
                                size: 100
                            });
                        } catch (error) {
                            console.error(`Erreur QR pour le billet ${ticket.id}:`, error);
                        }
                    }
                });
                
                // Configure les boutons de téléchargement
                document.querySelectorAll('.download-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const ticketId = e.target.dataset.ticketId;
                        this.downloadTicket(ticketId, tickets);
                    });
                });
                
                // Configure les boutons de suppression
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const ticketId = e.target.dataset.ticketId;
                        this.deleteTicket(ticketId);
                    });
                });
            }, 100);
        }
        
        // Télécharge un ticket sous forme d'image
        downloadTicket(ticketId, tickets) {
            // Trouve le ticket correspondant
            const ticket = tickets.find(t => String(t.id) === String(ticketId));
            if (!ticket) {
                alert('Billet non trouvé');
                return;
            }
            
            // Récupère le canvas du QR code
            const canvas = document.getElementById(`qrcode-${ticketId}`);
            if (canvas) {
                // Convertit le canvas en URL de données
                const dataUrl = canvas.toDataURL('image/png');
                // Crée un lien de téléchargement
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `ticket-${ticketId}.png`;
                // Ajoute temporairement le lien au document et déclenche le téléchargement
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert('QR Code non disponible pour ce billet.');
            }
        }
        
        // Supprime un ticket
        async deleteTicket(ticketId) {
            console.log("Suppression du billet ID:", ticketId);
            
            // Demande confirmation à l'utilisateur
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce billet ? Cette action est irréversible.')) {
                return;
            }
            
            // Tente de supprimer via l'API
            try {
                const csrftoken = getCookie('csrftoken');
                const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Token ${window.authManager.token}`,
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Erreur lors de la suppression du billet');
                }
                
                alert("Billet supprimé avec succès!");
                window.location.reload();
                
            } catch (error) {
                console.error('Erreur API suppression:', error);
                
                // Fallback : suppression locale
                try {
                    // Récupère tous les tickets du stockage local
                    const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
                    console.log("Total des billets avant suppression:", allTickets.length);
                    
                    // Trouve l'index du ticket à supprimer
                    const ticketIndex = allTickets.findIndex(t => String(t.id) === String(ticketId));
                    console.log("Index du billet à supprimer:", ticketIndex);
                    
                    if (ticketIndex === -1) {
                        alert("Billet non trouvé!");
                        return;
                    }
                    
                    // Supprime le ticket du tableau
                    allTickets.splice(ticketIndex, 1);
                    console.log("Total des billets après suppression:", allTickets.length);
                    
                    // Sauvegarde la liste mise à jour
                    localStorage.setItem('user_tickets', JSON.stringify(allTickets));
                    
                    alert("Billet supprimé avec succès!");
                    
                    // Rafraîchit la page pour mettre à jour l'affichage
                    window.location.reload();
                } catch (error) {
                    console.error("Erreur lors de la suppression:", error);
                    alert("Erreur lors de la suppression: " + error.message);
                }
            }
        }
    }
    
    // Crée une instance unique du gestionnaire de tickets et l'expose globalement
    window.ticketManager = new TicketManager();
})();