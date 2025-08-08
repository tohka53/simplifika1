// src/app/config/user-types.config.ts
import { DualAccessConfig, UserTypeInfo } from '../interfaces/user.interfaces';

export const USER_TYPES_CONFIG: DualAccessConfig = {
  reclutador: {
    type: 'reclutador',
    title: 'Acceso para Reclutadores',
    description: 'Gestiona ofertas laborales, revisa candidatos y programa entrevistas',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    color: 'blue',
    features: [
      'Publicar ofertas de empleo',
      'Revisar candidatos y CVs',
      'Programar entrevistas',
      'Gestionar proceso de selección',
      'Reportes de reclutamiento',
      'Comunicación con candidatos'
    ]
  },
  candidato: {
    type: 'candidato',
    title: 'Acceso para Candidatos',
    description: 'Crea tu CV, aplica a empleos y gestiona tus postulaciones',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    color: 'green',
    features: [
      'Crear y gestionar CV',
      'Buscar ofertas de empleo',
      'Aplicar a posiciones',
      'Seguimiento de postulaciones',
      'Agenda de entrevistas',
      'Perfil profesional'
    ]
  },
  defaultType: 'candidato'
};

// Configuración de colores por tipo
export const USER_TYPE_COLORS = {
  reclutador: {
    primary: 'blue-600',
    secondary: 'blue-50',
    border: 'blue-200',
    text: 'blue-800',
    hover: 'blue-700'
  },
  candidato: {
    primary: 'green-600',
    secondary: 'green-50',
    border: 'green-200',
    text: 'green-800',
    hover: 'green-700'
  }
};

// Rutas de redirección por tipo de usuario
export const REDIRECT_ROUTES = {
  reclutador: {
    dashboard: '/dashboard',
    afterLogin: '/gestionar-empleos',
    register: '/register?type=reclutador'
  },
  candidato: {
    dashboard: '/dashboard',
    afterLogin: '/buscar-empleos',
    register: '/register?type=candidato'
  }
};

// Perfiles permitidos por tipo de usuario
export const ALLOWED_PROFILES = {
  reclutador: [1, 3, 4, 6], // Admin, Supervisor, Reclutador, Empresa
  candidato: [2, 5] // Usuario, Candidato
};

// Mensajes personalizados por tipo
export const USER_TYPE_MESSAGES = {
  reclutador: {
    welcome: '¡Bienvenido al panel de reclutamiento!',
    loginPlaceholder: 'Usuario del reclutador',
    loginButton: 'Ingresar como Reclutador',
    registerButton: 'Registro Empresas',
    noPermissions: 'Su cuenta no tiene permisos de reclutador',
    loginError: 'Credenciales incorrectas para acceso de reclutador'
  },
  candidato: {
    welcome: '¡Bienvenido a tu búsqueda laboral!',
    loginPlaceholder: 'Usuario del candidato',
    loginButton: 'Ingresar como Candidato',
    registerButton: 'Registro Candidatos',
    noPermissions: 'Su cuenta no tiene permisos de candidato',
    loginError: 'Credenciales incorrectas para acceso de candidato'
  }
};

// Función helper para obtener la configuración de un tipo de usuario
export function getUserTypeConfig(type: 'reclutador' | 'candidato'): UserTypeInfo {
  return USER_TYPES_CONFIG[type];
}

// Función helper para verificar si un perfil es válido para un tipo de usuario
export function isValidProfileForUserType(profileId: number, userType: 'reclutador' | 'candidato'): boolean {
  return ALLOWED_PROFILES[userType].includes(profileId);
}

// Función helper para obtener la ruta de redirección
export function getRedirectRoute(userType: 'reclutador' | 'candidato', routeType: 'dashboard' | 'afterLogin' | 'register'): string {
  return REDIRECT_ROUTES[userType][routeType];
}

// Función helper para obtener mensajes personalizados
export function getUserTypeMessage(userType: 'reclutador' | 'candidato', messageType: keyof typeof USER_TYPE_MESSAGES.reclutador): string {
  return USER_TYPE_MESSAGES[userType][messageType];
}