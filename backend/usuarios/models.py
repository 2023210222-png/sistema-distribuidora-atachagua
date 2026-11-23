from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class Usuario(AbstractUser):
    class Rol(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        GERENTE = 'GERENTE', 'Gerente'
        SUPERVISOR = 'SUPERVISOR', 'Supervisor'
        TRABAJADOR = 'TRABAJADOR', 'Trabajador'
        CLIENTE = 'CLIENTE', 'Cliente'

    rol = models.CharField(max_length=20, choices=Rol.choices, default=Rol.TRABAJADOR)
    dni = models.CharField(max_length=15, unique=True)
    area = models.CharField(max_length=100, blank=True)
    intentos_fallidos = models.PositiveSmallIntegerField(default=0)
    bloqueado_hasta = models.DateTimeField(null=True, blank=True)

    def esta_bloqueado(self):
        return bool(self.bloqueado_hasta and self.bloqueado_hasta > timezone.now())

    def registrar_intento_fallido(self):
        self.intentos_fallidos += 1
        if self.intentos_fallidos >= 5:
            self.bloqueado_hasta = timezone.now() + timedelta(minutes=15)
        self.save(update_fields=['intentos_fallidos', 'bloqueado_hasta'])

    def resetear_intentos(self):
        if self.intentos_fallidos > 0 or self.bloqueado_hasta is not None:
            self.intentos_fallidos = 0
            self.bloqueado_hasta = None
            self.save(update_fields=['intentos_fallidos', 'bloqueado_hasta'])

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_rol_display()})"