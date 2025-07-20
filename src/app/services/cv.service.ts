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

  async createCV(cvData: CVFormData): Promise<CVResponse> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        return { success: false, message: 'Usuario no autenticado' };
      }

      // Validar datos
      const validation = this.validateCV(cvData);
      if (!validation.isValid) {
        return { 
          success: false, 
          message: 'Datos inválidos: ' + validation.errors.map(e => e.message).join(', ')
        };
      }

      // Preparar datos para insertar
      const dataToInsert = {
        id_profile: currentUser.id,
        nombre: cvData.nombre,
        cv_pdf_url: cvData.cv_pdf_url || null,
        educacion: JSON.stringify(cvData.educacion),
        experiencia_laboral: JSON.stringify(cvData.experiencia_laboral),
        idiomas: JSON.stringify(cvData.idiomas),
        cursos_certificaciones_extra: JSON.stringify(cvData.cursos_certificaciones_extra),
        contactos_referencias: JSON.stringify(cvData.contactos_referencias)
      };

      console.log('Creando CV:', dataToInsert);

      const result = await this.supabaseService.insertData('cv', dataToInsert);
      
      if (result && result.length > 0) {
        const createdCV = this.parseCV(result[0]);
        return { 
          success: true, 
          message: 'CV creado exitosamente',
          data: createdCV
        };
      } else {
        return { success: false, message: 'Error al crear el CV' };
      }

    } catch (error) {
      console.error('Error creando CV:', error);
      return { success: false, message: 'Error inesperado al crear CV' };
    }
  }

  async updateCV(id: number, cvData: CVFormData): Promise<CVResponse> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        return { success: false, message: 'Usuario no autenticado' };
      }

      // Verificar que el CV pertenece al usuario
      const existingCV = await this.getCVById(id);
      if (!existingCV.success || !existingCV.data) {
        return { success: false, message: 'CV no encontrado' };
      }

      if (existingCV.data.id_profile !== currentUser.id) {
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

      // Preparar datos para actualizar
      const dataToUpdate = {
        nombre: cvData.nombre,
        cv_pdf_url: cvData.cv_pdf_url || null,
        educacion: JSON.stringify(cvData.educacion),
        experiencia_laboral: JSON.stringify(cvData.experiencia_laboral),
        idiomas: JSON.stringify(cvData.idiomas),
        cursos_certificaciones_extra: JSON.stringify(cvData.cursos_certificaciones_extra),
        contactos_referencias: JSON.stringify(cvData.contactos_referencias)
      };

      console.log('Actualizando CV:', id, dataToUpdate);

      const result = await this.supabaseService.updateData('cv', id.toString(), dataToUpdate);
      
      if (result && result.length > 0) {
        const updatedCV = this.parseCV(result[0]);
        return { 
          success: true, 
          message: 'CV actualizado exitosamente',
          data: updatedCV
        };
      } else {
        return { success: false, message: 'Error al actualizar el CV' };
      }

    } catch (error) {
      console.error('Error actualizando CV:', error);
      return { success: false, message: 'Error inesperado al actualizar CV' };
    }
  }

  async deleteCV(id: number): Promise<CVResponse> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        return { success: false, message: 'Usuario no autenticado' };
      }

      // Verificar que el CV pertenece al usuario
      const existingCV = await this.getCVById(id);
      if (!existingCV.success || !existingCV.data) {
        return { success: false, message: 'CV no encontrado' };
      }

      if (existingCV.data.id_profile !== currentUser.id) {
        return { success: false, message: 'No tienes permisos para eliminar este CV' };
      }

      // Cambiar status a 0 (eliminación lógica)
      const result = await this.supabaseService.updateData('cv', id.toString(), { status: 0 });
      
      if (result) {
        return { 
          success: true, 
          message: 'CV eliminado exitosamente'
        };
      } else {
        return { success: false, message: 'Error al eliminar el CV' };
      }

    } catch (error) {
      console.error('Error eliminando CV:', error);
      return { success: false, message: 'Error inesperado al eliminar CV' };
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

  validateCV(cvData: CVFormData): CVValidationResult {
    const errors: CVValidationError[] = [];

    // Validar nombre
    if (!cvData.nombre || cvData.nombre.trim().length === 0) {
      errors.push({ field: 'nombre', message: 'El nombre del CV es requerido' });
    } else if (cvData.nombre.length > CV_CONSTANTS.MAX_NOMBRE_LENGTH) {
      errors.push({ 
        field: 'nombre', 
        message: `El nombre no puede exceder ${CV_CONSTANTS.MAX_NOMBRE_LENGTH} caracteres` 
      });
    }

    // Validar educación
    cvData.educacion.forEach((edu, index) => {
      if (!edu.institucion?.trim()) {
        errors.push({ 
          field: 'institucion', 
          message: 'La institución es requerida',
          section: 'educacion',
          index 
        });
      }
      if (!edu.titulo_obtenido?.trim()) {
        errors.push({ 
          field: 'titulo_obtenido', 
          message: 'El título obtenido es requerido',
          section: 'educacion',
          index 
        });
      }
      if (edu.anio_inicio < CV_CONSTANTS.MIN_ANIO || edu.anio_inicio > CV_CONSTANTS.MAX_ANIO) {
        errors.push({ 
          field: 'anio_inicio', 
          message: `Año de inicio inválido (${CV_CONSTANTS.MIN_ANIO}-${CV_CONSTANTS.MAX_ANIO})`,
          section: 'educacion',
          index 
        });
      }
      if (edu.anio_finalizacion < edu.anio_inicio) {
        errors.push({ 
          field: 'anio_finalizacion', 
          message: 'El año de finalización debe ser mayor al año de inicio',
          section: 'educacion',
          index 
        });
      }
    });

    // Validar experiencia laboral
    cvData.experiencia_laboral.forEach((exp, index) => {
      if (!exp.institucion?.trim()) {
        errors.push({ 
          field: 'institucion', 
          message: 'La institución es requerida',
          section: 'experiencia_laboral',
          index 
        });
      }
      if (!exp.puesto_ejercido?.trim()) {
        errors.push({ 
          field: 'puesto_ejercido', 
          message: 'El puesto ejercido es requerido',
          section: 'experiencia_laboral',
          index 
        });
      }
      if (exp.anio_finalizacion < exp.anio_inicio) {
        errors.push({ 
          field: 'anio_finalizacion', 
          message: 'El año de finalización debe ser mayor al año de inicio',
          section: 'experiencia_laboral',
          index 
        });
      }
    });

    // Validar idiomas
    cvData.idiomas.forEach((idioma, index) => {
      if (!idioma.idioma?.trim()) {
        errors.push({ 
          field: 'idioma', 
          message: 'El idioma es requerido',
          section: 'idiomas',
          index 
        });
      }
      if (!CV_CONSTANTS.NIVELES_IDIOMA.includes(idioma.nivel)) {
        errors.push({ 
          field: 'nivel', 
          message: 'Nivel de idioma inválido',
          section: 'idiomas',
          index 
        });
      }
    });

    // Validar cursos y certificaciones
    cvData.cursos_certificaciones_extra.forEach((curso, index) => {
      if (!curso.nombre_reconocimiento?.trim()) {
        errors.push({ 
          field: 'nombre_reconocimiento', 
          message: 'El nombre del reconocimiento es requerido',
          section: 'cursos_certificaciones_extra',
          index 
        });
      }
      if (!curso.institucion?.trim()) {
        errors.push({ 
          field: 'institucion', 
          message: 'La institución es requerida',
          section: 'cursos_certificaciones_extra',
          index 
        });
      }
    });

    // Validar contactos y referencias
    cvData.contactos_referencias.forEach((contacto, index) => {
      if (!contacto.nombre_apellido?.trim()) {
        errors.push({ 
          field: 'nombre_apellido', 
          message: 'El nombre y apellido es requerido',
          section: 'contactos_referencias',
          index 
        });
      }
      if (!contacto.numero_telefonico?.trim()) {
        errors.push({ 
          field: 'numero_telefonico', 
          message: 'El número telefónico es requerido',
          section: 'contactos_referencias',
          index 
        });
      }
      if (!CV_CONSTANTS.TIPOS_PARENTESCO.includes(contacto.parentesco)) {
        errors.push({ 
          field: 'parentesco', 
          message: 'Tipo de parentesco inválido',
          section: 'contactos_referencias',
          index 
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

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