// empleos.service.ts - VERSIÓN CORREGIDA
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Empleo {
  id?: number;
  nombre: string;
  descripcion: {
    descripcion: string;
    requisitos: string[];
    beneficios: string[];
    habilidades: string[];
    idiomas: string[];
  };
  categoria: string;
  lugar_trabajo: {
    modalidades: string[];
  };
  experiencia_laboral: string;
  salario: {
    minimo: number | null;
    maximo: number | null;
    moneda: string;
    periodo: string;
    negociable: boolean;
  };
  jornada_laboral: string;
  tipo_contrato: string;
  urgencia: string;
  empresa_id: number;
  fecha_creacion?: string;
  fecha_fin_publicacion: string;
  status?: number;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
  numero_vacantes: number;
  aplicaciones_recibidas?: number;
  vistas?: number;
  keywords: string[];
  edad_minima?: number | null;
  edad_maxima?: number | null;
  genero?: string;
  estado_civil?: string;
  nivel_educacion?: string;
  
  // Campos calculados de la vista
  empresa_nombre?: string;
  empresa_sector?: string;
  estado_calculado?: string;
  dias_restantes?: number;
  puede_editar?: boolean;
}

export interface EmpleoStats {
  total_empleos: number;
  empleos_activos: number;
  empleos_expirados: number;
  empleos_cerrados: number;
  total_aplicaciones: number;
  empleos_urgentes: number;
  promedio_aplicaciones: number;
  categorias_populares: Array<{categoria: string, total: number}>;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleosService {
  
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  // =============================================
  // MÉTODOS PRINCIPALES - CORREGIDOS
  // =============================================

  // Obtener todos los empleos del usuario actual
  async getEmpleosByUser(): Promise<Empleo[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Obteniendo empleos para usuario:', currentUser.id, 'Perfil:', currentUser.id_perfil);

      // Usar la función simple que funciona mejor
      const { data, error } = await this.supabaseService.client
        .rpc('get_empleos_simple', { p_user_id: currentUser.id });

      if (error) {
        console.error('Error obteniendo empleos:', error);
        throw error;
      }

      console.log('Empleos obtenidos:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error en getEmpleosByUser:', error);
      throw error;
    }
  }

