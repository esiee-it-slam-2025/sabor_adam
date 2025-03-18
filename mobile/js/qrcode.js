class QRCodeManager {
    constructor() {
        // Charge la bibliothèque QRious depuis un CDN
        this.loadQRiousLibrary();
    }
    
    // Charge dynamiquement la bibliothèque QRious
    loadQRiousLibrary() {
        // Vérifie si la bibliothèque est déjà chargée
        // Ajoute un script pour charger la bibliothèque si nécessaire
        if (typeof QRious === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
            script.async = true;
            document.head.appendChild(script);
            
            script.onload = () => {
                console.log('QRious chargé avec succès');
            };
            
            script.onerror = () => {
                console.error('Erreur lors du chargement de QRious');
            };
        }
    }

    // Génère un code QR dans un élément canvas
    generateQRCode(elementId, value, size = 150) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Élément avec l'ID ${elementId} non trouvé`);
            return null;
        }
        
        return new QRious({
            element: element,
            value: value,
            size: size
        });
    }

    // Télécharge un code QR sous forme d'image PNG
    downloadQRCode(elementId, fileName) {
        const canvas = document.getElementById(elementId);
        if (!canvas) {
            console.error(`Canvas avec l'ID ${elementId} non trouvé`);
            return false;
        }
        
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = fileName || 'qrcode.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            console.error('Erreur lors du téléchargement du QR code:', error);
            return false;
        }
    }
    
    // Génère des codes QR pour une liste de billets
    generateQRCodesForTickets(tickets) {
        if (!tickets || !tickets.length) return;
        
        // Attendre que QRious soit chargé
        const checkQRious = () => {
            if (typeof QRious !== 'undefined') {
                tickets.forEach(ticket => {
                    const canvasId = `qrcode-${ticket.id}`;
                    const canvas = document.getElementById(canvasId);
                    if (canvas) {
                        this.generateQRCode(canvasId, ticket.id.toString());
                    }
                });
                
                // Ajouter les écouteurs pour le téléchargement
                document.querySelectorAll('.download-qr').forEach(button => {
                    button.addEventListener('click', () => {
                        const ticketId = button.dataset.ticketId;
                        this.downloadQRCode(`qrcode-${ticketId}`, `ticket-${ticketId}.png`);
                    });
                });
            } else {
                setTimeout(checkQRious, 100);
            }
        };
        
        checkQRious();
    }
}

// Initialiser le gestionnaire de QR codes
const qrCodeManager = new QRCodeManager();