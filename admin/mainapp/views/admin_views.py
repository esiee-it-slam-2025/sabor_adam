from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from rest_framework import generics
from mainapp.models import Event, Team, Stadium, Ticket
from mainapp.serializers import EventSerializer, TeamSerializer, StadiumSerializer, TicketSerializer
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework import status
from ..models import Ticket, Event
from ..serializers import TicketSerializer
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.http import JsonResponse

from rest_framework.authentication import TokenAuthentication
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.db import IntegrityError
import uuid
from ..serializers import UserRegistrationSerializer, UserSerializer
from django.contrib.auth.hashers import make_password
from mainapp.models import Event, Team, Stadium, Ticket
from mainapp.serializers import EventSerializer, TeamSerializer, StadiumSerializer, TicketSerializer
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.db import IntegrityError
import uuid
from ..serializers import UserRegistrationSerializer


def is_match_admin(user):
    """
    Vérifie si l'utilisateur a les droits d'administration
    
    Args:
        user: L'utilisateur à vérifier
        
    Returns:
        bool: True si l'utilisateur est authentifié et est staff, False sinon
    """
    return user.is_authenticated and user.is_staff

def admin_login(request):
    """
    Gère la connexion des administrateurs
    
    Processus:
    1. Vérifie si l'admin est déjà connecté
    2. Authentifie l'utilisateur avec username/password
    3. Redirige vers la page des matchs si connexion réussie
    
    Args:
        request: La requête HTTP
        
    Returns:
        HttpResponse: Redirection ou page de connexion
    """
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('admin_matches')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        
        if user is not None and user.is_staff:
            login(request, user)
            messages.success(request, "Connexion réussie")
            return redirect('admin_matches')
        else:
            messages.error(request, "Identifiants invalides")
    
    return render(request, 'auth/login.html')

@user_passes_test(is_match_admin, login_url='admin_login')
def admin_matches(request):
    """
    🎮 Gestion des matchs (CRUD)
    """
    if request.method == 'POST':
        event_id = request.POST.get('event_id')
        if event_id:
            try:
                event = get_object_or_404(Event, id=event_id)
                event.time = request.POST.get('start')
                event.stadium_id = request.POST.get('stadium')
                event.team_home_id = request.POST.get('team_home')
                event.team_away_id = request.POST.get('team_away')
                event.score_home = request.POST.get('score_team_home') or 0
                event.score_away = request.POST.get('score_team_away') or 0
                event.save()
                messages.success(request, "Match mis à jour avec succès")
            except Exception as e:
                messages.error(request, f"Erreur lors de la mise à jour: {str(e)}")
        
        # Vérifier si c'est une requête AJAX
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True})
        return redirect('admin_matches')

    context = {
        'events': Event.objects.all().order_by('time'),
        'teams': Team.objects.all(),
        'stadiums': Stadium.objects.all()
    }
    return render(request, 'admin/matches.html', context)

@user_passes_test(is_match_admin, login_url='admin_login')
def admin_match_edit(request, pk):
    """
    Édition d'un match existant
    """
    event = get_object_or_404(Event, pk=pk)
    if request.method == 'POST':
        # Logique d'édition existante
        return redirect('admin_matches')
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

@user_passes_test(is_match_admin, login_url='admin_login')
def admin_match_delete(request, pk):
    """
    Suppression d'un match
    """
    if request.method == 'POST':
        event = get_object_or_404(Event, pk=pk)
        event.delete()
        messages.success(request, "Match supprimé avec succès")
        return redirect('admin_matches')
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

def admin_logout(request):
    """
    🚪 Déconnexion administrative
    """
    logout(request)
    messages.info(request, "Vous avez été déconnecté")
    return redirect('admin_login')

# Vues API administratives
class EventAdminAPI(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminUser]

class TeamAdminAPI(generics.ListCreateAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAdminUser]

class StadiumAdminAPI(generics.ListCreateAPIView):
    queryset = Stadium.objects.all()
    serializer_class = StadiumSerializer
    permission_classes = [IsAdminUser]

class TicketAdminAPI(generics.ListCreateAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAdminUser]



# ==============================
# 📌 VUES API POUR L'APPLICATION MOBILE
# ==============================

# 🎟️ Vue pour la gestion des événements
class EventListCreateAPIView(generics.ListCreateAPIView):
    queryset = Event.objects.select_related('team_home', 'team_away', 'stadium').all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Event.objects.select_related('team_home', 'team_away', 'stadium').order_by('time')

class EventDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny]


# ⚽ Vue pour la gestion des équipes
class TeamListCreateAPIView(generics.ListCreateAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [AllowAny]  # Accès public pour tous

class TeamDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAdminUser]


