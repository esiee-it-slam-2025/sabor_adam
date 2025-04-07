/*
Vue d'ensemble du fichier :
Ce fichier est le script principal de l'application mobile des JO Paris 2024 (section football).
Il gère l'affichage dynamique des matchs, la recherche/filtrage, et l'interaction avec les boutons d'achat.
Le code s'exécute une fois que la page HTML est entièrement chargée.
*/

// L'événement 'DOMContentLoaded' se déclenche quand le HTML est complètement chargé
// La fonction passée en paramètre sera exécutée à ce moment-là
document.addEventListener('DOMContentLoaded', function() {
    // Log de débogage pour confirmer le démarrage du script
    console.log("Initialisation de l'application des matchs...");
  
    // Récupération des éléments HTML qui seront manipulés
    // getElementById() recherche un élément HTML par son attribut id
    const matchesContainer = document.getElementById('matches-container'); // Conteneur principal des match
    const accessFilter = document.getElementById("accessibility-filter");
    const sortFilter = document.getElementById("sort-filter");
    accessFilter.addEventListener("change", displayMatches);
    sortFilter.addEventListener("change", displayMatches);
    displayMatches();
    // Fonction asynchrone principale qui :
    // 1. Récupère les matchs depuis l'API
    // 2. Génère le HTML pour chaque match
    // 3. Affiche les matchs dans la page
    async function displayMatches() {
        try {
            const access = accessFilter.value;
            const sortType = sortFilter.value;
            
            let url = `${API_BASE_URL}/events/`;
            if (access) {
                url += `?access=${access}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Erreur réseau');
            }
            
            let matches = await response.json();
            
            // Tri des matchs selon le filtre sélectionné
            matches = sortMatches(matches, sortType);
            
            if (!matches || matches.length === 0) {
                matchesContainer.innerHTML = '<p class="no-matches">Aucun match disponible</p>';
                return;
            }
    
            // Génération du HTML avec ajout des icônes d'accessibilité
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
    
                    <div class="access-icons">
                        ${match.stadium_accessibility.motor ? '<i class="fa-solid fa-wheelchair"></i>' : ''}
                        ${match.stadium_accessibility.visual ? '<i class="fa-solid fa-eye"></i>' : ''}
                        ${match.stadium_accessibility.hearing ? '<i class="fa-solid fa-ear-listen"></i>' : ''}
                        ${match.stadium_accessibility.mental ? '<i class="fa-solid fa-brain"></i>' : ''}
                    </div>
    
                    <button class="buy-button" data-match-id="${match.id}">
                        ${window.authManager && window.authManager.isLoggedIn ? 
                          'Acheter un billet' : 'Connectez-vous pour acheter'}
                    </button>
                </div>
            `).join('');
    
            matchesContainer.innerHTML = matchesHTML;
    
            // Gestion des clics sur les boutons d'achat
            document.querySelectorAll('.buy-button').forEach(button => {
                button.addEventListener('click', function () {
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
    };
    
    // Fonction de tri des matchs
    function sortMatches(matches, sortType) {
        switch (sortType) {
            case 'date-asc':
                return matches.sort((a, b) => new Date(a.time) - new Date(b.time));
            case 'date-desc':
                return matches.sort((a, b) => new Date(b.time) - new Date(a.time));
            case 'team':
                return matches.sort((a, b) => a.team_home_name.localeCompare(b.team_home_name));
            default:
                return matches;
        }
    }
}); 