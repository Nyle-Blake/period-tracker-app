from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import RegisterView, LoginView
from cycles.views import CycleEntryViewSet, SymptomViewSet, SymptomEntryViewSet

router = DefaultRouter()
router.register(r'cycles-entries', CycleEntryViewSet, basename='cycle-entry')
router.register(r'symptoms', SymptomViewSet, basename='symptom')
router.register(r'symptom-entries', SymptomEntryViewSet, basename='symptom-entry')

urlpatterns = [
    path('admin/', admin.site.urls), 

    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view()),
    path('api/auth/login/', LoginView.as_view()),
    
    path('api/', include(router.urls)),
]