# 🏟️ Vue pour la gestion des stades
class StadiumListCreateAPIView(generics.ListCreateAPIView):
    queryset = Stadium.objects.all()
    serializer_class = StadiumSerializer
    permission_classes = [AllowAny]  # Accès public pour tous

class StadiumDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Stadium.objects.all()
    serializer_class = StadiumSerializer
    permission_classes = [IsAdminUser]


# 🎫 Vue pour la gestion des tickets
class TicketListCreateAPIView(generics.ListCreateAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]  # Authentification requise pour les tickets

class TicketDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAdminUser]

class LoginUserAPIView(APIView):
    """
    API de connexion pour l'application mobile
    
    Endpoint: POST /api/login/
    Données requises:
        - username: nom d'utilisateur
        - password: mot de passe
    
    Returns:
        - Token d'authentification
        - Informations utilisateur
    """
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is not None:
            # Crée ou récupère le token de l'utilisateur
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "user": {"id": user.id, "username": user.username}}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Identifiants incorrects"}, status=status.HTTP_401_UNAUTHORIZED)

class PurchaseTicketAPIView(APIView):
    """
    API d'achat de tickets pour l'application mobile
    
    Endpoint: POST /api/tickets/purchase/
    Authentification requise: Oui
    
    Données requises:
        - event_id: ID de l'événement
        - category: Catégorie du ticket (silver/gold/platinum)
    
    Processus:
    1. Vérifie l'existence de l'événement
    2. Valide la catégorie du ticket
    3. Calcule le prix selon la catégorie
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

        # Vérifier la catégorie et le prix
        category_prices = {
            "STANDARD": 50,
            "VIP": 100,
            "PREMIUM": 150
        }
        
        if category not in category_prices:
            return Response({"error": "Catégorie invalide."}, status=status.HTTP_400_BAD_REQUEST)

        price = category_prices[category]
        
        try:
            # Créer les tickets pour la quantité demandée
            tickets = []
            for _ in range(quantity):
                ticket = Ticket.objects.create(
                    user=user,
                    event=event,
                    category=category,
                    price=price
                )
                tickets.append(ticket)
            
            serializer = TicketSerializer(tickets, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": f"Erreur lors de la création du ticket: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserTicketsAPIView(APIView):
    """
    API pour récupérer les tickets d'un utilisateur
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tickets = Ticket.objects.filter(user=request.user)
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    """
    API endpoint for user login
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Veuillez fournir un nom d\'utilisateur et un mot de passe'}, status=400)
    
    user = authenticate(username=username, password=password)
    
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
    else:
        return Response({'error': 'Identifiants incorrects'}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
    """
    API endpoint for user registration
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Inscription réussie',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=201)
        except IntegrityError:
            return Response({'error': 'Un utilisateur avec ce nom existe déjà'}, status=400)
    
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """
    API endpoint for user logout
    """
    try:
        # Delete the token to logout
        request.user.auth_token.delete()
        return Response({'message': 'Déconnexion réussie'}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

class RegisterUserAPIView(APIView):
    """
    API d'inscription pour l'application mobile
    
    Endpoint: POST /api/register/
    Données requises:
        - username: nom d'utilisateur
        - email: email utilisateur
        - password: mot de passe
        - password_confirm: confirmation du mot de passe
    
    Returns:
        - Informations utilisateur
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Créer l'utilisateur
                user = serializer.save()
                
                # Créer un token d'authentification
                token, _ = Token.objects.get_or_create(user=user)
                
                return Response({
                    "success": True,
                    "token": token.key,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email
                    }
                }, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({
                    "success": False,
                    "error": "Un utilisateur avec ce nom existe déjà"
                }, status=status.HTTP_400_BAD_REQUEST)
                
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    """
    API pour la connexion des utilisateurs
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'success': False,
            'error': 'Veuillez fournir un nom d\'utilisateur et un mot de passe'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if user:
        # Créer ou récupérer le token
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'success': False,
            'error': 'Identifiants incorrects'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """
    API pour la déconnexion des utilisateurs
    """
    try:
        # Supprimer le token pour se déconnecter
        request.user.auth_token.delete()
        return Response({
            'success': True,
            'message': 'Déconnexion réussie'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
    """
    API pour l'inscription des utilisateurs
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = User.objects.create_user(
                username=serializer.validated_data['username'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                first_name=serializer.validated_data.get('first_name', ''),
                last_name=serializer.validated_data.get('last_name', '')
            )
            
            # Créer un token pour l'utilisateur
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'success': True,
                'message': 'Inscription réussie',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({
                'success': False,
                'error': 'Un utilisateur avec ce nom existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)