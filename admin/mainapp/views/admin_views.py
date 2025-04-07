"""
Vue d'ensemble du fichier :
Ce fichier contient toutes les vues (contrôleurs) pour la partie administrative et l'API de l'application.
Il gère :
- L'interface d'administration web (connexion, gestion des matchs, etc.)
- Les endpoints API pour l'application mobile (authentification, tickets, etc.)
- La sécurité et les permissions d'accès
- Les opérations CRUD (Create, Read, Update, Delete) sur les différents modèles

Structure :
1. Imports des modules nécessaires
2. Vues pour l'interface d'administration web
3. Vues API pour l'administration
4. Vues API pour l'application mobile
"""

# === SECTION 1: IMPORTS ===

# Imports Django de base pour les vues et l'authentification
from django.shortcuts import render, redirect, get_object_or_404  # Fonctions utilitaires pour les vues
from django.contrib.auth import authenticate, login, logout  # Gestion de l'authentification
from django.contrib.auth.decorators import login_required, user_passes_test  # Décorateurs de sécurité
from django.contrib import messages  # Système de messages flash pour l'interface utilisateur
from rest_framework.decorators import permission_classes
from django.utils import timezone

# Imports Django REST framework pour l'API
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated  # Classes de permissions
from rest_framework import generics  # Vues génériques pour l'API
from rest_framework.decorators import api_view  # Décorateur pour les vues d'API
from rest_framework.response import Response  # Classe de réponse API
from rest_framework.authtoken.models import Token  # Modèle de token d'authentification
from rest_framework.views import APIView  # Classe de base pour les vues d'API
from rest_framework import status  # Codes de statut HTTP

# Imports des modèles et sérialiseurs de l'application
from mainapp.models import Event, Team, Stadium, Ticket  # Nos modèles de données
from mainapp.serializers import (  # Nos sérialiseurs pour l'API
    EventSerializer, TeamSerializer, StadiumSerializer, TicketSerializer,
    UserRegistrationSerializer, UserSerializer
)

# Imports Django supplémentaires
from django.contrib.auth.models import User  # Modèle utilisateur par défaut de Django
from django.http import JsonResponse  # Réponse JSON pour les requêtes AJAX
from django.views.decorators.csrf import csrf_exempt  # Désactive la protection CSRF
from django.contrib.auth.hashers import make_password  # Hashage des mots de passe
from django.db import IntegrityError  # Erreur de contrainte d'intégrité base de données

# Imports Python standard
import uuid  # Génération d'identifiants uniques

# === SECTION 2: FONCTIONS UTILITAIRES ===

def is_match_admin(user):
    """
    Vérifie si l'utilisateur a les droits d'administration des matchs
    Cette fonction est utilisée comme test de permission par le décorateur @user_passes_test
    
    Args:
        user: L'objet utilisateur Django à vérifier
        
    Returns:
        bool: True si l'utilisateur est connecté et est staff, False sinon
    """
    return user.is_authenticated and user.is_staff

# === SECTION 3: VUES D'ADMINISTRATION WEB ===

def admin_login(request):
    """
    Gère la page de connexion des administrateurs
    
    Processus:
    1. Si l'admin est déjà connecté, redirige vers la page des matchs
    2. Si méthode POST (formulaire soumis):
       - Récupère username/password
       - Tente l'authentification
       - Redirige si succès, affiche erreur si échec
    3. Si méthode GET, affiche le formulaire de connexion
    
    Args:
        request: L'objet HttpRequest Django contenant les données de la requête
        
    Returns:
        HttpResponse: Soit une redirection, soit la page de connexion
    """
    # Si l'utilisateur est déjà connecté et est admin, redirige vers la page des matchs
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('admin_matches')
    
    # Traitement du formulaire de connexion
    if request.method == 'POST':
        username = request.POST.get('username')  # Récupère le nom d'utilisateur du formulaire
        password = request.POST.get('password')  # Récupère le mot de passe du formulaire
        # Tente d'authentifier l'utilisateur avec les identifiants fournis
        user = authenticate(username=username, password=password)
        
        # Si l'authentification réussit et que l'utilisateur est staff
        if user is not None and user.is_staff:
            login(request, user)  # Connecte l'utilisateur dans la session
            messages.success(request, "Connexion réussie")  # Affiche un message de succès
            return redirect('admin_matches')  # Redirige vers la page des matchs
        else:
            messages.error(request, "Identifiants invalides")  # Affiche un message d'erreur
    
    # Si méthode GET ou authentification échouée, affiche le formulaire de connexion
    return render(request, 'auth/login.html')

@user_passes_test(is_match_admin, login_url='admin_login')  # Vérifie que l'utilisateur est admin
def admin_matches(request):
    """
    Vue principale de gestion des matchs pour les administrateurs
    Permet de voir, créer, modifier et supprimer des matchs
    
    Processus:
    1. Si POST: met à jour un match existant
    2. Si GET: affiche la liste des matchs et le formulaire
    
    Le décorateur @user_passes_test vérifie que l'utilisateur est admin
    sinon redirige vers la page de connexion
    """
    # Traitement de la mise à jour d'un match
    if request.method == 'POST':
        event_id = request.POST.get('event_id')  # Récupère l'ID du match à modifier
        if event_id:
            try:
                # Récupère le match ou renvoie une erreur 404 si non trouvé
                event = get_object_or_404(Event, id=event_id)
                # Met à jour les champs du match avec les données du formulaire
                event.time = request.POST.get('start')  # Date et heure du match
                event.stadium_id = request.POST.get('stadium')  # ID du stade
                event.team_home_id = request.POST.get('team_home')  # ID équipe domicile
                event.team_away_id = request.POST.get('team_away')  # ID équipe extérieur
                event.score_home = request.POST.get('score_team_home') or 0  # Score équipe domicile
                event.score_away = request.POST.get('score_team_away') or 0  # Score équipe extérieur
                event.save()  # Sauvegarde les modifications en base de données
                messages.success(request, "Match mis à jour avec succès")
            except Exception as e:
                messages.error(request, f"Erreur lors de la mise à jour: {str(e)}")
        
        # Si la requête est AJAX (asynchrone), renvoie une réponse JSON
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True})
        return redirect('admin_matches')  # Sinon redirige vers la liste des matchs

    # Prépare les données pour l'affichage de la page
    context = {
        'events': Event.objects.all().order_by('time'),  # Liste des matchs triés par date
        'teams': Team.objects.all(),  # Liste des équipes
        'stadiums': Stadium.objects.all()  # Liste des stades
    }
    return render(request, 'admin/matches.html', context)

@user_passes_test(is_match_admin, login_url='admin_login')
def admin_match_edit(request, pk):
    """
    Vue pour éditer un match spécifique
    
    Args:
        request: La requête HTTP
        pk: L'identifiant primaire (ID) du match à éditer
    """
    # Récupère le match ou renvoie une erreur 404
    event = get_object_or_404(Event, pk=pk)
    if request.method == 'POST':
        # Note: La logique d'édition n'est pas implémentée ici
        return redirect('admin_matches')
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

@user_passes_test(is_match_admin, login_url='admin_login')
def admin_match_delete(request, pk):
    """
    Vue pour supprimer un match
    
    Args:
        request: La requête HTTP
        pk: L'identifiant primaire (ID) du match à supprimer
    """
    if request.method == 'POST':
        event = get_object_or_404(Event, pk=pk)  # Récupère le match
        event.delete()  # Supprime le match de la base de données
        messages.success(request, "Match supprimé avec succès")
        return redirect('admin_matches')
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

def admin_logout(request):
    """
    Vue de déconnexion pour les administrateurs
    Déconnecte l'utilisateur et redirige vers la page de connexion
    """
    logout(request)  # Déconnecte l'utilisateur de la session
    messages.info(request, "Vous avez été déconnecté")
    return redirect('admin_login')

# === SECTION 4: VUES API ADMINISTRATIVES ===


class TeamAdminAPI(generics.ListCreateAPIView):
    """
    Vue API pour lister et créer des équipes
    Même principe que EventAdminAPI
    """
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAdminUser]

class StadiumAdminAPI(generics.ListCreateAPIView):
    """
    Vue API pour lister et créer des stades
    Même principe que EventAdminAPI
    """
    queryset = Stadium.objects.all()
    serializer_class = StadiumSerializer
    permission_classes = [IsAdminUser]

