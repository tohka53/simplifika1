// src/app/empresas/gestionar-empresas/gestionar-empresas.component.ts
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { Profile } from '../../interfaces/user.interfaces';

export interface Empresa {
  id?: number;
  nombre: string;
  descripcion: any; // JSONB object
  responsables: number[];
  contactos_referencias: any[]; // JSONB array
  direccion?: string;
  telefono?: string;
  email?: string;
  sitio_web?: string;
  sector?: string;
  tamano_empresa?: string;
  logo_url?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  // Propiedades adicionales de la vista
  responsables_info?: any[];
  created_by_username?: string;
  created_by_name?: string;
}

export interface ContactoReferencia {
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
}

@Component({
  selector: 'app-gestionar-empresas',
  standalone: false,
  templateUrl: './gestionar-empresas.component.html',
  styleUrls: ['./gestionar-empresas.component.css']
})
export class GestionarEmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
  empresasAsignadas: Empresa[] = []; // Solo empresas donde el usuario es responsable
  filteredEmpresas: Empresa[] = [];
  usuarios: Profile[] = [];
  usuariosSupervisores: Profile[] = [];
  loading = true;
  error = '';
  success = '';
  searchTerm = '';
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedEmpresa: Empresa | null = null;
  currentUser: Profile | null = null;
  
  // Formulario para nueva empresa o edición
  empresaForm: Empresa = {
    nombre: '',
    descripcion: {
      descripcion: '',
      sector: '',
      tamano: '',
      ubicacion: '',
      sitio_web: '',
      fundacion: ''
    },
    responsables: [],
    contactos_referencias: [],
    direccion: '',
    telefono: '',
    email: '',
    sitio_web: '',
    sector: '',
    tamano_empresa: 'Pequena',
    status: 1
  };

  // Nuevo contacto temporal
  nuevoContacto: ContactoReferencia = {
    nombre: '',
    cargo: '',
    telefono: '',
    email: ''
  };

  // Filtros
  statusFilter = 'all';
  sectorFilter = 'all';
  tamanoFilter = 'all';
  responsableFilter = 'mis-empresas'; // nuevo filtro específico

  // Opciones para selects
  sectoresDisponibles = [
    'Tecnologia', 'Consultoria IT', 'Finanzas', 'Salud', 'Educacion', 
    'Retail', 'Manufactura', 'Servicios', 'Gobierno', 'ONG', 'Otro'
  ];

  tamanosEmpresa = ['Pequena', 'Mediana', 'Grande', 'Corporativa'];

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('GestionarEmpresasComponent inicializado');
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.error = 'Usuario no autenticado';
      this.loading = false;
      return;
    }

    // Verificar permisos del usuario
    if (!this.canAccessModule()) {
      this.error = 'No tienes permisos para acceder a este módulo';
      this.loading = false;
      return;
    }

    await Promise.all([
      this.loadEmpresas(),
      this.loadUsuarios()
    ]);
  }

  // Verificar si el usuario puede acceder al módulo
  canAccessModule(): boolean {
    if (!this.currentUser) return false;
    
    // Administradores y Supervisores pueden acceder
    return this.currentUser.id_perfil === 1 || this.currentUser.id_perfil === 3;
  }

  // Verificar si el usuario es responsable de una empresa específica
  isResponsableOf(empresa: Empresa): boolean {
    if (!this.currentUser || !empresa.responsables) return false;
    return empresa.responsables.includes(this.currentUser.id!);
  }

  // Verificar si puede editar una empresa (es admin, supervisor o responsable)
  canEditEmpresa(empresa: Empresa): boolean {
    if (!this.currentUser) return false;
    
    // Administradores pueden editar cualquier empresa
    if (this.currentUser.id_perfil === 1) return true;
    
    // Supervisores y responsables pueden editar solo las empresas donde son responsables
    return this.isResponsableOf(empresa);
  }

  // Verificar si puede crear empresas (solo admin y supervisores)
  canCreateEmpresa(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.id_perfil === 1 || this.currentUser.id_perfil === 3;
  }

  async loadEmpresas(): Promise<void> {
    this.loading = true;
    this.error = '';
    
    try {
      console.log('Cargando empresas desde la base de datos...');
      
      const { data, error } = await this.supabaseService.client
        .from('empresas')
        .select(`
          *,
          profiles!empresas_created_by_fkey(username, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Datos recibidos:', data);
      
      // Procesar datos para incluir información de responsables
      this.empresas = await Promise.all((data || []).map(async (empresa) => {
        const responsablesInfo = [];
        if (empresa.responsables && empresa.responsables.length > 0) {
          const { data: responsablesData } = await this.supabaseService.client
            .from('profiles')
            .select('id, username, full_name, id_perfil')
            .in('id', empresa.responsables)
            .eq('status', 1);
          
          if (responsablesData) {
            responsablesInfo.push(...responsablesData);
          }
        }

        return {
          ...empresa,
          responsables_info: responsablesInfo
        };
      }));

      // Filtrar empresas según permisos del usuario
      this.filterEmpresasByPermissions();
      
      console.log('Empresas cargadas exitosamente:', this.empresas.length);
      console.log('Empresas donde soy responsable:', this.empresasAsignadas.length);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      this.error = 'Error al cargar las empresas. Verifique la conexión a la base de datos.';
    } finally {
      this.loading = false;
    }
  }

  // Filtrar empresas según permisos del usuario
  filterEmpresasByPermissions(): void {
    if (!this.currentUser) return;

    if (this.currentUser.id_perfil === 1) {
      // Administradores ven todas las empresas
      this.empresasAsignadas = [...this.empresas];
    } else {
      // Supervisores y otros solo ven empresas donde son responsables
      this.empresasAsignadas = this.empresas.filter(empresa => 
        this.isResponsableOf(empresa)
      );
    }

    this.filteredEmpresas = [...this.empresasAsignadas];
    this.applyFilters();
  }

  async loadUsuarios(): Promise<void> {
    try {
      // Cargar todos los usuarios activos
      const data = await this.supabaseService.getData('profiles');
      this.usuarios = (data || []).filter((user: Profile) => user.status === 1);
      
      // Filtrar solo supervisores para responsables
      this.usuariosSupervisores = this.usuarios.filter((user: Profile) => user.id_perfil === 3);
      
      console.log('Usuarios cargados:', this.usuarios.length);
      console.log('Supervisores disponibles:', this.usuariosSupervisores.length);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  applyFilters(): void {
    let filtered = [...this.empresasAsignadas];

    // Filtro por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(empresa => 
        empresa.nombre?.toLowerCase().includes(term) ||
        empresa.sector?.toLowerCase().includes(term) ||
        empresa.direccion?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(empresa => empresa.status === 1);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(empresa => empresa.status === 0);
    }

    // Filtro por sector
    if (this.sectorFilter !== 'all') {
      filtered = filtered.filter(empresa => empresa.sector === this.sectorFilter);
    }

    // Filtro por tamaño
    if (this.tamanoFilter !== 'all') {
      filtered = filtered.filter(empresa => empresa.tamano_empresa === this.tamanoFilter);
    }

    // Filtro específico para responsables
    if (this.responsableFilter === 'mis-empresas') {
      filtered = filtered.filter(empresa => this.isResponsableOf(empresa));
    }

    this.filteredEmpresas = filtered;
    console.log('Empresas filtradas:', this.filteredEmpresas.length);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openCreateModal(): void {
    if (!this.canCreateEmpresa()) {
      this.error = 'No tienes permisos para crear empresas';
      return;
    }

    if (this.usuariosSupervisores.length === 0) {
      this.error = 'No hay usuarios con perfil de Supervisor disponibles para asignar como responsables.';
      return;
    }
    
    this.modalMode = 'create';
    this.empresaForm = {
      nombre: '',
      descripcion: {
        descripcion: '',
        sector: '',
        tamano: '',
        ubicacion: '',
        sitio_web: '',
        fundacion: ''
      },
      responsables: [this.currentUser!.id!], // Auto-asignarse como responsable
      contactos_referencias: [],
      direccion: '',
      telefono: '',
      email: '',
      sitio_web: '',
      sector: '',
      tamano_empresa: 'Pequena',
      status: 1
    };
    this.error = '';
    this.success = '';
    this.showModal = true;
  }

  openEditModal(empresa: any): void {
    if (!this.canEditEmpresa(empresa)) {
      this.error = 'No tienes permisos para editar esta empresa';
      return;
    }
    
    this.modalMode = 'edit';
    this.selectedEmpresa = empresa;
    
    // Asegurar que la descripción sea un objeto
    let descripcion = empresa.descripcion;
    if (typeof descripcion === 'string') {
      try {
        descripcion = JSON.parse(descripcion);
      } catch (e) {
        descripcion = {
          descripcion: descripcion,
          sector: '',
          tamano: '',
          ubicacion: '',
          sitio_web: '',
          fundacion: ''
        };
      }
    }

    this.empresaForm = {
      ...empresa,
      descripcion: descripcion || {
        descripcion: '',
        sector: '',
        tamano: '',
        ubicacion: '',
        sitio_web: '',
        fundacion: ''
      },
      responsables: empresa.responsables || [],
      contactos_referencias: empresa.contactos_referencias || []
    };
    this.error = '';
    this.success = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedEmpresa = null;
    this.error = '';
    this.success = '';
    this.nuevoContacto = { nombre: '', cargo: '', telefono: '', email: '' };
  }

  async saveEmpresa(): Promise<void> {
    try {
      console.log('Guardando empresa:', this.empresaForm);
      
      this.error = '';
      this.success = '';

      // Validaciones básicas
      if (!this.empresaForm.nombre || this.empresaForm.nombre.trim() === '') {
        this.error = 'El nombre de la empresa es requerido';
        return;
      }

      if (!this.empresaForm.sector) {
        this.error = 'El sector es requerido';
        return;
      }

      // Validar que hay al menos un responsable
      if (!this.empresaForm.responsables || this.empresaForm.responsables.length === 0) {
        this.error = 'Debe asignar al menos un responsable';
        return;
      }

      // Preparar datos para guardar
      const dataToSave = {
        nombre: this.empresaForm.nombre.trim(),
        descripcion: this.empresaForm.descripcion,
        responsables: this.empresaForm.responsables || [],
        contactos_referencias: this.empresaForm.contactos_referencias || [],
        direccion: this.empresaForm.direccion?.trim() || null,
        telefono: this.empresaForm.telefono?.trim() || null,
        email: this.empresaForm.email?.trim() || null,
        sitio_web: this.empresaForm.sitio_web?.trim() || null,
        sector: this.empresaForm.sector,
        tamano_empresa: this.empresaForm.tamano_empresa,
        status: this.empresaForm.status,
        updated_by: this.currentUser?.id
      };

      if (this.modalMode === 'create') {
        // Verificar permisos para crear
        if (!this.canCreateEmpresa()) {
          this.error = 'No tienes permisos para crear empresas';
          return;
        }

        // Verificar si el nombre ya existe
        const { data: existingEmpresa } = await this.supabaseService.client
          .from('empresas')
          .select('nombre')
          .eq('nombre', this.empresaForm.nombre.trim())
          .single();

        if (existingEmpresa) {
          this.error = 'Ya existe una empresa con este nombre';
          return;
        }

        // Crear nueva empresa
        const newEmpresaData = {
          ...dataToSave,
          created_by: this.currentUser?.id
        };

        console.log('Creando empresa:', newEmpresaData);
        await this.supabaseService.insertData('empresas', newEmpresaData);
        this.success = 'Empresa creada exitosamente';
        console.log('Empresa creada exitosamente');

      } else {
        // Verificar permisos para editar
        if (!this.canEditEmpresa(this.selectedEmpresa!)) {
          this.error = 'No tienes permisos para editar esta empresa';
          return;
        }

        // Editar empresa existente
        console.log('Actualizando empresa:', dataToSave);
        await this.supabaseService.updateData('empresas', this.selectedEmpresa!.id!.toString(), dataToSave);
        this.success = 'Empresa actualizada exitosamente';
        console.log('Empresa actualizada exitosamente');
      }

      // Recargar empresas y cerrar modal después de un delay
      await this.loadEmpresas();
      setTimeout(() => {
        this.closeModal();
      }, 1500);

    } catch (error) {
      console.error('Error guardando empresa:', error);
      this.error = 'Error al guardar la empresa. Intente nuevamente.';
    }
  }

  async deactivateEmpresa(empresa: Empresa): Promise<void> {
    if (!this.canEditEmpresa(empresa)) {
      this.error = 'No tienes permisos para desactivar esta empresa';
      return;
    }

    const confirmMessage = `¿Está seguro de desactivar la empresa "${empresa.nombre}"?`;
    if (confirm(confirmMessage)) {
      try {
        console.log('Desactivando empresa:', empresa.nombre);
        await this.supabaseService.updateData('empresas', empresa.id!.toString(), { 
          status: 0,
          updated_by: this.currentUser?.id 
        });
        await this.loadEmpresas();
        this.success = 'Empresa desactivada exitosamente';
        setTimeout(() => this.success = '', 3000);
      } catch (error) {
        console.error('Error desactivando empresa:', error);
        this.error = 'Error al desactivar la empresa';
        setTimeout(() => this.error = '', 5000);
      }
    }
  }

  async reactivateEmpresa(empresa: Empresa): Promise<void> {
    if (!this.canEditEmpresa(empresa)) {
      this.error = 'No tienes permisos para reactivar esta empresa';
      return;
    }

    const confirmMessage = `¿Está seguro de reactivar la empresa "${empresa.nombre}"?`;
    if (confirm(confirmMessage)) {
      try {
        console.log('Reactivando empresa:', empresa.nombre);
        await this.supabaseService.updateData('empresas', empresa.id!.toString(), { 
          status: 1,
          updated_by: this.currentUser?.id 
        });
        await this.loadEmpresas();
        this.success = 'Empresa reactivada exitosamente';
        setTimeout(() => this.success = '', 3000);
      } catch (error) {
        console.error('Error reactivando empresa:', error);
        this.error = 'Error al reactivar la empresa';
        setTimeout(() => this.error = '', 5000);
      }
    }
  }

  // Métodos para gestionar contactos de referencia
  agregarContacto(): void {
    if (!this.nuevoContacto.nombre || !this.nuevoContacto.cargo) {
      this.error = 'Nombre y cargo son requeridos para el contacto';
      return;
    }

    this.empresaForm.contactos_referencias.push({ ...this.nuevoContacto });
    this.nuevoContacto = { nombre: '', cargo: '', telefono: '', email: '' };
    this.error = '';
  }

  removerContacto(index: number): void {
    this.empresaForm.contactos_referencias.splice(index, 1);
  }

  // Métodos para gestionar responsables
  isResponsableSelected(userId: number): boolean {
    return this.empresaForm.responsables.includes(userId);
  }

  toggleResponsable(userId: number): void {
    const index = this.empresaForm.responsables.indexOf(userId);
    if (index > -1) {
      // No permitir eliminar si es el último responsable
      if (this.empresaForm.responsables.length === 1) {
        this.error = 'Debe haber al menos un responsable asignado';
        return;
      }
      this.empresaForm.responsables.splice(index, 1);
    } else {
      this.empresaForm.responsables.push(userId);
    }
    this.error = '';
  }

  // Métodos de utilidad
  getStatusText(status: number | undefined): string {
    return status === 1 ? 'Activa' : 'Inactiva';
  }

  getStatusColor(status: number | undefined): string {
    return status === 1 ? 'green' : 'red';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }

  getNombreUsuario(userId: number): string {
    const usuario = this.usuarios.find(u => u.id === userId);
    return usuario ? usuario.full_name || usuario.username : 'Usuario no encontrado';
  }

  getResponsablesNombres(responsables: number[]): string {
    if (!responsables || responsables.length === 0) return 'Sin responsables';
    
    const nombres = responsables.map(id => this.getNombreUsuario(id));
    return nombres.join(', ');
  }

  async refreshEmpresas(): Promise<void> {
    console.log('Refrescando lista de empresas');
    await this.loadEmpresas();
  }

  clearFilters(): void {
    console.log('Limpiando filtros');
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sectorFilter = 'all';
    this.tamanoFilter = 'all';
    this.responsableFilter = 'mis-empresas';
    this.applyFilters();
  }

  // TrackBy para optimizar rendimiento
  trackByEmpresaId(index: number, empresa: Empresa): any {
    return empresa.id || index;
  }

  // Método para obtener sectores únicos
  getSectoresUnicos(): string[] {
    const sectores = new Set(this.empresas.map(e => e.sector).filter((s): s is string => typeof s === 'string' && !!s));
    return Array.from(sectores).sort();
  }

  // Método para mostrar el tamaño en formato legible
  getTamanoLegible(tamano: string | undefined): string {
    if (!tamano) return 'No definido';
    
    const tamanos: { [key: string]: string } = {
      'Pequena': 'Pequeña',
      'Mediana': 'Mediana',
      'Grande': 'Grande',
      'Corporativa': 'Corporativa'
    };
    
    return tamanos[tamano] || tamano;
  }

  // Obtener nombre del perfil por ID
  getPerfilName(idPerfil: number | undefined): string {
    switch (idPerfil) {
      case 1: return 'Administrador';
      case 2: return 'Usuario';
      case 3: return 'Supervisor';
      case 4: return 'Invitado';
      default: return 'Sin asignar';
    }
  }

  // Verificar si hay supervisores disponibles
  haySupervisoresDisponibles(): boolean {
    return this.usuariosSupervisores.length > 0;
  }

  // Obtener conteo de supervisores disponibles
  getConteoSupervisores(): number {
    return this.usuariosSupervisores.length;
  }

  // Obtener estadísticas del usuario
  getUserStats(): any {
    if (!this.currentUser) return null;

    return {
      totalEmpresas: this.empresasAsignadas.length,
      empresasActivas: this.empresasAsignadas.filter(e => e.status === 1).length,
      empresasInactivas: this.empresasAsignadas.filter(e => e.status === 0).length,
      role: this.getPerfilName(this.currentUser.id_perfil)
    };
  }
}