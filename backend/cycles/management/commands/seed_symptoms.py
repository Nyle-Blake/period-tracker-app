from django.core.management.base import BaseCommand
from cycles.models import Symptom

class Command(BaseCommand):
    help = 'Seed the database with default symptoms'

    def handle(self, *args, **kwargs):
        symptoms = [
            { 'name': 'Cramps', 'category': 'physical', 'icon': '🤕' },
            { 'name': 'Bloating', 'category': 'digestive', 'icon': '🫃' },
            { 'name': 'Headache', 'category': 'physical', 'icon': '🤯' },
            { 'name': 'Fatigue', 'category': 'physical', 'icon': '😴' },
            { 'name': 'Mood Swings', 'category': 'mood', 'icon': '😤' },
            { 'name': 'Anxiety', 'category': 'mood', 'icon': '😰' },
            { 'name': 'Acne', 'category': 'skin', 'icon': '😣' },
            { 'name': 'Back Pain', 'category': 'physical', 'icon': '🔙' },
            { 'name': 'Nausea', 'category': 'digestive', 'icon': '🤢' },
            { 'name': 'Tender Breasts', 'category': 'physical', 'icon': '💢' },
        ]

        for s in symptoms:
            Symptom.objects.get_or_create(name=s['name'], defaults=s)
            self.stdout.write(f"Added {s['name']}")

        self.stdout.write(self.style.SUCCESS('Symptoms seeded successfully!'))