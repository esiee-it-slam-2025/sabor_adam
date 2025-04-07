"""
Vue d'ensemble du fichier :
Ce fichier définit toutes les URLs (routes) de l'application Django.
Il fait le lien entre les URLs demandées par les utilisateurs et les fonctions/classes qui vont traiter ces requêtes.
Le fichier est organisé en plusieurs sections :
- Imports des dépendances nécessaires
- Routes d'administration Django et personnalisées 
- Routes API pour l'authentification
- Routes API pour la gestion des données (événements, équipes, stades, tickets)
- Routes API publiques
"""

# Import des fonctionnalités Django de base
from django.contrib import admin  # Module d'administration Django
from django.urls import path, include  # Fonctions pour définir les URLs
from django.conf import settings  # Accès aux paramètres du projet
from django.conf.urls.static import static  # Gestion des fichiers statiques/médias

# Import des vues personnalisées
from .views import admin_views
from .views.admin_views import (
    # Vues pour l'interface d'administration personnalisée
    admin_login,      # Connexion administrateur
    admin_matches,    # Liste des matchs
    admin_match_edit, # Édition d'un match
    admin_match_delete, # Suppression d'un match
    admin_logout,     # Déconnexion administrateur
    
    # Classes API pour l'administration
    TeamAdminAPI,     # Gestion des équipes
    StadiumAdminAPI,  # Gestion des stades
    TicketAdminAPI,   # Gestion des tickets
    
    # Classes API génériques pour les opérations CRUD
    EventListCreateAPIView,    # Liste et création d'événements
    EventDetailAPIView,        # Détails et modification d'un événement
    TeamListCreateAPIView,     # Liste et création d'équipes
    TeamDetailAPIView,         # Détails et modification d'une équipe
    StadiumListCreateAPIView,  # Liste et création de stades
    StadiumDetailAPIView,      # Détails et modification d'un stade
    TicketListCreateAPIView,   # Liste et création de tickets
    TicketDetailAPIView,       # Détails et modification d'un ticket
    
    # Classes API pour l'authentification et la gestion des tickets
    LoginUserAPIView,          # Connexion utilisateur via API
    RegisterUserAPIView,       # Inscription utilisateur via API
    PurchaseTicketAPIView,     # Achat de tickets
    UserTicketsAPIView,        # Liste des tickets d'un utilisateur
    
    # Fonctions de gestion des utilisateurs
    user_login,     # Connexion utilisateur
    user_register,  # Inscription utilisateur
    user_logout     # Déconnexion utilisateur
)

# Import des outils REST framework
from rest_framework.decorators import api_view  # Décorateur pour créer des endpoints API
from rest_framework.response import Response    # Classe pour renvoyer des réponses API formatées

# Import de l'API de vérification des tickets
from .views.ticket_verification_api import VerifyTicketAPIView

# Définition d'un endpoint simple pour vérifier que l'API fonctionne
@api_view(['GET'])  # Ce décorateur indique que la fonction ne répond qu'aux requêtes GET
def health_check(request):
    """
    Endpoint simple pour vérifier que l'API est en ligne
    """
    return Response({"status": "ok"}, status=200)  # Renvoie un JSON avec statut 200 (OK)

