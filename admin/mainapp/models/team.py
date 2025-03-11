from django.db import models

class Team(models.Model):
    name = models.CharField(max_length=200, verbose_name="Nom de l'équipe")
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='team_logos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Équipe"
        verbose_name_plural = "Équipes"

    def __str__(self):
        return self.name
