// =============================================
// SERVICIO CORREGIDO - postulaciones.service.ts
// =============================================

import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { 
  EmpleoPublico, 
  CVUsuario, 
  CrearAplicacion, 
  AplicacionEmpleo, 
  FiltrosEmpleos,
  ActualizarEstadoAplicacion 
} from '../interfaces/postulaciones.interface';

@Injectable({
  providedIn: 'root'
})
export class PostulacionesService {

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  // =============================================
  // MÉTODOS PARA EMPLEOS PÚBLICOS - CONVERTIDOS A OBSERVABLE
  // =============================================

  getEmpleosPublicos(filtros?: FiltrosEmpleos): Observable<{empleos: EmpleoPublico[], total: number}> {
    return from(this._getEmpleosPublicos(filtros));
  }

  private async _getEmpleosPublicos(filtros?: FiltrosEmpleos): Promise<{empleos: EmpleoPublico[], total: number}> {
    try {
      const limite = filtros?.limite || 20;
      const offset = ((filtros?.pagina || 1) - 1) * limite;

      const { data, error } = await this.supabaseService.client
        .rpc('get_empleos_publicos', {
          p_limit: limite,
          p_offset: offset,
          p_categoria: filtros?.categoria || null,
          p_modalidad: filtros?.modalidad || null,
          p_experiencia: filtros?.experiencia || null
        });

      if (error) {
        console.error('Error obteniendo empleos públicos:', error);
        throw error;
      }

      let empleos = data || [];
      if (filtros?.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        empleos = empleos.filter((empleo: any) => 
          empleo.nombre.toLowerCase().includes(busqueda) ||
          empleo.empresa_nombre.toLowerCase().includes(busqueda)
        );
      }

      return {
        empleos: empleos,
        total: empleos.length
      };

    } catch (error) {
      console.error('Error en getEmpleosPublicos:', error);
      throw error;
    }
  }

  getDetalleEmpleo(empleoId: number): Observable<EmpleoPublico | null> {
    return from(this._getDetalleEmpleo(empleoId));
  }

  private async _getDetalleEmpleo(empleoId: number): Promise<EmpleoPublico | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('empleos')
        .select(`
          *,
          empresas (
            nombre,
            sector,
            email
          )
        `)
        .eq('id', empleoId)
        .eq('status', 1)
        .gte('fecha_fin_publicacion', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      const empleo: EmpleoPublico = {
        ...data,
        empresa_nombre: data.empresas?.nombre || '',
        dias_restantes: Math.max(0, Math.ceil(
          (new Date(data.fecha_fin_publicacion).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ))
      };

      return empleo;

    } catch (error) {
      console.error('Error obteniendo detalle del empleo:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS PARA CVs DEL USUARIO - CONVERTIDOS A OBSERVABLE
  // =============================================

  getMisCVs(): Observable<CVUsuario[]> {
    return from(this._getMisCVs());
  }

  private async _getMisCVs(): Promise<CVUsuario[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await this.supabaseService.client
        .rpc('get_cvs_candidato', { p_candidato_id: currentUser.id });

      if (error) {
        console.error('Error obteniendo CVs:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error en getMisCVs:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS PARA APLICACIONES - CONVERTIDOS A OBSERVABLE
  // =============================================

  aplicarAEmpleo(aplicacion: CrearAplicacion): Observable<{success: boolean, message: string}> {
    return from(this._aplicarAEmpleo(aplicacion));
  }

  private async _aplicarAEmpleo(aplicacion: CrearAplicacion): Promise<{success: boolean, message: string}> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await this.supabaseService.client
        .rpc('aplicar_a_empleo', {
          p_empleo_id: aplicacion.empleo_id,
          p_candidato_id: currentUser.id,
          p_cv_id: aplicacion.cv_id,
          p_carta_presentacion: aplicacion.carta_presentacion,
          p_salario_esperado: aplicacion.salario_esperado || null,
          p_disponibilidad_inicio: aplicacion.disponibilidad_inicio || null,
          p_notas_candidato: aplicacion.notas_candidato || null
        });

      if (error) {
        console.error('Error aplicando a empleo:', error);
        throw error;
      }

      return data || { success: false, message: 'Error desconocido' };

    } catch (error) {
      console.error('Error en aplicarAEmpleo:', error);
      return { success: false, message: 'Error al enviar la aplicación' };
    }
  }

  getMisAplicaciones(): Observable<AplicacionEmpleo[]> {
    return from(this._getMisAplicaciones());
  }

  private async _getMisAplicaciones(): Promise<AplicacionEmpleo[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await this.supabaseService.client
        .from('v_aplicaciones_completa')
        .select('*')
        .eq('candidato_id', currentUser.id)
        .order('fecha_aplicacion', { ascending: false });

      if (error) {
        console.error('Error obteniendo mis aplicaciones:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error en getMisAplicaciones:', error);
      throw error;
    }
  }

  // MÉTODO FALTANTE - RETIRAR APLICACIÓN
  retirarAplicacion(aplicacionId: number): Observable<{success: boolean, message: string}> {
    return from(this._retirarAplicacion(aplicacionId));
  }

  private async _retirarAplicacion(aplicacionId: number): Promise<{success: boolean, message: string}> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que la aplicación pertenece al usuario
      const { data: aplicacion, error: checkError } = await this.supabaseService.client
        .from('aplicaciones_empleo')
        .select('candidato_id, status')
        .eq('id', aplicacionId)
        .single();

      if (checkError || !aplicacion) {
        return { success: false, message: 'Aplicación no encontrada' };
      }

      if (aplicacion.candidato_id !== currentUser.id) {
        return { success: false, message: 'No tienes permisos para retirar esta aplicación' };
      }

      if (aplicacion.status === 'contratado') {
        return { success: false, message: 'No puedes retirar una aplicación ya contratada' };
      }

      // Marcar como retirada
      const { error } = await this.supabaseService.client
        .from('aplicaciones_empleo')
        .update({ 
          status: 'retirada',
          updated_at: new Date().toISOString()
        })
        .eq('id', aplicacionId);

      if (error) {
        console.error('Error retirando aplicación:', error);
        throw error;
      }

      return { success: true, message: 'Aplicación retirada exitosamente' };

    } catch (error) {
      console.error('Error en retirarAplicacion:', error);
      return { success: false, message: 'Error al retirar la aplicación' };
    }
  }

  // =============================================
  // MÉTODOS PARA RRHH - CONVERTIDOS A OBSERVABLE
  // =============================================

  getAplicacionesPorEmpresa(filtros?: any): Observable<AplicacionEmpleo[]> {
    return from(this._getAplicacionesPorEmpresa(filtros));
  }

  private async _getAplicacionesPorEmpresa(filtros?: any): Promise<AplicacionEmpleo[]> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      if (currentUser.id_perfil !== 1 && currentUser.id_perfil !== 3) {
        throw new Error('No tiene permisos para ver estas aplicaciones');
      }

      let query = this.supabaseService.client
        .from('v_aplicaciones_completa')
        .select('*');

      if (currentUser.id_perfil === 3) {
        const { data: empresasAsignadas } = await this.supabaseService.client
          .from('empresas')
          .select('id')
          .contains('responsables', [currentUser.id]);

        if (empresasAsignadas && empresasAsignadas.length > 0) {
          const empresaIds = empresasAsignadas.map(e => e.id);
          query = query.in('empresa_id', empresaIds);
        } else {
          return [];
        }
      }

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros?.empleo_id) {
        query = query.eq('empleo_id', filtros.empleo_id);
      }

      query = query.order('fecha_aplicacion', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo aplicaciones por empresa:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error en getAplicacionesPorEmpresa:', error);
      throw error;
    }
  }

  getDetalleAplicacion(aplicacionId: number): Observable<AplicacionEmpleo | null> {
    return from(this._getDetalleAplicacion(aplicacionId));
  }

