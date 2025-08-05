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
import { EmpresasComponent } from './empresas/empresas/empresas.component';
import { GestionarEmpresasComponent } from './gestionar-empresas/gestionar-empresas/gestionar-empresas.component';
import { GestionarEmpleosComponent } from './gestionar-empleos/gestionar-empleos/gestionar-empleos.component';

// =============================================
// IMPORTAR COMPONENTES DE POSTULACIONES
// =============================================
import { MisAplicacionesComponent } from './mis-aplicaciones/mis-aplicaciones/mis-aplicaciones.component';
import { BuscarEmpleosComponent } from './buscar-empleos/buscar-empleos/buscar-empleos.component';
import { RevisarCandidatosComponent } from './revisar-candidatos/revisar-candidatos/revisar-candidatos.component';

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
      
      // =============================================
      // MÓDULO DE USUARIOS
      // =============================================
      { 
        path: 'usuarios', 
        component: UsuariosComponent,
        canActivate: [PermissionGuard],
        data: { 
          permissions: ['view', 'admin'],
          profiles: [1, 3] // Solo admin y supervisor
        }
      },

      // =============================================
      // MÓDULO DE EMPRESAS
      // =============================================
      { 
        path: 'empresas', 
        component: EmpresasComponent,
        canActivate: [PermissionGuard],
        data: { 
          permissions: ['view', 'admin'],
          profiles: [1, 3] // Solo admin y supervisor
        }
      },
      { 
        path: 'gestionar-empresas', 
        component: GestionarEmpresasComponent,
        canActivate: [RoleGuard],
        data: { 
          profiles: [1, 3] // Solo Admin y Supervisores
        }
      },

      // =============================================
      // MÓDULO DE EMPLEOS
      // =============================================
      {
        path: 'empleos',
        children: [
          {
            path: '',
            redirectTo: 'lista',
            pathMatch: 'full'
          },
          {
            path: 'lista',
            component: GestionarEmpleosComponent,
            canActivate: [RoleGuard],
            data: { 
              title: 'Gestión de Empleos',
              profiles: [1, 3] // Solo Admin y Supervisor/RRHH
            }
          },
          {
            path: 'crear',
            component: GestionarEmpleosComponent,
            canActivate: [RoleGuard],
            data: { 
              title: 'Crear Empleo',
              profiles: [1, 3],
              mode: 'create'
            }
          },
          {
            path: 'editar/:id',
            component: GestionarEmpleosComponent,
            canActivate: [RoleGuard],
            data: { 
              title: 'Editar Empleo',
              profiles: [1, 3],
              mode: 'edit'
            }
          },
          {
            path: 'ver/:id',
            component: GestionarEmpleosComponent,
            canActivate: [RoleGuard],
            data: { 
              title: 'Ver Empleo',
              profiles: [1, 3],
              mode: 'view'
            }
          }
        ]
      },

      // =============================================
      // MÓDULO DE CV - RESTAURADO A LA VERSIÓN ORIGINAL ✅
      // =============================================
    // src/app/app-routing.module.ts - SECCIÓN CV CORREGIDA

// =============================================
// MÓDULO DE CV - VERSIÓN CORREGIDA PARA PERMISOS
// =============================================
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
            component: CVListComponent,
            canActivate: [AuthGuard], // ✅ Solo verificar autenticación
            data: {
              title: 'Mis CVs',
              breadcrumb: 'Mis CVs'
            }
          },
          {
            path: 'crear',
            component: CVFormComponent,
            canActivate: [AuthGuard], // ✅ Solo verificar autenticación
            data: {
              title: 'Crear CV',
              breadcrumb: 'Crear CV'
            }
          },
          {
            path: 'editar/:id',
            component: CVFormComponent,
            canActivate: [AuthGuard], // ✅ Solo verificar autenticación
            data: {
              title: 'Editar CV',
              breadcrumb: 'Editar CV'
            }
          },
          {
            path: 'ver/:id',
            component: CVViewComponent,
            canActivate: [AuthGuard], // ✅ Solo verificar autenticación
            data: {
              title: 'Ver CV',
              breadcrumb: 'Ver CV'
            }
          }
        ]
      },

      // =============================================
      // MÓDULO DE POSTULACIONES
      // =============================================
      {
        path: 'postulaciones',
        children: [
          {
            path: '',
            redirectTo: 'mis-aplicaciones',
            pathMatch: 'full'
          },
          {
            path: 'mis-aplicaciones',
            component: MisAplicacionesComponent,
            canActivate: [AuthGuard],
            data: {
              title: 'Mis Aplicaciones',
              description: 'Seguimiento de tus postulaciones enviadas'
            }
          },
          {
            path: 'buscar-empleos',
            component: BuscarEmpleosComponent,
            canActivate: [AuthGuard],
            data: {
              title: 'Buscar Empleos',
              description: 'Encuentra tu próxima oportunidad laboral'
            }
          },
          {
            path: 'revisar-candidatos',
            component: RevisarCandidatosComponent,
            canActivate: [RoleGuard],
            data: {
              title: 'Revisar Candidatos',
              description: 'Gestiona las aplicaciones recibidas',
              profiles: [1, 3] // Solo Admin y Supervisor/RRHH
            }
          },
          // Rutas adicionales del módulo postulaciones
          {
            path: 'empleo/:id',
            component: BuscarEmpleosComponent,
            canActivate: [AuthGuard],
            data: {
              title: 'Detalle del Empleo',
              mode: 'detail'
            }
          },
          {
            path: 'categoria/:categoria',
            component: BuscarEmpleosComponent,
            canActivate: [AuthGuard],
            data: {
              title: 'Empleos por Categoría',
              mode: 'category'
            }
          },
          {
            path: 'empresa/:empresaId',
            component: BuscarEmpleosComponent,
            canActivate: [AuthGuard],
            data: {
              title: 'Empleos por Empresa',
              mode: 'company'
            }
          }
        ]
      },

      // =============================================
      // RUTAS DE PERFIL DE USUARIO
      // =============================================
      {
        path: 'perfil',
        children: [
          {
            path: '',
            redirectTo: 'mi-perfil',
            pathMatch: 'full'
          },
          {
            path: 'mi-perfil',
            component: CVFormComponent, // Temporalmente, luego crear PerfilComponent
            canActivate: [AuthGuard],
            data: {
              title: 'Mi Perfil'
            }
          },
          {
            path: 'cambiar-password',
            component: CVFormComponent, // Temporalmente
            canActivate: [AuthGuard],
            data: {
              title: 'Cambiar Contraseña'
            }
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
    enableTracing: false, // Cambiar a true para debugging
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled',
    // Configuraciones adicionales para mejorar la experiencia
    onSameUrlNavigation: 'reload',
    // Opcional: estrategia de precarga para mejorar rendimiento
    // preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }