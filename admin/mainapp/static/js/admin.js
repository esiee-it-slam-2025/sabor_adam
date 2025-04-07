/*
Vue d'ensemble du fichier :
Ce fichier JavaScript gère l'interface d'édition des matches dans l'administration.
Il permet d'ouvrir une fenêtre modale pour modifier les détails d'un match (équipes, date, stade),
avec validation des données et gestion des interactions utilisateur.
Les données sont récupérées et envoyées via des appels API.
*/

// Fonction qui ouvre la fenêtre modale d'édition pour un match spécifique
// matchId : l'identifiant unique du match à éditer
function openModal(matchId) {
    // Récupère l'élément HTML de la fenêtre modale via son ID 'editModal'
    const modal = document.getElementById('editModal');
    // Trouve le formulaire à l'intérieur de la modale avec querySelector
    const form = modal.querySelector('form');
    
    // Appel à l'API pour récupérer les données du match
    // fetch : fonction native qui permet de faire des requêtes HTTP
    fetch(`/api/matches/${matchId}/`)
        // Convertit la réponse en format JSON
        .then(response => response.json())
        // Une fois les données reçues, on les utilise pour remplir le formulaire
        .then(data => {
            // Remplit chaque champ du formulaire avec les données du match
            // querySelector('[name="..."]') trouve l'élément par son attribut 'name'
            form.querySelector('[name="match_id"]').value = matchId;
            // formatDateTime convertit la date en format compatible avec l'input
            form.querySelector('[name="start"]').value = formatDateTime(data.start);
            form.querySelector('[name="stadium"]').value = data.stadium;
            form.querySelector('[name="team_home"]').value = data.team_home;
            form.querySelector('[name="team_away"]').value = data.team_away;
            
            // Affiche la modale en modifiant son style CSS
            modal.style.display = 'block';
        });
}

// Fonction qui ferme la fenêtre modale
function closeModal() {
    // Cache la modale en modifiant sa propriété CSS display
    document.getElementById('editModal').style.display = 'none';
}

// Fonction utilitaire qui formate une date pour l'input datetime-local
// dateString : chaîne de caractères représentant une date
function formatDateTime(dateString) {
    // Crée un objet Date à partir de la chaîne
    const date = new Date(dateString);
    // Convertit la date en format ISO et garde les 16 premiers caractères
    // (format YYYY-MM-DDTHH:mm requis par l'input datetime-local)
    return date.toISOString().slice(0, 16);
}

// Gestionnaire d'événement qui ferme la modale si on clique en dehors
// window.onclick est déclenché sur chaque clic dans la fenêtre
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    // event.target est l'élément sur lequel on a cliqué
    // Si c'est la modale elle-même (fond gris), on la ferme
    if (event.target === modal) {
        closeModal();
    }
}

// Gestionnaire de soumission du formulaire
// addEventListener attache une fonction à l'événement 'submit' du formulaire
document.querySelector('#editModal form').addEventListener('submit', function(e) {
    // Empêche le comportement par défaut du formulaire (rechargement de la page)
    e.preventDefault();
    
    // Récupère les valeurs des équipes sélectionnées
    // this fait référence au formulaire lui-même
    const teamHome = this.querySelector('[name="team_home"]').value;
    const teamAway = this.querySelector('[name="team_away"]').value;
    
    // Vérifie que les équipes sont différentes
    if (teamHome === teamAway) {
        // alert affiche une boîte de dialogue avec le message
        alert("Les équipes domicile et extérieure doivent être différentes");
        return; // Arrête l'exécution de la fonction
    }
    
    // Si la validation est OK, soumet le formulaire
    this.submit();
});