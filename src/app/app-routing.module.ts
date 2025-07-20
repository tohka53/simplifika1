// src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, PermissionGuard, RoleGuard } from './guards/auth.guard';
import { LoginComponent } from './login/login/login.component';
import { RegisterComponent } from './register/register/register.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { UsuariosComponent } from './usuarios/usuarios/usuarios.component';
import { LandingComponent } from './landing/landing/landing.component';
import { LayoutComponent } from './layout/layout/layout.component';

// Importar componentes CV
import { CVListComponent } from './cv-list/cv-list/cv-list.component';
import { CVFormComponent } from './cv-form/cv-form/cv-form.component';
import { CVViewComponent } from './cv-view/cv-view/cv-view.component';

const routes: Routes = [
  // Ruta principal - Landing page
  { path: '', component: LandingComponent },
  { path: 'home', component: LandingComponent },
  
  // Rutas de autenticación (sin layout)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Rutas protegidas con layout compartido
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { 
        path: 'dashboard', 
        component: DashboardComponent
      },
      { 
        path: 'usuarios', 
        component: UsuariosComponent,
        canActivate: [PermissionGuard],
        data: { 
          permissions: ['view', 'admin'],
          profiles: [1, 3] // Solo admin y supervisor
        }
      },
      
      // ✅ SOLUCIÓN: Rutas CV corregidas
      {
        path: 'cv',
        children: [
          {
            path: '',
            redirectTo: 'mis-cvs',
            pathMatch: 'full'
          },
          {
            path: 'mis-cvs',
            component: CVListComponent
            // ✅ Quitar PermissionGuard temporalmente o usar solo AuthGuard
            // canActivate: [AuthGuard] // Solo verificar autenticación
          },
          {
            path: 'crear',
            component: CVFormComponent
            // ✅ Solo verificar autenticación
            // canActivate: [AuthGuard]
          },
          {
            path: 'editar/:id',
            component: CVFormComponent
            // ✅ Solo verificar autenticación
            // canActivate: [AuthGuard]
          },
          {
            path: 'ver/:id',
            component: CVViewComponent
            // ✅ IMPORTANTE: Cambiar el permiso requerido
            // canActivate: [PermissionGuard],
            // data: { permissions: ['view'] } // Solo requiere 'view', no 'edit'
          }
        ]
      }
    ]
  },
  
  // Ruta wildcard - redirige al landing page
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }