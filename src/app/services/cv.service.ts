// src/app/services/cv.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { 
  CV, 
  CVFormData, 
  CVResponse, 
  CVListResponse, 
  CVValidationResult, 
  CVValidationError,
  CVSearchCriteria,
  CVSearchResult,
  CV_CONSTANTS
} from '../interfaces/cv.interfaces';

@Injectable({
  providedIn: 'root'
})
export class CVService {

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  // ================================
  // MÉTODOS CRUD PRINCIPALES
  // ================================

// Reemplaza tu método createCV con esta versión corregida:

async createCV(cvData: CVFormData): Promise<CVResponse> {
  try {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    console.log('🔄 Iniciando creación de CV para usuario:', currentUser.id);
    console.log('📝 Datos del CV:', cvData);

    // Validar datos básicos
    if (!cvData.nombre || cvData.nombre.trim().length === 0) {
      return { success: false, message: 'El nombre del CV es requerido' };
    }

    // Preparar datos correctamente para Supabase
    const dataToInsert = {
      id_profile: currentUser.id,
      nombre: cvData.nombre.trim(),
      cv_pdf_url: cvData.cv_pdf_url || null,
      // No usar JSON.stringify, dejar como arrays/objetos
      educacion: cvData.educacion && cvData.educacion.length > 0 
        ? cvData.educacion 
        : [],
      experiencia_laboral: cvData.experiencia_laboral && cvData.experiencia_laboral.length > 0 
        ? cvData.experiencia_laboral 
        : [],
      idiomas: cvData.idiomas && cvData.idiomas.length > 0 
        ? cvData.idiomas 
        : [],
      cursos_certificaciones_extra: cvData.cursos_certificaciones_extra && cvData.cursos_certificaciones_extra.length > 0 
        ? cvData.cursos_certificaciones_extra 
        : [],
      contactos_referencias: cvData.contactos_referencias && cvData.contactos_referencias.length > 0 
        ? cvData.contactos_referencias 
        : [],
      status: 1
    };

    console.log('📤 Datos preparados para insertar:', dataToInsert);

    // Usar cliente Supabase directamente
    const { data, error } = await this.supabaseService.client
      .from('cv')
      .insert(dataToInsert)
      .select()
      .single();

    console.log('📥 Respuesta de Supabase:', { data, error });

    if (error) {
      console.error('❌ Error de Supabase:', error);
      return { 
        success: false, 
        message: 'Error al crear CV: ' + error.message
      };
    }

    if (data) {
      console.log('✅ CV creado exitosamente:', data);
      const createdCV = this.parseCV(data);
      return { 
        success: true, 
        message: 'CV creado exitosamente',
        data: createdCV
      };
    } else {
      console.error('❌ No se recibió data de Supabase');
      return { success: false, message: 'Error inesperado: no se recibieron datos' };
    }

  } catch (error) {
    console.error('💥 Error crítico creando CV:', error);
    return { 
      success: false, 
      message: 'Error inesperado al crear CV: ' + (error as Error).message
    };
  }
}


 



  // ================================
  // MÉTODOS DE CONSULTA
  // ================================

