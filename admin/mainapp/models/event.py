from django.db import models
from .team import Team
from .stadium import Stadium

class Event(models.Model):
    name = models.CharField(max_length=200)
    time = models.DateTimeField()
    team_home = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_events')
    team_away = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_events')
    stadium = models.ForeignKey(Stadium, on_delete=models.CASCADE)
    score_home = models.IntegerField(default=0)
    score_away = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.team_home} ({self.score_home}) vs {self.team_away} ({self.score_away}) - {self.time}"

    class Meta:
        ordering = ['-time'] 