// =============================================
// COMPONENTE CORREGIDO - mis-aplicaciones.component.ts
// =============================================

import { Component, OnInit } from '@angular/core';
import { PostulacionesService } from '../../services/postulaciones.service';
import { AplicacionEmpleo } from '../../interfaces/postulaciones.interface';

@Component({
  selector: 'app-mis-aplicaciones',
  standalone: false,
  templateUrl: './mis-aplicaciones.component.html',
  styleUrls: ['./mis-aplicaciones.component.css']
})
export class MisAplicacionesComponent implements OnInit {
  aplicaciones: AplicacionEmpleo[] = [];
  aplicacionesFiltradas: AplicacionEmpleo[] = [];
  aplicacionSeleccionada: AplicacionEmpleo | null = null;
  cargando = false;
  mostrarDetalle = false;
  
  // Filtros - CORREGIDOS para coincidir con el HTML
  filtros = {
    status: '',
    empleo: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  // Estados para mostrar
  estadisticas = {
    total: 0,
    pendientes: 0,
    revisadas: 0,
    preseleccionadas: 0,
    entrevistas: 0,
    contratadas: 0,
    rechazadas: 0
  };

  // Estados disponibles - AGREGADO para coincidir con HTML
  estados = [
    { valor: '', nombre: 'Todos los estados' },
    { valor: 'pendiente', nombre: 'Pendiente', color: 'yellow' },
    { valor: 'revisado', nombre: 'Revisado', color: 'blue' },
    { valor: 'preseleccionado', nombre: 'Preseleccionado', color: 'green' },
    { valor: 'entrevista', nombre: 'En Entrevista', color: 'purple' },
    { valor: 'contratado', nombre: 'Contratado', color: 'green' },
    { valor: 'rechazado', nombre: 'Rechazado', color: 'red' }
  ];

  constructor(
    private postulacionesService: PostulacionesService
  ) {}

  ngOnInit(): void {
    this.cargarMisAplicaciones();
  }

  cargarMisAplicaciones(): void {
    this.cargando = true;
    this.postulacionesService.getMisAplicaciones().subscribe({
      next: (aplicaciones: AplicacionEmpleo[]) => {
        this.aplicaciones = aplicaciones;
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar aplicaciones:', error);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    let filtradas = [...this.aplicaciones];

    if (this.filtros.status) {
      filtradas = filtradas.filter(app => app.status === this.filtros.status);
    }

    if (this.filtros.empleo) {
      filtradas = filtradas.filter(app => 
        app.empleo_nombre.toLowerCase().includes(this.filtros.empleo.toLowerCase()) ||
        app.empresa_nombre.toLowerCase().includes(this.filtros.empleo.toLowerCase())
      );
    }

    if (this.filtros.fecha_desde) {
      filtradas = filtradas.filter(app => 
        new Date(app.fecha_aplicacion) >= new Date(this.filtros.fecha_desde)
      );
    }

    if (this.filtros.fecha_hasta) {
      filtradas = filtradas.filter(app => 
        new Date(app.fecha_aplicacion) <= new Date(this.filtros.fecha_hasta)
      );
    }

    this.aplicacionesFiltradas = filtradas;
  }

  limpiarFiltros(): void {
    this.filtros = {
      status: '',
      empleo: '',
      fecha_desde: '',
      fecha_hasta: ''
    };
    this.aplicarFiltros();
  }

  calcularEstadisticas(): void {
    this.estadisticas = {
      total: this.aplicaciones.length,
      pendientes: this.aplicaciones.filter(a => a.status === 'pendiente').length,
      revisadas: this.aplicaciones.filter(a => a.status === 'revisado').length,
      preseleccionadas: this.aplicaciones.filter(a => a.status === 'preseleccionado').length,
      entrevistas: this.aplicaciones.filter(a => a.status === 'entrevista').length,
      contratadas: this.aplicaciones.filter(a => a.status === 'contratado').length,
      rechazadas: this.aplicaciones.filter(a => a.status === 'rechazado').length
    };
  }

  // MÉTODOS AGREGADOS para coincidir con el HTML
  contarPorEstado(status: string): number {
    return this.aplicaciones.filter(a => a.status === status).length;
  }

  verDetalle(aplicacion: AplicacionEmpleo): void {
    this.aplicacionSeleccionada = aplicacion;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.aplicacionSeleccionada = null;
  }

  obtenerColorEstado(status: string): string {
    const estado = this.estados.find(e => e.valor === status);
    const color = estado?.color || 'gray';
    return `bg-${color}-100 text-${color}-800 border-${color}-200`;
  }

  retirarAplicacion(aplicacionId: number): void {
    if (!confirm('¿Estás seguro de que deseas retirar esta aplicación?')) {
      return;
    }

    this.cargando = true;
    this.postulacionesService.retirarAplicacion(aplicacionId).subscribe({
      next: (response: {success: boolean, message: string}) => {
        if (response.success) {
          alert(response.message);
          this.cargarMisAplicaciones();
        } else {
          alert(response.message);
        }
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al retirar aplicación:', error);
        alert('Error al retirar la aplicación');
        this.cargando = false;
      }
    });
  }

  getStatusColor(status: string): string {
    return this.postulacionesService.getStatusColor(status);
  }

  getStatusDescription(status: string): string {
    return this.postulacionesService.getStatusDescription(status);
  }

  formatearSalario(salario: any): string {
    return this.postulacionesService.formatearSalario(salario);
  }

  puedeRetirar(aplicacion: AplicacionEmpleo): boolean {
    // No se puede retirar si ya está contratado o rechazado
    return !['contratado', 'rechazado', 'retirada'].includes(aplicacion.status);
  }
}