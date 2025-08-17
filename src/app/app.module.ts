import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing/landing.component';
import { LoginComponent } from './login/login/login.component';
import { RegisterComponent } from './register/register/register.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { UsuariosComponent } from './usuarios/usuarios/usuarios.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutComponent } from './layout/layout/layout.component';
import { CVListComponent } from './cv-list/cv-list/cv-list.component';
import { CVFormComponent } from './cv-form/cv-form/cv-form.component';
import { CVViewComponent } from './cv-view/cv-view/cv-view.component';
import { EmpresasComponent } from './empresas/empresas/empresas.component';
import { GestionarEmpresasComponent } from './gestionar-empresas/gestionar-empresas/gestionar-empresas.component';
import { GestionarEmpleosComponent } from './gestionar-empleos/gestionar-empleos/gestionar-empleos.component';
import { BuscarEmpleosComponent } from './buscar-empleos/buscar-empleos/buscar-empleos.component';
import { MisAplicacionesComponent } from './mis-aplicaciones/mis-aplicaciones/mis-aplicaciones.component';
import { RevisarCandidatosComponent } from './revisar-candidatos/revisar-candidatos/revisar-candidatos.component';
import { PostulacionesService } from './services/postulaciones.service';
import { JobService } from './services/job.service';
import { AuthService } from './services/auth.service';
import { PermissionsService } from './services/permissions.service';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    UsuariosComponent,
    LayoutComponent,
    CVListComponent,
    CVFormComponent,
    CVViewComponent,
    EmpresasComponent,
    GestionarEmpresasComponent,
    GestionarEmpleosComponent,
    BuscarEmpleosComponent,
    MisAplicacionesComponent,
    RevisarCandidatosComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
     FormsModule,        // ← Agregar esto para ngForm
    ReactiveFormsModule, // ← Opcional, para formularios reactivos
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