# Liste de toutes les URLs de l'application
urlpatterns = [
    # Routes d'administration Django standard
    path('admin/', admin.site.urls),  # Interface d'administration Django par défaut
    
    # Routes pour l'interface d'administration personnalisée
    path('gestion/login/', admin_login, name='admin_login'),           # Page de connexion admin
    path('gestion/matches/', admin_matches, name='admin_matches'),     # Liste des matchs
    path('gestion/matches/<int:pk>/edit/', admin_match_edit,          # Édition d'un match (pk = ID du match)
         name='admin_match_edit'),
    path('gestion/matches/<int:pk>/delete/', admin_match_delete,      # Suppression d'un match
         name='admin_match_delete'),
    path('gestion/logout/', admin_logout, name='admin_logout'),        # Déconnexion admin

    # Routes API pour l'authentification des utilisateurs
    path('api/user/login/', user_login, name='user_login'),           # Connexion utilisateur
    path('api/user/register/', user_register, name='user_register'),   # Inscription utilisateur
    path('api/user/logout/', user_logout, name='user_logout'),        # Déconnexion utilisateur

    # Routes API pour la gestion des données (version 1)
    path('api/v1/events/', EventListCreateAPIView.as_view(),          # Liste/création événements
         name='event-list'),
    path('api/v1/events/<int:pk>/', EventDetailAPIView.as_view(),     # Détails/modification événement
         name='event-detail'),
    path('api/v1/teams/', TeamListCreateAPIView.as_view(),            # Liste/création équipes
         name='team-list'),
    path('api/v1/teams/<int:pk>/', TeamDetailAPIView.as_view(),       # Détails/modification équipe
         name='team-detail'),
    path('api/v1/stadiums/', StadiumListCreateAPIView.as_view(),      # Liste/création stades
         name='stadium-list'),
    path('api/v1/stadiums/<int:pk>/', StadiumDetailAPIView.as_view(), # Détails/modification stade
         name='stadium-detail'),
    
    # Routes API pour la gestion des tickets
    path('api/v1/tickets/', TicketListCreateAPIView.as_view(),        # Liste/création tickets
         name='ticket-list'),
    path('api/v1/tickets/<int:pk>/', TicketDetailAPIView.as_view(),   # Détails/modification ticket
         name='ticket-detail'),
    path('api/v1/tickets/purchase/', PurchaseTicketAPIView.as_view(), # Achat de tickets
         name='purchase-ticket'),
    path('api/v1/user/tickets/', UserTicketsAPIView.as_view(),        # Liste tickets utilisateur
         name='user-tickets'),

    # Routes API pour l'administration (interface séparée)
    path('api/admin/teams/', TeamAdminAPI.as_view(),                  # Gestion admin équipes
         name='team_admin_api'),
    path('api/admin/stadiums/', StadiumAdminAPI.as_view(),            # Gestion admin stades
         name='stadium_admin_api'),
    path('api/admin/tickets/', TicketAdminAPI.as_view(),              # Gestion admin tickets
         name='ticket_admin_api'),
    
    # Routes API publiques (sans préfixe de version)
    path('api/events/', EventListCreateAPIView.as_view(),             # Liste/création événements
         name='event_list_create'),
    path('api/events/<int:pk>/', EventDetailAPIView.as_view(),        # Détails/modification événement
         name='event_detail'),
    path('api/teams/', TeamListCreateAPIView.as_view(),               # Liste/création équipes
         name='team_list_create'),
    path('api/teams/<int:pk>/', TeamDetailAPIView.as_view(),          # Détails/modification équipe
         name='team_detail'),
    path('api/stadiums/', StadiumListCreateAPIView.as_view(),         # Liste/création stades
         name='stadium_list_create'),
    path('api/stadiums/<int:pk>/', StadiumDetailAPIView.as_view(),    # Détails/modification stade
         name='stadium_detail'),
    path('api/tickets/', TicketListCreateAPIView.as_view(),           # Liste/création tickets
         name='ticket_list_create'),
    path('api/tickets/<int:pk>/', TicketDetailAPIView.as_view(),      # Détails/modification ticket
         name='ticket_detail'),
    path('api/tickets/purchase/', PurchaseTicketAPIView.as_view(),    # Achat de tickets
         name='purchase_ticket'),
    path('api/user/tickets/', UserTicketsAPIView.as_view(),           # Liste tickets utilisateur
         name='user_tickets'),
    path('api/tickets/verify/<str:uuid>/', VerifyTicketAPIView.as_view(), # Vérification ticket par UUID
         name='verify_ticket'),
    path('api/health-check/', health_check, name='health_check'),      # Vérification état API

    # Routes API pour l'authentification (endpoints généraux)
    path('api/login/', LoginUserAPIView.as_view(), name='api_login'),      # Connexion API
    path('api/register/', RegisterUserAPIView.as_view(), name='api_register'), # Inscription API
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)  
# Ajout des URLs pour servir les fichiers média uploadés en développement