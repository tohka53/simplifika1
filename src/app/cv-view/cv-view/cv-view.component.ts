// src/app/cv/cv-view/cv-view.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CVService } from '../../services/cv.service';
import { CV } from '../../interfaces/cv.interfaces';

@Component({
  selector: 'app-cv-view',
  standalone: false,
  templateUrl: './cv-view.component.html',
  styleUrls: ['./cv-view.component.css']
})
export class CVViewComponent implements OnInit {
  cv: CV | null = null;
  loading = true;
  error = '';
  cvId: number;

  constructor(
    private cvService: CVService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.cvId = parseInt(this.route.snapshot.params['id']);
  }

  async ngOnInit(): Promise<void> {
    await this.loadCV();
  }

  async loadCV(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const response = await this.cvService.getCVById(this.cvId);
      
      if (response.success && response.data) {
        this.cv = response.data;
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

  editCV(): void {
    this.router.navigate(['/cv/editar', this.cvId]);
  }

  goBack(): void {
    this.router.navigate(['/cv/mis-cvs']);
  }

  downloadPDF(): void {
    if (this.cv?.cv_pdf_url) {
      window.open(this.cv.cv_pdf_url, '_blank');
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