  private async _getDetalleAplicacion(aplicacionId: number): Promise<AplicacionEmpleo | null> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await this.supabaseService.client
        .from('v_aplicaciones_completa')
        .select('*')
        .eq('id', aplicacionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      const esPropioDeLCandidato = data.candidato_id === currentUser.id;
      const esAdmin = currentUser.id_perfil === 1;
      
      let puedeVerAplicacion = esPropioDeLCandidato || esAdmin;

      if (!puedeVerAplicacion && currentUser.id_perfil === 3) {
        const { data: empresa } = await this.supabaseService.client
          .from('empresas')
          .select('responsables')
          .eq('id', data.empresa_id)
          .single();

        if (empresa && empresa.responsables.includes(currentUser.id)) {
          puedeVerAplicacion = true;
        }
      }

      if (!puedeVerAplicacion) {
        throw new Error('No tiene permisos para ver esta aplicación');
      }

      return data;

    } catch (error) {
      console.error('Error obteniendo detalle de aplicación:', error);
      throw error;
    }
  }

  actualizarEstadoAplicacion(
    aplicacionId: number, 
    datos: ActualizarEstadoAplicacion
  ): Observable<{success: boolean, message: string}> {
    return from(this._actualizarEstadoAplicacion(aplicacionId, datos));
  }

  private async _actualizarEstadoAplicacion(
    aplicacionId: number, 
    datos: ActualizarEstadoAplicacion
  ): Promise<{success: boolean, message: string}> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      if (currentUser.id_perfil !== 1 && currentUser.id_perfil !== 3) {
        throw new Error('No tiene permisos para actualizar aplicaciones');
      }

      const { data, error } = await this.supabaseService.client
        .rpc('actualizar_estado_aplicacion', {
          p_aplicacion_id: aplicacionId,
          p_nuevo_status: datos.status,
          p_notas_rrhh: datos.notas_rrhh || null,
          p_puntuacion_rrhh: datos.puntuacion_rrhh || null,
          p_comentario: datos.comentario || null,
          p_revisado_por: currentUser.id
        });

      if (error) {
        console.error('Error actualizando estado:', error);
        throw error;
      }

      return data || { success: false, message: 'Error desconocido' };

    } catch (error) {
      console.error('Error en actualizarEstadoAplicacion:', error);
      return { success: false, message: 'Error al actualizar el estado' };
    }
  }

  // =============================================
  // MÉTODOS DE UTILIDAD
  // =============================================

  formatearSalario(salario: any): string {
    if (!salario) return 'No especificado';
    
    let texto = '';
    if (salario.minimo && salario.maximo) {
      texto = `Q${salario.minimo.toLocaleString()} - Q${salario.maximo.toLocaleString()}`;
    } else if (salario.minimo) {
      texto = `Desde Q${salario.minimo.toLocaleString()}`;
    } else if (salario.maximo) {
      texto = `Hasta Q${salario.maximo.toLocaleString()}`;
    }
    
    if (salario.periodo) {
      texto += ` ${salario.periodo}`;
    }
    if (salario.negociable) {
      texto += ' (Negociable)';
    }
    
    return texto;
  }

  obtenerModalidades(lugar_trabajo: any): string {
    if (!lugar_trabajo || !lugar_trabajo.modalidades) return '';
    return lugar_trabajo.modalidades.join(', ');
  }

  getStatusDescription(status: string): string {
    const statusMap: {[key: string]: string} = {
      'pendiente': 'Pendiente de revisión',
      'revisado': 'Revisado por RRHH',
      'preseleccionado': 'Preseleccionado',
      'entrevista': 'En proceso de entrevista',
      'rechazado': 'No seleccionado',
      'contratado': 'Contratado',
      'retirada': 'Retirada por el candidato'
    };

    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: {[key: string]: string} = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'revisado': 'bg-blue-100 text-blue-800',
      'preseleccionado': 'bg-purple-100 text-purple-800',
      'entrevista': 'bg-indigo-100 text-indigo-800',
      'rechazado': 'bg-red-100 text-red-800',
      'contratado': 'bg-green-100 text-green-800',
      'retirada': 'bg-gray-100 text-gray-800'
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  // =============================================
  // MÉTODOS DE VERIFICACIÓN DE PERMISOS
  // =============================================

  canAccessPostulaciones(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return !!currentUser;
  }

  canReviewApplications(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    return currentUser.id_perfil === 1 || currentUser.id_perfil === 3;
  }

  canAccessAllApplications(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    return currentUser.id_perfil === 1;
  }
}