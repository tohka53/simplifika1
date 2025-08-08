// src/app/interfaces/user.interfaces.ts

// ===== INTERFACES EXISTENTES (MANTENER) =====

// Interface principal para el perfil de usuario
export interface Profile {
  id?: number;
  username: string;
  full_name: string;
  password?: string; // Opcional para seguridad
  status: number;
  id_perfil?: number; // Referencia al perfil/rol
  created_at?: string;
  updated_at?: string;
  avatar_url?: string;
  provider?: string;
}

// Interface para credenciales de login - 🆕 EXTENDIDA
export interface LoginCredentials {
  username: string;
  password: string;
  userType?: 'reclutador' | 'candidato'; // 🆕 NUEVO: Tipo de acceso seleccionado en el UI
}

// Interface para el perfil/rol del sistema
export interface UserRole {
  id_perfil: number;
  perfil: string;
  descripcion?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

// Interface para Supabase User (del sistema de auth de Supabase)
export interface SupabaseUser {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  id_perfil?: number;
  provider?: string;
  created_at?: string;
  updated_at?: string;
  status?: number;
}

// Interface para respuesta de autenticación - 🆕 EXTENDIDA
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Profile;
  userType?: 'reclutador' | 'candidato' | 'admin'; // 🆕 NUEVO: Tipo detectado del usuario
  redirectUrl?: string; // 🆕 NUEVO: URL de redirección específica
}

// Interface para datos de registro - 🆕 EXTENDIDA
export interface RegisterData {
  username: string;
  full_name: string;
  password: string;
  status?: number;
  id_perfil?: number;
  userType?: 'reclutador' | 'candidato'; // 🆕 NUEVO: Tipo de registro
}

// Interface para actualización de perfil
export interface ProfileUpdate {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  id_perfil?: number;
  status?: number;
}

// ===== 🆕 NUEVAS INTERFACES PARA EL SISTEMA DUAL =====

// Configuración de tipos de usuario para el UI
export interface UserTypeConfig {
  type: 'reclutador' | 'candidato';
  title: string;
  description: string;
  icon: string;
  color: string;
  themeClass: string;
}

// Mapeo de perfiles a tipos de usuario
export interface ProfileTypeMapping {
  [key: number]: 'reclutador' | 'candidato' | 'admin';
}

// Configuración de redirección por tipo
export interface RedirectConfig {
  reclutador: string;
  candidato: string;
  admin: string;
}

// ===== 🆕 CONSTANTES Y CONFIGURACIONES =====

// Mapeo de ID de perfiles a tipos de usuario ✅ ACTUALIZADO CON TUS PERFILES
export const PROFILE_TYPE_MAP: ProfileTypeMapping = {
  1: 'admin',      // Administrador - puede acceder como cualquiera
  2: 'candidato',  // Usuario/Candidato ✅
  3: 'reclutador', // Supervisor/Reclutador ✅
  4: 'reclutador', // Reclutador adicional (si existe)
  5: 'candidato',  // Candidato adicional (si existe)
  6: 'reclutador'  // Empresa (si existe)
};

// Configuración visual para cada tipo de usuario
export const USER_TYPE_CONFIGS: Record<'reclutador' | 'candidato', UserTypeConfig> = {
  reclutador: {
    type: 'reclutador',
    title: 'Acceso para Reclutadores',
    description: 'Gestiona ofertas laborales, revisa candidatos y programa entrevistas',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    color: 'blue',
    themeClass: 'recruiter-theme'
  },
  candidato: {
    type: 'candidato',
    title: 'Acceso para Candidatos',
    description: 'Crea tu CV, aplica a empleos y gestiona tus postulaciones',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    color: 'green',
    themeClass: 'candidate-theme'
  }
};

// Rutas de redirección después del login
export const LOGIN_REDIRECT_ROUTES: RedirectConfig = {
  reclutador: '/dashboard', // o '/gestionar-empleos' si tienes esa ruta
  candidato: '/dashboard',  // o '/buscar-empleos' si tienes esa ruta
  admin: '/dashboard'
};

// ===== 🆕 FUNCIONES HELPER =====

/**
 * Determina el tipo de usuario basado en el ID del perfil
 */
export function getUserTypeFromProfile(profileId: number): 'reclutador' | 'candidato' | 'admin' {
  return PROFILE_TYPE_MAP[profileId] || 'candidato';
}

/**
 * Verifica si un usuario puede acceder como el tipo especificado
 */
export function canAccessAsUserType(profileId: number, requestedType: 'reclutador' | 'candidato'): boolean {
  const userActualType = getUserTypeFromProfile(profileId);
  
  // Los administradores pueden acceder como cualquier tipo
  if (userActualType === 'admin') {
    return true;
  }
  
  // Para otros usuarios, debe coincidir el tipo
  return userActualType === requestedType;
}

/**
 * Obtiene la configuración visual para un tipo de usuario
 */
export function getUserTypeConfig(type: 'reclutador' | 'candidato'): UserTypeConfig {
  return USER_TYPE_CONFIGS[type];
}

/**
 * Obtiene la URL de redirección para un tipo de usuario
 */
export function getRedirectUrl(userType: 'reclutador' | 'candidato' | 'admin'): string {
  return LOGIN_REDIRECT_ROUTES[userType];
}

/**
 * Verifica si un perfil ID corresponde a un administrador
 */
export function isAdminProfile(profileId: number): boolean {
  return getUserTypeFromProfile(profileId) === 'admin';
}

/**
 * Verifica si un perfil ID corresponde a un reclutador
 */
export function isRecruiterProfile(profileId: number): boolean {
  return getUserTypeFromProfile(profileId) === 'reclutador';
}

/**
 * Verifica si un perfil ID corresponde a un candidato
 */
export function isCandidateProfile(profileId: number): boolean {
  return getUserTypeFromProfile(profileId) === 'candidato';
}

/**
 * Obtiene una descripción amigable del tipo de perfil
 */
export function getProfileDescription(profileId: number): string {
  const type = getUserTypeFromProfile(profileId);
  switch (type) {
    case 'admin':
      return 'Administrador del sistema';
    case 'reclutador':
      return 'Reclutador/Empresa';
    case 'candidato':
      return 'Candidato/Usuario';
    default:
      return 'Usuario';
  }
}

// ===== 🆕 CONSTANTES ÚTILES =====

// IDs de perfiles según tu estructura
export const PROFILE_IDS = {
  ADMIN: 1,
  CANDIDATO: 2, // ✅ Tu perfil de candidatos
  RECLUTADOR: 3 // ✅ Tu perfil de reclutadores
} as const;

// Validadores rápidos
export const VALIDATORS = {
  isAdmin: (profileId?: number) => profileId === PROFILE_IDS.ADMIN,
  isCandidato: (profileId?: number) => profileId === PROFILE_IDS.CANDIDATO,
  isReclutador: (profileId?: number) => profileId === PROFILE_IDS.RECLUTADOR
} as const;