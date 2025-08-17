// src/app/dashboard/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { PermissionsService, MenuModule } from '../../services/permissions.service';
import { JobService, JobOffer } from '../../services/job.service';
import { Profile } from '../../interfaces/user.interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: Profile | null = null;
  menuItems: MenuModule[] = [];
  isSidebarCollapsed = false;
  loading = true;
  error = '';
  currentRoute = '';
  expandedModules: Set<number> = new Set();

  // Job offers carousel
  jobOffers: JobOffer[] = [];
  displayedJobs: JobOffer[] = [];
  currentJobIndex = 0;
  carouselInterval: any;
  jobsPerPage = 3;
  autoRotateInterval = 10000; // 10 segundos

  // Stats data
  stats = {
    totalUsers: 0,
    activeProjects: 0,
    pendingTasks: 0,
    totalReports: 0
  };

  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private jobService: JobService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('Dashboard inicializado');
    
    try {
      // Obtener usuario actual
      this.currentUser = this.authService.getCurrentUser();
      console.log('Usuario actual:', this.currentUser);

      if (!this.currentUser) {
        console.log('No hay usuario autenticado, redirigiendo a login');
        this.router.navigate(['/login']);
        return;
      }

      // Cargar menú del usuario
      await this.loadUserMenu();
      
      // Cargar estadísticas
      await this.loadDashboardStats();

      // Cargar ofertas de trabajo
      await this.loadJobOffers();

      // Suscribirse a cambios de ruta
      this.subscriptions.add(
        this.router.events
          .pipe(filter(event => event instanceof NavigationEnd))
          .subscribe((event: NavigationEnd) => {
            this.currentRoute = event.urlAfterRedirects;
            console.log('Ruta actual:', this.currentRoute);
          })
      );

      // Obtener ruta actual
      this.currentRoute = this.router.url;

    } catch (error) {
      console.error('Error inicializando dashboard:', error);
      this.error = 'Error cargando el dashboard';
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  async loadUserMenu(): Promise<void> {
    try {
      console.log('Cargando menú del usuario...');
      this.menuItems = await this.permissionsService.loadUserMenu();
      
      if (!this.menuItems || this.menuItems.length === 0) {
        console.log('No se obtuvo menú de la BD, usando menú por defecto');
        this.menuItems = this.createDefaultMenu();
      }
      
      this.updateExpandedModules();
      console.log('Menú cargado:', this.menuItems);
    } catch (error) {
      console.error('Error cargando menú:', error);
      this.menuItems = this.createDefaultMenu();
      this.updateExpandedModules();
    }
  }

  async loadJobOffers(): Promise<void> {
    try {
      console.log('Cargando ofertas de trabajo...');
      this.jobOffers = await this.jobService.getDashboardJobs(9).toPromise() || [];
      
      if (this.jobOffers.length > 0) {
        this.updateDisplayedJobs();
        this.startCarousel();
      }
      
      console.log('Ofertas cargadas:', this.jobOffers.length);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
    }
  }

  updateDisplayedJobs(): void {
    if (this.jobOffers.length === 0) return;
    
    const startIndex = this.currentJobIndex;
    const endIndex = startIndex + this.jobsPerPage;
    
    // Si no hay suficientes trabajos para llenar la página, reciclar desde el inicio
    if (endIndex > this.jobOffers.length) {
      const remaining = this.jobsPerPage - (this.jobOffers.length - startIndex);
      this.displayedJobs = [
        ...this.jobOffers.slice(startIndex),
        ...this.jobOffers.slice(0, remaining)
      ];
    } else {
      this.displayedJobs = this.jobOffers.slice(startIndex, endIndex);
    }
  }

  startCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }

    this.carouselInterval = setInterval(() => {
      this.nextJobs();
    }, this.autoRotateInterval);
  }

  nextJobs(): void {
    if (this.jobOffers.length <= this.jobsPerPage) return;
    
    this.currentJobIndex = (this.currentJobIndex + this.jobsPerPage) % this.jobOffers.length;
    this.updateDisplayedJobs();
  }

  previousJobs(): void {
    if (this.jobOffers.length <= this.jobsPerPage) return;
    
    this.currentJobIndex = this.currentJobIndex - this.jobsPerPage;
    if (this.currentJobIndex < 0) {
      this.currentJobIndex = Math.max(0, this.jobOffers.length - this.jobsPerPage);
    }
    this.updateDisplayedJobs();
  }

  pauseCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  resumeCarousel(): void {
    this.startCarousel();
  }

  createDefaultMenu(): MenuModule[] {
    return [
      {
        id_modulo: 1,
        nombre: 'Dashboard',
        descripcion: 'Panel principal',
        icono: 'fas fa-tachometer-alt',
        ruta: '/dashboard',
        orden: 1,
        es_padre: false,
        modulo_padre_id: null,
        permisos: ['view'],
        expanded: false
      },
      {
        id_modulo: 2,
        nombre: 'Usuarios',
        descripcion: 'Gestión de usuarios',
        icono: 'fas fa-users',
        ruta: '/usuarios',
        orden: 2,
        es_padre: false,
        modulo_padre_id: null,
        permisos: ['view'],
        expanded: false
      },
      {
        id_modulo: 6,
        nombre: 'Postulaciones',
        descripcion: 'Gestión de aplicaciones',
        icono: 'fas fa-file-alt',
        ruta: '/postulaciones',
        orden: 6,
        es_padre: false,
        modulo_padre_id: null,
        permisos: ['view'],
        expanded: false
      }
    ];
  }

  private updateExpandedModules(): void {
    this.menuItems.forEach(module => {
      if (module.expanded === undefined) {
        module.expanded = false;
      }
      if (module.children) {
        module.children.forEach(child => {
          if (child.expanded === undefined) {
            child.expanded = false;
          }
        });
      }
    });
  }

  async loadDashboardStats(): Promise<void> {
    try {
      // Aquí puedes hacer llamadas a servicios para obtener estadísticas reales
      this.stats = {
        totalUsers: 1247,
        activeProjects: 23,
        pendingTasks: 47,
        totalReports: 156
      };
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }

  // Métodos del job service para usar en el template
  formatSalary(salario: any): string {
    return this.jobService.formatSalary(salario);
  }

  formatWorkLocation(lugar_trabajo: any): string {
    return this.jobService.formatWorkLocation(lugar_trabajo);
  }

  formatUrgency(urgencia: string): { text: string, class: string } {
    return this.jobService.formatUrgency(urgencia);
  }

  formatDaysRemaining(days: number): { text: string, class: string } {
    return this.jobService.formatDaysRemaining(days);
  }

  // Navegación a detalle del trabajo
  viewJobDetail(job: JobOffer): void {
    // En lugar de navegar a postulaciones, mostrar detalles en modal o nueva página
    console.log('Ver detalles del empleo:', job.id);
    
    // Opción 1: Abrir en modal (recomendado)
    this.showJobDetailModal(job);
    
    // Opción 2: Navegar a una ruta sin restricciones de permisos
    // this.router.navigate(['/empleos/detalle', job.id]);
  }

  // Aplicar rápidamente a un trabajo
  quickApply(job: JobOffer): void {
    // Pausar el carrusel mientras el usuario interactúa
    this.pauseCarousel();
    
    console.log('Aplicar rápido al empleo:', job.id);
    
    // Verificar si el usuario está autenticado
    if (!this.currentUser) {
      alert('Debe iniciar sesión para aplicar a empleos');
      this.router.navigate(['/login']);
      return;
    }

    // Mostrar modal de aplicación rápida
    this.showQuickApplyModal(job);
  }

  // Mostrar modal con detalles del empleo
  showJobDetailModal(job: JobOffer): void {
    // Implementar modal con detalles del empleo
    const modalData = {
      job: job,
      showApplyButton: true
    };
    
    // Aquí puedes implementar un modal personalizado
    console.log('Mostrando modal de detalles:', modalData);
    
    // Por ahora, mostrar información en alerta (temporal)
    let details = `
🏢 ${job.empresa_nombre}
📍 ${this.formatWorkLocation(job.lugar_trabajo)}
💰 ${this.formatSalary(job.salario)}
⏱️ ${job.experiencia_laboral}
📅 ${this.formatDaysRemaining(job.dias_restantes).text}

${job.descripcion?.descripcion || 'Sin descripción disponible'}
    `;
    
    if (confirm(details + '\n\n¿Desea aplicar a este empleo?')) {
      this.quickApply(job);
    }
  }

  // Mostrar modal de aplicación rápida
  showQuickApplyModal(job: JobOffer): void {
    // Implementar modal de aplicación
    console.log('Mostrando modal de aplicación para:', job.nombre);
    
    // Por ahora, simulación simple
    const coverLetter = prompt('Escriba una breve carta de presentación (opcional):');
    
    if (coverLetter !== null) { // El usuario no canceló
      this.applyToJobNow(job, coverLetter);
    }
  }

  // Aplicar al empleo directamente
  async applyToJobNow(job: JobOffer, coverLetter?: string): Promise<void> {
    try {
      console.log('Aplicando al empleo:', job.id);
      
      // Obtener CVs del usuario
      const cvs = await this.jobService.getMyCVs().toPromise();
      
      if (!cvs || cvs.length === 0) {
        alert('Necesita crear un CV antes de aplicar. Será redirigido para crear uno.');
        // Redirigir a crear CV
        this.router.navigate(['/curriculum-vitae/crear']);
        return;
      }

      // Usar el primer CV disponible (o mostrar selector)
      const selectedCv = cvs[0];
      
      const applicationData = {
        carta_presentacion: coverLetter,
        // Otros campos opcionales
      };

      const result = await this.jobService.applyToJob(job.id, selectedCv.id, applicationData).toPromise();
      
      if (result.success) {
        alert('¡Aplicación enviada exitosamente!');
        // Recargar datos del empleo para actualizar contador
        await this.loadJobOffers();
      } else {
        alert('Error al enviar aplicación: ' + result.message);
      }
      
    } catch (error) {
      console.error('Error aplicando al empleo:', error);
      alert('Error inesperado al aplicar al empleo');
    } finally {
      // Reanudar el carrusel
      this.resumeCarousel();
    }
  }

  // Navegar a lista completa de empleos (sin restricciones)
  viewAllJobs(): void {
    // En lugar de ir a postulaciones, ir a una ruta pública
    this.router.navigate(['/empleos-publicos']);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    console.log('Sidebar colapsado:', this.isSidebarCollapsed);
  }

  toggleModule(moduleId: number): void {
    if (this.expandedModules.has(moduleId)) {
      this.expandedModules.delete(moduleId);
    } else {
      this.expandedModules.add(moduleId);
    }

    const module = this.menuItems.find(m => m.id_modulo === moduleId);
    if (module) {
      module.expanded = this.expandedModules.has(moduleId);
      console.log(`Módulo ${module.nombre} ${module.expanded ? 'expandido' : 'colapsado'}`);
    }
  }

  isModuleExpanded(moduleId: number): boolean {
    return this.expandedModules.has(moduleId);
  }

  logout(): void {
    console.log('Cerrando sesión desde dashboard');
    this.permissionsService.clearUserData();
    this.currentUser = null;
    this.menuItems = [];
    this.authService.logout();
  }

  // Métodos para el menú
  getFilteredMenuItems(): MenuModule[] {
    return this.menuItems.filter(item => !item.modulo_padre_id);
  }

  getFilteredChildren(module: MenuModule): MenuModule[] {
    if (!module.children) {
      return this.menuItems.filter(item => item.modulo_padre_id === module.id_modulo);
    }
    return module.children;
  }

  isRouteActive(route: string): boolean {
    if (!route || route === '#') {
      return false;
    }
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  navigateTo(route: string): void {
    if (route && route !== '#') {
      console.log('Navegando a:', route);
      this.router.navigate([route]);
    }
  }

  // Métodos de utilidad
  getUserInitials(): string {
    if (!this.currentUser?.full_name) {
      return 'U';
    }
    const names = this.currentUser.full_name.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return this.currentUser.full_name.charAt(0).toUpperCase();
  }

  getUserRole(): string {
    switch (this.currentUser?.id_perfil) {
      case 1: return 'Administrador';
      case 2: return 'Usuario';
      case 3: return 'Supervisor';
      case 4: return 'Invitado';
      default: return 'Usuario';
    }
  }

  getPageTitle(): string {
    switch (this.currentRoute) {
      case '/dashboard': return 'Dashboard';
      case '/usuarios': return 'Gestión de Usuarios';
      case '/reportes': return 'Reportes';
      case '/configuracion': return 'Configuración';
      default: return 'Dashboard';
    }
  }

  // Verificar si estamos en la página principal del dashboard
  isDashboardHome(): boolean {
    return this.currentRoute === '/dashboard';
  }

  // Verificar si estamos en la página de usuarios
  isUsersPage(): boolean {
    return this.currentRoute === '/usuarios';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Métodos adicionales para el carrusel
  trackByJobId(index: number, job: JobOffer): number {
    return job.id;
  }

  getCarouselIndicators(): number[] {
    if (this.jobOffers.length <= this.jobsPerPage) return [];
    const totalSlides = Math.ceil(this.jobOffers.length / this.jobsPerPage);
    return Array(totalSlides).fill(0).map((_, i) => i);
  }

  getCurrentSlideIndex(): number {
    if (this.jobOffers.length <= this.jobsPerPage) return 0;
    return Math.floor(this.currentJobIndex / this.jobsPerPage);
  }

  goToSlide(slideIndex: number): void {
    if (this.jobOffers.length <= this.jobsPerPage) return;
    
    this.currentJobIndex = slideIndex * this.jobsPerPage;
    if (this.currentJobIndex >= this.jobOffers.length) {
      this.currentJobIndex = Math.max(0, this.jobOffers.length - this.jobsPerPage);
    }
    this.updateDisplayedJobs();
    
    // Reiniciar el temporizador del carrusel
    this.startCarousel();
  }

  async refreshDashboard(): Promise<void> {
    this.loading = true;
    try {
      await this.loadUserMenu();
      await this.loadDashboardStats();
      await this.loadJobOffers();
      await this.permissionsService.loadUserPermissions();
    } catch (error) {
      console.error('Error refrescando dashboard:', error);
    } finally {
      this.loading = false;
    }
  }
}