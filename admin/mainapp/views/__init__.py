# Supprimer ou modifier l'importation des vues d'authentification
# from .auth_views import register_user, login_user

# Importer uniquement les vues d'administration
from .admin_views import *

__all__ = [
    'admin_login',
    'admin_matches',
    'admin_match_edit',
    'admin_match_delete',
    'admin_logout',
    'EventAdminAPI',
    'TeamAdminAPI',
    'StadiumAdminAPI',
    'TicketAdminAPI',
    'EventListCreateAPIView',
    'EventDetailAPIView',
    'TeamListCreateAPIView',
    'TeamDetailAPIView',
    'StadiumListCreateAPIView',
    'StadiumDetailAPIView',
    'TicketListCreateAPIView',
    'TicketDetailAPIView',
    'LoginUserAPIView',
    'PurchaseTicketAPIView',
    'UserTicketsAPIView'
]