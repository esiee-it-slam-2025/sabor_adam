from django.db import models

class Stadium(models.Model):
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)  # Date de création

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
