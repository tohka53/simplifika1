// =============================================
// COMPONENTE CORREGIDO - revisar-candidatos.component.ts
// =============================================

import { Component, OnInit } from '@angular/core';
import { PostulacionesService } from '../../services/postulaciones.service';
import { AplicacionEmpleo, ActualizarEstadoAplicacion } from '../../interfaces/postulaciones.interface';

@Component({
  selector: 'app-revisar-candidatos',
  standalone: false,
  templateUrl: './revisar-candidatos.component.html',
  styleUrls: ['./revisar-candidatos.component.css']
})
export class RevisarCandidatosComponent implements OnInit {
  aplicaciones: AplicacionEmpleo[] = [];
  aplicacionSeleccionada: AplicacionEmpleo | null = null;
  cargando = false;
  mostrarDetalle = false;
  mostrarModalEstado = false;

  // Filtros
  filtros = {
    empleo_id: '',
    status: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  // Estados disponibles
  estados = [
    { valor: 'pendiente', nombre: 'Pendiente', color: 'yellow' },
    { valor: 'revisado', nombre: 'Revisado', color: 'blue' },
    { valor: 'preseleccionado', nombre: 'Preseleccionado', color: 'green' },
    { valor: 'entrevista', nombre: 'En Entrevista', color: 'purple' },
    { valor: 'contratado', nombre: 'Contratado', color: 'green' },
    { valor: 'rechazado', nombre: 'Rechazado', color: 'red' }
  ];

  // Datos para actualizar estado
  actualizacionEstado: ActualizarEstadoAplicacion = {
    status: '',
    notas_rrhh: '',
    puntuacion_rrhh: undefined,
    comentario: ''
  };

  constructor(
    private postulacionesService: PostulacionesService
  ) {}

  ngOnInit(): void {
    this.cargarAplicaciones();
  }

  cargarAplicaciones(): void {
    this.cargando = true;
    const filtrosLimpios = { ...this.filtros };
    
    Object.keys(filtrosLimpios).forEach(key => {
      if (!filtrosLimpios[key as keyof typeof filtrosLimpios]) {
        delete filtrosLimpios[key as keyof typeof filtrosLimpios];
      }
    });

    this.postulacionesService.getAplicacionesPorEmpresa(filtrosLimpios).subscribe({
      next: (aplicaciones: AplicacionEmpleo[]) => {
        this.aplicaciones = aplicaciones;
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar aplicaciones:', error);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarAplicaciones();
  }

  limpiarFiltros(): void {
    this.filtros = {
      empleo_id: '',
      status: '',
      fecha_desde: '',
      fecha_hasta: ''
    };
    this.cargarAplicaciones();
  }

  verDetalleCandidato(aplicacion: AplicacionEmpleo): void {
    this.postulacionesService.getDetalleAplicacion(aplicacion.id).subscribe({
      next: (detalle: AplicacionEmpleo | null) => {
        this.aplicacionSeleccionada = detalle;
        this.mostrarDetalle = true;
      },
      error: (error: any) => {
        console.error('Error al cargar detalle:', error);
      }
    });
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.aplicacionSeleccionada = null;
  }

  abrirModalEstado(aplicacion: AplicacionEmpleo): void {
    this.aplicacionSeleccionada = aplicacion;
    this.actualizacionEstado = {
      status: aplicacion.status,
      notas_rrhh: aplicacion.notas_rrhh || '',
      puntuacion_rrhh: aplicacion.puntuacion_rrhh,
      comentario: ''
    };
    this.mostrarModalEstado = true;
  }

  cerrarModalEstado(): void {
    this.mostrarModalEstado = false;
    this.aplicacionSeleccionada = null;
  }

  actualizarEstado(): void {
    if (!this.aplicacionSeleccionada) return;

    this.cargando = true;
    this.postulacionesService.actualizarEstadoAplicacion(
      this.aplicacionSeleccionada.id,
      this.actualizacionEstado
    ).subscribe({
      next: (response: {success: boolean, message: string}) => {
        if (response.success) {
          alert(response.message);
          this.cerrarModalEstado();
          this.cargarAplicaciones();
        } else {
          alert(response.message);
        }
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar el estado');
        this.cargando = false;
      }
    });
  }

  obtenerColorEstado(status: string): string {
    const estado = this.estados.find(e => e.valor === status);
    const color = estado?.color || 'gray';
    return `bg-${color}-100 text-${color}-800 border-${color}-200`;
  }

  contarPorEstado(status: string): number {
    return this.aplicaciones.filter(a => a.status === status).length;
  }

  getStatusDescription(status: string): string {
    return this.postulacionesService.getStatusDescription(status);
  }

  formatearSalario(salario: any): string {
    return this.postulacionesService.formatearSalario(salario);
  }
}