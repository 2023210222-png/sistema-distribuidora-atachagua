import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Estadísticas de Ventas del Mes</h4>
        <small class="text-muted">Consolidado en tiempo real de unidades vendidas por sede y material</small>
      </div>
      <button class="btn btn-outline-dark btn-sm" (click)="cargarEstadisticas()">
        <i class="bi bi-arrow-clockwise me-1"></i> Actualizar Datos
      </button>
    </div>

    @if (datos) {
      <!-- Tarjetas KPI -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted small fw-semibold">Unidades Vendidas (Mes Actual)</div>
                <h3 class="fw-bold text-primary mb-0">{{ datos.total_unidades }}</h3>
              </div>
              <div class="bg-primary bg-opacity-10 text-primary rounded-3 p-3">
                <i class="bi bi-graph-up-arrow fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted small fw-semibold">Operaciones de Venta</div>
                <h3 class="fw-bold text-success mb-0">{{ datos.total_operaciones }}</h3>
              </div>
              <div class="bg-success bg-opacity-10 text-success rounded-3 p-3">
                <i class="bi bi-receipt fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted small fw-semibold">Sede Líder del Mes</div>
                <h5 class="fw-bold text-dark mb-0">{{ datos.por_sede[0]?.sede__nombre || 'Sin ventas' }}</h5>
              </div>
              <div class="bg-warning bg-opacity-10 text-warning rounded-3 p-3">
                <i class="bi bi-trophy fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <!-- Ranking de Ventas por Sede con Barras -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3 px-4 border-bottom">
              <h6 class="fw-bold mb-0"><i class="bi bi-building text-primary me-2"></i>Ventas por Sede</h6>
            </div>
            <div class="card-body p-4">
              @for (s of datos.por_sede; track s.sede__codigo) {
                <div class="mb-3">
                  <div class="d-flex justify-content-between small fw-semibold mb-1">
                    <span>{{ s.sede__codigo }} · {{ s.sede__nombre }} ({{ s.sede__departamento }})</span>
                    <span class="text-primary">{{ s.unidades }} unid.</span>
                  </div>
                  <div class="progress" style="height: 10px;">
                    <div class="progress-bar bg-primary" [style.width.%]="calcularPorcentaje(s.unidades)"></div>
                  </div>
                </div>
              } @empty {
                <p class="text-muted small">Aún no hay ventas registradas este mes.</p>
              }
            </div>
          </div>
        </div>

        <!-- Productos Más Vendidos -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3 px-4 border-bottom">
              <h6 class="fw-bold mb-0"><i class="bi bi-box-seam text-success me-2"></i>Materiales Más Vendidos</h6>
            </div>
            <div class="card-body p-0">
              <table class="table table-hover mb-0 align-middle">
                <thead class="table-light small text-uppercase">
                  <tr>
                    <th class="ps-4">Material</th>
                    <th class="pe-4 text-end">Total Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of datos.por_producto; track p.producto) {
                    <tr>
                      <td class="ps-4 fw-semibold">{{ p.producto }}</td>
                      <td class="pe-4 text-end fw-bold text-success">{{ p.unidades }} {{ p.unidad_medida }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Últimas Ventas Registradas -->
      <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div class="card-header bg-white py-3 px-4 border-bottom">
          <h6 class="fw-bold mb-0">Últimos Movimientos de Venta Registrados</h6>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead class="table-light small text-uppercase">
              <tr>
                <th class="ps-4">Sede</th>
                <th>Material Vendido</th>
                <th>Cantidad</th>
                <th>Registrado Por</th>
                <th class="pe-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              @for (v of datos.ultimas_ventas; track v.id) {
                <tr>
                  <td class="ps-4 fw-bold">{{ v.sede }}</td>
                  <td>{{ v.producto }}</td>
                  <td class="fw-bold text-primary">{{ v.cantidad }} {{ v.unidad_medida }}</td>
                  <td>{{ v.vendedor }}</td>
                  <td class="pe-4 small text-muted">{{ v.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class EstadisticasComponent implements OnInit {
  private http = inject(HttpClient);
  datos: any = null;

  ngOnInit() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.http.get('http://127.0.0.1:8000/api/estadisticas-ventas/').subscribe(res => this.datos = res);
  }

  calcularPorcentaje(unidades: number): number {
    if (!this.datos || this.datos.total_unidades === 0) return 0;
    return Math.round((unidades / this.datos.total_unidades) * 100);
  }
}