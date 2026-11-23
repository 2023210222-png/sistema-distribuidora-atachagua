import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div class="card shadow-sm border-0 p-4" style="width: 380px;">
        <h4 class="fw-bold text-center mb-1">SGE Atachagua</h4>
        <p class="text-muted text-center small mb-4">Acceso Corporativo</p>

        @if (errorMsg) {
          <div class="alert alert-danger py-2 small">{{ errorMsg }}</div>
        }

        <form (ngSubmit)="ingresar()">
          <div class="mb-3">
            <label class="form-label small fw-semibold">Usuario</label>
            <input type="text" class="form-control" [(ngModel)]="username" name="username" required placeholder="ej. admin">
          </div>
          <div class="mb-3">
            <label class="form-label small fw-semibold">Contraseña</label>
            <input type="password" class="form-control" [(ngModel)]="password" name="password" required>
          </div>
          <button type="submit" class="btn btn-dark w-100" [disabled]="cargando">
            {{ cargando ? 'Validando...' : 'Iniciar Sesión' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  errorMsg = '';
  cargando = false;

  ingresar() {
    this.cargando = true;
    this.errorMsg = '';
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/app/operaciones']),
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al conectar con el servidor';
        this.cargando = false;
      }
    });
  }
}