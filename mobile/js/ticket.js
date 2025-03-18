// Gestionnaire de billets
(function() {
    console.log("Initialisation du gestionnaire de billets...");
    
    class TicketManager {
        constructor() {
            console.log("Initialisation du gestionnaire de tickets...");
            this.setupEventListeners();
            this.currentMatch = null;
        }
        
        setupEventListeners() {
            // Écouteur pour le formulaire d'achat
            const purchaseForm = document.getElementById('purchase-form');
            if (purchaseForm) {
                purchaseForm.addEventListener('submit', (e) => this.handlePurchase(e));
            }
            
            // Écouteur pour les boutons d'achat
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('buy-button')) {
                    if (!window.authManager || !window.authManager.isLoggedIn) {
                        alert('Veuillez vous connecter pour acheter des billets');
                        showModal(document.getElementById('login-modal'));
                        return;
                    }
                    const matchId = e.target.dataset.matchId;
                    if (matchId) {
                        this.handleBuyButtonClick(matchId);
                    }
                }
            });
            
            // Mise à jour du prix total
            const categorySelect = document.getElementById('purchase-category');
            const quantityInput = document.getElementById('purchase-quantity');
            const totalPrice = document.getElementById('total-price');
            
            if (categorySelect && quantityInput && totalPrice) {
                const updateTotalPrice = () => {
                    const prices = {
                        'STANDARD': 50,
                        'VIP': 100,
                        'PREMIUM': 150
                    };
                    const price = prices[categorySelect.value] || 50;
                    const quantity = parseInt(quantityInput.value) || 1;
                    totalPrice.textContent = price * quantity;
                };
                
                categorySelect.addEventListener('change', updateTotalPrice);
                quantityInput.addEventListener('input', updateTotalPrice);
            }
            
            // Si nous sommes sur la page des tickets, charger les tickets de l'utilisateur
            if (window.location.pathname.includes('ticket.html')) {
                this.loadUserTickets();
            }
        }
        
        async handleBuyButtonClick(matchId) {
            try {
                // Récupérer les détails du match depuis l'API
                const response = await fetch(`${API_BASE_URL}/events/${matchId}/`);
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des détails du match");
                }
                
                const match = await response.json();
                
                if (!match) {
                    throw new Error("Match non trouvé");
                }
                
                this.currentMatch = match;
                
                // Définir l'ID de l'événement dans le formulaire
                const eventIdInput = document.getElementById('purchase-event-id');
                if (eventIdInput) {
                    eventIdInput.value = matchId;
                }
                
                // Afficher les détails du match dans la modal
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
                
                // Afficher la modal
                showModal(document.getElementById('ticket-modal'));
                
            } catch (error) {
                console.error("Erreur:", error);
                
                // Fallback vers la récupération locale des données
                fetchEvent(matchId).then(match => {
                    this.currentMatch = match;
                    
                    // Définir l'ID de l'événement dans le formulaire
                    const eventIdInput = document.getElementById('purchase-event-id');
                    if (eventIdInput) {
                        eventIdInput.value = matchId;
                    }
                    
                    // Afficher les détails du match dans la modal
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
                    
                    // Afficher la modal
                    showModal(document.getElementById('ticket-modal'));
                }).catch(error => {
                    alert(`Erreur lors de la récupération du match: ${error.message}`);
                });
            }
        }
        
        // Modifiez la fonction handlePurchase dans mobile/js/ticket.js

        async handlePurchase(event) {
            event.preventDefault();
            console.log("Formulaire soumis");
            
            try {
                // Vérifier si l'utilisateur est connecté
                if (!window.authManager || !window.authManager.isLoggedIn) {
                    alert("Veuillez vous connecter pour acheter un billet");
                    if (window.authManager) {
                        window.authManager.showLoginModal();
                    }
                    return;
                }
                
                // Récupérer les valeurs du formulaire
                const form = event.target;
                const eventId = form.querySelector('[name="event_id"]')?.value;
                const category = form.querySelector('[name="category"]')?.value;
                const quantity = parseInt(form.querySelector('[name="quantity"]')?.value || 1);
                
                console.log("Données du formulaire:", { eventId, category, quantity });
                
                // Vérifier que toutes les valeurs sont présentes
                if (!eventId || !category) {
                    console.error('Données du formulaire manquantes', { eventId, category, quantity });
                    alert('Erreur: Données du formulaire incomplètes. Veuillez réessayer.');
                    return;
                }
                
                // Récupérer le token
                const token = localStorage.getItem('api_token');
                if (!token) {
                    throw new Error('Non authentifié');
                }
                
                // Obtenir le token CSRF
                const csrftoken = getCookie('csrftoken');
                
                // Préparer les données pour l'achat
                const purchaseData = {
                    event_id: eventId,
                    category: category,
                    quantity: quantity
                };
                
                // Appel API pour l'achat de ticket
                const response = await fetch(`${API_BASE_URL}/tickets/purchase/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify(purchaseData),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Réponse de l\'API achat:', data);
                
                alert("Achat réussi ! Vous pouvez consulter votre billet dans la section 'Mes billets'.");
                
                // Fermer la modale
                hideModal(document.getElementById('ticket-modal'));
                
                // Rediriger vers la page des billets
                window.location.href = 'ticket.html';
                
            } catch (error) {
                console.error("Erreur lors de l'achat:", error);
                
                // Si erreur avec l'API, essayer la méthode locale (fallback)
                try {
                    const prices = {
                        'STANDARD': 50,
                        'VIP': 100,
                        'PREMIUM': 150
                    };
                    const price = prices[form.querySelector('[name="category"]').value] || 50;
                    const eventId = form.querySelector('[name="event_id"]').value;
                    const category = form.querySelector('[name="category"]').value;
                    const quantity = parseInt(form.querySelector('[name="quantity"]').value || 1);
                    
                    // Appeler la méthode de fallback
                    this.handleLocalPurchase(eventId, category, quantity, price);
                } catch (fallbackError) {
                    console.error("Erreur lors du fallback local:", fallbackError);
                    alert(`Erreur lors de l'achat: ${error.message}. Veuillez réessayer.`);
                }
            }
        }
        
        async handleLocalPurchase(eventId, category, quantity, price) {
            try {
                const match = await fetchEvent(eventId);
                
                // Récupérer les tickets du stockage local
                const tickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
                
                // Créer des tickets individuels pour chaque quantité
                for (let i = 0; i < quantity; i++) {
                    // Créer un nouvel identifiant unique pour chaque ticket individuel
                    const ticketId = Date.now().toString() + '-' + i;
                    
                    // Créer le nouveau ticket individuel
                    const newTicket = {
                        id: ticketId,
                        user: window.authManager.username,
                        user_id: window.authManager.userId,
                        event: eventId,
                        event_details: match,
                        category: category,
                        ticket_type: category,
                        quantity: 1, // Chaque ticket est pour 1 place
                        price: price,
                        purchase_date: new Date().toISOString(),
                        status: 'ACTIVE',
                        ticket_uuid: `TICKET-${ticketId}-${eventId}`,
                        seat: `SECTION-${category}-${Math.floor(Math.random() * 100) + 1}` // Ajoute une section aléatoire pour plus de réalisme
                    };
                    
                    // Ajouter le ticket individuel à la liste
                    tickets.push(newTicket);
                }
                
                // Sauvegarder la liste dans le stockage local
                localStorage.setItem('user_tickets', JSON.stringify(tickets));
                
                alert("Achat réussi ! Vous pouvez consulter votre billet dans la section 'Mes billets'.");
                
                // Fermer la modale
                hideModal(document.getElementById('ticket-modal'));
                
                // Rediriger vers la page des billets
                window.location.href = 'ticket.html';
                
            } catch (error) {
                console.error("Erreur lors de l'achat local:", error);
                alert(`Erreur lors de l'achat: ${error.message}`);
            }
        }
        
        // Dans mobile/js/ticket.js, modifiez la fonction loadUserTickets()

        async loadUserTickets() {
            try {
                if (!window.authManager || !window.authManager.isLoggedIn) {
                    window.location.href = 'index.html';
                    return;
                }
                
                const token = localStorage.getItem('api_token');
                if (!token) {
                    throw new Error('Non authentifié');
                }
                
                const ticketsContainer = document.getElementById('tickets-container');
                if (!ticketsContainer) return;
                
                ticketsContainer.innerHTML = '<div class="loading">Chargement de vos billets...</div>';
                
                // Appel API pour récupérer les tickets de l'utilisateur
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
                
                if (tickets.length === 0) {
                    ticketsContainer.innerHTML = `
                        <div class="no-tickets">
                            <p>Vous n'avez pas encore de billets.</p>
                            <a href="index.html" class="btn">Acheter des billets</a>
                        </div>
                    `;
                    return;
                }
                
                this.displayTickets(tickets);
                
            } catch (error) {
                console.error('Erreur lors du chargement des tickets:', error);
                
                // Fallback vers le stockage local
                const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
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
        
        displayTickets(tickets) {
            const ticketsContainer = document.getElementById('tickets-container');
            if (!ticketsContainer) return;
            
            if (!tickets || tickets.length === 0) {
                ticketsContainer.innerHTML = `
                    <div class="no-tickets">
                        <p>Vous n'avez pas encore de billets.</p>
                        <a href="index.html" class="btn">Voir les matches disponibles</a>
                    </div>`;
                return;
            }
            
            // Regrouper les tickets par événement
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
            
            // Générer le HTML pour chaque groupe de tickets
            Object.keys(ticketsByEvent).forEach(eventId => {
                const eventTickets = ticketsByEvent[eventId];
                const firstTicket = eventTickets[0];
                const eventDetails = firstTicket.event_details || firstTicket;
                
                html += `
                    <div class="ticket-group">
                        <div class="ticket-event-header">
                            <h3>${eventDetails.team_home_name} vs ${eventDetails.team_away_name}</h3>
                            <p>${formatDate(eventDetails.time).date} à ${formatDate(eventDetails.time).time}</p>
                            <p>${eventDetails.stadium_name || 'Stade non précisé'}</p>
                        </div>
                        <div class="tickets-list">
                `;
                
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
            
            ticketsContainer.innerHTML = html;
            
            // Générer les QR codes
            setTimeout(() => {
                tickets.forEach(ticket => {
                    const canvasId = `qrcode-${ticket.id}`;
                    const canvas = document.getElementById(canvasId);
                    if (canvas) {
                        try {
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
                
                // Ajouter les écouteurs pour le téléchargement
                document.querySelectorAll('.download-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const ticketId = e.target.dataset.ticketId;
                        this.downloadTicket(ticketId, tickets);
                    });
                });
                
                // Ajouter les écouteurs pour la suppression
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const ticketId = e.target.dataset.ticketId;
                        this.deleteTicket(ticketId);
                    });
                });
            }, 100);
        }
        
        downloadTicket(ticketId, tickets) {
            const ticket = tickets.find(t => String(t.id) === String(ticketId));
            if (!ticket) {
                alert('Billet non trouvé');
                return;
            }
            
            const canvas = document.getElementById(`qrcode-${ticketId}`);
            if (canvas) {
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `ticket-${ticketId}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert('QR Code non disponible pour ce billet.');
            }
        }
        
        async deleteTicket(ticketId) {
            console.log("Suppression du billet ID:", ticketId);
            
            // Demander confirmation avant de supprimer
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce billet ? Cette action est irréversible.')) {
                return;
            }
            
            // Tentative de suppression via l'API
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
                
                // Fallback vers le stockage local
                try {
                    // Récupérer les billets du stockage local
                    const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
                    console.log("Total des billets avant suppression:", allTickets.length);
                    
                    // Trouver l'index du billet à supprimer
                    const ticketIndex = allTickets.findIndex(t => String(t.id) === String(ticketId));
                    console.log("Index du billet à supprimer:", ticketIndex);
                    
                    if (ticketIndex === -1) {
                        alert("Billet non trouvé!");
                        return;
                    }
                    
                    // Supprimer le billet
                    allTickets.splice(ticketIndex, 1);
                    console.log("Total des billets après suppression:", allTickets.length);
                    
                    // Enregistrer les billets mis à jour
                    localStorage.setItem('user_tickets', JSON.stringify(allTickets));
                    
                    alert("Billet supprimé avec succès!");
                    
                    // Rafraîchir la page
                    window.location.reload();
                } catch (error) {
                    console.error("Erreur lors de la suppression:", error);
                    alert("Erreur lors de la suppression: " + error.message);
                }
            }
        }
    }
    
    // Créer et exposer l'instance
    window.ticketManager = new TicketManager();
})();