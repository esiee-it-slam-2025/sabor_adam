from django.db import models

class Stadium(models.Model):
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)  # Date de création
    access_motor = models.BooleanField(default=False)
    access_mental = models.BooleanField(default=False)
    access_visual = models.BooleanField(default=False)
    access_hearing = models.BooleanField(default=False)
 

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
