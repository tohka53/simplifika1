// src/app/empresas/empresas/empresas.component.ts - VERSIÓN CORREGIDA
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { Profile } from '../../interfaces/user.interfaces';

export interface Empresa {
  id?: number;
  nombre: string;
  descripcion: any;
  responsables: number[];
  contactos_referencias: any[];
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
  selector: 'app-empresas',
  standalone: false,
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.css']
})
export class EmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
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

  nuevoContacto: ContactoReferencia = {
    nombre: '',
    cargo: '',
    telefono: '',
    email: ''
  };

  statusFilter = 'all';
  sectorFilter = 'all';
  tamanoFilter = 'all';

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
    console.log('EmpresasComponent inicializado');
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.error = 'Usuario no autenticado';
      this.loading = false;
      return;
    }

    console.log('Usuario actual:', this.currentUser);

    await Promise.all([
      this.loadEmpresas(),
      this.loadUsuarios()
    ]);
  }

  async loadEmpresas(): Promise<void> {
    this.loading = true;
    this.error = '';
    
    try {
      console.log('Cargando empresas...');
      
      const data = await this.supabaseService.getData('empresas');
      console.log('Datos de empresas recibidos:', data);
      
      this.empresas = await Promise.all((data || []).map(async (empresa) => {
        const responsablesInfo = [];
        if (empresa.responsables && empresa.responsables.length > 0) {
          try {
            const { data: responsablesData } = await this.supabaseService.client
              .from('profiles')
              .select('id, username, full_name, id_perfil')
              .in('id', empresa.responsables)
              .eq('status', 1)
              .eq('id_perfil', 3); // Solo supervisores
            
            if (responsablesData) {
              responsablesInfo.push(...responsablesData);
            }
          } catch (error) {
            console.error('Error cargando responsables:', error);
          }
        }

        return {
          ...empresa,
          responsables_info: responsablesInfo
        };
      }));

      this.filteredEmpresas = [...this.empresas];
      this.applyFilters();
      
      console.log('Empresas cargadas exitosamente:', this.empresas.length);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      this.error = 'Error al cargar las empresas';
    } finally {
      this.loading = false;
    }
  }

  async loadUsuarios(): Promise<void> {
    try {
      const data = await this.supabaseService.getData('profiles');
      this.usuarios = (data || []).filter((user: Profile) => user.status === 1);
      this.usuariosSupervisores = this.usuarios.filter((user: Profile) => user.id_perfil === 3);
      
      console.log('Usuarios cargados:', this.usuarios.length);
      console.log('Supervisores disponibles:', this.usuariosSupervisores.length);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  applyFilters(): void {
    let filtered = [...this.empresas];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(empresa => 
        empresa.nombre?.toLowerCase().includes(term) ||
        empresa.sector?.toLowerCase().includes(term) ||
        empresa.direccion?.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter === 'active') {
      filtered = filtered.filter(empresa => empresa.status === 1);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(empresa => empresa.status === 0);
    }

    if (this.sectorFilter !== 'all') {
      filtered = filtered.filter(empresa => empresa.sector === this.sectorFilter);
    }

    if (this.tamanoFilter !== 'all') {
      filtered = filtered.filter(empresa => empresa.tamano_empresa === this.tamanoFilter);
    }

    this.filteredEmpresas = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openCreateModal(): void {
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
    this.error = '';
    this.success = '';
    this.showModal = true;
  }

  openEditModal(empresa: any): void {
    if (this.usuariosSupervisores.length === 0) {
      this.error = 'No hay usuarios con perfil de Supervisor disponibles.';
      return;
    }
    
    this.modalMode = 'edit';
    this.selectedEmpresa = empresa;
    
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
      console.log('=== GUARDANDO EMPRESA ===');
      console.log('Modo:', this.modalMode);
      console.log('Usuario actual:', this.currentUser);
      console.log('Datos del formulario:', this.empresaForm);
      
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

      if (!this.currentUser || !this.currentUser.id) {
        this.error = 'Usuario no autenticado correctamente';
        return;
      }

      // Verificar permisos
      if (this.currentUser.id_perfil !== 1 && this.currentUser.id_perfil !== 3) {
        this.error = 'No tienes permisos para realizar esta acción';
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
        updated_by: this.currentUser.id
      };

      if (this.modalMode === 'create') {
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
          created_by: this.currentUser.id
        };

        console.log('Creando empresa:', newEmpresaData);
        const result = await this.supabaseService.insertData('empresas', newEmpresaData);
        console.log('Resultado creación:', result);
        
        this.success = 'Empresa creada exitosamente';

      } else {
        // Editar empresa existente
        console.log('Editando empresa ID:', this.selectedEmpresa!.id);
        
        const result = await this.supabaseService.updateData(
          'empresas',
          this.selectedEmpresa!.id!.toString(),
          dataToSave
        );
        
        console.log('Resultado actualización:', result);
        
        this.success = 'Empresa actualizada exitosamente';
      }

      // Recargar empresas
      await this.loadEmpresas();
      
      // Cerrar modal después de mostrar éxito
      setTimeout(() => {
        this.closeModal();
      }, 1500);

    } catch (error: any) {
      console.error('=== ERROR EN GUARDADO ===');
      console.error('Error:', error);
      
      if (error.message?.includes('duplicate key')) {
        this.error = 'Ya existe una empresa con este nombre';
      } else if (error.message?.includes('permission')) {
        this.error = 'No tienes permisos para realizar esta acción';
      } else {
        this.error = `Error al guardar: ${error.message || 'Error desconocido'}`;
      }
    }
  }

  async deactivateEmpresa(empresa: Empresa): Promise<void> {
    if (!this.canEdit()) {
      this.error = 'No tienes permisos para desactivar empresas';
      return;
    }

    const confirmMessage = `¿Está seguro de desactivar la empresa "${empresa.nombre}"?`;
    if (confirm(confirmMessage)) {
      try {
        await this.supabaseService.updateData('empresas', empresa.id!.toString(), { 
          status: 0,
          updated_by: this.currentUser!.id 
        });
        await this.loadEmpresas();
        this.success = 'Empresa desactivada exitosamente';
        setTimeout(() => this.success = '', 3000);
      } catch (error: any) {
        console.error('Error desactivando empresa:', error);
        this.error = 'Error al desactivar la empresa';
        setTimeout(() => this.error = '', 5000);
      }
    }
  }

  async reactivateEmpresa(empresa: Empresa): Promise<void> {
    if (!this.canEdit()) {
      this.error = 'No tienes permisos para reactivar empresas';
      return;
    }

    const confirmMessage = `¿Está seguro de reactivar la empresa "${empresa.nombre}"?`;
    if (confirm(confirmMessage)) {
      try {
        await this.supabaseService.updateData('empresas', empresa.id!.toString(), { 
          status: 1,
          updated_by: this.currentUser!.id 
        });
        await this.loadEmpresas();
        this.success = 'Empresa reactivada exitosamente';
        setTimeout(() => this.success = '', 3000);
      } catch (error: any) {
        console.error('Error reactivando empresa:', error);
        this.error = 'Error al reactivar la empresa';
        setTimeout(() => this.error = '', 5000);
      }
    }
  }

  // Métodos para gestionar contactos
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
    const usuario = this.usuariosSupervisores.find(u => u.id === userId);
    if (!usuario) {
      this.error = 'Solo se pueden asignar usuarios con perfil de Supervisor';
      return;
    }

    const index = this.empresaForm.responsables.indexOf(userId);
    if (index > -1) {
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
    this.applyFilters();
  }

  // Verificar permisos
  canEdit(): boolean {
    return this.currentUser?.id_perfil === 1 || this.currentUser?.id_perfil === 3;
  }

  canCreate(): boolean {
    return this.canEdit();
  }

  // TrackBy para optimizar rendimiento
  trackByEmpresaId(index: number, empresa: Empresa): any {
    return empresa.id || index;
  }

  getSectoresUnicos(): string[] {
    const sectores = new Set(this.empresas.map(e => e.sector).filter(s => s));
    return Array.from(sectores).filter((s): s is string => typeof s === 'string').sort();
  }

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

  getPerfilName(idPerfil: number | undefined): string {
    switch (idPerfil) {
      case 1: return 'Administrador';
      case 2: return 'Usuario';
      case 3: return 'Supervisor';
      case 4: return 'Invitado';
      default: return 'Sin asignar';
    }
  }

  haySupervisoresDisponibles(): boolean {
    return this.usuariosSupervisores.length > 0;
  }

  getConteoSupervisores(): number {
    return this.usuariosSupervisores.length;
  }

  validarResponsables(): boolean {
    const responsablesInvalidos = this.empresaForm.responsables.filter(id => 
      !this.usuariosSupervisores.some(supervisor => supervisor.id === id)
    );
    return responsablesInvalidos.length === 0;
  }
}