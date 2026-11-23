import os
import random
from django.core.management.base import BaseCommand
from usuarios.models import Usuario
from operaciones.models import SedeRed, StockMaterial, TicketFalla, RegistroVenta

class Command(BaseCommand):
    help = 'Carga usuarios (incluyendo Cliente), 11 sedes, inventario, ventas del mes y tickets'

    def handle(self, *args, **kwargs):
        clave_default = os.environ.get('DEV_DEFAULT_PASS', 'Atachagua2026!')
        usuarios_demo = [
            ('admin', 'Carlos', 'Mendoza', '10000001', Usuario.Rol.ADMIN, 'Soporte TI - Amarilis'),
            ('gerente', 'Elena', 'Rojas', '10000002', Usuario.Rol.GERENTE, 'Gerencia General EDYCA'),
            ('supervisor', 'Jorge', 'Quispe', '10000003', Usuario.Rol.SUPERVISOR, 'Supervisión Regional Selva'),
            ('trabajador', 'Luis', 'Huamán', '10000004', Usuario.Rol.TRABAJADOR, 'Almacén María Luisa'),
            ('cliente', 'Rosa', 'Valdivia', '10000005', Usuario.Rol.CLIENTE, 'Consulta Catálogo Web'),
        ]

        objs = {}
        for username, nombre, apellido, dni, rol, area in usuarios_demo:
            u, created = Usuario.objects.get_or_create(
                username=username,
                defaults={'first_name': nombre, 'last_name': apellido, 'dni': dni, 'rol': rol, 'area': area}
            )
            if created:
                u.set_password(clave_default)
                u.save()
            objs[rol] = u

        sedes_data = [
            ('S01', 'Amarilis (Sede Central)', 'Urb. Santa Elena Mz. B Lt. 4', 'HUANUCO', 'R-DIST-HCO-METRO', 'R-S01-AMARILIS', 'SERIAL', 'Servidor Central Inventarios, 2 PC (Gerencia y Contabilidad), Impresora de red, Wi-Fi', 'Etapa 1 - Huánuco', 'OPERATIVO', objs['ADMIN']),
            ('S02', 'Amarilis - Almacén María Luisa', 'Zona Industrial María Luisa', 'HUANUCO', 'R-DIST-HCO-METRO', 'R-S02-ALMACEN', 'SERIAL', '1 PC de despacho, Wi-Fi para terminales PDA', 'Etapa 1 - Huánuco', 'OPERATIVO', objs['TRABAJADOR']),
            ('S03', 'Huánuco Cercado', 'Jr. 28 de Julio N° 1090-1098', 'HUANUCO', 'R-DIST-HCO-METRO', 'R-S03-HCOCERCADO', 'SERIAL', '2 PC (Caja y Ventas Mayoristas), Impresora de red, Wi-Fi', 'Etapa 1 - Huánuco', 'OPERATIVO', objs['SUPERVISOR']),
            ('S04', 'Pillco Marca', 'Av. Universitaria N° 2735', 'HUANUCO', 'R-DIST-HCO-METRO', 'R-S04-PILLCOMARCA', 'GIGABIT', '2 PC (Caja y Atención al cliente), Impresora de red, Wi-Fi', 'Etapa 1 - Huánuco', 'OPERATIVO', objs['TRABAJADOR']),
            ('S05', 'Ambo', 'Jr. Las Américas N° 750', 'HUANUCO', 'R-CORE-HUANUCO', 'R-S05-AMBO', 'GIGABIT', '1 PC de caja y facturación, Impresora, Wi-Fi', 'Etapa 1 - Huánuco', 'EN_DESPLIEGUE', objs['SUPERVISOR']),
            ('S06', 'Tingo María (Principal)', 'Av. Ucayali N° 325', 'HUANUCO', 'R-DIST-LEONCIO-PRADO', 'R-S06-TMUCAYALI', 'SERIAL', '2 PC (Caja y Supervisión Selva), Impresora de red, Wi-Fi', 'Etapa 2 - Selva', 'OPERATIVO', objs['SUPERVISOR']),
            ('S07', 'Tingo María (Sucursal 2)', 'Av. Raymondi N° 853', 'HUANUCO', 'R-DIST-LEONCIO-PRADO', 'R-S07-TMRAYMONDI', 'SERIAL', '1 PC de caja y ventas, Impresora, Wi-Fi', 'Etapa 2 - Selva', 'EN_DESPLIEGUE', objs['SUPERVISOR']),
            ('S08', 'Tingo María (Sucursal 3)', 'Av. Tito Jaime N° 445', 'HUANUCO', 'R-DIST-LEONCIO-PRADO', 'R-S08-TMTITOJAIME', 'SERIAL', '1 PC de caja y ventas, Wi-Fi para lectores de almacén', 'Etapa 2 - Selva', 'EN_DESPLIEGUE', objs['SUPERVISOR']),
            ('S09', 'Aucayacu', 'Distrito José Crespo y Castillo', 'HUANUCO', 'R-DIST-LEONCIO-PRADO', 'R-S09-AUCAYACU', 'GIGABIT', '1 PC de caja y despacho, Wi-Fi', 'Etapa 2 - Selva', 'EN_DESPLIEGUE', objs['SUPERVISOR']),
            ('S10', 'Pucallpa', 'Av. Centenario N° 1310', 'UCAYALI', 'R-CORE-UCAYALI', 'R-S10-PUCALLPA', 'SERIAL', '2 PC (Caja y Almacén Ucayali), Impresora de red, Wi-Fi', 'Etapa 2 - Selva', 'OPERATIVO', objs['GERENTE']),
            ('S11', 'Iquitos', 'Sede Logística Loreto', 'LORETO', 'R-CORE-LORETO', 'R-S11-IQUITOS', 'SERIAL', '2 PC (Caja y Recepción Fluvial), Impresora de red, Wi-Fi', 'Etapa 2 - Selva', 'OPERATIVO', objs['GERENTE']),
        ]

        productos_base = [
            ('Fierro Corrugado 1/2"', 'Acero', 'Varillas'),
            ('Cemento Portland Tipo I (42.5 kg)', 'Cementos', 'Bolsas'),
            ('Ladrillo King Kong 18 Huecos', 'Albañilería', 'Millares'),
            ('Cerámico Piso 45x45 cm', 'Acabados', 'Cajas'),
            ('Alambre Negro Recocido N° 16', 'Acero', 'Rollos'),
            ('Clavos para Madera 3"', 'Ferretería', 'Cajas'),
        ]

        sedes_creadas = {}
        for cod, nom, dir_, dep, padre, rtr, med, eq, etp, est, resp in sedes_data:
            sede, created = SedeRed.objects.get_or_create(
                codigo=cod,
                defaults={
                    'nombre': nom, 'direccion': dir_, 'departamento': dep,
                    'nodo_padre': padre, 'router_nombre': rtr, 'medio_enlace': med,
                    'equipos_detalle': eq, 'etapa': etp, 'estado': est, 'responsable': resp
                }
            )
            sedes_creadas[cod] = sede
            if created:
                for idx, (prod, cat, uni) in enumerate(productos_base):
                    if (cod in ['S03', 'S04', 'S10'] and idx == 2) or (cod == 'S01' and idx == 4):
                        cant = 0
                    else:
                        multiplicador = 3 if cod in ['S02', 'S01', 'S10'] else 1
                        cant = random.randint(25, 160) * multiplicador
                    StockMaterial.objects.create(
                        sede=sede, producto=prod, categoria=cat,
                        cantidad=cant, unidad_medida=uni
                    )

        if not RegistroVenta.objects.exists():
            ventas_demo = [
                ('S01', 'Cemento Portland Tipo I (42.5 kg)', 180, 'Bolsas', objs['TRABAJADOR']),
                ('S02', 'Fierro Corrugado 1/2"', 240, 'Varillas', objs['TRABAJADOR']),
                ('S03', 'Ladrillo King Kong 18 Huecos', 45, 'Millares', objs['SUPERVISOR']),
                ('S04', 'Cerámico Piso 45x45 cm', 95, 'Cajas', objs['TRABAJADOR']),
                ('S06', 'Cemento Portland Tipo I (42.5 kg)', 130, 'Bolsas', objs['SUPERVISOR']),
                ('S10', 'Fierro Corrugado 1/2"', 150, 'Varillas', objs['GERENTE']),
                ('S11', 'Cemento Portland Tipo I (42.5 kg)', 110, 'Bolsas', objs['GERENTE']),
            ]
            for cod_sede, prod, cant, uni, vend in ventas_demo:
                RegistroVenta.objects.create(
                    sede=sedes_creadas[cod_sede], producto=prod,
                    cantidad=cant, unidad_medida=uni, vendedor=vend
                )

        if not TicketFalla.objects.exists():
            TicketFalla.objects.create(
                sede=sedes_creadas['S04'],
                reportado_por=objs['TRABAJADOR'],
                tipo_falla='Lentitud al consultar stock en Amarilis',
                descripcion='Desde caja en Pillco Marca demora la consulta de fierro corrugado.',
                estado=TicketFalla.EstadoTicket.RESUELTO,
                respuesta_soporte='Enlace verificado y optimizado hacia el servidor central de Amarilis.'
            )

        self.stdout.write(self.style.SUCCESS('Usuarios (incluido Cliente), 11 Sedes, Ventas del Mes y Tickets cargados.'))