from django.db import models
from django.contrib.auth.models import User
import uuid
from .event import Event

class Ticket(models.Model):
    TICKET_TYPES = [
        ('PLATINUM', 'Platinum'),
        ('GOLD', 'Gold'),
        ('SILVER', 'Silver'),
    ]

    PRICES = {
        'PLATINUM': 300,
        'GOLD': 200,
        'SILVER': 100
    }

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tickets')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ticket_type = models.CharField(max_length=20, choices=TICKET_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ticket_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def save(self, *args, **kwargs):
        if not self.price:
            self.price = self.PRICES.get(self.ticket_type, 0)
        
        self.total_price = self.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_type} - {self.event}"

    def get_qr_code_data(self):
        """Retourne les données à encoder dans le QR code"""
        return str(self.ticket_uuid)

    class Meta:
        ordering = ['-purchase_date'] 