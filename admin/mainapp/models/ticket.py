from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

class Ticket(models.Model):
    """
    Modèle représentant un billet pour un événement
    """
    TICKET_TYPES = (
        ('STANDARD', 'Standard'),
        ('VIP', 'VIP'),
        ('PREMIUM', 'Premium'),
    )
    
    TICKET_STATUS = (
        ('ACTIVE', 'Actif'),
        ('USED', 'Utilisé'),
        ('CANCELLED', 'Annulé'),
        ('EXPIRED', 'Expiré'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='tickets')
    ticket_type = models.CharField(max_length=20, choices=TICKET_TYPES, default='STANDARD')
    category = models.CharField(max_length=20, blank=True, null=True)  # Pour compatibilité
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    seat_number = models.CharField(max_length=20, blank=True, null=True)
    purchase_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=TICKET_STATUS, default='ACTIVE')
    used_at = models.DateTimeField(blank=True, null=True)
    ticket_uuid = models.CharField(max_length=100, unique=True, blank=True, editable=False)
    
    class Meta:
        verbose_name = "Billet"
        verbose_name_plural = "Billets"
        ordering = ['-purchase_date']
    
    def __str__(self):
        return f"Billet {self.ticket_type} - {self.event}"
    
    def save(self, *args, **kwargs):
        """
        Génère automatiquement un UUID unique pour le billet s'il n'en a pas déjà un
        """
        if not self.ticket_uuid:
            self.ticket_uuid = f"TICKET-{uuid.uuid4()}"
        
        # Assurer la compatibilité entre ticket_type et category
        if not self.category and self.ticket_type:
            self.category = self.ticket_type
        elif not self.ticket_type and self.category:
            self.ticket_type = self.category
        
        super().save(*args, **kwargs)
    
    def mark_as_used(self):
        """
        Marque le billet comme utilisé et enregistre la date/heure
        """
        self.status = 'USED'
        self.used_at = timezone.now()
        self.save()
        
    def is_valid(self):
        """
        Vérifie si le billet est valide (actif et non expiré)
        """
        return self.status == 'ACTIVE' and self.event.time > timezone.now()