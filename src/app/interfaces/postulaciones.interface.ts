// =============================================
// INTERFACES CORREGIDAS - postulaciones.interface.ts
// =============================================

export interface EmpleoPublico {
  id: number;
  nombre: string;
  empresa_nombre: string;
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
  fecha_creacion: string;
  fecha_fin_publicacion: string;
  dias_restantes: number;
  numero_vacantes: number;
  urgencia: string;
  descripcion?: {
    descripcion: string;
    requisitos: string[];
    beneficios: string[];
    habilidades: string[];
    idiomas: string[];
  };
}

export interface CVUsuario {
  id: number;
  nombre: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
  educacion?: any;
  experiencia_laboral?: any;
  idiomas?: any;
  cursos_certificaciones_extra?: any;
  contactos_referencias?: any;
}

export interface CrearAplicacion {
  empleo_id: number;
  cv_id: number;
  carta_presentacion: string;
  salario_esperado?: number;
  disponibilidad_inicio?: string;
  notas_candidato?: string;
}

// INTERFAZ CORREGIDA CON TODAS LAS PROPIEDADES
export interface AplicacionEmpleo {
  id: number;
  fecha_aplicacion: string;
  status: string;
  status_descripcion: string;
  cv_id: number;
  carta_presentacion: string;
  salario_esperado?: number;
  disponibilidad_inicio?: string;
  notas_candidato?: string;
  notas_rrhh?: string;
  puntuacion_rrhh?: number;
  fecha_revision?: string;
  dias_desde_aplicacion: number;
  tiene_entrevista_pendiente: boolean;
  
  // Información del candidato
  candidato_id: number;
  candidato_username: string;
  candidato_nombre: string;
  candidato_email?: string;        // AGREGADO
  candidato_telefono?: string;     // AGREGADO
  candidato_foto?: string;         // AGREGADO
  
  // Información del CV
  cv_nombre: string;
  cv_educacion?: any;              // AGREGADO
  cv_experiencia?: any;            // AGREGADO  
  cv_idiomas?: any;                // AGREGADO
  cv_cursos?: any;                 // AGREGADO
  cv_referencias?: any;            // AGREGADO
  
  // Información del empleo
  empleo_id: number;
  empleo_nombre: string;
  empleo_categoria: string;
  empleo_salario: any;
  jornada_laboral: string;
  tipo_contrato: string;
  urgencia: string;
  fecha_fin_publicacion: string;
  
  // Información de la empresa
  empresa_nombre: string;
  empresa_sector: string;
  empresa_email: string;
  
  // Información del revisor
  revisado_por_nombre?: string;
}

export interface FiltrosEmpleos {
  categoria?: string;
  modalidad?: string;
  experiencia?: string;
  busqueda?: string;
  limite?: number;
  pagina?: number;
}

export interface ActualizarEstadoAplicacion {
  status: string;
  notas_rrhh?: string;
  puntuacion_rrhh?: number;
  comentario?: string;
}