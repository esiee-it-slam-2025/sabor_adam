"""
Vue d'ensemble du fichier :
Ce fichier définit les sérialiseurs Django REST framework qui permettent de :
- Convertir les objets Python (modèles) en JSON pour l'API
- Valider les données reçues avant de les sauvegarder en base
- Gérer la sérialisation des utilisateurs, événements, équipes, stades et tickets
- Gérer l'inscription des nouveaux utilisateurs avec validation
"""

# Import des classes nécessaires de Django REST framework pour la sérialisation
from rest_framework import serializers
# Import du modèle User de Django pour la gestion des utilisateurs
from django.contrib.auth.models import User
# Import de nos modèles personnalisés définis dans models.py
from mainapp.models import Event, Team, Stadium, Ticket

class UserSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour afficher les informations de l'utilisateur
    Convertit un objet User en JSON et vice-versa
    """
    class Meta:
        # Indique que ce sérialiseur travaille avec le modèle User
        model = User
        # Liste des champs du modèle à inclure dans la sérialisation
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        # L'ID est en lecture seule car il est géré automatiquement par Django
        read_only_fields = ['id']
class StadiumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stadium
        # Inclut également tous les champs du modèle Stadium
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    team_home_name = serializers.CharField(source='team_home.name', read_only=True)
    team_away_name = serializers.CharField(source='team_away.name', read_only=True)
    stadium_name = serializers.CharField(source='stadium.name', read_only=True)

    # Ajout : accessibilité du stade    
    stadium_accessibility = serializers.SerializerMethodField()

    def get_stadium_accessibility(self, obj):
        return {
            "motor": obj.stadium.access_motor,
            "mental": obj.stadium.access_mental,
            "visual": obj.stadium.access_visual,
            "hearing": obj.stadium.access_hearing
        }

    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description', 'time', 'team_home', 'team_away',
            'team_home_name', 'team_away_name', 'stadium', 'stadium_name',
            'stadium_accessibility',  # ← le nouveau champ JSON
            'score_home', 'score_away', 'created_at', 'updated_at'
        ]


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        # '__all__' signifie qu'on inclut tous les champs du modèle Team
        fields = '__all__'


class TicketSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les tickets, incluant les détails de l'utilisateur et de l'événement
    """
    # Inclut les informations complètes de l'utilisateur via UserSerializer
    user = UserSerializer(read_only=True)
    # Inclut les informations complètes de l'événement, renommées en 'event_details'
    event_details = EventSerializer(source='event', read_only=True)
    
    class Meta:
        model = Ticket
        # Liste tous les champs, y compris les relations imbriquées définies ci-dessus
        fields = ['id', 'user', 'event', 'event_details', 'ticket_type', 'status', 'price', 
                 'quantity', 'seat_number', 'ticket_uuid', 'purchase_date']
        # Ces champs sont générés automatiquement et ne peuvent pas être modifiés via l'API
        read_only_fields = ['id', 'ticket_uuid', 'purchase_date']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur spécial pour gérer l'inscription des nouveaux utilisateurs
    Inclut la validation du mot de passe et de l'email
    """
    # Champ mot de passe en écriture seule (n'apparaît pas dans les réponses API)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    # Champ de confirmation du mot de passe
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    # L'email est obligatoire pour l'inscription
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        # Champs nécessaires pour créer un nouvel utilisateur
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate(self, data):
        """
        Méthode appelée automatiquement pour valider les données avant la création
        Vérifie que les mots de passe correspondent et que l'email est unique
        """
        # Vérifie que les deux mots de passe saisis sont identiques
        if data['password'] != data['password_confirm']:
            # Lève une exception si les mots de passe ne correspondent pas
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        
        # Vérifie qu'aucun utilisateur n'existe déjà avec cet email
        if User.objects.filter(email=data['email']).exists():
            # Lève une exception si l'email est déjà utilisé
            raise serializers.ValidationError({"email": "Un utilisateur avec cet email existe déjà."})
        
        return data
    
    def create(self, validated_data):
        """
        Méthode appelée pour créer un nouvel utilisateur après validation
        """
        # Retire le champ de confirmation qui n'est pas nécessaire pour la création
        validated_data.pop('password_confirm')
        
        # Crée l'utilisateur avec create_user qui gère le hashage du mot de passe
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            # get() permet d'avoir une valeur par défaut si le champ n'est pas rempli
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        
        return user