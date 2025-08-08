// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { 
  LoginCredentials, 
  Profile,
  getUserTypeFromProfile,
  canAccessAsUserType,
  getUserTypeConfig,
  getRedirectUrl,
  USER_TYPE_CONFIGS
} from '../../interfaces/user.interfaces';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // 🆕 Nuevo: Tipo de usuario seleccionado
  userType: 'reclutador' | 'candidato' = 'candidato';
  
  credentials: LoginCredentials = {
    username: '',
    password: ''
  };

  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('LoginComponent inicializado con acceso dual');
  }

  /**
   * 🆕 Selecciona el tipo de usuario (reclutador o candidato)
   */
  selectUserType(type: 'reclutador' | 'candidato'): void {
    this.userType = type;
    this.errorMessage = ''; // Limpiar errores al cambiar tipo
    
    // Limpiar campos para que el usuario ingrese credenciales específicas
    this.credentials = {
      username: '',
      password: ''
    };
    
    console.log('Tipo de usuario seleccionado:', type);
  }

  /**
   * 🔄 Procesa el login según el tipo de usuario seleccionado
   */
  async onLogin(): Promise<void> {
    console.log('onLogin ejecutado para tipo:', this.userType);
    
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Por favor complete todos los campos';
      console.log('Error: Campos vacíos');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      console.log('Intentando login como:', this.userType, 'con usuario:', this.credentials.username);
      
      // 🆕 Agregar el tipo de usuario a las credenciales para validación
      const loginData: LoginCredentials = {
        ...this.credentials,
        userType: this.userType
      };
      
      const result = await this.authService.login(loginData);
      
      if (result.success && result.user) {
        console.log('Login exitoso, redirigiendo...');
        this.redirectUserBasedOnType(result.user);
      } else {
        console.log('Login falló:', result.message);
        this.errorMessage = this.getErrorMessage(result.message);
      }
    } catch (error) {
      console.error('Error inesperado en login:', error);
      this.errorMessage = 'Error inesperado. Intente nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * 🔄 Redirige al usuario según su tipo y permisos validados
   */
  private redirectUserBasedOnType(user: Profile): void {
    if (!user.id_perfil) {
      console.log('Error: Usuario sin perfil, redirigiendo a dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Obtener el tipo real del usuario del perfil
    const actualUserType = getUserTypeFromProfile(user.id_perfil);
    
    // Usar el tipo seleccionado en el UI si es válido, sino el tipo real
    const redirectType = canAccessAsUserType(user.id_perfil, this.userType) 
      ? this.userType 
      : actualUserType;

    const redirectUrl = getRedirectUrl(redirectType as any);
    
    console.log('Redirigiendo usuario:', {
      username: user.username,
      perfil: user.id_perfil,
      tipoSeleccionado: this.userType,
      tipoReal: actualUserType,
      tipoRedirect: redirectType,
      url: redirectUrl
    });

    this.router.navigate([redirectUrl]);
  }

  /**
   * 🔄 Personaliza el mensaje de error según el contexto
   */
  private getErrorMessage(originalMessage: string): string {
    const config = getUserTypeConfig(this.userType);
    
    if (originalMessage.toLowerCase().includes('credenciales') || 
        originalMessage.toLowerCase().includes('incorrect') ||
        originalMessage.toLowerCase().includes('incorrecta')) {
      return `Credenciales incorrectas para acceso de ${this.userType}`;
    }
    
    if (originalMessage.toLowerCase().includes('usuario') || 
        originalMessage.toLowerCase().includes('user')) {
      return `Usuario no encontrado o no disponible para acceso de ${this.userType}`;
    }
    
    return originalMessage;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    console.log('Password visibility toggled:', this.showPassword);
  }

  /**
   * 🔄 Navega al registro según el tipo de usuario
   */
  goToRegister(type?: 'reclutador' | 'candidato'): void {
    const registerType = type || this.userType;
    console.log('goToRegister ejecutado para tipo:', registerType);
    
    try {
      // Pasar el tipo como query parameter para el registro
      this.router.navigate(['/register'], { 
        queryParams: { type: registerType } 
      });
      console.log('Navegación a /register iniciada con tipo:', registerType);
    } catch (error) {
      console.error('Error al navegar a register:', error);
    }
  }

  /**
   * 🆕 Método helper para obtener la configuración actual del tipo de usuario
   */
  getCurrentTypeConfig() {
    return getUserTypeConfig(this.userType);
  }

  /**
   * 🆕 Método helper para obtener clases CSS dinámicas
   */
  getThemeClass(): string {
    return getUserTypeConfig(this.userType).themeClass;
  }

  /**
   * 🆕 Método helper para obtener el color del tema
   */
  getThemeColor(): string {
    return getUserTypeConfig(this.userType).color;
  }

  // Método de prueba para verificar que el componente funciona
  testNavigation(): void {
    console.log('Test navigation button clicked!');
    alert(`¡El botón funciona! Navegando a register como ${this.userType}...`);
    this.goToRegister();
  }
}
