from django.db import models
from django.conf import settings

class SedeRed(models.Model):
    class Departamento(models.TextChoices):
        HUANUCO = 'HUANUCO', 'Huánuco'
        UCAYALI = 'UCAYALI', 'Ucayali'
        LORETO = 'LORETO', 'Loreto'

    class EstadoEnlace(models.TextChoices):
        OPERATIVO = 'OPERATIVO', 'Conectado'
        FALLA = 'FALLA', 'Falla de Conexión'  # <-- NUEVA OPCIÓN
        FAILOVER = 'FAILOVER', 'Respaldo Activo'
        EN_DESPLIEGUE = 'EN_DESPLIEGUE', 'En Implementación'

    codigo = models.CharField(max_length=15, unique=True)
    nombre = models.CharField(max_length=120)
    direccion = models.CharField(max_length=200)
    departamento = models.CharField(max_length=20, choices=Departamento.choices)
    nodo_padre = models.CharField(max_length=80)
    router_nombre = models.CharField(max_length=80)
    medio_enlace = models.CharField(max_length=20, default='SERIAL')
    equipos_detalle = models.CharField(max_length=250)
    etapa = models.CharField(max_length=50, default='Etapa 1 - Huánuco')
    estado = models.CharField(max_length=20, choices=EstadoEnlace.choices, default=EstadoEnlace.OPERATIVO)
    responsable = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class StockMaterial(models.Model):
    sede = models.ForeignKey(SedeRed, related_name='inventario', on_delete=models.CASCADE)
    producto = models.CharField(max_length=120)
    categoria = models.CharField(max_length=60)
    cantidad = models.PositiveIntegerField(default=0)
    unidad_medida = models.CharField(max_length=30)

class RegistroVenta(models.Model):
    sede = models.ForeignKey(SedeRed, related_name='ventas', on_delete=models.CASCADE)
    producto = models.CharField(max_length=120)
    cantidad = models.PositiveIntegerField()
    unidad_medida = models.CharField(max_length=30)
    vendedor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_venta = models.DateTimeField(auto_now_add=True)

class TicketFalla(models.Model):
    class EstadoTicket(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_REVISION = 'EN_REVISION', 'En Revisión'
        RESUELTO = 'RESUELTO', 'Resuelto'

    sede = models.ForeignKey(SedeRed, related_name='tickets', on_delete=models.CASCADE)
    reportado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    tipo_falla = models.CharField(max_length=100)
    descripcion = models.TextField()
    estado = models.CharField(max_length=20, choices=EstadoTicket.choices, default=EstadoTicket.PENDIENTE)
    respuesta_soporte = models.TextField(blank=True, default='')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

class HistorialCambio(models.Model):
    sede = models.ForeignKey(SedeRed, on_delete=models.CASCADE, null=True, blank=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=200) # Ej: "Cambió estado de conexión"
    detalle = models.TextField()             # Ej: "De Conectado a Falla de Conexión"
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']