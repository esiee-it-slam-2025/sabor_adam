from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils import timezone
from ..models import Ticket
from ..serializers import TicketSerializer
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

class VerifyTicketAPIView(APIView):
    """
    API pour vérifier la validité d'un ticket via son UUID
    
    Endpoint: GET /api/tickets/verify/<uuid>/
    Authentification requise: Non (accessible pour le personnel de contrôle)
    
    Returns:
        - Statut du ticket (valide/invalide)
        - Détails du ticket si valide
    """
    permission_classes = [AllowAny]
    
    def get(self, request, uuid):
        try:
            # Chercher le ticket par son UUID
            ticket = Ticket.objects.select_related('event', 'user').filter(ticket_uuid=uuid).first()
            
            if not ticket:
                return Response({
                    "valid": False, 
                    "message": "Billet non trouvé dans le système."
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Vérifier si le ticket a déjà été utilisé
            if ticket.status == 'USED':
                return Response({
                    "valid": False,
                    "message": "Ce billet a déjà été utilisé.",
                    "used_at": ticket.used_at
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Ticket valide
            serializer = TicketSerializer(ticket)
            
            return Response({
                "valid": True,
                "message": "Billet valide.",
                "ticket": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "valid": False,
                "message": f"Erreur lors de la vérification: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, uuid):
        """
        Marquer un ticket comme utilisé
        """
        try:
            # Chercher le ticket par son UUID
            ticket = Ticket.objects.filter(ticket_uuid=uuid).first()
            
            if not ticket:
                return Response({
                    "success": False, 
                    "message": "Billet non trouvé dans le système."
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Vérifier si le ticket a déjà été utilisé
            if ticket.status == 'USED':
                return Response({
                    "success": False,
                    "message": "Ce billet a déjà été utilisé.",
                    "used_at": ticket.used_at
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Marquer le ticket comme utilisé
            ticket.status = 'USED'
            ticket.used_at = timezone.now()
            ticket.save()
            
            return Response({
                "success": True,
                "message": "Billet marqué comme utilisé avec succès."
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "success": False,
                "message": f"Erreur lors du marquage du billet: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Dans une console Django (python manage.py shell)
# Lister tous les tokens
tokens = Token.objects.all()
for token in tokens:
    print(f"User: {token.user.username}, Token: {token.key}")

# Vérifier si un utilisateur spécifique a un token
username = "nom_utilisateur"
try:
    user = User.objects.get(username=username)
    token = Token.objects.get(user=user)
    print(f"Token pour {username}: {token.key}")
except Exception as e:
    print(f"Erreur: {e}")

class UserTicketsAPIView(APIView):
    """
    API pour récupérer les tickets d'un utilisateur
    """
    # Commentez temporairement ces lignes pour le débogage
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]  # Temporaire pour le débogage
    
    def get(self, request):
        # Pour le débogage, utilisez un utilisateur spécifique
        user_id = request.query_params.get('user_id')
        if user_id:
            tickets = Ticket.objects.filter(user_id=user_id)
        else:
            tickets = Ticket.objects.all()[:10]  # Limiter à 10 tickets pour le test
        
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)