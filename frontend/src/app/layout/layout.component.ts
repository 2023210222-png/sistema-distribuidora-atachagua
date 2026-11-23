import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex min-vh-100">
      <aside class="d-flex flex-column text-white p-3 shadow" style="width: 260px; background-color: #111827;">
        <div class="d-flex align-items-center gap-2 px-2 py-2 mb-3 border-bottom border-secondary">
          <div class="bg-primary rounded-2 d-flex align-items-center justify-content-center fw-bold" style="width: 36px; height: 36px;">
            A
          </div>
          <div>
            <div class="fw-bold lh-1">ATACHAGUA</div>
            <small class="text-secondary" style="font-size: 0.72rem;">Distribuidora E.I.R.L.</small>
          </div>
        </div>

        <small class="text-uppercase text-secondary fw-semibold px-2 mb-2" style="font-size: 0.7rem;">Menú Principal</small>
        <ul class="nav nav-pills flex-column mb-auto gap-1">
          <li>
            <a routerLink="/app/operaciones" routerLinkActive="active bg-primary" class="nav-link text-white d-flex align-items-center gap-2 py-2">
              <i class="bi bi-building"></i>
              <span>Sedes</span>
            </a>
          </li>

          <!-- ESTADÍSTICAS DE VENTAS: VISIBLE PARA TRABAJADOR, SUPERVISOR, GERENTE Y ADMIN (NO CLIENTE) -->
          @if (user?.rol !== 'CLIENTE') {
            <li>
              <a routerLink="/app/estadisticas" routerLinkActive="active bg-primary" class="nav-link text-white d-flex align-items-center gap-2 py-2">
                <i class="bi bi-bar-chart-line"></i>
                <span>Estadísticas de Ventas</span>
              </a>
            </li>
          }

          <!-- TICKETS DE SOPORTE: SOLO VISIBLE PARA ADMINISTRADOR -->
          @if (user?.rol === 'ADMIN') {
            <li>
              <a routerLink="/app/tickets" routerLinkActive="active bg-primary" class="nav-link text-white d-flex align-items-center justify-content-between py-2">
                <span class="d-flex align-items-center gap-2">
                  <i class="bi bi-life-preserver"></i>
                  <span>Tickets de Soporte</span>
                </span>
                @if (pendientesCount > 0) {
                  <span class="badge bg-danger rounded-pill">{{ pendientesCount }}</span>
                }
              </a>
            </li>
            <li>
              <a routerLink="/app/usuarios" routerLinkActive="active bg-primary" class="nav-link text-white d-flex align-items-center gap-2 py-2">
                <i class="bi bi-people"></i>
                <span>Directorio de Personal</span>
              </a>
            </li>
          }
        </ul>

        <div class="mt-auto pt-3 border-top border-secondary">
          <div class="d-flex align-items-center gap-2 mb-3 px-1">
            <div class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 38px; height: 38px;">
              {{ user?.first_name?.charAt(0) }}{{ user?.last_name?.charAt(0) }}
            </div>
            <div class="overflow-hidden">
              <div class="small fw-semibold text-truncate">{{ user?.first_name }} {{ user?.last_name }}</div>
              <span class="badge bg-primary" style="font-size: 0.65rem;">{{ user?.rol }}</span>
            </div>
          </div>
          <button (click)="auth.logout()" class="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2">
            <i class="bi bi-box-arrow-left"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div class="flex-grow-1 d-flex flex-column" style="background-color: #f3f4f6;">
        <header class="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center shadow-sm">
          <span class="text-muted small fw-semibold">
            <i class="bi bi-geo-alt-fill text-primary me-1"></i> Unidad: <span class="text-dark">{{ user?.area }}</span>
          </span>
          <span class="badge bg-light text-dark border px-3 py-2">
            <i class="bi bi-person-badge me-1 text-primary"></i> {{ user?.rol }}
          </span>
        </header>

        <main class="p-4 flex-grow-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  user = this.auth.getUser();
  pendientesCount = 0;

  ngOnInit() {
    if (this.user?.rol === 'ADMIN') {
      this.http.get<any[]>('http://127.0.0.1:8000/api/tickets/').subscribe({
        next: (res) => {
          this.pendientesCount = res.filter(t => t.estado !== 'RESUELTO').length;
        }
      });
    }
  }
}