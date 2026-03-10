from rest_framework import viewsets, permissions
from .models import PeriodEntry, Symptom, SymptomEntry
from .serializers import PeriodEntrySerializer, SymptomSerializer, SymptomEntrySerializer

class PeriodEntryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PeriodEntrySerializer

    def get_queryset(self):
        return PeriodEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SymptomViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SymptomSerializer
    queryset = Symptom.objects.all()


class SymptomEntryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SymptomEntrySerializer

    def get_queryset(self):
        return SymptomEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)