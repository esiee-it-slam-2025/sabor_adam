from django.contrib import admin
from django.utils.html import format_html
# Importation depuis le package mainapp.models
from mainapp.models import Event, Team, Stadium, Ticket

# Commençons par les modèles sans dépendances
@admin.register(Stadium)
class StadiumAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'access_motor',
        'access_mental',
        'access_visual',
        'access_hearing'
    ]
    search_fields = ('name',)
    ordering = ['name']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'display_logo',
        'created_at'
    ]
    search_fields = ('name',)

    def display_logo(self, obj):
        if obj.logo:
            return format_html('<img src="{}" width="50" height="50" />', obj.logo.url)
        return "Pas de logo"
    display_logo.short_description = 'Logo'

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'time',
        'team_home',
        'team_away',
        'stadium',
        'score_home',
        'score_away',
        'created_at'
    ]
    search_fields = ('name', 'team_home__name', 'team_away__name', 'stadium__name')
    list_editable = ['score_home', 'score_away']
    list_filter = ['time', 'stadium']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'get_event_name',
        'ticket_type',
        'price',
        'quantity',
        'total_price',
        'purchase_date',
        'status',
        'ticket_uuid'
    ]
    list_filter = [
        'ticket_type',
        'event',
        'status',
        'purchase_date'
    ]

    def get_event_name(self, obj):
        if obj.event:
            return obj.event.name
        return "Aucun événement"
    get_event_name.short_description = 'Événement'

    def total_price(self, obj):
        return obj.price * obj.quantity
    total_price.short_description = 'Prix total'