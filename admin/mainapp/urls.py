from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import auth_views, admin_views
from .views.auth_views import (
    RegisterAPIView, LoginAPIView, LogoutAPIView, 
    UserProfileAPIView, register_user, login_user
)
from .views.admin_views import (
    admin_login,
    admin_matches,
    admin_match_edit,
    admin_match_delete,
    admin_logout,
    EventAdminAPI,
    TeamAdminAPI,
    StadiumAdminAPI,
    TicketAdminAPI,
    EventListCreateAPIView,
    EventDetailAPIView,
    TeamListCreateAPIView,
    TeamDetailAPIView,
    StadiumListCreateAPIView,
    StadiumDetailAPIView,
    TicketListCreateAPIView,
    TicketDetailAPIView,
    LoginUserAPIView,
    PurchaseTicketAPIView,
    UserTicketsAPIView
)

urlpatterns = [
    path('auth/register/', register_user, name='register'),
    path('auth/login/', login_user, name='login'),
    # Routes d'administration Django
    path('admin/', admin.site.urls),
    
    # Routes d'administration personnalisée
    path('gestion/login/', admin_login, name='admin_login'),
    path('gestion/matches/', admin_matches, name='admin_matches'),
    path('gestion/matches/<int:pk>/edit/', admin_match_edit, name='admin_match_edit'),
    path('gestion/matches/<int:pk>/delete/', admin_match_delete, name='admin_match_delete'),
    path('gestion/logout/', admin_logout, name='admin_logout'),

    # Routes API - Authentification et profil utilisateur
    path('api/v1/register/', RegisterAPIView.as_view(), name='api_register'),
    path('api/v1/login/', LoginAPIView.as_view(), name='api_login'),
    path('api/v1/logout/', LogoutAPIView.as_view(), name='api_logout'),
    path('api/v1/user/', UserProfileAPIView.as_view(), name='api_user_profile'),
    
    # Routes API - Gestion des événements, équipes et stades
    path('api/v1/events/', EventListCreateAPIView.as_view(), name='event-list'),
    path('api/v1/events/<int:pk>/', EventDetailAPIView.as_view(), name='event-detail'),
    path('api/v1/teams/', TeamListCreateAPIView.as_view(), name='team-list'),
    path('api/v1/teams/<int:pk>/', TeamDetailAPIView.as_view(), name='team-detail'),
    path('api/v1/stadiums/', StadiumListCreateAPIView.as_view(), name='stadium-list'),
    path('api/v1/stadiums/<int:pk>/', StadiumDetailAPIView.as_view(), name='stadium-detail'),
    
    # Routes API - Gestion des tickets
    path('api/v1/tickets/', TicketListCreateAPIView.as_view(), name='ticket-list'),
    path('api/v1/tickets/<int:pk>/', TicketDetailAPIView.as_view(), name='ticket-detail'),
    path('api/v1/tickets/purchase/', PurchaseTicketAPIView.as_view(), name='purchase-ticket'),
    path('api/v1/user/tickets/', UserTicketsAPIView.as_view(), name='user-tickets'),

    # Routes API - Gestion des événements, équipes et stades
    path('api/admin/events/', EventAdminAPI.as_view(), name='event_admin_api'),
    path('api/admin/teams/', TeamAdminAPI.as_view(), name='team_admin_api'),
    path('api/admin/stadiums/', StadiumAdminAPI.as_view(), name='stadium_admin_api'),
    path('api/admin/tickets/', TicketAdminAPI.as_view(), name='ticket_admin_api'),
    
    # Routes API publiques
    path('api/events/', EventListCreateAPIView.as_view(), name='event_list_create'),
    path('api/events/<int:pk>/', EventDetailAPIView.as_view(), name='event_detail'),
    path('api/teams/', TeamListCreateAPIView.as_view(), name='team_list_create'),
    path('api/teams/<int:pk>/', TeamDetailAPIView.as_view(), name='team_detail'),
    path('api/stadiums/', StadiumListCreateAPIView.as_view(), name='stadium_list_create'),
    path('api/stadiums/<int:pk>/', StadiumDetailAPIView.as_view(), name='stadium_detail'),
    path('api/tickets/', TicketListCreateAPIView.as_view(), name='ticket_list_create'),
    path('api/tickets/<int:pk>/', TicketDetailAPIView.as_view(), name='ticket_detail'),
    path('api/login/', LoginUserAPIView.as_view(), name='api_login'),
    path('api/tickets/purchase/', PurchaseTicketAPIView.as_view(), name='purchase_ticket'),
    path('api/user/tickets/', UserTicketsAPIView.as_view(), name='user_tickets'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)