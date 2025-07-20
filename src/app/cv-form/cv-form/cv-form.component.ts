// src/app/cv/cv-form/cv-form.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CVService } from '../../services/cv.service';
import { AuthService } from '../../services/auth.service';
import { 
  CVFormData, 
  Educacion, 
  ExperienciaLaboral, 
  Idioma, 
  CursoCertificacion, 
  ContactoReferencia,
  CV_CONSTANTS,
  NivelIdioma,
  TipoParentesco
} from '../../interfaces/cv.interfaces';

@Component({
  selector: 'app-cv-form',
  standalone: false,
  templateUrl: './cv-form.component.html',
  styleUrls: ['./cv-form.component.css']
})
export class CVFormComponent implements OnInit {
  cvForm: CVFormData;
  loading = false;
  error = '';
  successMessage = '';
  isEditMode = false;
  cvId: number | null = null;
  currentUser: any = null;

  // Constantes para los selects
  nivelesIdioma: NivelIdioma[] = [...CV_CONSTANTS.NIVELES_IDIOMA];
  tiposParentesco: TipoParentesco[] = [...CV_CONSTANTS.TIPOS_PARENTESCO];
  availableYears: number[] = [];

  // File upload
  selectedFile: File | null = null;
  uploadingFile = false;

  constructor(
    private cvService: CVService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.cvForm = this.cvService.createEmptyCV();
    this.availableYears = this.cvService.getAvailableYears();
  }

  async ngOnInit(): Promise<void> {
    this.currentUser = this.authService.getCurrentUser();
    
    // Verificar si estamos en modo edición
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.cvId = parseInt(id);
      await this.loadCV();
    }
  }

  async loadCV(): Promise<void> {
    if (!this.cvId) return;

    this.loading = true;
    this.error = '';

    try {
      const response = await this.cvService.getCVById(this.cvId);
      
      if (response.success && response.data) {
        this.cvForm = {
          nombre: response.data.nombre,
          cv_pdf_url: response.data.cv_pdf_url,
          educacion: response.data.educacion || [],
          experiencia_laboral: response.data.experiencia_laboral || [],
          idiomas: response.data.idiomas || [],
          cursos_certificaciones_extra: response.data.cursos_certificaciones_extra || [],
          contactos_referencias: response.data.contactos_referencias || []
        };
      } else {
        this.error = response.message;
      }
    } catch (error) {
      console.error('Error cargando CV:', error);
      this.error = 'Error al cargar el CV';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    try {
      let response;
      
      if (this.isEditMode && this.cvId) {
        response = await this.cvService.updateCV(this.cvId, this.cvForm);
      } else {
        response = await this.cvService.createCV(this.cvForm);
      }

      if (response.success) {
        this.successMessage = response.message;
        setTimeout(() => {
          this.router.navigate(['/cv/mis-cvs']);
        }, 2000);
      } else {
        this.error = response.message;
      }
    } catch (error) {
      console.error('Error guardando CV:', error);
      this.error = 'Error inesperado al guardar el CV';
    } finally {
      this.loading = false;
    }
  }

  // ================================
  // MÉTODOS PARA EDUCACIÓN
  // ================================

  addEducacion(): void {
    this.cvForm.educacion.push(this.cvService.getEmptyEducacion());
  }

  removeEducacion(index: number): void {
    if (confirm('¿Está seguro de eliminar esta educación?')) {
      this.cvForm.educacion.splice(index, 1);
    }
  }

  // ================================
  // MÉTODOS PARA EXPERIENCIA LABORAL
  // ================================

  addExperiencia(): void {
    this.cvForm.experiencia_laboral.push(this.cvService.getEmptyExperiencia());
  }

  removeExperiencia(index: number): void {
    if (confirm('¿Está seguro de eliminar esta experiencia laboral?')) {
      this.cvForm.experiencia_laboral.splice(index, 1);
    }
  }

  // ================================
  // MÉTODOS PARA IDIOMAS
  // ================================

  addIdioma(): void {
    this.cvForm.idiomas.push(this.cvService.getEmptyIdioma());
  }

  removeIdioma(index: number): void {
    if (confirm('¿Está seguro de eliminar este idioma?')) {
      this.cvForm.idiomas.splice(index, 1);
    }
  }

  // ================================
  // MÉTODOS PARA CURSOS Y CERTIFICACIONES
  // ================================

  addCurso(): void {
    this.cvForm.cursos_certificaciones_extra.push(this.cvService.getEmptyCurso());
  }

  removeCurso(index: number): void {
    if (confirm('¿Está seguro de eliminar este curso/certificación?')) {
      this.cvForm.cursos_certificaciones_extra.splice(index, 1);
    }
  }

  // ================================
  // MÉTODOS PARA CONTACTOS Y REFERENCIAS
  // ================================

  addContacto(): void {
    this.cvForm.contactos_referencias.push(this.cvService.getEmptyContacto());
  }

  removeContacto(index: number): void {
    if (confirm('¿Está seguro de eliminar este contacto de referencia?')) {
      this.cvForm.contactos_referencias.splice(index, 1);
    }
  }

  // ================================
  // MÉTODOS PARA ARCHIVOS
  // ================================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar archivo
      if (file.size > CV_CONSTANTS.MAX_FILE_SIZE) {
        this.error = `El archivo es demasiado grande. Máximo ${CV_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB.`;
        return;
      }

      if (!CV_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type)) {
        this.error = 'Solo se permiten archivos PDF.';
        return;
      }

      this.selectedFile = file;
      this.error = '';
    }
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile) return;

    this.uploadingFile = true;
    this.error = '';

    try {
      const response = await this.cvService.uploadCVFile(this.selectedFile);
      
      if (response.success && response.url) {
        this.cvForm.cv_pdf_url = response.url;
        this.selectedFile = null;
        this.successMessage = 'Archivo subido exitosamente';
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.error = response.message;
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      this.error = 'Error al subir el archivo';
    } finally {
      this.uploadingFile = false;
    }
  }

  async removeFile(): Promise<void> {
    if (!this.cvForm.cv_pdf_url) return;

    if (confirm('¿Está seguro de eliminar el archivo PDF?')) {
      try {
        await this.cvService.deleteCVFile(this.cvForm.cv_pdf_url);
        this.cvForm.cv_pdf_url = undefined;
        this.successMessage = 'Archivo eliminado exitosamente';
        setTimeout(() => this.successMessage = '', 3000);
      } catch (error) {
        console.error('Error eliminando archivo:', error);
        this.error = 'Error al eliminar el archivo';
      }
    }
  }

  // ================================
  // MÉTODOS DE UTILIDAD
  // ================================

  cancel(): void {
    if (confirm('¿Está seguro de cancelar? Se perderán los cambios no guardados.')) {
      this.router.navigate(['/cv/mis-cvs']);
    }
  }

  getPageTitle(): string {
    return this.isEditMode ? 'Editar CV' : 'Crear Nuevo CV';
  }

  getSubmitButtonText(): string {
    if (this.loading) {
      return this.isEditMode ? 'Actualizando...' : 'Creando...';
    }
    return this.isEditMode ? 'Actualizar CV' : 'Crear CV';
  }

  // Método para capitalizar primera letra
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Validación de años
  validateYears(startYear: number, endYear: number): boolean {
    return endYear >= startYear;
  }

  // Método para trackBy en ngFor
  trackByIndex(index: number): number {
    return index;
  }
}