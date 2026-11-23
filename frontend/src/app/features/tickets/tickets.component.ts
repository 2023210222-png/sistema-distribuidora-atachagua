import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Tickets de Soporte Técnico y Enlaces</h4>
        <small class="text-muted">Incidencias reportadas por las sedes hacia Soporte TI Amarilis</small>
      </div>
      <button class="btn btn-outline-dark btn-sm" (click)="cargarTickets()">
        <i class="bi bi-arrow-clockwise me-1"></i> Actualizar Lista
      </button>
    </div>

    @if (mensaje) {
      <div class="alert alert-success alert-dismissible fade show py-2 small shadow-sm">
        <i class="bi bi-check-circle-fill me-2"></i>{{ mensaje }}
        <button type="button" class="btn-close py-2" (click)="mensaje = ''"></button>
      </div>
    }

    <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light small text-uppercase">
            <tr>
              <th class="ps-4">Sede</th>
              <th>Problema Reportado</th>
              <th>Reportado Por</th>
              <th>Estado</th>
              <th>Respuesta / Solución</th>
              @if (user?.rol === 'ADMIN') {
                <th class="pe-4 text-end">Acción</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (t of tickets; track t.id) {
              <tr>
                <td class="ps-4">
                  <div class="fw-bold text-dark">{{ t.sede_codigo }} · {{ t.sede_nombre }}</div>
                  <small class="text-muted">{{ t.fecha_creacion | date:'dd/MM/yyyy HH:mm' }}</small>
                </td>
                <td>
                  <div class="fw-semibold text-danger">{{ t.tipo_falla }}</div>
                  <small class="text-muted">{{ t.descripcion }}</small>
                </td>
                <td>{{ t.reportado_nombre }}</td>
                <td>
                  <span class="badge rounded-pill px-3 py-2"
                    [ngClass]="{
                      'bg-danger': t.estado === 'PENDIENTE',
                      'bg-warning text-dark': t.estado === 'EN_REVISION',
                      'bg-success': t.estado === 'RESUELTO'
                    }">
                    {{ t.estado.replace('_', ' ') }}
                  </span>
                </td>
                <td>
                  <span class="small text-dark">{{ t.respuesta_soporte || 'En espera de atención técnica...' }}</span>
                </td>
                @if (user?.rol === 'ADMIN') {
                  <td class="pe-4 text-end">
                    <button class="btn btn-primary btn-sm" (click)="seleccionarTicket(t)">
                      <i class="bi bi-reply me-1"></i> Atender
                    </button>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="text-center py-4 text-muted">No hay tickets registrados aún.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- PANEL PARA QUE EL ADMINISTRADOR RESPONDA Y RESUELVA EL TICKET -->
    @if (ticketEditando && user?.rol === 'ADMIN') {
      <div class="card border-0 shadow-sm mt-4 border-start border-primary border-4">
        <div class="card-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
          <h6 class="mb-0 fw-bold"><i class="bi bi-tools me-2"></i>Atender Ticket #{{ ticketEditando.id }} — {{ ticketEditando.sede_nombre }}</h6>
          <button class="btn btn-sm btn-outline-light" (click)="ticketEditando = null">Cerrar</button>
        </div>
        <div class="card-body p-4">
          <div class="alert alert-light border small mb-3">
            <strong>Problema reportado:</strong> {{ ticketEditando.tipo_falla }} — {{ ticketEditando.descripcion }}
          </div>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label small fw-semibold">Cambiar Estado</label>
              <select class="form-select" [(ngModel)]="ticketEditando.estado">
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_REVISION">En Revisión</option>
                <option value="RESUELTO">Resuelto</option>
              </select>
            </div>
            <div class="col-md-8">
              <label class="form-label small fw-semibold">Solución Aplicada / Respuesta al Personal</label>
              <input type="text" class="form-control" [(ngModel)]="ticketEditando.respuesta_soporte" placeholder="Ej. Enlace redirigido por ruta de respaldo y conexión restablecida">
            </div>
          </div>
          <div class="mt-3 text-end">
            <button class="btn btn-success btn-sm px-4" (click)="guardarRespuesta()">
              <i class="bi bi-check2-circle me-1"></i> Guardar Solución y Notificar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class TicketsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  user = this.auth.getUser();
  tickets: any[] = [];
  ticketEditando: any = null;
  mensaje = '';

  ngOnInit() {
    this.cargarTickets();
  }

  cargarTickets() {
    this.http.get<any[]>('http://127.0.0.1:8000/api/tickets/').subscribe(res => this.tickets = res);
  }

  seleccionarTicket(ticket: any) {
    this.ticketEditando = { ...ticket };
  }

  guardarRespuesta() {
    this.http.patch(`http://127.0.0.1:8000/api/tickets/${this.ticketEditando.id}/`, {
      estado: this.ticketEditando.estado,
      respuesta_soporte: this.ticketEditando.respuesta_soporte
    }).subscribe(() => {
      this.mensaje = 'Ticket atendido y actualizado correctamente.';
      this.ticketEditando = null;
      this.cargarTickets();
    });
  }
}