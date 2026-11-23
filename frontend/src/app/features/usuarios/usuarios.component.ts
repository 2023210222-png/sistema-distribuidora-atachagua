import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white py-3">
        <h5 class="mb-0 fw-bold">Directorio de Personal</h5>
      </div>
      <div class="card-body p-0">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>DNI</th>
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Rol</th>
              <th>Área</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuarios; track u.id) {
              <tr>
                <td class="fw-semibold">{{ u.dni }}</td>
                <td>{{ u.username }}</td>
                <td>{{ u.first_name }} {{ u.last_name }}</td>
                <td><span class="badge bg-dark">{{ u.rol }}</span></td>
                <td>{{ u.area }}</td>
                <td>
                  <span class="badge" [ngClass]="u.is_active ? 'bg-success' : 'bg-danger'">
                    {{ u.is_active ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UsuariosComponent implements OnInit {
  private http = inject(HttpClient);
  usuarios: any[] = [];

  ngOnInit() {
    this.http.get<any[]>('http://127.0.0.1:8000/api/usuarios/').subscribe(res => this.usuarios = res);
  }
}