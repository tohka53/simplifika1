// gestionar-empleos.component.ts - VERSIÓN COMPLETA Y CORREGIDA
import { Component, OnInit } from '@angular/core';
import { EmpleosService, Empleo, EmpleoStats } from '../../services/empleos.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestionar-empleos',
  standalone: false,
  templateUrl: './gestionar-empleos.component.html',
  styleUrls: ['./gestionar-empleos.component.css']
})
export class GestionarEmpleosComponent implements OnInit {
  
  // Datos principales
  empleos: Empleo[] = [];
  empleosFiltrados: Empleo[] = [];
  stats: EmpleoStats | null = null;
  empresasDisponibles: any[] = [];
  
  // Estado del componente
  loading = false;
  error = '';
  currentUser: any = null;
  
  // Filtros
  searchTerm = '';
  categoriaFilter = 'all';
  estadoFilter = 'all';
  urgenciaFilter = 'all';
  empresaFilter = 'all';
  jornadaFilter = 'all';
  modalidadFilter = 'all';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Modal/Form
  showModal = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  selectedEmpleo: Empleo | null = null;
  
  // Form data
  empleoForm: Partial<Empleo> = this.getEmptyForm();

  constructor(
    private empleosService: EmpleosService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🚀 Iniciando GestionarEmpleosComponent');
    
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual:', this.currentUser);
    
    if (!this.currentUser) {
      console.log('❌ No hay usuario logueado, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('🔑 Verificando permisos de acceso al módulo...');
    if (!this.empleosService.canAccessEmpleos()) {
      console.log('❌ No tiene permisos para acceder al módulo');
      this.error = 'No tiene permisos para acceder a este módulo';
      return;
    }
    console.log('✅ Permisos de acceso verificados');

    console.log('📊 Verificando permisos específicos:');
    console.log('- Puede crear empleos:', this.canCreateEmpleo());
    
    await this.loadInitialData();
    
    // Debug adicional después de cargar datos
    console.log('🎯 Estado final del componente:');
    console.log('- Empleos cargados:', this.empleos.length);
    console.log('- Empresas disponibles:', this.empresasDisponibles.length);
    console.log('- Estadísticas:', this.stats);
    
    // Verificar permisos en algunos empleos de ejemplo
    if (this.empleos.length > 0) {
      console.log('🔍 Verificando permisos en primeros empleos:');
      this.empleos.slice(0, 3).forEach((empleo, index) => {
        console.log(`- Empleo ${index + 1} (ID: ${empleo.id}): Puede editar = ${this.canEditEmpleo(empleo)}`);
      });
    }
  }

  // =============================================
  // MÉTODOS DE CARGA DE DATOS
  // =============================================

  async loadInitialData(): Promise<void> {
    this.loading = true;
    this.error = '';
    
    try {
      console.log('Iniciando carga de datos...');
      
      // Cargar empresas primero
      await this.loadEmpresasDisponibles();
      
      // Luego empleos - usar método con fallback
      await this.loadEmpleosWithFallback();
      
      // Finalmente estadísticas
      await this.loadStats();
      
      console.log('Carga inicial completada exitosamente');
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      this.error = 'Error al cargar los datos. Algunas funciones pueden no estar disponibles.';
    } finally {
      this.loading = false;
    }
  }

  async loadEmpleosWithFallback(): Promise<void> {
    try {
      console.log('Intentando cargar empleos con función principal...');
      
      // Intentar con la función principal primero
      this.empleos = await this.empleosService.getEmpleosByUser();
      console.log('Empleos cargados con función principal:', this.empleos.length);
      
    } catch (error) {
      console.warn('Error con función principal, intentando con vista...', error);
      
      try {
        // Fallback 1: Usar vista directamente
        this.empleos = await this.empleosService.getEmpleosFromView();
        console.log('Empleos cargados con vista:', this.empleos.length);
        
      } catch (error2) {
        console.warn('Error con vista, intentando método básico...', error2);
        
        try {
          // Fallback 2: Método básico
          this.empleos = await this.empleosService.getEmpleosBasic();
          console.log('Empleos cargados con método básico:', this.empleos.length);
          
        } catch (error3) {
          console.error('Todos los métodos fallaron:', error3);
          this.empleos = [];
          throw new Error('No se pudieron cargar los empleos');
        }
      }
    }
    
    this.applyFilters();
  }

  async loadStats(): Promise<void> {
    try {
      console.log('Cargando estadísticas...');
      this.stats = await this.empleosService.getEmpleosStats();
      
      // Verificar si las estadísticas están vacías y tenemos empleos
      if (this.isStatsEmpty(this.stats) && this.empleos.length > 0) {
        console.log('Las estadísticas están vacías pero hay empleos, calculando localmente...');
        this.stats = this.calculateLocalStats();
      }
      
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      console.log('Calculando estadísticas localmente como fallback...');
      this.stats = this.calculateLocalStats();
    }
  }

  // Verificar si las estadísticas están vacías
  private isStatsEmpty(stats: EmpleoStats | null): boolean {
    return !stats || (
      stats.total_empleos === 0 &&
      stats.empleos_activos === 0 &&
      stats.empleos_expirados === 0 &&
      stats.empleos_cerrados === 0 &&
      stats.total_aplicaciones === 0 &&
      stats.empleos_urgentes === 0
    );
  }

  // Calcular estadísticas localmente desde los empleos cargados
  private calculateLocalStats(): EmpleoStats {
    if (!this.empleos || this.empleos.length === 0) {
      return {
        total_empleos: 0,
        empleos_activos: 0,
        empleos_expirados: 0,
        empleos_cerrados: 0,
        total_aplicaciones: 0,
        empleos_urgentes: 0,
        promedio_aplicaciones: 0,
        categorias_populares: []
      };
    }

    const now = new Date();
    
    const empleosActivos = this.empleos.filter(e => 
      e.status === 1 && e.fecha_fin_publicacion && new Date(e.fecha_fin_publicacion) > now
    );
    
    const empleosExpirados = this.empleos.filter(e => 
      e.fecha_fin_publicacion && new Date(e.fecha_fin_publicacion) <= now
    );
    
    const empleosCerrados = this.empleos.filter(e => e.status === 2);
    
    const empleosUrgentes = this.empleos.filter(e => 
      e.urgencia === 'urgente' && e.status === 1
    );

    const totalAplicaciones = this.empleos.reduce((sum, e) => 
      sum + (e.aplicaciones_recibidas || 0), 0
    );

    const categoriasCount: { [key: string]: number } = {};
    this.empleos.forEach(empleo => {
      if (empleo.categoria) {
        categoriasCount[empleo.categoria] = (categoriasCount[empleo.categoria] || 0) + 1;
      }
    });

    const categoriasPopulares = Object.entries(categoriasCount)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const stats: EmpleoStats = {
      total_empleos: this.empleos.length,
      empleos_activos: empleosActivos.length,
      empleos_expirados: empleosExpirados.length,
      empleos_cerrados: empleosCerrados.length,
      total_aplicaciones: totalAplicaciones,
      empleos_urgentes: empleosUrgentes.length,
      promedio_aplicaciones: this.empleos.length > 0 ? totalAplicaciones / this.empleos.length : 0,
      categorias_populares: categoriasPopulares
    };

    console.log('✅ Estadísticas calculadas localmente:', stats);
    return stats;
  }

  async loadEmpresasDisponibles(): Promise<void> {
    try {
      console.log('Cargando empresas disponibles...');
      this.empresasDisponibles = await this.empleosService.getEmpresasDisponibles();
      console.log('Empresas disponibles:', this.empresasDisponibles.length);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      this.empresasDisponibles = [];
      // No lanzar error para no interrumpir la carga
    }
  }

  // =============================================
  // MÉTODOS DE FILTROS Y BÚSQUEDA
  // =============================================

  applyFilters(): void {
    let filtered = [...this.empleos];

    // Filtro de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(empleo =>
        empleo.nombre.toLowerCase().includes(term) ||
        (empleo.descripcion?.descripcion || '').toLowerCase().includes(term) ||
        (empleo.empresa_nombre || '').toLowerCase().includes(term) ||
        (empleo.keywords || []).some(keyword => keyword.toLowerCase().includes(term))
      );
    }

    // Filtro por categoría
    if (this.categoriaFilter !== 'all') {
      filtered = filtered.filter(empleo => empleo.categoria === this.categoriaFilter);
    }

    // Filtro por estado
    if (this.estadoFilter !== 'all') {
      filtered = filtered.filter(empleo => empleo.estado_calculado === this.estadoFilter);
    }

    // Filtro por urgencia
    if (this.urgenciaFilter !== 'all') {
      filtered = filtered.filter(empleo => empleo.urgencia === this.urgenciaFilter);
    }

    // Filtro por empresa
    if (this.empresaFilter !== 'all') {
      filtered = filtered.filter(empleo => empleo.empresa_id.toString() === this.empresaFilter);
    }

    // Filtro por jornada
    if (this.jornadaFilter !== 'all') {
      filtered = filtered.filter(empleo => empleo.jornada_laboral === this.jornadaFilter);
    }

    // Filtro por modalidad
    if (this.modalidadFilter !== 'all') {
      filtered = filtered.filter(empleo => 
        empleo.lugar_trabajo?.modalidades?.includes(this.modalidadFilter)
      );
    }

    this.empleosFiltrados = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.empleosFiltrados.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedEmpleos(): Empleo[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.empleosFiltrados.slice(start, end);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoriaFilter = 'all';
    this.estadoFilter = 'all';
    this.urgenciaFilter = 'all';
    this.empresaFilter = 'all';
    this.jornadaFilter = 'all';
    this.modalidadFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  // =============================================
  // MÉTODOS DE MODAL Y FORMULARIO
  // =============================================

  openCreateModal(): void {
    if (!this.canCreateEmpleo()) {
      this.error = 'No tiene permisos para crear empleos';
      return;
    }

    console.log('=== ABRIENDO MODAL CREAR ===');
    this.resetForm();
    this.modalMode = 'create';
    this.selectedEmpleo = null;
    this.showModal = true;
  }

  openEditModal(empleo: Empleo): void {
    if (!this.canEditEmpleo(empleo)) {
      this.error = 'No tiene permisos para editar este empleo';
      return;
    }

    console.log('=== ABRIENDO MODAL EDITAR ===');
    this.selectedEmpleo = empleo;
    this.loadEmpleoToForm(empleo);
    this.modalMode = 'edit';
    this.showModal = true;
  }

  openViewModal(empleo: Empleo): void {
    this.selectedEmpleo = empleo;
    this.loadEmpleoToForm(empleo);
    this.modalMode = 'view';
    this.showModal = true;
    
    // Incrementar vistas
    if (empleo.id) {
      this.empleosService.incrementarVistas(empleo.id);
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedEmpleo = null;
    this.resetForm();
    this.error = '';
  }

  getEmptyForm(): Partial<Empleo> {
    return {
      nombre: '',
      descripcion: {
        descripcion: '',
        requisitos: [],
        beneficios: [],
        habilidades: [],
        idiomas: []
      },
      categoria: '',
      lugar_trabajo: {
        modalidades: []
      },
      experiencia_laboral: '',
      salario: {
        minimo: null,
        maximo: null,
        moneda: 'GTQ',
        periodo: 'mensual',
        negociable: false
      },
      jornada_laboral: '',
      tipo_contrato: '',
      urgencia: 'normal',
      empresa_id: 0,
      fecha_fin_publicacion: '',
      numero_vacantes: 1,
      keywords: [],
      edad_minima: null,
      edad_maxima: null,
      genero: 'indiferente',
      estado_civil: 'indiferente',
      nivel_educacion: ''
    };
  }

  resetForm(): void {
    console.log('=== RESETEANDO FORMULARIO ===');
    this.empleoForm = this.getEmptyForm();
    
    // Asegurar que la empresa predeterminada esté configurada
    if (this.empresasDisponibles.length === 1) {
      this.empleoForm.empresa_id = this.empresasDisponibles[0].id;
    }
  }

  loadEmpleoToForm(empleo: Empleo): void {
    console.log('=== CARGANDO EMPLEO AL FORMULARIO ===');
    
    this.empleoForm = {
      ...empleo,
      fecha_fin_publicacion: empleo.fecha_fin_publicacion ? 
        new Date(empleo.fecha_fin_publicacion).toISOString().split('T')[0] : ''
    };

    // Asegurar estructuras inicializadas
    if (!this.empleoForm.lugar_trabajo) {
      this.empleoForm.lugar_trabajo = { modalidades: [] };
    }
    if (!this.empleoForm.descripcion) {
      this.empleoForm.descripcion = {
        descripcion: '',
        requisitos: [],
        beneficios: [],
        habilidades: [],
        idiomas: []
      };
    }
    if (!this.empleoForm.keywords) {
      this.empleoForm.keywords = [];
    }
    if (!this.empleoForm.salario) {
      this.empleoForm.salario = {
        minimo: null,
        maximo: null,
        moneda: 'GTQ',
        periodo: 'mensual',
        negociable: false
      };
    }
  }

  // =============================================
  // MÉTODOS DE CRUD
  // =============================================

  async saveEmpleo(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';

      console.log('=== INICIANDO GUARDADO DE EMPLEO ===');
      
      // Validar formulario básico
      if (!this.empleoForm.nombre || !this.empleoForm.categoria || !this.empleoForm.empresa_id) {
        this.error = 'Faltan campos obligatorios básicos';
        return;
      }

      // Validar modalidades
      if (!this.empleoForm.lugar_trabajo?.modalidades || 
          this.empleoForm.lugar_trabajo.modalidades.length === 0) {
        this.error = 'Debe seleccionar al menos una modalidad de trabajo';
        return;
      }

      // Validaciones adicionales del servicio
      const errors = this.empleosService.validateEmpleoData(this.empleoForm);
      if (errors.length > 0) {
        this.error = 'Errores de validación: ' + errors.join(', ');
        return;
      }

      // Preparar datos para envío
      const empleoData = {
        ...this.empleoForm,
        fecha_fin_publicacion: new Date(this.empleoForm.fecha_fin_publicacion!).toISOString()
      };

      // Guardar
      if (this.modalMode === 'create') {
        await this.empleosService.createEmpleo(empleoData);
      } else if (this.modalMode === 'edit') {
        await this.empleosService.updateEmpleo(this.selectedEmpleo!.id!, empleoData);
      }

      // Recargar datos y cerrar modal
      await this.loadEmpleosWithFallback();
      await this.loadStats();
      this.closeModal();

    } catch (error: any) {
      console.error('Error guardando empleo:', error);
      this.error = 'Error al guardar el empleo: ' + (error?.message || 'Error desconocido');
    } finally {
      this.loading = false;
    }
  }

  async deleteEmpleo(empleo: Empleo): Promise<void> {
    if (!this.canEditEmpleo(empleo)) {
      this.error = 'No tiene permisos para eliminar este empleo';
      return;
    }

    if (!confirm(`¿Está seguro de eliminar el empleo "${empleo.nombre}"?`)) {
      return;
    }

    try {
      this.loading = true;
      await this.empleosService.deleteEmpleo(empleo.id!);
      console.log('Empleo eliminado exitosamente');
      
      await this.loadEmpleosWithFallback();
      await this.loadStats();
    } catch (error) {
      console.error('Error eliminando empleo:', error);
      this.error = 'Error al eliminar el empleo. Intente nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  // Flags para debug (cambiar a false en producción)
  showDebugActions = true; // Mostrar botones de debug
  showDebugInfo = true; // Mostrar información de debug

  // =============================================
  // MÉTODOS DE PERMISOS - MEJORADOS
  // =============================================

  canCreateEmpleo(): boolean {
    console.log('🔍 Verificando permisos para crear empleo');
    console.log('- Usuario actual:', this.currentUser);
    console.log('- ID Perfil:', this.currentUser?.id_perfil);
    
    if (!this.currentUser) {
      console.log('❌ No hay usuario logueado');
      return false;
    }

    // Admin (1) y Supervisor/RRHH (3) pueden crear empleos
    const canCreate = this.currentUser.id_perfil === 1 || this.currentUser.id_perfil === 3;
    console.log('✅ Puede crear empleo:', canCreate);
    
    return canCreate;
  }

  canEditEmpleo(empleo: Empleo): boolean {
    console.log('🔍 Verificando permisos para editar empleo:', empleo.id);
    console.log('- Usuario actual:', this.currentUser);
    console.log('- ID Perfil:', this.currentUser?.id_perfil);
    console.log('- Empleo empresa_id:', empleo.empresa_id);
    console.log('- Empleo puede_editar:', empleo.puede_editar);
    
    if (!this.currentUser) {
      console.log('❌ No hay usuario logueado');
      return false;
    }
    
    // Admin puede editar cualquier empleo
    if (this.currentUser.id_perfil === 1) {
      console.log('✅ Es admin - puede editar cualquier empleo');
      return true;
    }
    
    // Supervisor/RRHH puede editar empleos de empresas donde es responsable
    if (this.currentUser.id_perfil === 3) {
      // Si el empleo tiene la flag puede_editar, usar esa
      if (empleo.puede_editar !== undefined) {
        console.log('✅ Usando flag puede_editar:', empleo.puede_editar);
        return empleo.puede_editar;
      }
      
      // Si no, verificar si la empresa está en las disponibles para el usuario
      const puedeEditar = this.empresasDisponibles.some(empresa => empresa.id === empleo.empresa_id);
      console.log('✅ Verificando por empresas disponibles:', puedeEditar);
      return puedeEditar;
    }
    
    console.log('❌ No tiene permisos para editar');
    return false;
  }

  // Método para verificar permisos de forma más permisiva (para testing)
  canEditEmpleoPermissive(empleo: Empleo): boolean {
    if (!this.currentUser) return false;
    
    // Admin siempre puede
    if (this.currentUser.id_perfil === 1) return true;
    
    // Supervisor puede si:
    // 1. Tiene el flag puede_editar en true
    // 2. O si es perfil 3 (RRHH/Supervisor)
    if (this.currentUser.id_perfil === 3) return true;
    
    return false;
  }

  // =============================================
  // MÉTODOS DE UTILIDAD
  // =============================================

  getCategorias(): string[] {
    return this.empleosService.getCategorias();
  }

  getModalidadesTrabajo(): string[] {
    return this.empleosService.getModalidadesTrabajo();
  }

  getNivelesExperiencia(): string[] {
    return this.empleosService.getNivelesExperiencia();
  }

  getTiposJornada(): string[] {
    return this.empleosService.getTiposJornada();
  }

  getTiposContrato(): string[] {
    return this.empleosService.getTiposContrato();
  }

  getNivelesUrgencia(): string[] {
    return this.empleosService.getNivelesUrgencia();
  }

  getNivelesEducacion(): string[] {
    return this.empleosService.getNivelesEducacion();
  }

  formatSalario(salario: any): string {
    return this.empleosService.formatSalario(salario);
  }

  formatModalidades(lugarTrabajo: any): string {
    return this.empleosService.formatModalidades(lugarTrabajo);
  }

  getEstadoLegible(empleo: Empleo): { texto: string, color: string } {
    return this.empleosService.getEstadoLegible(empleo);
  }

  getCategoriaLegible(categoria: string): string {
    return this.empleosService.getCategoriaLegible(categoria);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  // =============================================
  // MÉTODOS DE ARRAYS DINÁMICOS
  // =============================================

  // Métodos para requisitos
  addRequisito(): void {
    if (!this.empleoForm.descripcion) {
      this.empleoForm.descripcion = { descripcion: '', requisitos: [], beneficios: [], habilidades: [], idiomas: [] };
    }
    this.empleoForm.descripcion.requisitos.push('');
  }

  removeRequisito(index: number): void {
    if (this.empleoForm.descripcion?.requisitos) {
      this.empleoForm.descripcion.requisitos.splice(index, 1);
    }
  }

  // Métodos para beneficios
  addBeneficio(): void {
    if (!this.empleoForm.descripcion) {
      this.empleoForm.descripcion = { descripcion: '', requisitos: [], beneficios: [], habilidades: [], idiomas: [] };
    }
    this.empleoForm.descripcion.beneficios.push('');
  }

  removeBeneficio(index: number): void {
    if (this.empleoForm.descripcion?.beneficios) {
      this.empleoForm.descripcion.beneficios.splice(index, 1);
    }
  }

  // Métodos para habilidades
  addHabilidad(): void {
    if (!this.empleoForm.descripcion) {
      this.empleoForm.descripcion = { descripcion: '', requisitos: [], beneficios: [], habilidades: [], idiomas: [] };
    }
    this.empleoForm.descripcion.habilidades.push('');
  }

  removeHabilidad(index: number): void {
    if (this.empleoForm.descripcion?.habilidades) {
      this.empleoForm.descripcion.habilidades.splice(index, 1);
    }
  }

  // Métodos para idiomas
  addIdioma(): void {
    if (!this.empleoForm.descripcion) {
      this.empleoForm.descripcion = { descripcion: '', requisitos: [], beneficios: [], habilidades: [], idiomas: [] };
    }
    this.empleoForm.descripcion.idiomas.push('');
  }

  removeIdioma(index: number): void {
    if (this.empleoForm.descripcion?.idiomas) {
      this.empleoForm.descripcion.idiomas.splice(index, 1);
    }
  }

  // Métodos para keywords
  addKeyword(): void {
    if (!this.empleoForm.keywords) {
      this.empleoForm.keywords = [];
    }
    this.empleoForm.keywords.push('');
  }

  removeKeyword(index: number): void {
    if (this.empleoForm.keywords) {
      this.empleoForm.keywords.splice(index, 1);
    }
  }

  // =============================================
  // MÉTODOS PARA MODALIDADES - VERSIÓN DROPDOWN
  // =============================================

  onModalidadSelectChange(event: any): void {
    const selectedModalidad = event.target.value;
    console.log('Modalidad seleccionada:', selectedModalidad);

    if (!this.empleoForm.lugar_trabajo) {
      this.empleoForm.lugar_trabajo = { modalidades: [] };
    }

    if (selectedModalidad && selectedModalidad !== '') {
      this.empleoForm.lugar_trabajo.modalidades = [selectedModalidad];
    } else {
      this.empleoForm.lugar_trabajo.modalidades = [];
    }
  }

  getSelectedModalidad(): string {
    const modalidades = this.empleoForm.lugar_trabajo?.modalidades;
    if (modalidades && modalidades.length > 0) {
      return modalidades[0];
    }
    return '';
  }

  hasSelectedModalidad(): boolean {
    return this.getSelectedModalidad() !== '';
  }

  // =============================================
  // MÉTODOS PARA TRACKING DE ARRAYS
  // =============================================

  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByEmpleoId(index: number, empleo: Empleo): any {
    return empleo.id || index;
  }

  // =============================================
  // MÉTODOS DE PAGINACIÓN
  // =============================================

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  get paginationPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // =============================================
  // MÉTODOS DE DEBUG Y UTILIDAD
  // =============================================

  toggleDebugMode(): void {
    this.showDebugActions = !this.showDebugActions;
    this.showDebugInfo = !this.showDebugInfo;
    console.log('🐛 Debug mode:', this.showDebugActions ? 'ACTIVADO' : 'DESACTIVADO');
    
    if (this.showDebugActions) {
      console.log('📋 Estado actual del componente:');
      console.log('- Usuario:', this.currentUser);
      console.log('- Empleos:', this.empleos.length);
      console.log('- Empresas disponibles:', this.empresasDisponibles);
      console.log('- Puede crear empleos:', this.canCreateEmpleo());
    }
  }

  debugEmpleoPermissions(empleo: Empleo): void {
    console.log('🔍 Debug permisos para empleo:', empleo.id);
    console.log('- Nombre:', empleo.nombre);
    console.log('- Empresa ID:', empleo.empresa_id);
    console.log('- Puede editar (flag):', empleo.puede_editar);
    console.log('- Usuario actual:', this.currentUser);
    console.log('- Perfil usuario:', this.currentUser?.id_perfil);
    console.log('- Resultado canEditEmpleo:', this.canEditEmpleo(empleo));
    console.log('- Resultado canEditEmpleoPermissive:', this.canEditEmpleoPermissive(empleo));
    console.log('- Empresas disponibles:', this.empresasDisponibles.map(e => ({ id: e.id, nombre: e.nombre })));
  }

  async refreshData(): Promise<void> {
    await this.loadInitialData();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
           this.categoriaFilter !== 'all' ||
           this.estadoFilter !== 'all' ||
           this.urgenciaFilter !== 'all' ||
           this.empresaFilter !== 'all' ||
           this.jornadaFilter !== 'all' ||
           this.modalidadFilter !== 'all';
  }

  getNoDataMessage(): string {
    if (this.loading) return 'Cargando empleos...';
    if (this.error) return this.error;
    if (this.hasActiveFilters()) return 'No se encontraron empleos que coincidan con los filtros aplicados.';
    if (!this.canCreateEmpleo()) return 'No hay empleos disponibles para mostrar.';
    return 'No hay empleos creados. Haga clic en "Crear Empleo" para agregar el primero.';
  }

  getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // =============================================
  // MÉTODOS DE EXPORTACIÓN
  // =============================================

  exportToCsv(): void {
    if (this.empleosFiltrados.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const headers = [
      'ID', 'Nombre', 'Categoría', 'Empresa', 'Jornada', 'Modalidad', 
      'Experiencia', 'Salario', 'Estado', 'Fecha Creación', 'Fecha Fin'
    ];

    const csvContent = [
      headers.join(','),
      ...this.empleosFiltrados.map(empleo => [
        empleo.id,
        `"${empleo.nombre}"`,
        this.getCategoriaLegible(empleo.categoria),
        `"${empleo.empresa_nombre || ''}"`,
        empleo.jornada_laboral,
        this.formatModalidades(empleo.lugar_trabajo),
        empleo.experiencia_laboral,
        `"${this.formatSalario(empleo.salario)}"`,
        this.getEstadoLegible(empleo).texto,
        this.formatDate(empleo.fecha_creacion),
        this.formatDate(empleo.fecha_fin_publicacion)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `empleos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}