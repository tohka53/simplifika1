// src/app/cv/cv-list/cv-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CVService } from '../../services/cv.service';
import { AuthService } from '../../services/auth.service';
import { CV } from '../../interfaces/cv.interfaces';

@Component({
  selector: 'app-cv-list',
  standalone: false,
  templateUrl: './cv-list.component.html',
  styleUrls: ['./cv-list.component.css']
})
export class CVListComponent implements OnInit {
  cvs: CV[] = [];
  filteredCVs: CV[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  currentUser: any = null;

  constructor(
    private cvService: CVService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.currentUser = this.authService.getCurrentUser();
    await this.loadCVs();
  }

  async loadCVs(): Promise<void> {
    this.loading = true;
    this.error = '';
    
    try {
      const response = await this.cvService.getUserCVs();
      
      if (response.success && response.data) {
        this.cvs = response.data;
        this.filteredCVs = [...this.cvs];
        console.log('CVs cargados:', this.cvs);
      } else {
        this.error = response.message;
        this.cvs = [];
        this.filteredCVs = [];
      }
    } catch (error) {
      console.error('Error cargando CVs:', error);
      this.error = 'Error al cargar los CVs';
      this.cvs = [];
      this.filteredCVs = [];
    } finally {
      this.loading = false;
    }
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCVs = [...this.cvs];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCVs = this.cvs.filter(cv => 
      cv.nombre.toLowerCase().includes(term)
    );
  }

  createNewCV(): void {
    this.router.navigate(['/cv/crear']);
  }

  editCV(cv: CV): void {
    this.router.navigate(['/cv/editar', cv.id]);
  }

  viewCV(cv: CV): void {
    this.router.navigate(['/cv/ver', cv.id]);
  }

  async deleteCV(cv: CV): Promise<void> {
    const confirmMessage = `¿Está seguro de eliminar el CV "${cv.nombre}"?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await this.cvService.deleteCV(cv.id!);
      
      if (response.success) {
        await this.loadCVs(); // Recargar la lista
        console.log('CV eliminado exitosamente');
      } else {
        this.error = response.message;
        setTimeout(() => this.error = '', 5000);
      }
    } catch (error) {
      console.error('Error eliminando CV:', error);
      this.error = 'Error al eliminar el CV';
      setTimeout(() => this.error = '', 5000);
    }
  }

  downloadCV(cv: CV): void {
    if (cv.cv_pdf_url) {
      window.open(cv.cv_pdf_url, '_blank');
    } else {
      alert('Este CV no tiene archivo PDF asociado');
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getEducationSummary(cv: CV): string {
    if (!cv.educacion || cv.educacion.length === 0) {
      return 'Sin educación registrada';
    }
    
    const titles = cv.educacion.map(edu => edu.titulo_obtenido).slice(0, 2);
    return titles.join(', ') + (cv.educacion.length > 2 ? '...' : '');
  }

  getExperienceSummary(cv: CV): string {
    if (!cv.experiencia_laboral || cv.experiencia_laboral.length === 0) {
      return 'Sin experiencia registrada';
    }
    
    const positions = cv.experiencia_laboral.map(exp => exp.puesto_ejercido).slice(0, 2);
    return positions.join(', ') + (cv.experiencia_laboral.length > 2 ? '...' : '');
  }

  getLanguagesSummary(cv: CV): string {
    if (!cv.idiomas || cv.idiomas.length === 0) {
      return 'Sin idiomas registrados';
    }
    
    const languages = cv.idiomas.map(lang => lang.idioma).slice(0, 3);
    return languages.join(', ') + (cv.idiomas.length > 3 ? '...' : '');
  }

  async refreshCVs(): Promise<void> {
    await this.loadCVs();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  trackByCV(index: number, cv: CV): any {
    return cv.id || index;
  }
}