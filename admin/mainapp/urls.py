from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import admin_views
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
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .views.ticket_verification_api import VerifyTicketAPIView

@api_view(['GET'])
def health_check(request):
    """
    Endpoint simple pour vérifier que l'API est en ligne
    """
    return Response({"status": "ok"}, status=200)

urlpatterns = [
    # Routes d'administration Django
    path('admin/', admin.site.urls),
    
    # Routes d'administration personnalisée
    path('gestion/login/', admin_login, name='admin_login'),
    path('gestion/matches/', admin_matches, name='admin_matches'),
    path('gestion/matches/<int:pk>/edit/', admin_match_edit, name='admin_match_edit'),
    path('gestion/matches/<int:pk>/delete/', admin_match_delete, name='admin_match_delete'),
    path('gestion/logout/', admin_logout, name='admin_logout'),

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
    
    # Routes API publiques principales
    path('api/events/', EventListCreateAPIView.as_view(), name='event_list_create'),
    path('api/events/<int:pk>/', EventDetailAPIView.as_view(), name='event_detail'),
    path('api/teams/', TeamListCreateAPIView.as_view(), name='team_list_create'),
    path('api/teams/<int:pk>/', TeamDetailAPIView.as_view(), name='team_detail'),
    path('api/stadiums/', StadiumListCreateAPIView.as_view(), name='stadium_list_create'),
    path('api/stadiums/<int:pk>/', StadiumDetailAPIView.as_view(), name='stadium_detail'),
    path('api/tickets/', TicketListCreateAPIView.as_view(), name='ticket_list_create'),
    path('api/tickets/<int:pk>/', TicketDetailAPIView.as_view(), name='ticket_detail'),
    path('api/tickets/purchase/', PurchaseTicketAPIView.as_view(), name='purchase_ticket'),
    path('api/user/tickets/', UserTicketsAPIView.as_view(), name='user_tickets'),
    path('api/tickets/verify/<str:uuid>/', VerifyTicketAPIView.as_view(), name='verify_ticket'),
    path('api/health-check/', health_check, name='health_check'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# Ajoutez ces imports si nécessaire
from .views.admin_views import user_login, user_register, user_logout

# Ajoutez ces URL dans urlpatterns
path('api/user/login/', user_login, name='user_login'),
path('api/user/register/', user_register, name='user_register'),
path('api/user/logout/', user_logout, name='user_logout'),