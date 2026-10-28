from datetime import timedelta
from rest_framework import serializers
from .models import PeriodEntry, Symptom, SymptomEntry
from django.utils import timezone

class PeriodEntrySerializer(serializers.ModelSerializer):
    period_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = PeriodEntry
        fields = ['id', 'start_date', 'end_date', 'notes', 'created_at', 'period_days']

    def validate(self, data):
        # Fall back to the saved values so partial updates are validated against the whole entry
        start_date = data.get('start_date', self.instance.start_date if self.instance else None)
        end_date = data.get('end_date', self.instance.end_date if self.instance else None)
        today = timezone.now().date()

        if start_date and start_date > today:
            raise serializers.ValidationError("Start date cannot be in the future.")

        if end_date and end_date > today:
            raise serializers.ValidationError("End date cannot be in the future.")

        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError("End date cannot be before start date.")

        # Prevent overlapping periods
        if start_date:
            user = self.context['request'].user
            period_length = user.period_length or 5
            all_entries = list(PeriodEntry.objects.filter(user=user))
            latest_start = max((c.start_date for c in all_entries), default=None)
            others = [c for c in all_entries if not self.instance or c.pk != self.instance.pk]

            def range_end(start, end, is_latest):
                if end:
                    return end
                assumed = start + timedelta(days=period_length - 1)
                # An open period runs until the user ends it, unless a later period has started
                return max(assumed, today) if is_latest else assumed

            new_is_latest = all(c.start_date <= start_date for c in others)
            new_end = range_end(start_date, end_date, new_is_latest)
            for c in others:
                c_end = range_end(c.start_date, c.end_date, c.start_date == latest_start)
                if start_date <= c_end and c.start_date <= new_end:
                    raise serializers.ValidationError(
                        "These dates overlap an existing period."
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

    def validate(self, data):
        user = self.context['request'].user
        symptom = data.get('symptom')
        date = data.get('date')
        if symptom and date:
            existing = SymptomEntry.objects.filter(user=user, symptom=symptom, date=date)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError("You have already logged this symptom today.")
        return data