  // Método alternativo usando la vista directamente
  async getEmpleosFromView(): Promise<Empleo[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      let query = this.supabaseService.client
        .from('v_empleos_completa')
        .select('*');

      // Si no es admin, filtrar por empresas donde es responsable
      if (currentUser.id_perfil !== 1) {
        // Primero obtener las empresas donde es responsable
        const { data: empresasResponsable, error: empresasError } = await this.supabaseService.client
          .from('empresas')
          .select('id')
          .contains('responsables', [currentUser.id])
          .eq('status', 1);

        if (empresasError) {
          console.error('Error obteniendo empresas:', empresasError);
          throw empresasError;
        }

        if (empresasResponsable && empresasResponsable.length > 0) {
          const empresaIds = empresasResponsable.map(e => e.id);
          query = query.in('empresa_id', empresaIds);
        } else {
          // Si no es responsable de ninguna empresa, devolver array vacío
          return [];
        }
      }

      const { data, error } = await query.order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error obteniendo empleos de vista:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getEmpleosFromView:', error);
      throw error;
    }
  }

  // Obtener empleo por ID
  async getEmpleoById(id: number): Promise<Empleo | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('v_empleos_completa')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo empleo por ID:', error);
      throw error;
    }
  }

  // Crear nuevo empleo
  async createEmpleo(empleo: Partial<Empleo>): Promise<Empleo> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar permisos antes de crear
      const canCreate = await this.canCreateEmpleo(empleo.empresa_id!);
      if (!canCreate) {
        throw new Error('No tiene permisos para crear empleos en esta empresa');
      }

      const empleoData = {
        ...empleo,
        created_by: currentUser.id,
        fecha_creacion: new Date().toISOString()
      };

      const { data, error } = await this.supabaseService.client
        .from('empleos')
        .insert([empleoData])
        .select()
        .single();

      if (error) {
        console.error('Error creando empleo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en createEmpleo:', error);
      throw error;
    }
  }

  // Actualizar empleo
  async updateEmpleo(id: number, empleo: Partial<Empleo>): Promise<Empleo> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const empleoData = {
        ...empleo,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabaseService.client
        .from('empleos')
        .update(empleoData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando empleo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en updateEmpleo:', error);
      throw error;
    }
  }

  // Eliminar empleo (cambiar status a 0)
  async deleteEmpleo(id: number): Promise<boolean> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await this.supabaseService.client
        .from('empleos')
        .update({ 
          status: 0,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error eliminando empleo:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error en deleteEmpleo:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS DE VALIDACIÓN Y PERMISOS
  // =============================================

  // Verificar si puede crear empleos en una empresa
  async canCreateEmpleo(empresaId: number): Promise<boolean> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return false;

      const { data, error } = await this.supabaseService.client
        .rpc('can_create_empleo', { 
          p_user_id: currentUser.id, 
          p_empresa_id: empresaId 
        });

      if (error) {
        console.error('Error verificando permisos:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error en canCreateEmpleo:', error);
      return false;
    }
  }

  // Verificar permisos generales para módulo de empleos
  canAccessEmpleos(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Solo admin (1) y supervisor/RRHH (3) pueden acceder
    return currentUser.id_perfil === 1 || currentUser.id_perfil === 3;
  }

  // =============================================
  // MÉTODOS DE ESTADÍSTICAS - CORREGIDOS
  // =============================================

  // Obtener estadísticas de empleos
  // Actualización para empleos.service.ts - MÉTODO DE ESTADÍSTICAS CORREGIDO

// Reemplazar el método getEmpleosStats en tu empleos.service.ts

// Obtener estadísticas de empleos - VERSIÓN CORREGIDA CON FALLBACKS
async getEmpleosStats(): Promise<EmpleoStats> {
  try {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    console.log('Obteniendo estadísticas para usuario:', currentUser.id);

    // Intentar con la función principal corregida
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('get_empleos_stats', { p_user_id: currentUser.id });

      if (error) {
        console.warn('Error con función principal de stats:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('✅ Estadísticas obtenidas con función principal:', data[0]);
        return this.formatStatsResponse(data[0]);
      }
    } catch (error) {
      console.warn('Función principal falló, intentando con función simple...');
    }

    // Fallback 1: Función simple
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('get_simple_empleos_stats', { p_user_id: currentUser.id });

      if (error) {
        console.warn('Error con función simple de stats:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('✅ Estadísticas obtenidas con función simple:', data[0]);
        return this.formatStatsResponse(data[0]);
      }
    } catch (error) {
      console.warn('Función simple falló, intentando con función básica...');
    }

    // Fallback 2: Función básica sin filtros
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('get_basic_empleos_stats');

      if (error) {
        console.warn('Error con función básica de stats:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('✅ Estadísticas obtenidas con función básica:', data[0]);
        return this.formatStatsResponse(data[0]);
      }
    } catch (error) {
      console.warn('Función básica falló, calculando manualmente...');
    }

    // Fallback 3: Calcular manualmente desde la tabla
    return await this.calculateStatsManually();

  } catch (error) {
    console.error('Error en getEmpleosStats:', error);
    return this.getEmptyStats();
  }
}

// Método para formatear la respuesta de estadísticas
private formatStatsResponse(data: any): EmpleoStats {
  return {
    total_empleos: Number(data.total_empleos) || 0,
    empleos_activos: Number(data.empleos_activos) || 0,
    empleos_expirados: Number(data.empleos_expirados) || 0,
    empleos_cerrados: Number(data.empleos_cerrados) || 0,
    total_aplicaciones: Number(data.total_aplicaciones) || 0,
    empleos_urgentes: Number(data.empleos_urgentes) || 0,
    promedio_aplicaciones: Number(data.promedio_aplicaciones) || 0,
    categorias_populares: data.categorias_populares || []
  };
}

// Método para calcular estadísticas manualmente
private async calculateStatsManually(): Promise<EmpleoStats> {
  try {
    console.log('Calculando estadísticas manualmente...');
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return this.getEmptyStats();
    }

    // Obtener empleos del usuario
    let query = this.supabaseService.client
      .from('empleos')
      .select('*');

    // Filtrar por permisos si no es admin
    if (currentUser.id_perfil !== 1) {
      // Obtener empresas donde es responsable
      const { data: empresasResp } = await this.supabaseService.client
        .from('empresas')
        .select('id')
        .contains('responsables', [currentUser.id])
        .eq('status', 1);

      if (empresasResp && empresasResp.length > 0) {
        const empresaIds = empresasResp.map(e => e.id);
        query = query.in('empresa_id', empresaIds);
      } else {
        return this.getEmptyStats();
      }
    }

    const { data: empleos, error } = await query;

    if (error) {
      console.error('Error obteniendo empleos para stats manuales:', error);
      return this.getEmptyStats();
    }

    if (!empleos || empleos.length === 0) {
      console.log('No hay empleos para calcular estadísticas');
      return this.getEmptyStats();
    }

    // Calcular estadísticas
    const now = new Date();
    const stats: EmpleoStats = {
      total_empleos: empleos.length,
      empleos_activos: empleos.filter(e => 
        e.status === 1 && new Date(e.fecha_fin_publicacion) > now
      ).length,
      empleos_expirados: empleos.filter(e => 
        new Date(e.fecha_fin_publicacion) <= now
      ).length,
      empleos_cerrados: empleos.filter(e => e.status === 2).length,
      total_aplicaciones: empleos.reduce((sum, e) => sum + (e.aplicaciones_recibidas || 0), 0),
      empleos_urgentes: empleos.filter(e => 
        e.urgencia === 'urgente' && e.status === 1
      ).length,
      promedio_aplicaciones: empleos.length > 0 ? 
        empleos.reduce((sum, e) => sum + (e.aplicaciones_recibidas || 0), 0) / empleos.length : 0,
      categorias_populares: this.calculateCategoriesPopularity(empleos)
    };

    console.log('✅ Estadísticas calculadas manualmente:', stats);
    return stats;

  } catch (error) {
    console.error('Error en cálculo manual de estadísticas:', error);
    return this.getEmptyStats();
  }
}

