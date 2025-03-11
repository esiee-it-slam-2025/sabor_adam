from django.db import models
from django.contrib.auth.models import User
import uuid
from .event import Event

class Ticket(models.Model):
    TICKET_TYPES = [
        ('STANDARD', 'Standard'),
        ('VIP', 'VIP'),
        ('PREMIUM', 'Premium'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('CONFIRMED', 'Confirmé'),
        ('CANCELLED', 'Annulé'),
    ]

    PRICES = {
        'STANDARD': 100,
        'VIP': 200,
        'PREMIUM': 300
    }

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tickets')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    ticket_type = models.CharField(max_length=20, choices=TICKET_TYPES, default='STANDARD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    seat_number = models.CharField(max_length=10, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    purchase_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ticket_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    @property
    def total_price(self):
        return self.price * self.quantity

    def save(self, *args, **kwargs):
        # Si le prix n'est pas renseigné (ou à 0), on le définit en fonction du type de billet
        if not self.price:
            self.price = self.PRICES.get(self.ticket_type, 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_type} - {self.event} - {self.user.username}"

    def get_qr_code_data(self):
        """Retourne les données à encoder dans le QR code"""
        return str(self.ticket_uuid)

    class Meta:
        ordering = ['-purchase_date']
        verbose_name = "Billet"
        verbose_name_plural = "Billets"
