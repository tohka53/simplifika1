// src/app/services/empresas.service.ts (ACTUALIZADO PARA PERFIL 3)
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Empresa } from '../empresas/empresas/empresas.component';
import { Profile } from '../interfaces/user.interfaces';

export interface EmpresaCompleta extends Empresa {
  responsables_supervisores_info?: any[];
  created_by_username?: string;
  created_by_name?: string;
}

export interface SupervisorInfo {
  id: number;
  username: string;
  full_name: string;
  empresas_asignadas: number;
  empresas_activas: number;
  empresas_nombres: string;
}

export interface IntegridadReporte {
  resultado: string;
  descripcion: string;
  count_afectados: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  // =============================================
  // MÉTODOS PARA GESTIÓN DE SUPERVISORES
  // =============================================

  // Obtener solo supervisores activos
  async getSupervisoresActivos(): Promise<Profile[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('get_supervisores_activos');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo supervisores activos:', error);
      throw error;
    }
  }

  // Validar que usuarios sean supervisores
  async validarSupervisores(userIds: number[]): Promise<boolean> {
    try {
      if (!userIds || userIds.length === 0) return true;

      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('id')
        .in('id', userIds)
        .eq('id_perfil', 3)
        .eq('status', 1);

      if (error) throw error;
      
      // Verificar que todos los IDs enviados son supervisores válidos
      return data.length === userIds.length;
    } catch (error) {
      console.error('Error validando supervisores:', error);
      return false;
    }
  }

  // Obtener reporte de supervisores y sus empresas
  async getReporteSupervisores(): Promise<SupervisorInfo[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('get_reporte_supervisores_empresas');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo reporte de supervisores:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS DE EMPRESAS MODIFICADOS
  // =============================================

  // Obtener todas las empresas con supervisores válidos
  async getAllEmpresas(): Promise<EmpresaCompleta[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('v_empresas_con_supervisores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo empresas:', error);
      throw error;
    }
  }

  // Crear nueva empresa (validando supervisores)
  async createEmpresa(empresaData: Partial<Empresa>): Promise<Empresa> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Validar que los responsables sean supervisores
      if (empresaData.responsables && empresaData.responsables.length > 0) {
        const sonSupervisores = await this.validarSupervisores(empresaData.responsables);
        if (!sonSupervisores) {
          throw new Error('Solo se pueden asignar usuarios con perfil de Supervisor como responsables');
        }
      }

      const dataToInsert = {
        ...empresaData,
        created_by: currentUser.id,
        updated_by: currentUser.id
      };

      const { data, error } = await this.supabaseService.client
        .from('empresas')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando empresa:', error);
      throw error;
    }
  }

  // Actualizar empresa (validando supervisores)
  async updateEmpresa(empresaId: number, empresaData: Partial<Empresa>): Promise<Empresa> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Validar que los responsables sean supervisores
      if (empresaData.responsables && empresaData.responsables.length > 0) {
        const sonSupervisores = await this.validarSupervisores(empresaData.responsables);
        if (!sonSupervisores) {
          throw new Error('Solo se pueden asignar usuarios con perfil de Supervisor como responsables');
        }
      }

      const dataToUpdate = {
        ...empresaData,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabaseService.client
        .from('empresas')
        .update(dataToUpdate)
        .eq('id', empresaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando empresa:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS DE VALIDACIÓN E INTEGRIDAD
  // =============================================

  // Verificar integridad del sistema
  async verificarIntegridad(): Promise<IntegridadReporte[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('verificar_integridad_responsables');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error verificando integridad:', error);
      throw error;
    }
  }

  // Limpiar responsables inválidos
  async limpiarResponsablesInvalidos(): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('limpiar_responsables_invalidos');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error limpiando responsables inválidos:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS DE RESPONSABLES ESPECÍFICOS
  // =============================================

  // Agregar supervisor como responsable
  async addSupervisorResponsable(empresaId: number, supervisorId: number): Promise<boolean> {
    try {
      // Verificar que el usuario sea supervisor
      const esSupervisor = await this.validarSupervisores([supervisorId]);
      if (!esSupervisor) {
        throw new Error('Solo se pueden asignar supervisores como responsables');
      }

      const { data, error } = await this.supabaseService.client
        .rpc('agregar_responsable_empresa', {
          p_empresa_id: empresaId,
          p_user_id: supervisorId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error agregando supervisor responsable:', error);
      throw error;
    }
  }

  // Obtener empresas de un supervisor específico
  async getEmpresasBySupervisor(supervisorId: number): Promise<EmpresaCompleta[]> {
    try {
      // Verificar que sea supervisor
      const esSupervisor = await this.validarSupervisores([supervisorId]);
      if (!esSupervisor) {
        throw new Error('El usuario especificado no es un supervisor activo');
      }

      const { data, error } = await this.supabaseService.client
        .rpc('get_empresas_responsable', { p_user_id: supervisorId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo empresas del supervisor:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS DE ESTADÍSTICAS Y REPORTES
  // =============================================

  // Obtener estadísticas específicas de supervisores
  async getEstadisticasSupervisores(): Promise<{
    total_supervisores: number;
    supervisores_con_empresas: number;
    supervisores_sin_empresas: number;
    promedio_empresas_por_supervisor: number;
    empresas_sin_responsables: number;
  }> {
    try {
      const [supervisores, reporte, integridad] = await Promise.all([
        this.getSupervisoresActivos(),
        this.getReporteSupervisores(),
        this.verificarIntegridad()
      ]);

      const supervisoresConEmpresas = reporte.filter(s => s.empresas_asignadas > 0).length;
      const totalEmpresasAsignadas = reporte.reduce((sum, s) => sum + s.empresas_asignadas, 0);
      const empresasSinResponsables = integridad.find(i => i.resultado === 'EMPRESAS_SIN_RESPONSABLES')?.count_afectados || 0;

      return {
        total_supervisores: supervisores.length,
        supervisores_con_empresas: supervisoresConEmpresas,
        supervisores_sin_empresas: supervisores.length - supervisoresConEmpresas,
        promedio_empresas_por_supervisor: supervisores.length > 0 ? totalEmpresasAsignadas / supervisores.length : 0,
        empresas_sin_responsables: Number(empresasSinResponsables)
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de supervisores:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS DE UTILIDAD
  // =============================================

  // Verificar si usuario actual puede asignar responsables
  canAssignResponsables(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id_perfil === 1 || currentUser?.id_perfil === 3; // Admin o Supervisor
  }

  // Verificar si usuario es supervisor
  async isUserSupervisor(userId: number): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('id_perfil')
        .eq('id', userId)
        .eq('status', 1)
        .single();

      if (error) return false;
      return data?.id_perfil === 3;
    } catch (error) {
      console.error('Error verificando si es supervisor:', error);
      return false;
    }
  }

  // Filtrar solo supervisores de una lista de usuarios
  filterSupervisores(usuarios: Profile[]): Profile[] {
    return usuarios.filter(usuario => usuario.id_perfil === 3 && usuario.status === 1);
  }

  // Validar datos de empresa con restricción de supervisores
  validateEmpresaDataWithSupervisores(empresa: Partial<Empresa>, supervisoresDisponibles: Profile[]): string[] {
    const errors: string[] = [];

    // Validaciones básicas
    if (!empresa.nombre || empresa.nombre.trim().length === 0) {
      errors.push('El nombre de la empresa es requerido');
    }

    if (!empresa.sector) {
      errors.push('El sector es requerido');
    }

    // Validación específica de responsables
    if (empresa.responsables && empresa.responsables.length > 0) {
      const supervisoresIds = supervisoresDisponibles.map(s => s.id);
      const responsablesInvalidos = empresa.responsables.filter(id => !supervisoresIds.includes(id));
      
      if (responsablesInvalidos.length > 0) {
        errors.push(`Los siguientes responsables no son supervisores válidos: ${responsablesInvalidos.join(', ')}`);
      }
    }

    return errors;
  }

  // Generar sugerencias de asignación de responsables
  async getSugerenciasAsignacion(): Promise<{
    supervisor_id: number;
    supervisor_nombre: string;
    empresas_actuales: number;
    puede_asignar_mas: boolean;
  }[]> {
    try {
      const reporte = await this.getReporteSupervisores();
      const maxEmpresasPorSupervisor = 5; // Límite sugerido

      return reporte.map(supervisor => ({
        supervisor_id: supervisor.id,
        supervisor_nombre: supervisor.full_name || supervisor.username,
        empresas_actuales: supervisor.empresas_asignadas,
        puede_asignar_mas: supervisor.empresas_asignadas < maxEmpresasPorSupervisor
      })).sort((a, b) => a.empresas_actuales - b.empresas_actuales);
    } catch (error) {
      console.error('Error generando sugerencias de asignación:', error);
      throw error;
    }
  }
}