// src/app/components/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { 
  RegisterData, 
  getUserTypeConfig,
  USER_TYPE_CONFIGS 
} from '../../interfaces/user.interfaces';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  
  // Tipo de usuario seleccionado
  userType: 'reclutador' | 'candidato' = 'candidato';
  
  user: RegisterData = {
    username: '',
    full_name: '',
    password: '',
    status: 1,
    id_perfil: 2 // Por defecto candidato ✅
  };
  
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar si se pasó el tipo como query parameter desde login
    this.route.queryParams.subscribe(params => {
      if (params['type'] && (params['type'] === 'reclutador' || params['type'] === 'candidato')) {
        this.selectUserType(params['type']);
      }
    });
  }

  /**
   * Selecciona el tipo de usuario y ajusta el perfil
   */
  selectUserType(type: 'reclutador' | 'candidato'): void {
    this.userType = type;
    
    // Ajustar el perfil por defecto según el tipo
    this.user.id_perfil = type === 'reclutador' ? 3 : 2; // 3 = Reclutador, 2 = Candidato ✅
    this.user.userType = type;
    
    // Limpiar mensajes al cambiar tipo
    this.errorMessage = '';
    this.successMessage = '';
    
    console.log('Tipo de registro seleccionado:', type, 'Perfil ID:', this.user.id_perfil);
  }

  async onRegister(): Promise<void> {
    console.log('onRegister llamado para tipo:', this.userType);
    console.log('Datos del formulario:', this.user);

    // Limpiar mensajes previos
    this.errorMessage = '';
    this.successMessage = '';

    // Validaciones
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    console.log('Iniciando proceso de registro...');

    try {
      const result = await this.authService.register(this.user);
      console.log('Resultado del registro:', result);
      
      if (result.success) {
        this.successMessage = `Usuario ${this.userType} creado exitosamente. `;
        
        // Opcional: Auto-login después del registro
        if (result.user) {
          this.successMessage += 'Redirigiendo al login...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        }
      } else {
        console.log('Registro falló:', result.message);
        this.errorMessage = this.getErrorMessage(result.message);
      }
    } catch (error) {
      console.error('Error inesperado en registro:', error);
      this.errorMessage = 'Error inesperado. Intente nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Valida el formulario de registro
   */
  private validateForm(): boolean {
    // Validación de campos requeridos
    if (!this.user.username || !this.user.full_name || !this.user.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor complete todos los campos';
      return false;
    }

    // Validación de contraseñas
    if (this.user.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return false;
    }

    if (this.user.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    // Validación de username
    if (this.user.username.length < 3) {
      this.errorMessage = 'El nombre de usuario debe tener al menos 3 caracteres';
      return false;
    }

    if (this.user.username.includes(' ')) {
      this.errorMessage = 'El nombre de usuario no puede contener espacios';
      return false;
    }

    const usernamePattern = /^[a-zA-Z0-9_.-]+$/;
    if (!usernamePattern.test(this.user.username)) {
      this.errorMessage = 'El nombre de usuario solo puede contener letras, números, guiones, puntos y guiones bajos';
      return false;
    }

    // Validación específica por tipo de usuario
    if (this.userType === 'reclutador') {
      if (!this.user.full_name.includes(' ')) {
        this.errorMessage = 'Para reclutadores, ingrese nombre y apellido completos';
        return false;
      }
    }

    return true;
  }

  /**
   * Personaliza el mensaje de error según el contexto
   */
  private getErrorMessage(originalMessage: string): string {
    const typeLabel = this.userType === 'reclutador' ? 'reclutador' : 'candidato';
    
    if (originalMessage.toLowerCase().includes('already exists') || 
        originalMessage.toLowerCase().includes('ya existe')) {
      return `Ya existe una cuenta ${typeLabel} con este nombre de usuario`;
    }
    
    if (originalMessage.toLowerCase().includes('email')) {
      return `Error con el email para el registro de ${typeLabel}`;
    }
    
    return originalMessage;
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Alterna la visibilidad de la confirmación de contraseña
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Navega de regreso al login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene la configuración del tipo de usuario actual
   */
  getCurrentTypeConfig() {
    return getUserTypeConfig(this.userType);
  }

  /**
   * Obtiene las clases CSS del tema
   */
  getThemeClass(): string {
    return getUserTypeConfig(this.userType).themeClass;
  }

  /**
   * Obtiene el color del tema
   */
  getThemeColor(): string {
    return getUserTypeConfig(this.userType).color;
  }

  /**
   * Obtiene el placeholder para el campo de nombre según el tipo
   */
  getNamePlaceholder(): string {
    return this.userType === 'reclutador' 
      ? 'Nombre completo del reclutador'
      : 'Nombre completo';
  }

  /**
   * Obtiene el placeholder para el username según el tipo
   */
  getUsernamePlaceholder(): string {
    return this.userType === 'reclutador' 
      ? 'Usuario empresarial'
      : 'Nombre de usuario';
  }
}