"""
Vue d'ensemble du fichier :
Ce fichier contient les APIs de gestion des tickets pour un système de billetterie.
Il permet principalement de :
1. Vérifier si un ticket est valide via son UUID (VerifyTicketAPIView - GET)
2. Marquer un ticket comme utilisé (VerifyTicketAPIView - POST) 
3. Récupérer la liste des tickets d'un utilisateur (UserTicketsAPIView)
Le fichier inclut aussi des exemples de gestion des tokens d'authentification.
"""

# Import des classes nécessaires depuis Django REST framework
from rest_framework.views import APIView  # Classe de base pour créer des vues API
from rest_framework.response import Response  # Classe pour formater les réponses API
from rest_framework import status  # Contient les codes HTTP standards (200, 404, etc.)
from rest_framework.permissions import AllowAny  # Permet l'accès à l'API sans authentification
from django.utils import timezone  # Utilitaire Django pour gérer les dates/heures
from ..models import Ticket  # Import du modèle Ticket défini dans models.py
from ..serializers import TicketSerializer  # Convertit les objets Ticket en JSON et vice-versa
from rest_framework.authtoken.models import Token  # Gère les tokens d'authentification
from django.contrib.auth.models import User  # Modèle utilisateur par défaut de Django

class VerifyTicketAPIView(APIView):
    """
    Cette classe gère la vérification des tickets.
    Elle hérite de APIView qui fournit les méthodes de base pour une API REST.
    
    Endpoint: GET /api/tickets/verify/<uuid>/
    Authentification requise: Non (accessible pour le personnel de contrôle)
    
    Returns:
        - Statut du ticket (valide/invalide)
        - Détails du ticket si valide
    """
    # Permet à n'importe qui d'accéder à cette API sans authentification
    permission_classes = [AllowAny]
    
    def get(self, request, uuid):
        """
        Méthode appelée lors d'une requête GET pour vérifier un ticket
        Paramètres:
            - request: L'objet requête HTTP
            - uuid: L'identifiant unique du ticket à vérifier
        """
        try:
            # Recherche le ticket dans la base de données
            # select_related() optimise la requête en chargeant aussi les données liées (event et user)
            ticket = Ticket.objects.select_related('event', 'user').filter(ticket_uuid=uuid).first()
            
            # Si aucun ticket n'est trouvé avec cet UUID
            if not ticket:
                return Response({
                    "valid": False, 
                    "message": "Billet non trouvé dans le système."
                }, status=status.HTTP_404_NOT_FOUND)  # Renvoie une erreur 404
            
            # Vérifie si le ticket a déjà été utilisé (status est un champ du modèle Ticket)
            if ticket.status == 'USED':
                return Response({
                    "valid": False,
                    "message": "Ce billet a déjà été utilisé.",
                    "used_at": ticket.used_at  # Date/heure d'utilisation du ticket
                }, status=status.HTTP_400_BAD_REQUEST)  # Erreur 400
            
            # Si le ticket est valide, on le convertit en format JSON
            serializer = TicketSerializer(ticket)
            
            # Renvoie une réponse positive avec les détails du ticket
            return Response({
                "valid": True,
                "message": "Billet valide.",
                "ticket": serializer.data  # Données du ticket au format JSON
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Capture toute erreur inattendue et renvoie un message d'erreur
            return Response({
                "valid": False,
                "message": f"Erreur lors de la vérification: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, uuid):
        """
        Méthode appelée lors d'une requête POST pour marquer un ticket comme utilisé
        Paramètres identiques à get()
        """
        try:
            # Recherche le ticket (sans select_related car on n'a pas besoin des relations ici)
            ticket = Ticket.objects.filter(ticket_uuid=uuid).first()
            
            # Mêmes vérifications que dans get()
            if not ticket:
                return Response({
                    "success": False, 
                    "message": "Billet non trouvé dans le système."
                }, status=status.HTTP_404_NOT_FOUND)
            
            if ticket.status == 'USED':
                return Response({
                    "success": False,
                    "message": "Ce billet a déjà été utilisé.",
                    "used_at": ticket.used_at
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Met à jour le statut du ticket
            ticket.status = 'USED'  # Marque comme utilisé
            ticket.used_at = timezone.now()  # Enregistre la date/heure actuelle
            ticket.save()  # Sauvegarde les modifications en base de données
            
            return Response({
                "success": True,
                "message": "Billet marqué comme utilisé avec succès."
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "success": False,
                "message": f"Erreur lors du marquage du billet: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserTicketsAPIView(APIView):
    """
    API pour récupérer la liste des tickets d'un utilisateur
    Actuellement en mode débug avec accès public
    """
    # Ces lignes sont commentées pendant le débogage
    # authentication_classes = [TokenAuthentication]  # Authentification par token
    # permission_classes = [IsAuthenticated]  # Nécessite une authentification
    permission_classes = [AllowAny]  # Temporairement accessible à tous
    
    def get(self, request):
        """
        Récupère les tickets d'un utilisateur ou les 10 premiers tickets si aucun utilisateur spécifié
        """
        # Récupère le paramètre user_id de l'URL (ex: ?user_id=123)
        user_id = request.query_params.get('user_id')
        if user_id:
            # Filtre les tickets pour l'utilisateur spécifié
            tickets = Ticket.objects.filter(user_id=user_id)
        else:
            # Prend les 10 premiers tickets ([:10] limite le nombre de résultats)
            tickets = Ticket.objects.all()[:10]
        
        # Convertit les tickets en format JSON
        serializer = TicketSerializer(tickets, many=True)  # many=True car c'est une liste
        return Response(serializer.data, status=status.HTTP_200_OK)