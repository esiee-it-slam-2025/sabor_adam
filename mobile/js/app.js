document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation de l'application des matchs...");
    
    // Éléments DOM
    const matchesContainer = document.getElementById('matches-container');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    
    // Fonction principale pour récupérer et afficher les matchs
    async function displayMatches() {
        try {
            const response = await fetch(`${API_BASE_URL}/events/`);
            
            if (!response.ok) {
                throw new Error('Erreur réseau');
            }
            
            const matches = await response.json();
            const matchesContainer = document.getElementById('matches-container');
            
            if (!matches || matches.length === 0) {
                matchesContainer.innerHTML = '<p class="no-matches">Aucun match disponible</p>';
                return;
            }

            const matchesHTML = matches.map(match => `
                <div class="match-card" data-match-id="${match.id}" data-time="${match.time}">
                    <div class="match-header">
                        <span class="match-date">${formatDate(match.time).date}</span>
                        <span class="match-time">${formatDate(match.time).time}</span>
                    </div>
                    <div class="match-teams">
                        <span class="team-home">${match.team_home_name}</span>
                        <span class="vs">VS</span>
                        <span class="team-away">${match.team_away_name}</span>
                    </div>
                    <div class="match-stadium">🏟️ ${match.stadium_name}</div>
                    <button class="buy-button" data-match-id="${match.id}">
                        ${window.authManager && window.authManager.isLoggedIn ? 
                          'Acheter un billet' : 'Connectez-vous pour acheter'}
                    </button>
                </div>
            `).join('');
            
            matchesContainer.innerHTML = matchesHTML;

            // Ajouter les écouteurs pour les boutons d'achat
            document.querySelectorAll('.buy-button').forEach(button => {
                button.addEventListener('click', function() {
                    const matchId = this.dataset.matchId;
                    if (window.authManager && window.authManager.isLoggedIn) {
                        if (window.ticketManager) {
                            window.ticketManager.handleBuyButtonClick(matchId);
                        }
                    } else {
                        showModal(document.getElementById('login-modal'));
                    }
                });
            });

        } catch (error) {
            console.error('Erreur:', error);
            matchesContainer.innerHTML = '<p class="error-message">Erreur lors du chargement des matchs.</p>';
        }
    }
    
    // Ajouter les écouteurs d'événements pour la recherche et le filtre
    if (searchInput) {
        searchInput.addEventListener('input', displayMatches);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', displayMatches);
    }
    
    // Charger les matchs au démarrage
    displayMatches();
});

