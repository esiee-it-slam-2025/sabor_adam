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
                // Récupérer les détails du match depuis le stockage local ou l'API
                const matches = await fetchEvents();
                const match = matches.find(m => m.id == matchId);
                
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
                alert(`Erreur lors de la récupération du match: ${error.message}`);
            }
        }
        
        handlePurchase(event) {
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
                
                // Récupérer les détails du match
                fetchEvent(eventId).then(match => {
                    // Définir les prix selon la catégorie
                    const prices = {
                        'STANDARD': 50,
                        'VIP': 100,
                        'PREMIUM': 150
                    };
                    const price = prices[category] || 50;
                    
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
                            event: eventId,
                            event_details: match,
                            category: category,
                            ticket_type: category,
                            quantity: 1, // Chaque ticket est pour 1 place
                            price: price,
                            purchase_date: new Date().toISOString(),
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
                    
                }).catch(error => {
                    console.error("Erreur lors de la récupération du match:", error);
                    alert(`Erreur lors de l'achat: ${error.message}`);
                });
                
            } catch (error) {
                console.error("Erreur lors de l'achat:", error);
                alert(`Erreur lors de l'achat: ${error.message}`);
            }
        }
        
        loadUserTickets() {
            try {
                if (!window.authManager || !window.authManager.isLoggedIn) {
                    window.location.href = 'index.html';
                    return;
                }
                
                // Récupérer les tickets du stockage local
                const allTickets = JSON.parse(localStorage.getItem('user_tickets') || '[]');
                
                // Filtrer pour ne garder que les tickets de l'utilisateur connecté
                const tickets = allTickets.filter(ticket => ticket.user === window.authManager.username);
                
                this.displayTickets(tickets);
            } catch (error) {
                const ticketsContainer = document.getElementById('tickets-container');
                if (ticketsContainer) {
                    ticketsContainer.innerHTML = `
                        <div class="error-message">
                            <p>${error.message}</p>
                            <a href="index.html" class="btn">Retour à l'accueil</a>
                        </div>`;
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
                const eventId = ticket.event;
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
                const eventDetails = firstTicket.event_details;
                
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
                                <p><strong>Place:</strong> ${ticket.seat || 'Non assignée'}</p>
                                <p><strong>Date d'achat:</strong> ${formatDate(ticket.purchase_date).date}</p>
                                <p><strong>Référence:</strong> #${ticket.id.substring(0, 8)}</p>
                            </div>
                            <div class="ticket-qr">
                                <canvas id="qrcode-${ticket.id}" width="100" height="100"></canvas>
                                <div class="ticket-actions">
                                    <button class="download-btn" data-ticket-id="${ticket.id}">
                                        Télécharger ce billet
                                    </button>
                                    <button class="delete-btn" data-ticket-id="${ticket.id}">
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
            tickets.forEach(ticket => {
                const canvas = document.getElementById(`qrcode-${ticket.id}`);
                if (canvas) {
                    new QRious({
                        element: canvas,
                        value: ticket.ticket_uuid || ticket.id.toString(),
                        size: 100
                    });
                }
            });
            
            // Ajouter les écouteurs pour le téléchargement
            document.querySelectorAll('.download-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const ticketId = e.target.dataset.ticketId;
                    this.downloadTicket(ticketId, tickets);
                });
            });
        }
        
        downloadTicket(ticketId, tickets) {
            const ticket = tickets.find(t => t.id == ticketId);
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
                alert('Fonctionnalité de téléchargement en cours de développement.');
                console.log('Téléchargement du billet:', ticket);
            }
        }
        
        deleteTicket(ticketId) {
            console.log("Suppression du billet ID:", ticketId);
            
            // Demander confirmation avant de supprimer
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce billet ? Cette action est irréversible.')) {
                return;
            }
            
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
        
        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                hideModal(modal);
            }
        }
    }
    
    // Créer et exposer l'instance
    window.ticketManager = new TicketManager();
})();