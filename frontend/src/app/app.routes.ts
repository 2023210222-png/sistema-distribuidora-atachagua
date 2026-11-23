import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/auth.service';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'operaciones', loadComponent: () => import('./features/operaciones/operaciones.component').then(m => m.OperacionesComponent) },
      { path: 'estadisticas', loadComponent: () => import('./features/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent) },
      { path: 'tickets', loadComponent: () => import('./features/tickets/tickets.component').then(m => m.TicketsComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: '', redirectTo: 'operaciones', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];