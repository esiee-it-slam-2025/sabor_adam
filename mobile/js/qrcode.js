/*
Vue d'ensemble du fichier :
Ce fichier définit une classe QRCodeManager qui gère la génération et le téléchargement de codes QR.
Il utilise la bibliothèque externe QRious pour créer les codes QR.
Cette classe est utilisée pour générer les QR codes des billets des JO Paris 2024.
Les codes QR permettront de valider les billets lors de l'entrée aux événements.
*/

class QRCodeManager {
    // Le constructeur est appelé quand on crée une nouvelle instance de la classe
    constructor() {
        // Appelle la méthode pour charger la bibliothèque QRious dès la création
        this.loadQRiousLibrary();
    }
    
    // Cette méthode charge dynamiquement la bibliothèque QRious depuis internet
    loadQRiousLibrary() {
        // Vérifie si QRious n'est pas déjà défini dans la page
        // typeof retourne le type d'une variable ('undefined' si elle n'existe pas)
        if (typeof QRious === 'undefined') {
            // createElement crée un nouvel élément HTML, ici une balise <script>
            const script = document.createElement('script');
            // Définit l'URL de la bibliothèque à charger
            script.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
            // async=true permet le chargement asynchrone (ne bloque pas le reste de la page)
            script.async = true;
            // Ajoute la balise script dans le <head> du document HTML
            document.head.appendChild(script);
            
            // Fonction exécutée quand la bibliothèque est chargée avec succès
            script.onload = () => {
                console.log('QRious chargé avec succès');
            };
            
            // Fonction exécutée si une erreur survient pendant le chargement
            script.onerror = () => {
                console.error('Erreur lors du chargement de QRious');
            };
        }
    }

    // Méthode qui génère un code QR dans un élément canvas existant
    // elementId : l'ID de l'élément canvas dans le HTML
    // value : le texte à encoder dans le QR code
    // size : la taille en pixels du QR code (150 par défaut)
    generateQRCode(elementId, value, size = 150) {
        // Récupère l'élément canvas par son ID
        const element = document.getElementById(elementId);
        // Si l'élément n'existe pas, affiche une erreur et arrête la fonction
        if (!element) {
            console.error(`Élément avec l'ID ${elementId} non trouvé`);
            return null;
        }
        
        // Crée et retourne un nouveau QR code avec QRious
        // QRious est la bibliothèque chargée précédemment
        return new QRious({
            element: element, // Le canvas où dessiner le QR code
            value: value,     // Le texte à encoder
            size: size        // La taille du QR code
        });
    }

    // Méthode pour télécharger un QR code existant en tant qu'image PNG
    // elementId : l'ID du canvas contenant le QR code
    // fileName : le nom du fichier pour le téléchargement
    downloadQRCode(elementId, fileName) {
        // Récupère le canvas contenant le QR code
        const canvas = document.getElementById(elementId);
        if (!canvas) {
            console.error(`Canvas avec l'ID ${elementId} non trouvé`);
            return false;
        }
        
        try {
            // Convertit le contenu du canvas en URL de données (format base64)
            const dataUrl = canvas.toDataURL('image/png');
            // Crée un lien invisible pour le téléchargement
            const link = document.createElement('a');
            link.href = dataUrl;
            // Définit le nom du fichier (ou 'qrcode.png' par défaut)
            link.download = fileName || 'qrcode.png';
            // Ajoute temporairement le lien à la page
            document.body.appendChild(link);
            // Simule un clic sur le lien pour démarrer le téléchargement
            link.click();
            // Retire le lien de la page
            document.body.removeChild(link);
            return true;
        } catch (error) {
            // En cas d'erreur, affiche le message et retourne false
            console.error('Erreur lors du téléchargement du QR code:', error);
            return false;
        }
    }
    
    // Méthode qui génère des QR codes pour une liste de billets
    // tickets : tableau d'objets représentant les billets
    generateQRCodesForTickets(tickets) {
        // Vérifie que tickets existe et n'est pas vide
        if (!tickets || !tickets.length) return;
        
        // Fonction qui vérifie si QRious est chargé et génère les QR codes
        const checkQRious = () => {
            // Si QRious est chargé
            if (typeof QRious !== 'undefined') {
                // Pour chaque billet dans le tableau
                tickets.forEach(ticket => {
                    // Crée un ID unique pour le canvas de ce billet
                    const canvasId = `qrcode-${ticket.id}`;
                    // Récupère le canvas correspondant
                    const canvas = document.getElementById(canvasId);
                    if (canvas) {
                        // Génère le QR code avec l'ID du billet
                        this.generateQRCode(canvasId, ticket.id.toString());
                    }
                });
                
                // Ajoute des écouteurs d'événements sur tous les boutons de téléchargement
                // querySelectorAll retourne tous les éléments correspondant au sélecteur CSS
                document.querySelectorAll('.download-qr').forEach(button => {
                    // Pour chaque bouton, ajoute un gestionnaire de clic
                    button.addEventListener('click', () => {
                        // Récupère l'ID du billet depuis l'attribut data-ticket-id du bouton
                        const ticketId = button.dataset.ticketId;
                        // Déclenche le téléchargement du QR code
                        this.downloadQRCode(`qrcode-${ticketId}`, `ticket-${ticketId}.png`);
                    });
                });
            } else {
                // Si QRious n'est pas encore chargé, réessaie dans 100ms
                setTimeout(checkQRious, 100);
            }
        };
        
        // Lance la première vérification
        checkQRious();
    }
}

// Crée une instance globale du gestionnaire de QR codes
// Cette instance sera accessible depuis d'autres fichiers JavaScript
const qrCodeManager = new QRCodeManager();