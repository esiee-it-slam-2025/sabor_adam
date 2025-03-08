from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User
from ..serializers import UserRegistrationSerializer, UserSerializer, TicketSerializer
from ..models import Event, Ticket, UserProfile
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken

class RegisterAPIView(APIView):
    """
    API d'enregistrement d'un nouvel utilisateur
    
    Endpoint: POST /api/v1/register/
    Données requises:
        - username: nom d'utilisateur
        - email: adresse email
        - password: mot de passe
        - password_confirm: confirmation du mot de passe
    
    Données optionnelles:
        - first_name: prénom
        - last_name: nom de famille
        - profile: informations complémentaires (téléphone, adresse, etc.)
    
    Returns:
        - Token d'authentification
        - Informations utilisateur
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Création du token d'authentification
            token, created = Token.objects.get_or_create(user=user)
            
            # Retourner la réponse
            return Response({
                "token": token.key,
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginAPIView(APIView):
    """
    API de connexion pour l'application
    
    Endpoint: POST /api/v1/login/
    Données requises:
        - username: nom d'utilisateur ou email
        - password: mot de passe
    
    Returns:
        - Token d'authentification
        - Informations utilisateur
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        # Si l'utilisateur essaie de se connecter avec son email
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({"error": "Identifiants incorrects."}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = authenticate(username=username, password=password)
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Identifiants incorrects."}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutAPIView(APIView):
    """
    API de déconnexion
    
    Endpoint: POST /api/v1/logout/
    Authentification requise: Oui
    
    Processus:
    1. Supprime le token d'authentification de l'utilisateur
    
    Returns:
        - Message de confirmation
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        request.user.auth_token.delete()
        return Response({"message": "Déconnexion réussie."}, status=status.HTTP_200_OK)

class UserProfileAPIView(APIView):
    """
    API pour obtenir ou mettre à jour le profil de l'utilisateur
    
    Endpoint: GET/PUT /api/v1/user/
    Authentification requise: Oui
    
    Returns:
        - Informations de l'utilisateur (GET)
        - Informations mises à jour (PUT)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PurchaseTicketAPIView(APIView):
    """
    API d'achat de tickets
    
    Endpoint: POST /api/v1/tickets/purchase/
    Authentification requise: Oui
    
    Données requises:
        - event_id: ID de l'événement
        - category: Catégorie du ticket (silver/gold/platinum)
        - quantity: Quantité de tickets (par défaut: 1)
    
    Processus:
    1. Vérifie l'existence de l'événement
    2. Valide la catégorie du ticket
    3. Calcule le prix total selon la catégorie et la quantité
    4. Crée le ticket pour l'utilisateur
    
    Returns:
        - Détails du ticket créé
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        event_id = request.data.get("event_id")
        category = request.data.get("category")
        quantity = int(request.data.get("quantity", 1))
        
        # Vérifier que l'événement existe
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({"error": "Événement non trouvé."}, status=status.HTTP_404_NOT_FOUND)
        
        # Valider la catégorie
        category_prices = {"silver": 100, "gold": 200, "platinum": 300}
        if category not in category_prices:
            return Response({"error": "Catégorie invalide."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculer le prix total
        unit_price = category_prices[category]
        total_price = unit_price * quantity
        
        # Créer le ticket
        ticket = Ticket.objects.create(
            user=user,
            event=event,
            category=category,
            price=total_price,
            quantity=quantity
        )
        
        # Retourner les détails du ticket
        serializer = TicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class UserTicketsAPIView(APIView):
    """
    API pour récupérer les tickets d'un utilisateur
    
    Endpoint: GET /api/v1/user/tickets/
    Authentification requise: Oui
    
    Returns:
        Liste des tickets appartenant à l'utilisateur connecté
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tickets = Ticket.objects.filter(user=request.user)
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Inscription réussie',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({
            'error': 'Veuillez fournir un nom d\'utilisateur et un mot de passe'
        }, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)

    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    else:
        return Response({
            'error': 'Identifiants invalides'
        }, status=status.HTTP_401_UNAUTHORIZED)