from django.db import models
from django.contrib.auth import get_user_model
from common.models import BaseModel

User = get_user_model()


class Symptom(BaseModel):
    CATEGORY_CHOICES = [
        ('physical', 'Physical'),
        ('mood', 'Mood'),
        ('digestive', 'Digestive'),
        ('skin', 'Skin'),
        ('other', 'Other'),
    ]
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    icon = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name


class PeriodEntry(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    @property
    def period_days(self):
        if self.end_date and self.start_date:
            return (self.end_date - self.start_date).days + 1
        return None

    def __str__(self):
        return f"{self.user} - {self.start_date}"


class SymptomEntry(BaseModel):
    SEVERITY_CHOICES = [(1, 'Mild'), (2, 'Moderate'), (3, 'Severe')]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    symptom = models.ForeignKey(Symptom, on_delete=models.CASCADE)
    date = models.DateField()
    severity = models.IntegerField(choices=SEVERITY_CHOICES, null=True, blank=True)

    class Meta:
        unique_together = ('user', 'symptom', 'date')

    def __str__(self):
        return f"{self.user} - {self.symptom.name} - {self.date}"