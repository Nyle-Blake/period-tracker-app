from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import RegisterView, LoginView, UserProfileView
from cycles.views import PeriodEntryViewSet, SymptomViewSet, SymptomEntryViewSet

router = DefaultRouter()
router.register(r'period-entries', PeriodEntryViewSet, basename='period-entry')
router.register(r'symptoms', SymptomViewSet, basename='symptom')
router.register(r'symptom-entries', SymptomEntryViewSet, basename='symptom-entry')

def health(request):  # temporary health check endpoint
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view()),
    path('api/auth/login/', LoginView.as_view()),

    path('api/me/', UserProfileView.as_view()),

    path('api/', include(router.urls)),

    path('api/health/', health),
]