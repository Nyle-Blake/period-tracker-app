from rest_framework import serializers
from .models import CycleEntry, Symptom, SymptomEntry

class CycleEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CycleEntry
        fields = ['id', 'start_date', 'end_date', 'notes', 'created_at']

class SymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Symptom
        fields = ['id', 'name', 'category', 'icon']

class SymptomEntrySerializer(serializers.ModelSerializer):
    symptom_name = serializers.CharField(source='symptom.name', read_only=True)
    
    class Meta:
        model = SymptomEntry
        fields = ['id', 'symptom', 'symptom_name', 'date', 'severity']