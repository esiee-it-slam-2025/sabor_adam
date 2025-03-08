from django.contrib import admin
from mainapp.models import UserProfile, Event, Team, Stadium, Ticket
from django.utils.html import format_html

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'time',
        'team_home',
        'team_away',
        'stadium',
        'score_home',
        'score_away'
    ]
    
    search_fields = ('name', 'team_home__name', 'team_away__name')
    list_filter = ('status',)
    list_editable = ['score_home', 'score_away']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'description',
        'display_logo',
        'created_at'
    ]
    search_fields = ('name',)

    def display_logo(self, obj):
        if obj.logo:
            return format_html('<img src="{}" width="50" height="50" />', obj.logo.url)
        return "Pas de logo"
    display_logo.short_description = 'Logo'

@admin.register(Stadium)
class StadiumAdmin(admin.ModelAdmin):
    list_display = [
        'name'
    ]
    search_fields = ('name', 'address')

    def display_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" />', obj.image.url)
        return "Pas d'image"
    display_image.short_description = 'Image'

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'event',
        'ticket_type',
        'price',
        'status',
        'user',
        'purchase_date',
        'seat_number'
    ]
    list_filter = [
        'ticket_type',
        'status',
        'event'
    ]
    search_fields = ('user__username', 'event__name', 'seat_number')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'created_at'
    ]
    search_fields = ('user__username', 'phone_number')