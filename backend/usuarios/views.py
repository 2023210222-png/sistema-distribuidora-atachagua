from rest_framework import serializers, viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'dni', 'rol', 'area', 'is_active']

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = Usuario.objects.filter(username=username).first()

        if not user:
            return Response({'detail': 'Credenciales inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.esta_bloqueado():
            return Response({'detail': 'Cuenta bloqueada temporalmente (15 min) por 5 intentos fallidos.'}, status=status.HTTP_403_FORBIDDEN)

        if not user.check_password(password):
            user.registrar_fallo()
            return Response({'detail': f'Contraseña incorrecta. Intento {user.intentos_fallidos}/5.'}, status=status.HTTP_401_UNAUTHORIZED)

        user.resetear_intentos()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UsuarioSerializer(user).data
        })

class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Usuario.objects.all().order_by('id')
    serializer_class = UsuarioSerializer