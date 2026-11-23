from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from usuarios.views import LoginView, UsuarioViewSet
from operaciones.views import SedeRedViewSet, TicketFallaViewSet, EstadisticasVentasView

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'sedes', SedeRedViewSet)
router.register(r'tickets', TicketFallaViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/estadisticas-ventas/', EstadisticasVentasView.as_view(), name='estadisticas-ventas'),
    path('api/', include(router.urls)),
]