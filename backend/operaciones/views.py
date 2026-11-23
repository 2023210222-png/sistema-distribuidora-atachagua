from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import SedeRed, StockMaterial, TicketFalla, RegistroVenta

class StockMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMaterial
        fields = ['id', 'producto', 'categoria', 'cantidad', 'unidad_medida']

class SedeRedSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True, default='Sin asignar')
    inventario = StockMaterialSerializer(many=True, read_only=True)

    class Meta:
        model = SedeRed
        fields = '__all__'

class TicketFallaSerializer(serializers.ModelSerializer):
    sede_nombre = serializers.CharField(source='sede.nombre', read_only=True)
    sede_codigo = serializers.CharField(source='sede.codigo', read_only=True)
    reportado_nombre = serializers.CharField(source='reportado_por.get_full_name', read_only=True)

    class Meta:
        model = TicketFalla
        fields = '__all__'
        read_only_fields = ['reportado_por']

class SedeRedViewSet(viewsets.ModelViewSet):
    queryset = SedeRed.objects.prefetch_related('inventario').select_related('responsable').all().order_by('codigo')
    serializer_class = SedeRedSerializer

    @action(detail=True, methods=['post'])
    def registrar_compra(self, request, pk=None):
        stock_id = request.data.get('stock_id')
        cantidad = int(request.data.get('cantidad', 0))
        if cantidad <= 0:
            return Response({'detail': 'La cantidad debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)

        item = StockMaterial.objects.filter(id=stock_id, sede_id=pk).first()
        if not item:
            return Response({'detail': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        item.cantidad += cantidad
        item.save(update_fields=['cantidad'])
        return Response({'detail': f'Compra registrada: +{cantidad} {item.unidad_medida} de {item.producto}.'})

    @action(detail=True, methods=['post'])
    def registrar_venta(self, request, pk=None):
        stock_id = request.data.get('stock_id')
        cantidad = int(request.data.get('cantidad', 0))
        if cantidad <= 0:
            return Response({'detail': 'La cantidad debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)

        item = StockMaterial.objects.filter(id=stock_id, sede_id=pk).first()
        if not item:
            return Response({'detail': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if item.cantidad < cantidad:
            return Response({'detail': f'Stock insuficiente. Solo quedan {item.cantidad} {item.unidad_medida}.'}, status=status.HTTP_400_BAD_REQUEST)

        item.cantidad -= cantidad
        item.save(update_fields=['cantidad'])

        RegistroVenta.objects.create(
            sede_id=pk,
            producto=item.producto,
            cantidad=cantidad,
            unidad_medida=item.unidad_medida,
            vendedor=request.user if request.user.is_authenticated else None
        )
        return Response({'detail': f'Venta registrada: -{cantidad} {item.unidad_medida} de {item.producto}.'})

class TicketFallaViewSet(viewsets.ModelViewSet):
    queryset = TicketFalla.objects.select_related('sede', 'reportado_por').all().order_by('-fecha_creacion')
    serializer_class = TicketFallaSerializer

    def perform_create(self, serializer):
        serializer.save(reportado_por=self.request.user)

class EstadisticasVentasView(APIView):
    def get(self, request):
        ventas_mes = RegistroVenta.objects.select_related('sede', 'vendedor').all()

        total_unidades = ventas_mes.aggregate(total=Sum('cantidad'))['total'] or 0
        total_operaciones = ventas_mes.count()

        por_sede = list(
            ventas_mes.values('sede__codigo', 'sede__nombre', 'sede__departamento')
            .annotate(unidades=Sum('cantidad'), operaciones=Count('id'))
            .order_by('-unidades')
        )

        por_producto = list(
            ventas_mes.values('producto', 'unidad_medida')
            .annotate(unidades=Sum('cantidad'))
            .order_by('-unidades')
        )

        ultimas = [
            {
                'id': v.id,
                'sede': f"{v.sede.codigo} · {v.sede.nombre}",
                'producto': v.producto,
                'cantidad': v.cantidad,
                'unidad_medida': v.unidad_medida,
                'vendedor': v.vendedor.get_full_name() if v.vendedor else 'Sistema',
                'fecha': v.fecha_venta
            }
            for v in ventas_mes.order_by('-id')[:15]
        ]

        return Response({
            'total_unidades': total_unidades,
            'total_operaciones': total_operaciones,
            'por_sede': por_sede,
            'por_producto': por_producto,
            'ultimas_ventas': ultimas
        })