from rest_framework import serializers
from django.contrib.auth.models import User
from mainapp.models import UserProfile, Event, Team, Stadium, Ticket

class UserSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour afficher les informations de l'utilisateur
    """
    profile = 'UserProfileSerializer(read_only=True)'
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id']

class EventSerializer(serializers.ModelSerializer):
    team_home_name = serializers.CharField(source='team_home.name', read_only=True)
    team_away_name = serializers.CharField(source='team_away.name', read_only=True)
    stadium_name = serializers.CharField(source='stadium.name', read_only=True)
    winner_name = serializers.CharField(source='winner.name', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'team_home', 'team_away', 'team_home_name', 'team_away_name', 
            'stadium', 'stadium_name', 'start', 'score_team_home', 'score_team_away',
            'winner', 'winner_name'
        ]

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'

class StadiumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stadium
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'address', 'birthdate']

class TicketSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les tickets
    """
    user = UserSerializer(read_only=True)
    event_details = EventSerializer(source='event', read_only=True)
    
    class Meta:
        model = Ticket
        fields = ['id', 'user', 'event', 'event_details', 'category', 'price', 
                 'quantity', 'reference', 'created_at']
        read_only_fields = ['id', 'reference', 'created_at']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'enregistrement d'un nouveau utilisateur
    """
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'profile']
    
    def validate(self, data):
        # Vérifier que les deux mots de passe correspondent
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        
        # Vérifier si l'email existe déjà
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Un utilisateur avec cet email existe déjà."})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        profile_data = validated_data.pop('profile', None)
        
        # Créer l'utilisateur
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        
        # Mettre à jour le profil si des données supplémentaires sont fournies
        if profile_data:
            UserProfile.objects.create(user=user, **profile_data)
        
        return user