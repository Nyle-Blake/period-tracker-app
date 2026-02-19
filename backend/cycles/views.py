from rest_framework import viewsets, permissions
from .models import CycleEntry, Symptom, SymptomEntry
from .serializers import CycleEntrySerializer, SymptomSerializer, SymptomEntrySerializer

class CycleEntryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CycleEntrySerializer

    def get_queryset(self):
        return CycleEntry.objects.filter(user=self.request.user)

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