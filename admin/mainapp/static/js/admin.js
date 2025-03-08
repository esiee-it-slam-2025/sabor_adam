// Gestion du modal
function openModal(matchId) {
    const modal = document.getElementById('editModal');
    const form = modal.querySelector('form');
    
    // Récupérer les données du match
    fetch(`/api/matches/${matchId}/`)
        .then(response => response.json())
        .then(data => {
            // Remplir le formulaire
            form.querySelector('[name="match_id"]').value = matchId;
            form.querySelector('[name="start"]').value = formatDateTime(data.start);
            form.querySelector('[name="stadium"]').value = data.stadium;
            form.querySelector('[name="team_home"]').value = data.team_home;
            form.querySelector('[name="team_away"]').value = data.team_away;
            
            modal.style.display = 'block';
        });
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Formatter la date et l'heure pour l'input datetime-local
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

// Fermer le modal en cliquant en dehors
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Validation du formulaire
document.querySelector('#editModal form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const teamHome = this.querySelector('[name="team_home"]').value;
    const teamAway = this.querySelector('[name="team_away"]').value;
    
    if (teamHome === teamAway) {
        alert("Les équipes domicile et extérieure doivent être différentes");
        return;
    }
    
    this.submit();
});