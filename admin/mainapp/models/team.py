from django.db import models

class Team(models.Model):
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='team_logos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name'] 