// src/app/services/job.service.ts - USANDO EmpleosService EXISTENTE
import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { EmpleosService, Empleo } from './empleos.service';

export interface JobOffer {
  id: number;
  nombre: string;
  descripcion: any;
  categoria: string;
  lugar_trabajo: any;
  experiencia_laboral: string;
  salario: any;
  jornada_laboral: string;
  tipo_contrato: string;
  urgencia: string;
  empresa_nombre: string;
  empresa_id?: number;
  fecha_creacion: string;
  fecha_fin_publicacion?: string;
  dias_restantes: number;
  numero_vacantes: number;
  aplicaciones_recibidas: number;
  keywords: string[];
  vistas?: number;
  status?: number;
  edad_minima?: number;
  edad_maxima?: number;
  genero?: string;
  estado_civil?: string;
  nivel_educacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {

  constructor(
    private authService: AuthService,
    private empleosService: EmpleosService
  ) {}

  // ==========================================
  // MÉTODOS PRINCIPALES USANDO EmpleosService
  // ==========================================

  /**
   * Obtener ofertas de trabajo públicas para el dashboard
   * Usa el EmpleosService existente
   */
  getDashboardJobs(limit: number = 6): Observable<JobOffer[]> {
    console.log('🔍 Obteniendo ofertas para dashboard desde EmpleosService...');
    
    return from(this.getJobsFromEmpleosService(limit)).pipe(
      map(empleos => {
        console.log('📊 Empleos obtenidos desde EmpleosService:', empleos.length);
        return empleos;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo ofertas desde EmpleosService:', error);
        console.log('🔄 Usando datos mock como fallback');
        return this.getMockJobs();
      })
    );
  }

  /**
   * Obtener empleos públicos usando el EmpleosService existente
   */
  private async getJobsFromEmpleosService(limit: number = 6): Promise<JobOffer[]> {
    try {
      console.log('🔍 Consultando empleos con EmpleosService...');
      
      // Usar el método getEmpleosFromView que ya tienes implementado
      const empleos = await this.empleosService.getEmpleosFromView();
      
      if (!empleos || empleos.length === 0) {
        console.log('📊 No hay empleos, intentando con getEmpleosByUser...');
        const empleosUser = await this.empleosService.getEmpleosByUser();
        return this.filterPublicJobs(empleosUser).slice(0, limit);
      }

      console.log('✅ Empleos obtenidos:', empleos.length);
      
      // Filtrar solo empleos públicos activos y convertir a JobOffer
      const empleosPublicos = this.filterPublicJobs(empleos);
      
      // Limitar y ordenar
      return empleosPublicos
        .sort((a, b) => {
          // Priorizar urgentes
          if (a.urgencia === 'urgente' && b.urgencia !== 'urgente') return -1;
          if (b.urgencia === 'urgente' && a.urgencia !== 'urgente') return 1;
          
          // Luego por fecha de creación
          return new Date(b.fecha_creacion || '').getTime() - new Date(a.fecha_creacion || '').getTime();
        })
        .slice(0, limit);

    } catch (error) {
      console.error('❌ Error en getJobsFromEmpleosService:', error);
      
      // Intentar con el método básico como fallback
      try {
        console.log('🔄 Intentando con método básico...');
        const empleosBasic = await this.empleosService.getEmpleosBasic();
        return this.filterPublicJobs(empleosBasic).slice(0, limit);
      } catch (basicError) {
        console.error('❌ Error con método básico:', basicError);
        return [];
      }
    }
  }

  /**
   * Filtrar solo empleos públicos activos
   */
  private filterPublicJobs(empleos: Empleo[]): JobOffer[] {
    const now = new Date();
    
    return empleos
      .filter(empleo => {
        // Solo empleos activos
        if (empleo.status !== 1) return false;
        
        // Solo empleos no expirados
        if (empleo.fecha_fin_publicacion && new Date(empleo.fecha_fin_publicacion) <= now) {
          return false;
        }
        
        return true;
      })
      .map(empleo => this.transformEmpleoToJobOffer(empleo));
  }

  /**
   * Transformar Empleo a JobOffer
   */
  private transformEmpleoToJobOffer(empleo: Empleo): JobOffer {
    return {
      id: empleo.id || 0,
      nombre: empleo.nombre,
      descripcion: empleo.descripcion,
      categoria: empleo.categoria,
      lugar_trabajo: empleo.lugar_trabajo,
      experiencia_laboral: empleo.experiencia_laboral,
      salario: empleo.salario,
      jornada_laboral: empleo.jornada_laboral,
      tipo_contrato: empleo.tipo_contrato,
      urgencia: empleo.urgencia,
      empresa_nombre: empleo.empresa_nombre || 'Empresa',
      empresa_id: empleo.empresa_id,
      fecha_creacion: empleo.fecha_creacion || new Date().toISOString(),
      fecha_fin_publicacion: empleo.fecha_fin_publicacion,
      dias_restantes: empleo.dias_restantes || this.calculateDaysRemaining(empleo.fecha_fin_publicacion),
      numero_vacantes: empleo.numero_vacantes,
      aplicaciones_recibidas: empleo.aplicaciones_recibidas || 0,
      keywords: empleo.keywords,
      vistas: empleo.vistas,
      status: empleo.status,
     
      genero: empleo.genero,
      estado_civil: empleo.estado_civil,
      nivel_educacion: empleo.nivel_educacion
    };
  }

  /**
   * Calcular días restantes
   */
  private calculateDaysRemaining(fechaFin: string | undefined): number {
    if (!fechaFin) return 0;
    const now = new Date();
    const endDate = new Date(fechaFin);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Obtener todas las ofertas públicas con filtros
   */
  getPublicJobs(filters?: {
    limite?: number;
    pagina?: number;
    categoria?: string;
    modalidad?: string;
    experiencia?: string;
    busqueda?: string;
  }): Observable<{ empleos: JobOffer[], total: number, pagina: number, limite: number }> {
    console.log('🔍 Obteniendo ofertas públicas con filtros:', filters);
    
    return from(this.getFilteredJobsFromEmpleosService(filters)).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo ofertas filtradas:', error);
        return of({ empleos: [], total: 0, pagina: 1, limite: 12 });
      })
    );
  }

  private async getFilteredJobsFromEmpleosService(filters?: any): Promise<{ empleos: JobOffer[], total: number, pagina: number, limite: number }> {
    try {
      const limite = filters?.limite || 12;
      const pagina = filters?.pagina || 1;
      const offset = (pagina - 1) * limite;

      // Obtener todos los empleos públicos
      let empleos = await this.empleosService.getEmpleosFromView();
      
      if (!empleos || empleos.length === 0) {
        empleos = await this.empleosService.getEmpleosByUser();
      }

      // Filtrar empleos públicos
      let empleosPublicos = this.filterPublicJobs(empleos);

      // Aplicar filtros adicionales
      if (filters?.categoria && filters.categoria !== 'all') {
        empleosPublicos = empleosPublicos.filter(job => job.categoria === filters.categoria);
      }

      if (filters?.experiencia && filters.experiencia !== 'all') {
        empleosPublicos = empleosPublicos.filter(job => job.experiencia_laboral === filters.experiencia);
      }

      if (filters?.busqueda) {
        const searchTerm = filters.busqueda.toLowerCase();
        empleosPublicos = empleosPublicos.filter(job => 
          job.nombre.toLowerCase().includes(searchTerm) ||
          job.empresa_nombre.toLowerCase().includes(searchTerm) ||
          job.categoria.toLowerCase().includes(searchTerm) ||
          (job.descripcion?.descripcion && job.descripcion.descripcion.toLowerCase().includes(searchTerm))
        );
      }

      if (filters?.modalidad && filters.modalidad !== 'all') {
        empleosPublicos = empleosPublicos.filter(job => 
          job.lugar_trabajo?.modalidades?.includes(filters.modalidad)
        );
      }

      // Ordenar
      empleosPublicos.sort((a, b) => {
        // Priorizar urgentes
        if (a.urgencia === 'urgente' && b.urgencia !== 'urgente') return -1;
        if (b.urgencia === 'urgente' && a.urgencia !== 'urgente') return 1;
        
        // Luego por fecha de creación
        return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
      });

      // Aplicar paginación
      const total = empleosPublicos.length;
      const empleosPaginados = empleosPublicos.slice(offset, offset + limite);

      return {
        empleos: empleosPaginados,
        total,
        pagina,
        limite
      };
    } catch (error) {
      console.error('❌ Error en getFilteredJobsFromEmpleosService:', error);
      return { empleos: [], total: 0, pagina: 1, limite: 12 };
    }
  }

  /**
   * Obtener detalle de un empleo específico
   */
  getJobDetail(jobId: number): Observable<JobOffer | null> {
    console.log('🔍 Obteniendo detalle del empleo:', jobId);
    
    return from(this.getJobDetailFromEmpleosService(jobId)).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo detalle:', error);
        return of(null);
      })
    );
  }

  private async getJobDetailFromEmpleosService(jobId: number): Promise<JobOffer | null> {
    try {
      const empleo = await this.empleosService.getEmpleoById(jobId);
      
      if (!empleo) {
        return null;
      }

      // Incrementar vistas
      await this.empleosService.incrementarVistas(jobId);

      return this.transformEmpleoToJobOffer(empleo);
    } catch (error) {
      console.error('❌ Error en getJobDetailFromEmpleosService:', error);
      return null;
    }
  }

  // ==========================================
  // MÉTODOS PARA APLICACIONES (MOCK POR AHORA)
  // ==========================================

  /**
   * Obtener CVs del usuario actual (mock)
   */
  getMyCVs(): Observable<any[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of([]);
    }

    console.log('🔍 Obteniendo CVs del usuario (mock)');
    
    // Datos mock de CVs - aquí podrías conectar con tu servicio de CVs
    const mockCVs = [
      {
        id: 1,
        nombre: 'CV Principal',
        fecha_creacion: '2024-01-15',
        fecha_actualizacion: '2024-11-20',
        activo: true
      },
      {
        id: 2,
        nombre: 'CV Técnico',
        fecha_creacion: '2024-06-10',
        fecha_actualizacion: '2024-11-18',
        activo: true
      }
    ];
    
    return of(mockCVs);
  }

  /**
   * Aplicar a un empleo (mock por ahora)
   */
  applyToJob(jobId: number, cvId: number, applicationData?: {
    carta_presentacion?: string;
    salario_esperado?: number;
    disponibilidad_inicio?: string;
    notas_candidato?: string;
  }): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of({ success: false, message: 'Usuario no autenticado' });
    }

    console.log('📝 Aplicando a empleo (mock):', { jobId, cvId });
    
    // Simular aplicación exitosa
    setTimeout(() => {
      console.log('✅ Aplicación enviada exitosamente (mock)');
    }, 1000);
    
    return of({ 
      success: true, 
      message: 'Aplicación enviada exitosamente',
      data: { id: Date.now(), empleo_id: jobId, cv_id: cvId }
    });
  }

  /**
   * Obtener mis aplicaciones (mock por ahora)
   */
  getMyApplications(): Observable<any[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of([]);
    }

    console.log('🔍 Obteniendo aplicaciones del usuario (mock)');
    
    // Datos mock de aplicaciones
    const mockApplications = [
      {
        id: 1,
        empleo_id: 1,
        empleo_nombre: 'Desarrollador Full Stack',
        empresa_nombre: 'TechCorp Guatemala',
        status: 'pendiente',
        fecha_aplicacion: '2024-11-20',
        status_descripcion: 'Pendiente de revisión'
      },
      {
        id: 2,
        empleo_id: 2,
        empleo_nombre: 'Ejecutivo de Ventas',
        empresa_nombre: 'Ventas Pro',
        status: 'revisado',
        fecha_aplicacion: '2024-11-18',
        status_descripcion: 'Revisado por RRHH'
      }
    ];
    
    return of(mockApplications);
  }

  // ==========================================
  // DATOS MOCK PARA FALLBACK
  // ==========================================

  private getMockJobs(): Observable<JobOffer[]> {
    const mockJobs: JobOffer[] = [
      {
        id: 1,
        nombre: 'Desarrollador Full Stack Angular/Node.js',
        descripcion: {
          descripcion: 'Buscamos desarrollador con experiencia en Angular y Node.js para unirse a nuestro equipo',
          requisitos: ['Angular 15+', 'Node.js', 'TypeScript', 'PostgreSQL'],
          beneficios: ['Seguro médico', 'Trabajo remoto', 'Capacitaciones'],
          habilidades: ['JavaScript', 'TypeScript', 'HTML5', 'CSS3'],
          idiomas: ['Español nativo', 'Inglés intermedio']
        },
        categoria: 'informatica',
        lugar_trabajo: { modalidades: ['remoto', 'hibrido'] },
        experiencia_laboral: '3-5 años',
        salario: { minimo: 12000, maximo: 18000, moneda: 'GTQ', periodo: 'mensual', negociable: true },
        jornada_laboral: 'tiempo_completo',
        tipo_contrato: 'indefinido',
        urgencia: 'normal',
        empresa_nombre: 'TechCorp Guatemala',
        fecha_creacion: new Date().toISOString(),
        dias_restantes: 25,
        numero_vacantes: 2,
        aplicaciones_recibidas: 15,
        keywords: ['angular', 'nodejs', 'typescript', 'postgresql']
      },
      {
        id: 2,
        nombre: 'Ejecutivo de Ventas',
        descripcion: {
          descripcion: 'Ejecutivo de ventas para productos tecnológicos en el área metropolitana',
          requisitos: ['Experiencia en ventas', 'Licencia de conducir', 'Vehículo propio'],
          beneficios: ['Comisiones atractivas', 'Bonos por metas', 'Seguro de vida'],
          habilidades: ['Comunicación efectiva', 'Negociación', 'CRM'],
          idiomas: ['Español nativo']
        },
        categoria: 'ventas',
        lugar_trabajo: { modalidades: ['presencial'] },
        experiencia_laboral: '1-3 años',
        salario: { minimo: 8000, maximo: 15000, moneda: 'GTQ', periodo: 'mensual', negociable: true },
        jornada_laboral: 'tiempo_completo',
        tipo_contrato: 'indefinido',
        urgencia: 'urgente',
        empresa_nombre: 'Ventas Pro',
        fecha_creacion: new Date().toISOString(),
        dias_restantes: 15,
        numero_vacantes: 3,
        aplicaciones_recibidas: 8,
        keywords: ['ventas', 'comercial', 'ejecutivo', 'tecnologia']
      },
      {
        id: 3,
        nombre: 'Diseñador UX/UI',
        descripcion: {
          descripcion: 'Diseñador UX/UI para crear experiencias digitales excepcionales',
          requisitos: ['Figma', 'Adobe Creative Suite', 'Prototipado', 'Research'],
          beneficios: ['Trabajo remoto', 'Horario flexible', 'Equipo Mac'],
          habilidades: ['Figma', 'Sketch', 'Adobe XD', 'Photoshop'],
          idiomas: ['Español nativo', 'Inglés básico']
        },
        categoria: 'diseño',
        lugar_trabajo: { modalidades: ['remoto'] },
        experiencia_laboral: '2-4 años',
        salario: { minimo: 10000, maximo: 16000, moneda: 'GTQ', periodo: 'mensual', negociable: false },
        jornada_laboral: 'tiempo_completo',
        tipo_contrato: 'indefinido',
        urgencia: 'normal',
        empresa_nombre: 'Design Studio',
        fecha_creacion: new Date().toISOString(),
        dias_restantes: 30,
        numero_vacantes: 1,
        aplicaciones_recibidas: 12,
        keywords: ['ux', 'ui', 'diseño', 'figma', 'prototipado']
      }
    ];

    console.log('🔄 Usando datos mock como fallback:', mockJobs.length, 'empleos');
    return of(mockJobs);
  }

  // ==========================================
  // MÉTODOS UTILITARIOS
  // ==========================================

  formatSalary(salario: any): string {
    // Usar el método del EmpleosService si está disponible
    if (this.empleosService.formatSalario) {
      return this.empleosService.formatSalario(salario);
    }

    // Fallback propio
    if (!salario) return 'No especificado';
    
    const { minimo, maximo, moneda = 'GTQ', periodo = 'mensual', negociable } = salario;
    
    if (negociable) {
      return 'Salario negociable';
    }
    
    let formattedSalary = '';
    
    if (minimo && maximo) {
      formattedSalary = `${moneda} ${minimo.toLocaleString()} - ${maximo.toLocaleString()}`;
    } else if (minimo) {
      formattedSalary = `Desde ${moneda} ${minimo.toLocaleString()}`;
    } else if (maximo) {
      formattedSalary = `Hasta ${moneda} ${maximo.toLocaleString()}`;
    } else {
      return 'No especificado';
    }
    
    const periodoText = periodo === 'mensual' ? '/mes' : 
                      periodo === 'anual' ? '/año' : 
                      periodo === 'semanal' ? '/sem' : '';
    
    return formattedSalary + periodoText;
  }

  formatWorkLocation(lugar_trabajo: any): string {
    // Usar el método del EmpleosService si está disponible
    if (this.empleosService.formatModalidades) {
      return this.empleosService.formatModalidades(lugar_trabajo);
    }

    // Fallback propio
    if (!lugar_trabajo || !lugar_trabajo.modalidades) return 'No especificado';
    
    const modalidades = lugar_trabajo.modalidades;
    const modalidadTexts: { [key: string]: string } = {
      'remoto': 'Remoto',
      'presencial': 'Presencial',
      'hibrido': 'Híbrido'
    };
    
    return modalidades.map((m: string) => modalidadTexts[m] || m).join(', ');
  }

  formatUrgency(urgencia: string): { text: string, class: string } {
    switch (urgencia) {
      case 'urgente':
        return { text: 'URGENTE', class: 'bg-red-100 text-red-800' };
      case 'normal':
        return { text: 'Normal', class: 'bg-blue-100 text-blue-800' };
      case 'bajo':
        return { text: 'No urgente', class: 'bg-gray-100 text-gray-800' };
      default:
        return { text: 'Normal', class: 'bg-blue-100 text-blue-800' };
    }
  }

  formatDaysRemaining(days: number): { text: string, class: string } {
    if (days <= 0) {
      return { text: 'Expirado', class: 'text-red-600' };
    } else if (days <= 5) {
      return { text: `${days} días restantes`, class: 'text-red-600' };
    } else if (days <= 15) {
      return { text: `${days} días restantes`, class: 'text-yellow-600' };
    } else {
      return { text: `${days} días restantes`, class: 'text-green-600' };
    }
  }

  formatCategory(categoria: string): string {
    // Usar el método del EmpleosService si está disponible
    if (this.empleosService.getCategoriaLegible) {
      return this.empleosService.getCategoriaLegible(categoria);
    }

    // Fallback propio
    const categoryMap: { [key: string]: string } = {
      'informatica': 'Informática',
      'ventas': 'Ventas',
      'administracion': 'Administración',
      'marketing': 'Marketing',
      'contabilidad': 'Contabilidad',
      'diseño': 'Diseño',
      'recursos_humanos': 'Recursos Humanos',
      'finanzas': 'Finanzas',
      'logistica': 'Logística',
      'produccion': 'Producción',
      'servicio_cliente': 'Servicio al Cliente',
      'legal': 'Legal',
      'educacion': 'Educación',
      'salud': 'Salud',
      'ingenieria': 'Ingeniería',
      'construccion': 'Construcción',
      'turismo': 'Turismo',
      'gastronomia': 'Gastronomía',
      'transporte': 'Transporte'
    };
    
    return categoryMap[categoria] || categoria;
  }

  // ==========================================
  // MÉTODOS PARA OBTENER OPCIONES
  // ==========================================

  getCategories(): string[] {
    return this.empleosService.getCategorias();
  }

  getExperienceLevels(): string[] {
    return this.empleosService.getNivelesExperiencia();
  }

  getWorkModalities(): string[] {
    return this.empleosService.getModalidadesTrabajo();
  }

  getJobTypes(): string[] {
    return this.empleosService.getTiposJornada();
  }

  getContractTypes(): string[] {
    return this.empleosService.getTiposContrato();
  }

  getUrgencyLevels(): string[] {
    return this.empleosService.getNivelesUrgencia();
  }
}