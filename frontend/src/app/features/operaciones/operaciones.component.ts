import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-operaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (mensajeAlerta) {
      <div class="alert alert-dismissible fade show py-2 small shadow-sm" [ngClass]="esError ? 'alert-danger' : 'alert-success'">
        <i class="bi me-2" [ngClass]="esError ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'"></i>{{ mensajeAlerta }}
        <button type="button" class="btn-close py-2" (click)="mensajeAlerta = ''"></button>
      </div>
    }

    @if (sedeSeleccionada) {
      <div class="mb-3 d-flex justify-content-between align-items-center">
        <button class="btn btn-outline-dark btn-sm" (click)="cerrarDetalle()">
          <i class="bi bi-arrow-left me-1"></i> Volver a todas las sedes
        </button>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-dark btn-sm" (click)="cargarSedes()">
            <i class="bi bi-arrow-clockwise me-1"></i> Actualizar
          </button>
          <span class="badge bg-dark px-3 py-2">{{ sedeSeleccionada.departamento }}</span>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-3 mb-4">
        <div class="card-header bg-white py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span class="badge bg-primary mb-1">{{ sedeSeleccionada.codigo }}</span>
            <h4 class="fw-bold mb-0">{{ sedeSeleccionada.nombre }}</h4>
            <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>{{ sedeSeleccionada.direccion }}</small>
          </div>

          <!-- BOTONES DE ACCIÓN: OCULTOS PARA EL CLIENTE -->
          @if (user?.rol !== 'CLIENTE') {
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-success btn-sm" (click)="abrirMovimiento('COMPRA')">
                <i class="bi bi-plus-circle me-1"></i> Registrar Compra (+)
              </button>
              <button class="btn btn-primary btn-sm" (click)="abrirMovimiento('VENTA')">
                <i class="bi bi-dash-circle me-1"></i> Registrar Venta (-)
              </button>
              <button class="btn btn-outline-danger btn-sm" (click)="mostrarFormFalla = !mostrarFormFalla; modoMovimiento = null">
                <i class="bi bi-exclamation-triangle me-1"></i> Reportar Falla
              </button>
            </div>
          }
        </div>

        <div class="card-body p-4">
          @if (modoMovimiento && user?.rol !== 'CLIENTE') {
            <div class="border rounded-3 p-3 mb-4" [ngClass]="modoMovimiento === 'COMPRA' ? 'bg-success bg-opacity-10 border-success' : 'bg-primary bg-opacity-10 border-primary'">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold mb-0" [ngClass]="modoMovimiento === 'COMPRA' ? 'text-success' : 'text-primary'">
                  {{ modoMovimiento === 'COMPRA' ? 'Ingreso por Compra (Aumentar Stock)' : 'Salida por Venta (Disminuir Stock)' }}
                </h6>
                <button class="btn-close btn-sm" (click)="modoMovimiento = null"></button>
              </div>
              <div class="row g-3 align-items-end">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Material</label>
                  <select class="form-select form-select-sm" [(ngModel)]="movimientoForm.stock_id">
                    @for (prod of sedeSeleccionada.inventario; track prod.id) {
                      <option [value]="prod.id">
                        {{ prod.producto }} (Disponible: {{ prod.cantidad }} {{ prod.unidad_medida }})
                      </option>
                    }
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-semibold">Cantidad</label>
                  <input type="number" min="1" class="form-control form-control-sm" [(ngModel)]="movimientoForm.cantidad">
                </div>
                <div class="col-md-3">
                  <button class="btn btn-sm w-100 fw-semibold"
                    [ngClass]="modoMovimiento === 'COMPRA' ? 'btn-success' : 'btn-primary'"
                    (click)="procesarMovimiento()"
                    [disabled]="!movimientoForm.cantidad || movimientoForm.cantidad <= 0">
                    {{ modoMovimiento === 'COMPRA' ? 'Sumar al Almacén' : 'Registrar Venta' }}
                  </button>
                </div>
              </div>
            </div>
          }

          @if (mostrarFormFalla && user?.rol !== 'CLIENTE') {
            <div class="bg-danger bg-opacity-10 border border-danger rounded-3 p-3 mb-4">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold text-danger mb-0"><i class="bi bi-tools me-1"></i> Reportar Falla al Administrador</h6>
                <button class="btn-close btn-sm" (click)="mostrarFormFalla = false"></button>
              </div>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label small fw-semibold">Tipo de Problema</label>
                  <select class="form-select form-select-sm" [(ngModel)]="nuevoTicket.tipo_falla">
                    <option value="Sin conexión con servidor central (Amarilis)">Sin conexión con servidor central (Amarilis)</option>
                    <option value="Falla de red Wi-Fi en almacén / tienda">Falla de red Wi-Fi en almacén / tienda</option>
                    <option value="Lentitud al consultar stock o facturar">Lentitud al consultar stock o facturar</option>
                    <option value="Falla de equipo de cómputo o impresora">Falla de equipo de cómputo o impresora</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Detalle del problema</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevoTicket.descripcion" placeholder="Describe qué sucede en tu sede...">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                  <button class="btn btn-danger btn-sm w-100" (click)="enviarTicket()" [disabled]="!nuevoTicket.descripcion">
                    Enviar Reporte
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- RESUMEN DE LA SEDE (SOLO PERSONAL INTERNO) -->
          @if (user?.rol !== 'CLIENTE') {
            <div class="row g-3 mb-4">
              <div class="col-md-3">
                <div class="border rounded-3 p-3 h-100 bg-primary bg-opacity-10 border-primary">
                  <div class="text-primary small fw-semibold">Total Unidades en Almacén</div>
                  <h3 class="fw-bold text-primary mb-0">{{ calcularTotalUnidades() }}</h3>
                  <small class="text-muted">{{ sedeSeleccionada.inventario?.length || 0 }} productos registrados</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="border rounded-3 p-3 h-100 bg-light">
                  <div class="text-muted small fw-semibold mb-1">Estado de Conexión WAN</div>
                  @if (user?.rol === 'ADMIN') {
                    <select class="form-select form-select-sm mb-2 fw-semibold" [ngModel]="sedeSeleccionada.estado" (ngModelChange)="cambiarEstadoSede($event)">
                      <option value="OPERATIVO">Conectado (Operativo)</option>
                      <option value="FAILOVER">Respaldo Activo (Failover OSPFv3)</option>
                      <option value="EN_DESPLIEGUE">En Despliegue (Pendiente)</option>
                    </select>
                  } @else {
                    <span class="badge rounded-pill px-3 py-2"
                      [ngClass]="{
                        'bg-success': sedeSeleccionada.estado === 'OPERATIVO',
                        'bg-warning text-dark': sedeSeleccionada.estado === 'FAILOVER',
                        'bg-secondary': sedeSeleccionada.estado === 'EN_DESPLIEGUE'
                      }">
                      {{ sedeSeleccionada.estado === 'OPERATIVO' ? 'CONECTADO' : (sedeSeleccionada.estado === 'FAILOVER' ? 'RESPALDO ACTIVO' : 'EN DESPLIEGUE') }}
                    </span>
                  }
                  <div class="small text-muted mt-1">Encargado: <strong>{{ sedeSeleccionada.responsable_nombre }}</strong></div>
                </div>
              </div>
              <div class="col-md-5">
                <div class="border rounded-3 p-3 h-100 bg-light">
                  <div class="text-muted small fw-semibold mb-1">Equipamiento en Local</div>
                  <p class="mb-1 small fw-medium text-dark">{{ sedeSeleccionada.equipos_detalle }}</p>
                </div>
              </div>
            </div>
          }

          <!-- TABLA DE PRODUCTOS: VISIBLE PARA TODOS (INCLUIDO CLIENTE) -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold mb-0"><i class="bi bi-box-seam text-primary me-2"></i>Catálogo y Stock Disponible en {{ sedeSeleccionada.nombre }}</h6>
            @if (contarAgotados() > 0) {
              <span class="badge bg-danger">{{ contarAgotados() }} producto(s) agotado(s)</span>
            }
          </div>

          <div class="table-responsive border rounded-3">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light small text-uppercase">
                <tr>
                  <th class="ps-3">Producto / Material</th>
                  <th>Categoría</th>
                  <th>Cantidad Disponible</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (item of sedeSeleccionada.inventario; track item.id) {
                  <tr>
                    <td class="ps-3 fw-semibold">{{ item.producto }}</td>
                    <td><span class="badge bg-light text-dark border">{{ item.categoria }}</span></td>
                    <td class="fw-bold fs-6" [ngClass]="item.cantidad === 0 ? 'text-danger' : 'text-dark'">
                      {{ item.cantidad }} <span class="fw-normal small text-muted">{{ item.unidad_medida }}</span>
                    </td>
                    <td>
                      @if (item.cantidad === 0) {
                        <span class="badge bg-danger px-3 py-2"><i class="bi bi-x-circle me-1"></i> AGOTADO</span>
                      } @else if (item.cantidad < 30) {
                        <span class="badge bg-warning text-dark px-3 py-2"><i class="bi bi-exclamation-circle me-1"></i> STOCK BAJO</span>
                      } @else {
                        <span class="badge bg-success px-3 py-2"><i class="bi bi-check-circle me-1"></i> DISPONIBLE</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    } @else {
      <!-- VISTA GENERAL DE SEDES -->
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h4 class="fw-bold mb-0">Sedes de Distribuidora Atachagua E.I.R.L.</h4>
          <small class="text-muted">
            {{ user?.rol === 'CLIENTE' ? 'Selecciona una tienda para consultar los materiales disponibles en stock' : 'Filtra por departamento y haz clic en una sede para gestionar su stock o reportar fallas' }}
          </small>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-outline-dark btn-sm" (click)="cargarSedes()">
            <i class="bi bi-arrow-clockwise me-1"></i> Actualizar
          </button>
          <div class="btn-group">
            <button class="btn btn-sm" [ngClass]="filtroDep === 'TODOS' ? 'btn-primary' : 'btn-outline-primary'" (click)="filtroDep = 'TODOS'">
              Todas ({{ sedes.length }})
            </button>
            <button class="btn btn-sm" [ngClass]="filtroDep === 'HUANUCO' ? 'btn-primary' : 'btn-outline-primary'" (click)="filtroDep = 'HUANUCO'">
              Huánuco (9)
            </button>
            <button class="btn btn-sm" [ngClass]="filtroDep === 'UCAYALI' ? 'btn-primary' : 'btn-outline-primary'" (click)="filtroDep = 'UCAYALI'">
              Ucayali (1)
            </button>
            <button class="btn btn-sm" [ngClass]="filtroDep === 'LORETO' ? 'btn-primary' : 'btn-outline-primary'" (click)="filtroDep = 'LORETO'">
              Loreto (1)
            </button>
          </div>
        </div>
      </div>

      <div class="row g-3">
        @for (s of sedesFiltradas(); track s.id) {
          <div class="col-md-6 col-lg-4">
            <div class="card border-0 shadow-sm h-100" style="cursor: pointer;" (click)="abrirSede(s)">
              <div class="card-body p-4 d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span class="badge bg-dark">{{ s.codigo }} · {{ s.departamento }}</span>
                  @if (user?.rol !== 'CLIENTE') {
                    <span class="badge rounded-pill"
                      [ngClass]="{
                        'bg-success': s.estado === 'OPERATIVO',
                        'bg-warning text-dark': s.estado === 'FAILOVER',
                        'bg-secondary': s.estado === 'EN_DESPLIEGUE'
                      }">
                      {{ s.estado === 'OPERATIVO' ? 'Conectado' : (s.estado === 'FAILOVER' ? 'Respaldo Activo' : 'En Despliegue') }}
                    </span>
                  }
                </div>

                <h5 class="fw-bold text-dark mb-1">{{ s.nombre }}</h5>
                <p class="text-muted small mb-3 flex-grow-1"><i class="bi bi-geo-alt me-1"></i>{{ s.direccion }}</p>

                <div class="pt-2 border-top d-flex justify-content-between align-items-center">
                  <small class="text-muted fw-semibold">
                    <i class="bi bi-boxes me-1"></i> {{ s.inventario?.length || 0 }} productos
                  </small>
                  <span class="text-primary small fw-semibold">Ver productos <i class="bi bi-arrow-right"></i></span>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class OperacionesComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  user = this.auth.getUser();
  sedes: any[] = [];
  filtroDep = 'TODOS';
  sedeSeleccionada: any = null;
  mostrarFormFalla = false;
  modoMovimiento: 'COMPRA' | 'VENTA' | null = null;
  mensajeAlerta = '';
  esError = false;

  movimientoForm = { stock_id: 0, cantidad: 10 };
  nuevoTicket = { tipo_falla: 'Sin conexión con servidor central (Amarilis)', descripcion: '' };
  private apiUrl = 'http://127.0.0.1:8000/api/sedes/';

  ngOnInit() {
    this.cargarSedes();
  }

  cargarSedes() {
    this.http.get<any[]>(this.apiUrl).subscribe(res => {
      this.sedes = res;
      if (this.sedeSeleccionada) {
        this.sedeSeleccionada = res.find(x => x.id === this.sedeSeleccionada.id) || null;
      }
    });
  }

  sedesFiltradas() {
    if (this.filtroDep === 'TODOS') return this.sedes;
    return this.sedes.filter(s => s.departamento === this.filtroDep);
  }

  abrirSede(sede: any) {
    this.sedeSeleccionada = sede;
    this.modoMovimiento = null;
    this.mostrarFormFalla = false;
  }

  cerrarDetalle() {
    this.sedeSeleccionada = null;
    this.modoMovimiento = null;
    this.mostrarFormFalla = false;
  }

  abrirMovimiento(tipo: 'COMPRA' | 'VENTA') {
    this.modoMovimiento = tipo;
    this.mostrarFormFalla = false;
    if (this.sedeSeleccionada?.inventario?.length > 0) {
      this.movimientoForm.stock_id = this.sedeSeleccionada.inventario[0].id;
      this.movimientoForm.cantidad = 10;
    }
  }

  procesarMovimiento() {
    const endpoint = this.modoMovimiento === 'COMPRA' ? 'registrar_compra' : 'registrar_venta';
    this.http.post<any>(`${this.apiUrl}${this.sedeSeleccionada.id}/${endpoint}/`, this.movimientoForm).subscribe({
      next: (res) => {
        this.esError = false;
        this.mensajeAlerta = res.detail;
        this.modoMovimiento = null;
        this.cargarSedes();
      },
      error: (err) => {
        this.esError = true;
        this.mensajeAlerta = err.error?.detail || 'No se pudo actualizar el stock.';
      }
    });
  }

  calcularTotalUnidades(): number {
    if (!this.sedeSeleccionada?.inventario) return 0;
    return this.sedeSeleccionada.inventario.reduce((acc: number, item: any) => acc + item.cantidad, 0);
  }

  contarAgotados(): number {
    if (!this.sedeSeleccionada?.inventario) return 0;
    return this.sedeSeleccionada.inventario.filter((item: any) => item.cantidad === 0).length;
  }

  cambiarEstadoSede(nuevoEstado: string) {
    this.http.patch(`${this.apiUrl}${this.sedeSeleccionada.id}/`, { estado: nuevoEstado }).subscribe(() => {
      this.esError = false;
      this.mensajeAlerta = `Estado de red actualizado para ${this.sedeSeleccionada.nombre}.`;
      this.cargarSedes();
    });
  }

  enviarTicket() {
    this.http.post('http://127.0.0.1:8000/api/tickets/', {
      sede: this.sedeSeleccionada.id,
      tipo_falla: this.nuevoTicket.tipo_falla,
      descripcion: this.nuevoTicket.descripcion
    }).subscribe({
      next: () => {
        this.mostrarFormFalla = false;
        this.nuevoTicket.descripcion = '';
        this.esError = false;
        this.mensajeAlerta = 'Reporte enviado correctamente al Administrador de Soporte.';
      },
      error: () => {
        this.esError = true;
        this.mensajeAlerta = 'No se pudo enviar el reporte.';
      }
    });
  }
}