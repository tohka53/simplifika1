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
    GestionarEmpresasComponent
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
