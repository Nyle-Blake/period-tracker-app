from datetime import timedelta
from rest_framework import serializers
from .models import CycleEntry, Symptom, SymptomEntry
from django.utils import timezone

class CycleEntrySerializer(serializers.ModelSerializer):
    period_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = CycleEntry
        fields = ['id', 'start_date', 'end_date', 'notes', 'created_at', 'period_days']

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        today = timezone.now().date()

        if start_date and start_date > today:
            raise serializers.ValidationError("Start date cannot be in the future.")

        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError("End date cannot be before start date.")

        # Prevent two periods within the same cycle
        if start_date:
            user = self.context['request'].user
            cycle_length = user.cycle_length or 28
            existing = CycleEntry.objects.filter(user=user)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            for c in existing:
                cycle_end = c.start_date + timedelta(days=cycle_length - 1)
                if start_date >= c.start_date and start_date <= cycle_end:
                    raise serializers.ValidationError(
                        "This date falls within an existing cycle. Each cycle can only have one period."
                    )

        return data

class SymptomSerializer(serializers.ModelSerializer):
    symptom_name = serializers.CharField(source='symptom.name', read_only=True)
    
    class Meta:
        model = Symptom
        fields = ['id', 'name', 'category', 'icon', 'symptom_name']

class SymptomEntrySerializer(serializers.ModelSerializer):
    symptom_name = serializers.CharField(source='symptom.name', read_only=True)
    
    class Meta:
        model = SymptomEntry
        fields = ['id', 'symptom', 'symptom_name', 'date', 'severity']

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Cannot log symptoms for a future date.")
        
        return value