class TicketAdminAPI(generics.ListCreateAPIView):
    """
    Vue API pour lister et créer des tickets
    Même principe que EventAdminAPI
    """
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAdminUser]

# === SECTION 5: VUES API POUR L'APPLICATION MOBILE ===
class EventListCreateAPIView(generics.ListCreateAPIView):
    """
    Vue API pour lister et créer des événements (matchs)
    
    Cette classe hérite de ListCreateAPIView qui fournit:
    - GET: Liste tous les événements 
    - POST: Crée un nouvel événement
    
    Caractéristiques:
    - Accessible à tous les utilisateurs (AllowAny)
    - Optimise les requêtes SQL avec select_related() pour charger les relations en une seule requête
    - Permet de filtrer les événements par type d'accessibilité via le paramètre 'access'
    - Retourne les événements triés par date/heure
    
    Exemple d'utilisation:
    - GET /api/events/ -> Liste tous les événements
    - GET /api/events/?access=moteur -> Liste les événements accessibles aux PMR
    - POST /api/events/ -> Crée un nouvel événement
    """
    # Requête de base optimisée qui charge les relations en une seule fois
    # select_related() évite le problème de N+1 requêtes en joignant les tables
    queryset = Event.objects.select_related('team_home', 'team_away', 'stadium').all()
    
    # Utilise EventSerializer pour convertir les objets Event en JSON et vice-versa
    serializer_class = EventSerializer
    
    # AllowAny permet l'accès à tous les utilisateurs, même non authentifiés
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Surcharge la méthode get_queryset pour ajouter le filtrage par accessibilité
        
        Paramètres URL supportés:
        - access: Type d'accessibilité à filtrer (moteur, mental, visuel, auditif)
        
        Retourne:
        - QuerySet filtré et trié par date/heure
        """
        # Commence avec le queryset de base défini plus haut
        queryset = self.queryset
        
        # Récupère le paramètre 'access' de l'URL s'il existe
        access = self.request.GET.get("access")
        
        # Applique le filtre approprié selon le type d'accessibilité demandé
        if access == "moteur":
            queryset = queryset.filter(stadium__access_motor=True)
        elif access == "mental":
            queryset = queryset.filter(stadium__access_mental=True)
        elif access == "visuel":
            queryset = queryset.filter(stadium__access_visual=True)
        elif access == "auditif":
            queryset = queryset.filter(stadium__access_hearing=True)
            
        # Retourne les résultats triés par date/heure croissante
        return queryset.order_by("time")
class EventDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue API pour voir/modifier/supprimer un événement spécifique
    Fournit les opérations GET (détail), PUT/PATCH (modification), DELETE (suppression)
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

class TeamListCreateAPIView(generics.ListCreateAPIView):
    """
    Vue API pour lister et créer des équipes
    Accessible à tous
    """
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [AllowAny]

class TeamDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue API pour voir/modifier/supprimer une équipe spécifique
    Réservé aux administrateurs
    """
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAdminUser]

class StadiumListCreateAPIView(generics.ListCreateAPIView):
    """
    Vue API pour lister et créer des stades
    Accessible à tous
    """
    queryset = Stadium.objects.all()
    serializer_class = StadiumSerializer
    permission_classes = [AllowAny]

class StadiumDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue API pour voir/modifier/supprimer un stade spécifique
    Réservé aux administrateurs
    """
    queryset = Stadium.objects.all()
    serializer_class = StadiumSerializer
    permission_classes = [IsAdminUser]

class TicketListCreateAPIView(generics.ListCreateAPIView):
    """
    Vue API pour lister et créer des tickets
    Nécessite d'être connecté
    """
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

class TicketDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue API pour voir/modifier/supprimer un ticket spécifique
    Réservé aux administrateurs
    """
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAdminUser]

class LoginUserAPIView(APIView):
    """
    Vue API pour la connexion des utilisateurs mobiles
    Endpoint: POST /api/login/
    
    Processus:
    1. Reçoit username/password
    2. Authentifie l'utilisateur
    3. Crée ou récupère un token d'authentification
    4. Renvoie le token et les infos utilisateur
    """
    def post(self, request):
        # Récupère les identifiants de connexion
        username = request.data.get("username")
        password = request.data.get("password")

        # Tente d'authentifier l'utilisateur
        user = authenticate(username=username, password=password)

        if user is not None:
            # Crée ou récupère le token d'authentification
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "user": {"id": user.id, "username": user.username}
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Identifiants incorrects"},
                status=status.HTTP_401_UNAUTHORIZED
            )