// Calcular popularidad de categorías
private calculateCategoriesPopularity(empleos: any[]): Array<{categoria: string, total: number}> {
  const categoriasCount: { [key: string]: number } = {};
  
  empleos.forEach(empleo => {
    if (empleo.categoria) {
      categoriasCount[empleo.categoria] = (categoriasCount[empleo.categoria] || 0) + 1;
    }
  });

  return Object.entries(categoriasCount)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

// Devolver estadísticas vacías en caso de error
private getEmptyStats(): EmpleoStats {
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

// =============================================
// MÉTODO ADICIONAL PARA DEBUG DE ESTADÍSTICAS
// =============================================

async debugStats(): Promise<void> {
  console.log('=== DEBUG ESTADÍSTICAS ===');
  
  try {
    // Verificar usuario actual
    const currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual:', currentUser);

    // Verificar empleos en BD
    const { data: totalEmpleos } = await this.supabaseService.client
      .from('empleos')
      .select('id');
    console.log('Total empleos en BD:', totalEmpleos?.length);

    // Verificar empresas del usuario
    if (currentUser && currentUser.id_perfil !== 1) {
      const { data: empresasResp } = await this.supabaseService.client
        .from('empresas')
        .select('id, nombre, responsables')
        .contains('responsables', [currentUser.id]);
      console.log('Empresas donde es responsable:', empresasResp);
    }

    // Probar funciones una por una
    try {
      const { data: stats1 } = await this.supabaseService.client
        .rpc('get_basic_empleos_stats');
      console.log('✅ get_basic_empleos_stats:', stats1);
    } catch (e) {
      console.log('❌ get_basic_empleos_stats:', e);
    }

    try {
      const { data: stats2 } = await this.supabaseService.client
        .rpc('get_simple_empleos_stats', { p_user_id: currentUser?.id });
      console.log('✅ get_simple_empleos_stats:', stats2);
    } catch (e) {
      console.log('❌ get_simple_empleos_stats:', e);
    }

    try {
      const { data: stats3 } = await this.supabaseService.client
        .rpc('get_empleos_stats', { p_user_id: currentUser?.id });
      console.log('✅ get_empleos_stats:', stats3);
    } catch (e) {
      console.log('❌ get_empleos_stats:', e);
    }

  } catch (error) {
    console.error('Error en debug de stats:', error);
  }
  
  console.log('=== FIN DEBUG ===');
}
  // =============================================
  // MÉTODOS DE UTILIDAD
  // =============================================

  // Incrementar vistas del empleo - CORREGIDO
  async incrementarVistas(empleoId: number): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('incrementar_vistas_empleo', { p_empleo_id: empleoId });

      if (error) {
        console.error('Error incrementando vistas:', error);
      }
    } catch (error) {
      console.error('Error en incrementarVistas:', error);
    }
  }

  // Obtener empresas donde el usuario puede crear empleos
  async getEmpresasDisponibles(): Promise<any[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return [];

      let query = this.supabaseService.client
        .from('empresas')
        .select('id, nombre, sector')
        .eq('status', 1);

      // Si no es admin, filtrar solo empresas donde es responsable
      if (currentUser.id_perfil !== 1) {
        query = query.contains('responsables', [currentUser.id]);
      }

      const { data, error } = await query.order('nombre');

      if (error) {
        console.error('Error obteniendo empresas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getEmpresasDisponibles:', error);
      throw error;
    }
  }

  // Método para usar como fallback en caso de errores
  async getEmpleosBasic(): Promise<any[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return [];

      const { data, error } = await this.supabaseService.client
        .from('empleos')
        .select(`
          *,
          empresas!inner(
            id,
            nombre,
            sector,
            responsables
          )
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error en consulta básica:', error);
        return [];
      }

      // Filtrar según permisos
      if (currentUser.id_perfil === 1) {
        return data || [];
      } else if (currentUser.id_perfil === 3) {
        return (data || []).filter(empleo => 
          empleo.empresas?.responsables?.includes(currentUser.id)
        );
      }

      return [];
    } catch (error) {
      console.error('Error en getEmpleosBasic:', error);
      return [];
    }
  }

  // =============================================
  // MÉTODOS DE CONFIGURACIÓN Y OPCIONES
  // =============================================

  // Obtener categorías disponibles
  getCategorias(): string[] {
    return [
      'ventas',
      'administracion',
      'informatica',
      'telecomunicaciones',
      'marketing',
      'recursos_humanos',
      'finanzas',
      'contabilidad',
      'logistica',
      'produccion',
      'servicio_cliente',
      'diseño',
      'legal',
      'educacion',
      'salud',
      'ingenieria',
      'construccion',
      'turismo',
      'gastronomia',
      'transporte'
    ];
  }

  // Obtener modalidades de trabajo
  getModalidadesTrabajo(): string[] {
    return ['remoto', 'hibrido', 'presencial'];
  }

  // Obtener niveles de experiencia
  getNivelesExperiencia(): string[] {
    return [
      'sin_experiencia',
      '0-1 años',
      '1-3 años',
      '3-5 años',
      '5-10 años',
      '10+ años'
    ];
  }

  // Obtener tipos de jornada
  getTiposJornada(): string[] {
    return ['tiempo_completo', 'medio_tiempo', 'por_horas'];
  }

  // Obtener tipos de contrato
  getTiposContrato(): string[] {
    return [
      'indefinido',
      'por_tiempo_determinado',
      'proyecto',
      'practicas',
      'temporal',
      'consultoria'
    ];
  }

  // Obtener niveles de urgencia
  getNivelesUrgencia(): string[] {
    return ['urgente', 'normal', 'bajo'];
  }

  // Obtener niveles de educación
  getNivelesEducacion(): string[] {
    return [
      'primaria',
      'secundaria',
      'tecnico',
      'universitario',
      'maestria',
      'doctorado'
    ];
  }

  // =============================================
  // MÉTODOS DE FORMATEO
  // =============================================

  // Formatear salario para mostrar
  formatSalario(salario: any): string {
    if (!salario || (!salario.minimo && !salario.maximo)) {
      return 'Salario no especificado';
    }

    const moneda = salario.moneda || 'GTQ';
    const periodo = salario.periodo || 'mensual';
    let texto = '';

    if (salario.minimo && salario.maximo) {
      texto = `${moneda} ${salario.minimo.toLocaleString()} - ${salario.maximo.toLocaleString()}`;
    } else if (salario.minimo) {
      texto = `Desde ${moneda} ${salario.minimo.toLocaleString()}`;
    } else if (salario.maximo) {
      texto = `Hasta ${moneda} ${salario.maximo.toLocaleString()}`;
    }

    texto += ` ${periodo}`;

    if (salario.negociable) {
      texto += ' (Negociable)';
    }

    return texto;
  }

  // Formatear modalidades de trabajo
  formatModalidades(lugarTrabajo: any): string {
    if (!lugarTrabajo || !lugarTrabajo.modalidades || lugarTrabajo.modalidades.length === 0) {
      return 'No especificado';
    }

    const modalidades = lugarTrabajo.modalidades.map((modalidad: string) => {
      switch (modalidad) {
        case 'remoto': return 'Remoto';
        case 'hibrido': return 'Híbrido';
        case 'presencial': return 'Presencial';
        default: return modalidad;
      }
    });

    return modalidades.join(', ');
  }

  // Obtener estado legible del empleo
  getEstadoLegible(empleo: Empleo): { texto: string, color: string } {
    if (empleo.estado_calculado) {
      switch (empleo.estado_calculado) {
        case 'activo':
          return { texto: 'Activo', color: 'green' };
        case 'expirado':
          return { texto: 'Expirado', color: 'red' };
        case 'cerrado':
          return { texto: 'Cerrado', color: 'gray' };
        case 'pausado':
          return { texto: 'Pausado', color: 'yellow' };
        case 'inactivo':
          return { texto: 'Inactivo', color: 'red' };
        default:
          return { texto: 'Desconocido', color: 'gray' };
      }
    }

    // Fallback si no hay estado calculado
    if (empleo.status === 0) return { texto: 'Inactivo', color: 'red' };
    if (empleo.status === 2) return { texto: 'Cerrado', color: 'gray' };
    if (empleo.status === 3) return { texto: 'Pausado', color: 'yellow' };
    
    // Verificar si está expirado
    if (empleo.fecha_fin_publicacion && new Date(empleo.fecha_fin_publicacion) < new Date()) {
      return { texto: 'Expirado', color: 'red' };
    }

    return { texto: 'Activo', color: 'green' };
  }

  // Obtener categoría legible
  getCategoriaLegible(categoria: string): string {
    const categorias: { [key: string]: string } = {
      'ventas': 'Ventas',
      'administracion': 'Administración',
      'informatica': 'Informática',
      'telecomunicaciones': 'Telecomunicaciones',
      'marketing': 'Marketing',
      'recursos_humanos': 'Recursos Humanos',
      'finanzas': 'Finanzas',
      'contabilidad': 'Contabilidad',
      'logistica': 'Logística',
      'produccion': 'Producción',
      'servicio_cliente': 'Servicio al Cliente',
      'diseño': 'Diseño',
      'legal': 'Legal',
      'educacion': 'Educación',
      'salud': 'Salud',
      'ingenieria': 'Ingeniería',
      'construccion': 'Construcción',
      'turismo': 'Turismo',
      'gastronomia': 'Gastronomía',
      'transporte': 'Transporte'
    };

    return categorias[categoria] || categoria;
  }

  // =============================================
  // MÉTODOS DE VALIDACIÓN
  // =============================================

  // Validar datos del empleo
  validateEmpleoData(empleo: Partial<Empleo>): string[] {
    const errors: string[] = [];

    if (!empleo.nombre || empleo.nombre.trim().length === 0) {
      errors.push('El nombre del empleo es requerido');
    }

    if (!empleo.categoria) {
      errors.push('La categoría es requerida');
    }

    if (!empleo.jornada_laboral) {
      errors.push('La jornada laboral es requerida');
    }

    if (!empleo.tipo_contrato) {
      errors.push('El tipo de contrato es requerido');
    }

    if (!empleo.empresa_id) {
      errors.push('La empresa es requerida');
    }

    if (!empleo.fecha_fin_publicacion) {
      errors.push('La fecha de fin de publicación es requerida');
    } else {
      const fechaFin = new Date(empleo.fecha_fin_publicacion);
      const hoy = new Date();
      if (fechaFin <= hoy) {
        errors.push('La fecha de fin de publicación debe ser mayor a la fecha actual');
      }
    }

    if (!empleo.numero_vacantes || empleo.numero_vacantes < 1) {
      errors.push('El número de vacantes debe ser mayor a 0');
    }

    if (empleo.edad_minima && empleo.edad_maxima && empleo.edad_minima > empleo.edad_maxima) {
      errors.push('La edad mínima no puede ser mayor que la edad máxima');
    }

    if (!empleo.descripcion || !empleo.descripcion.descripcion || empleo.descripcion.descripcion.trim().length === 0) {
      errors.push('La descripción del empleo es requerida');
    }

    if (!empleo.lugar_trabajo || !empleo.lugar_trabajo.modalidades || empleo.lugar_trabajo.modalidades.length === 0) {
      errors.push('Debe seleccionar al menos una modalidad de trabajo');
    }

    return errors;
  }
}