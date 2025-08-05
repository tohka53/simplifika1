// src/app/guards/auth.guard.ts - VERSIÓN CORREGIDA COMPLETA

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private router: Router
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('No se pudo obtener el usuario actual');
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener la ruta que se intenta acceder
    const targetRoute = state.url;
    console.log('🔐 Verificando acceso a ruta:', targetRoute);

    // ✅ SOLUCIÓN: Rutas que NO requieren verificación de permisos específicos
    const publicRoutes = [
      '/dashboard', 
      '/login', 
      '/register'
    ];

    // ✅ IMPORTANTE: Permitir TODAS las rutas CV sin verificación de permisos
    const cvRoutes = [
      '/cv',
      '/cv/mis-cvs',
      '/cv/crear',
      '/cv/editar',
      '/cv/ver'
    ];

    // Verificar si es una ruta CV (incluyendo con parámetros)
    const isCVRoute = cvRoutes.some(cvRoute => 
      targetRoute.startsWith(cvRoute) // Permite /cv/editar/123, /cv/ver/456, etc.
    );

    if (publicRoutes.includes(targetRoute) || isCVRoute) {
      console.log('✅ Ruta permitida sin verificación de permisos:', targetRoute);
      return true;
    }

    try {
      // Para otras rutas, verificar permisos normalmente
      const hasPermission = await this.permissionsService.canAccessRoute(targetRoute);
      
      if (!hasPermission) {
        console.log('❌ Usuario sin permisos para acceder a:', targetRoute);
        // Redirigir a dashboard si no tiene permisos
        this.router.navigate(['/dashboard'], {
          queryParams: { 
            error: 'no_permissions',
            attempted_route: targetRoute 
          }
        });
        return false;
      }

      console.log('✅ Acceso autorizado a:', targetRoute);
      return true;

    } catch (error) {
      console.error('💥 Error verificando permisos:', error);
      // En caso de error para rutas no-CV, permitir acceso pero registrar el error
      console.log('⚠️ Permitiendo acceso por error en verificación');
      return true;
    }
  }
}

// Guard adicional para verificar permisos específicos (NO USADO EN CV)
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private router: Router
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener permisos requeridos desde la configuración de la ruta
    const requiredPermissions = route.data['permissions'] as string[];
    const targetRoute = state.url;

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // Si no se especifican permisos, solo verificar acceso básico
      return await this.permissionsService.canAccessRoute(targetRoute);
    }

    try {
      // Verificar si tiene al menos uno de los permisos requeridos
      const hasPermission = await this.permissionsService.hasAnyPermission(
        targetRoute, 
        requiredPermissions
      );

      if (!hasPermission) {
        console.log('Permisos insuficientes para:', targetRoute, 'Requeridos:', requiredPermissions);
        this.router.navigate(['/dashboard'], {
          queryParams: { 
            error: 'insufficient_permissions',
            required: requiredPermissions.join(','),
            attempted_route: targetRoute 
          }
        });
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error en PermissionGuard:', error);
      return false;
    }
  }
}

// Guard para verificar roles específicos
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const currentUser = this.authService.getCurrentUser();
    const requiredProfiles = route.data['profiles'] as number[];

    if (!requiredProfiles || requiredProfiles.length === 0) {
      return true; // Si no se especifican perfiles requeridos, permitir acceso
    }

    // ✅ CORRECCIÓN: Verificar que currentUser existe y tiene id_perfil
    if (!currentUser) {
      console.log('Usuario no encontrado');
      this.router.navigate(['/dashboard'], {
        queryParams: { error: 'user_not_found' }
      });
      return false;
    }

    // ✅ CORRECCIÓN: Verificar que id_perfil existe antes de usarlo
    const userProfile = currentUser.id_perfil;
    if (userProfile === undefined || userProfile === null) {
      console.log('Usuario sin perfil asignado');
      this.router.navigate(['/dashboard'], {
        queryParams: { error: 'no_profile' }
      });
      return false;
    }

    // ✅ AHORA userProfile es definitivamente un number
    if (!requiredProfiles.includes(userProfile)) {
      console.log('Perfil insuficiente:', userProfile, 'Requeridos:', requiredProfiles);
      this.router.navigate(['/dashboard'], {
        queryParams: { 
          error: 'insufficient_role',
          required: requiredProfiles.join(',')
        }
      });
      return false;
    }

    return true;
  }
}