class PurchaseTicketAPIView(APIView):
    """
    Vue API pour l'achat de tickets
    Nécessite d'être connecté
    
    Processus:
    1. Vérifie l'existence de l'événement
    2. Valide la catégorie du ticket
    3. Calcule le prix
    4. Crée le(s) ticket(s)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Récupère les données de la requête
        user = request.user
        event_id = request.data.get("event_id")
        category = request.data.get("category")
        quantity = int(request.data.get("quantity", 1))  # Par défaut 1 ticket

        # Vérifie que l'événement existe
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {"error": "Événement non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Définit les prix selon la catégorie
        category_prices = {
            "STANDARD": 50,
            "VIP": 100,
            "PREMIUM": 150
        }
        
        # Vérifie que la catégorie est valide
        if category not in category_prices:
            return Response(
                {"error": "Catégorie invalide."},
                status=status.HTTP_400_BAD_REQUEST
            )

        price = category_prices[category]
        
        try:
            # Crée les tickets demandés
            tickets = []
            for _ in range(quantity):
                ticket = Ticket.objects.create(
                    user=user,
                    event=event,
                    category=category,
                    price=price
                )
                tickets.append(ticket)
            
            # Convertit les tickets en JSON et les renvoie
            serializer = TicketSerializer(tickets, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": f"Erreur lors de la création du ticket: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserTicketsAPIView(APIView):
    """
    Vue API pour récupérer les tickets d'un utilisateur
    Nécessite d'être connecté
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Récupère tous les tickets de l'utilisateur connecté
        tickets = Ticket.objects.filter(user=request.user)
        # Convertit les tickets en JSON
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data)

@api_view(['POST'])  # Décorateur indiquant que cette vue accepte uniquement les requêtes POST
@permission_classes([AllowAny])  # Permet l'accès à tous (pas besoin d'être connecté)
def user_login(request):
    """
    Vue API pour la connexion des utilisateurs
    Endpoint: POST /api/login/
    """
    # Récupère les identifiants
    username = request.data.get('username')
    password = request.data.get('password')
    
    # Vérifie que les identifiants sont fournis
    if not username or not password:
        return Response(
            {'error': 'Veuillez fournir un nom d\'utilisateur et un mot de passe'},
            status=400
        )
    
    # Tente d'authentifier l'utilisateur
    user = authenticate(username=username, password=password)
    
    if user:
        # Crée ou récupère le token d'authentification
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
    Vue API pour l'inscription des utilisateurs
    Endpoint: POST /api/register/
    """
    # Valide les données d'inscription avec le sérialiseur
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Crée l'utilisateur
            user = serializer.save()
            # Crée le token d'authentification
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
            return Response(
                {'error': 'Un utilisateur avec ce nom existe déjà'},
                status=400
            )
    
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """
    Vue API pour la déconnexion des utilisateurs
    Endpoint: POST /api/logout/
    Nécessite d'être connecté
    """
    try:
        # Supprime le token d'authentification
        request.user.auth_token.delete()
        return Response({'message': 'Déconnexion réussie'}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

class RegisterUserAPIView(APIView):
    """
    Vue API pour l'inscription des utilisateurs
    Version classe de la vue user_register
    Endpoint: POST /api/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Valide les données avec le sérialiseur
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Crée l'utilisateur
                user = serializer.save()
                
                # Crée le token d'authentification
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
    Vue API pour la connexion des utilisateurs
    Version fonction de la vue LoginUserAPIView
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
    Vue API pour la déconnexion des utilisateurs
    Version fonction de la vue de déconnexion
    """
    try:
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
    Vue API pour l'inscription des utilisateurs
    Version fonction alternative avec création directe de l'utilisateur
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Crée l'utilisateur avec les données validées
            user = User.objects.create_user(
                username=serializer.validated_data['username'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                first_name=serializer.validated_data.get('first_name', ''),
                last_name=serializer.validated_data.get('last_name', '')
            )
            
            # Crée le token d'authentification
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