  async getUserCVs(): Promise<CVListResponse> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        return { success: false, message: 'Usuario no autenticado' };
      }

      console.log('Obteniendo CVs del usuario:', currentUser.id);

      const { data, error } = await this.supabaseService.client
        .from('cv')
        .select('*')
        .eq('id_profile', currentUser.id)
        .eq('status', 1)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo CVs:', error);
        return { success: false, message: 'Error al obtener CVs' };
      }

      const cvs = (data || []).map(cv => this.parseCV(cv));
      
      return { 
        success: true, 
        message: 'CVs obtenidos exitosamente',
        data: cvs
      };

    } catch (error) {
      console.error('Error en getUserCVs:', error);
      return { success: false, message: 'Error inesperado al obtener CVs' };
    }
  }

  async getCVById(id: number): Promise<CVResponse> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('cv')
        .select('*')
        .eq('id', id)
        .eq('status', 1)
        .single();

      if (error) {
        console.error('Error obteniendo CV:', error);
        return { success: false, message: 'CV no encontrado' };
      }

      if (!data) {
        return { success: false, message: 'CV no encontrado' };
      }

      const cv = this.parseCV(data);
      
      return { 
        success: true, 
        message: 'CV obtenido exitosamente',
        data: cv
      };

    } catch (error) {
      console.error('Error en getCVById:', error);
      return { success: false, message: 'Error inesperado al obtener CV' };
    }
  }

  // ================================
  // MÉTODOS DE VALIDACIÓN
  // ================================


  // ================================
  // MÉTODOS DE ARCHIVOS
  // ================================

  async uploadCVFile(file: File): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        return { success: false, message: 'Usuario no autenticado' };
      }

      // Validar archivo
      if (file.size > CV_CONSTANTS.MAX_FILE_SIZE) {
        return { success: false, message: 'El archivo es demasiado grande (máximo 5MB)' };
      }

      if (!CV_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type)) {
        return { success: false, message: 'Solo se permiten archivos PDF' };
      }

      const fileExt = 'pdf';
      const fileName = `cv-${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      const { error: uploadError } = await this.supabaseService.client.storage
        .from('cv-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        return { success: false, message: 'Error al subir el archivo' };
      }

      const { data } = this.supabaseService.client.storage
        .from('cv-files')
        .getPublicUrl(filePath);

      return { 
        success: true, 
        message: 'Archivo subido exitosamente',
        url: data.publicUrl
      };

    } catch (error) {
      console.error('Error en uploadCVFile:', error);
      return { success: false, message: 'Error inesperado al subir archivo' };
    }
  }

  async deleteCVFile(fileUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!fileUrl) {
        return { success: true, message: 'No hay archivo para eliminar' };
      }

      // Extraer el path del archivo de la URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `cvs/${fileName}`;

      const { error } = await this.supabaseService.client.storage
        .from('cv-files')
        .remove([filePath]);

      if (error) {
        console.error('Error eliminando archivo:', error);
        return { success: false, message: 'Error al eliminar el archivo' };
      }

      return { success: true, message: 'Archivo eliminado exitosamente' };

    } catch (error) {
      console.error('Error en deleteCVFile:', error);
      return { success: false, message: 'Error inesperado al eliminar archivo' };
    }
  }







  // =============================================
// CORRECCIONES PARA TU CV.SERVICE.TS ACTUAL
// =============================================

// 1. MÉTODO updateCV CORREGIDO (para ser consistente con createCV)
async updateCV(id: number, cvData: CVFormData): Promise<CVResponse> {
  try {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    console.log('🔄 Actualizando CV:', id, 'para usuario:', currentUser.id);

    // Verificar que el CV existe y pertenece al usuario
    const { data: existingCV, error: checkError } = await this.supabaseService.client
      .from('cv')
      .select('id, id_profile')
      .eq('id', id)
      .eq('status', 1)
      .single();

    if (checkError || !existingCV) {
      console.error('❌ CV no encontrado:', checkError);
      return { success: false, message: 'CV no encontrado' };
    }

    if (existingCV.id_profile !== currentUser.id) {
      return { success: false, message: 'No tienes permisos para editar este CV' };
    }

    // Validar datos
    const validation = this.validateCV(cvData);
    if (!validation.isValid) {
      return { 
        success: false, 
        message: 'Datos inválidos: ' + validation.errors.map(e => e.message).join(', ')
      };
    }

    // ⚠️ CORRECCIÓN: Preparar datos igual que en createCV
    const dataToUpdate = {
      nombre: cvData.nombre.trim(),
      cv_pdf_url: cvData.cv_pdf_url || null,
      // ⚠️ NO usar JSON.stringify, dejar como arrays/objetos
      educacion: cvData.educacion || [],
      experiencia_laboral: cvData.experiencia_laboral || [],
      idiomas: cvData.idiomas || [],
      cursos_certificaciones_extra: cvData.cursos_certificaciones_extra || [],
      contactos_referencias: cvData.contactos_referencias || [],
      updated_at: new Date().toISOString()
    };

    console.log('📤 Actualizando con datos:', dataToUpdate);

    // ⚠️ CORRECCIÓN: Usar cliente Supabase directamente
    const { data, error } = await this.supabaseService.client
      .from('cv')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    console.log('📥 Respuesta de actualización:', { data, error });

    if (error) {
      console.error('❌ Error actualizando CV:', error);
      return { 
        success: false, 
        message: 'Error al actualizar CV: ' + error.message 
      };
    }

    if (data) {
      console.log('✅ CV actualizado exitosamente:', data);
      const updatedCV = this.parseCV(data);
      return { 
        success: true, 
        message: 'CV actualizado exitosamente',
        data: updatedCV
      };
    }

    return { success: false, message: 'Error inesperado al actualizar' };

  } catch (error) {
    console.error('💥 Error crítico actualizando CV:', error);
    return { 
      success: false, 
      message: 'Error inesperado al actualizar CV: ' + (error as Error).message 
    };
  }
}

// 2. MÉTODO deleteCV CORREGIDO
async deleteCV(id: number): Promise<CVResponse> {
  try {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    console.log('🗑️ Eliminando CV:', id, 'para usuario:', currentUser.id);

    // Verificar que el CV pertenece al usuario
    const existingCV = await this.getCVById(id);
    if (!existingCV.success || !existingCV.data) {
      return { success: false, message: 'CV no encontrado' };
    }

    if (existingCV.data.id_profile !== currentUser.id) {
      return { success: false, message: 'No tienes permisos para eliminar este CV' };
    }

    // ⚠️ CORRECCIÓN: Usar cliente Supabase directamente
    const { data, error } = await this.supabaseService.client
      .from('cv')
      .update({ status: 0, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error eliminando CV:', error);
      return { success: false, message: 'Error al eliminar CV: ' + error.message };
    }

    if (data) {
      console.log('✅ CV eliminado exitosamente');
      return { 
        success: true, 
        message: 'CV eliminado exitosamente'
      };
    }

    return { success: false, message: 'Error inesperado al eliminar' };

  } catch (error) {
    console.error('💥 Error crítico eliminando CV:', error);
    return { 
      success: false, 
      message: 'Error inesperado al eliminar CV: ' + (error as Error).message 
    };
  }
}

// 3. MÉTODO DE DEBUG PARA PROBAR CONEXIÓN
async testConnection(): Promise<void> {
  console.log('🧪 Probando conexión con Supabase...');
  
  try {
    // Probar acceso a la tabla CV
    const { data, error } = await this.supabaseService.client
      .from('cv')
      .select('*')
      .limit(1);

    console.log('🔍 Test tabla CV:', { data, error });
    
    if (error) {
      console.error('❌ Error accediendo a tabla CV:', error);
      console.log('💡 Posibles soluciones:');
      console.log('  1. Verificar que la tabla "cv" existe en Supabase');
      console.log('  2. Verificar permisos RLS (Row Level Security)');
      console.log('  3. Verificar configuración de Supabase');
    } else {
      console.log('✅ Tabla CV accesible');
      if (data && data.length > 0) {
        console.log('📋 Estructura de CV:', Object.keys(data[0]));
      } else {
        console.log('📋 Tabla CV vacía (sin datos)');
      }
    }

    // Probar usuario actual
    const currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual:', currentUser);
    
  } catch (error) {
    console.error('💥 Error crítico en test:', error);
  }
}

// 4. VALIDACIÓN MEJORADA (más permisiva para debugging)
validateCV(cvData: CVFormData): CVValidationResult {
  const errors: CVValidationError[] = [];

  // Solo validar lo esencial al inicio
  if (!cvData.nombre || cvData.nombre.trim().length === 0) {
    errors.push({ field: 'nombre', message: 'El nombre del CV es requerido' });
  }

  // ⚠️ TEMPORAL: Hacer validaciones más permisivas para debugging
  // Las demás validaciones las mantienes igual, pero podrías comentarlas temporalmente
  
  // Si quieres ser más permisivo temporalmente:
  console.log('🔍 Validando CV:', cvData.nombre, 'Errores encontrados:', errors.length);

  return {
    isValid: errors.length === 0,
    errors
  };
}


  // ================================
  // MÉTODOS DE BÚSQUEDA
  // ================================

  async searchCVs(criteria: CVSearchCriteria): Promise<{ success: boolean; message: string; data?: CVSearchResult[] }> {
    try {
      let query = this.supabaseService.client
        .from('v_cv_search')
        .select('*');

      // Aplicar filtros
      if (criteria.nombre) {
        query = query.ilike('nombre', `%${criteria.nombre}%`);
      }

      if (criteria.titulo_educacion) {
        query = query.ilike('titulos_educacion', `%${criteria.titulo_educacion}%`);
      }

      if (criteria.puesto_experiencia) {
        query = query.ilike('puestos_experiencia', `%${criteria.puesto_experiencia}%`);
      }

      if (criteria.idioma) {
        query = query.ilike('idiomas_disponibles', `%${criteria.idioma}%`);
      }

      if (criteria.status !== undefined) {
        query = query.eq('status', criteria.status);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Error buscando CVs:', error);
        return { success: false, message: 'Error al buscar CVs' };
      }

      return { 
        success: true, 
        message: 'Búsqueda completada exitosamente',
        data: data || []
      };

    } catch (error) {
      console.error('Error en searchCVs:', error);
      return { success: false, message: 'Error inesperado en búsqueda' };
    }
  }

  // ================================
  // MÉTODOS UTILITARIOS
  // ================================

  private parseCV(rawCV: any): CV {
    return {
      id: rawCV.id,
      id_profile: rawCV.id_profile,
      nombre: rawCV.nombre,
      cv_pdf_url: rawCV.cv_pdf_url,
      educacion: this.parseJsonField(rawCV.educacion, []),
      experiencia_laboral: this.parseJsonField(rawCV.experiencia_laboral, []),
      idiomas: this.parseJsonField(rawCV.idiomas, []),
      cursos_certificaciones_extra: this.parseJsonField(rawCV.cursos_certificaciones_extra, []),
      contactos_referencias: this.parseJsonField(rawCV.contactos_referencias, []),
      status: rawCV.status,
      created_at: rawCV.created_at,
      updated_at: rawCV.updated_at
    };
  }

  private parseJsonField(field: any, defaultValue: any = []): any {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (error) {
        console.error('Error parsing JSON field:', error);
        return defaultValue;
      }
    }
    return field || defaultValue;
  }

  // Obtener años disponibles para select
  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    
    for (let year = CV_CONSTANTS.MIN_ANIO; year <= currentYear + 5; year++) {
      years.push(year);
    }
    
    return years.reverse(); // Más recientes primero
  }

  // Obtener template vacío para nuevos elementos
  getEmptyEducacion() {
    return {
      institucion: '',
      anio_inicio: new Date().getFullYear(),
      anio_finalizacion: new Date().getFullYear(),
      titulo_obtenido: ''
    };
  }

  getEmptyExperiencia() {
    return {
      institucion: '',
      anio_inicio: new Date().getFullYear(),
      anio_finalizacion: new Date().getFullYear(),
      puesto_ejercido: '',
      motivo_retiro: ''
    };
  }

  getEmptyIdioma() {
    return {
      idioma: '',
      nivel: 'básico' as const
    };
  }

  getEmptyCurso() {
    return {
      nombre_reconocimiento: '',
      anio_realizado: new Date().getFullYear(),
      institucion: ''
    };
  }

  getEmptyContacto() {
    return {
      nombre_apellido: '',
      numero_telefonico: '',
      parentesco: 'amigo' as const
    };
  }

  // Crear CV vacío para formularios
  createEmptyCV(): CVFormData {
    return {
      nombre: '',
      educacion: [],
      experiencia_laboral: [],
      idiomas: [],
      cursos_certificaciones_extra: [],
      contactos_referencias: []
    };
  }
}