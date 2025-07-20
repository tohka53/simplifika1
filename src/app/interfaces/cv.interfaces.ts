// src/app/interfaces/cv.interfaces.ts

// Interface principal del CV
export interface CV {
  id?: number;
  id_profile?: number;
  nombre: string;
  cv_pdf_url?: string;
  educacion: Educacion[];
  experiencia_laboral: ExperienciaLaboral[];
  idiomas: Idioma[];
  cursos_certificaciones_extra: CursoCertificacion[];
  contactos_referencias: ContactoReferencia[];
  status?: number;
  created_at?: string;
  updated_at?: string;
}

// Interface para educación
export interface Educacion {
  institucion: string;
  anio_inicio: number;
  anio_finalizacion: number;
  titulo_obtenido: string;
}

// Interface para experiencia laboral
export interface ExperienciaLaboral {
  institucion: string;
  anio_inicio: number;
  anio_finalizacion: number;
  puesto_ejercido: string;
  motivo_retiro: string;
}

// Interface para idiomas
export interface Idioma {
  idioma: string;
  nivel: NivelIdioma;
}

export type NivelIdioma = 'básico' | 'intermedio' | 'avanzado' | 'materno';

// Interface para cursos y certificaciones
export interface CursoCertificacion {
  nombre_reconocimiento: string;
  anio_realizado: number;
  institucion: string;
}

// Interface para contactos y referencias
export interface ContactoReferencia {
  nombre_apellido: string;
  numero_telefonico: string;
  parentesco: TipoParentesco;
}

export type TipoParentesco = 'padre' | 'madre' | 'hermano' | 'hermana' | 'amigo' | 'familiar' | 'supervisora' | 'supervisor' | 'colega' | 'otro';

// Interface para crear/actualizar CV
export interface CVFormData {
  nombre: string;
  cv_pdf_url?: string;
  educacion: Educacion[];
  experiencia_laboral: ExperienciaLaboral[];
  idiomas: Idioma[];
  cursos_certificaciones_extra: CursoCertificacion[];
  contactos_referencias: ContactoReferencia[];
}

// Interface para respuesta de la API
export interface CVResponse {
  success: boolean;
  message: string;
  data?: CV;
}

// Interface para listado de CVs
export interface CVListResponse {
  success: boolean;
  message: string;
  data?: CV[];
}

// Interface para estadísticas de CV
export interface CVStats {
  total_cvs: number;
  cvs_activos: number;
  cvs_inactivos: number;
  ultimo_cv_actualizado?: string;
}

// Interface para búsqueda de CVs
export interface CVSearchCriteria {
  nombre?: string;
  titulo_educacion?: string;
  puesto_experiencia?: string;
  idioma?: string;
  status?: number;
}

// Interface para vista de búsqueda
export interface CVSearchResult {
  id: number;
  nombre: string;
  username: string;
  full_name: string;
  titulos_educacion: string;
  puestos_experiencia: string;
  idiomas_disponibles: string;
  created_at: string;
  updated_at: string;
}

// Constantes para validaciones
export const CV_CONSTANTS = {
  MAX_NOMBRE_LENGTH: 255,
  MIN_ANIO: 1950,
  MAX_ANIO: new Date().getFullYear() + 10,
  NIVELES_IDIOMA: ['básico', 'intermedio', 'avanzado', 'materno'] as const,
  TIPOS_PARENTESCO: [
    'padre', 'madre', 'hermano', 'hermana', 'amigo', 
    'familiar', 'supervisora', 'supervisor', 'colega', 'otro'
  ] as const,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  // ✅ SOLUCIÓN: Cambiar el tipo de ALLOWED_FILE_TYPES
  ALLOWED_FILE_TYPES: ['application/pdf'], // Quitar 'as const' para flexibilidad
  // O alternativamente:
  // ALLOWED_FILE_TYPES: ['application/pdf'] as string[]
};

// Interface para validación de formularios
export interface CVValidationError {
  field: string;
  message: string;
  section?: string;
  index?: number;
}

export interface CVValidationResult {
  isValid: boolean;
  errors: CVValidationError[];
}