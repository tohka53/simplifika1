// =============================================
// COMPONENTE CORREGIDO - buscar-empleos.component.ts
// =============================================

import { Component, OnInit } from '@angular/core';
import { PostulacionesService } from '../../services/postulaciones.service';
import { EmpleoPublico, CrearAplicacion, CVUsuario, FiltrosEmpleos } from '../../interfaces/postulaciones.interface';

@Component({
  selector: 'app-buscar-empleos',
  standalone: false,
  templateUrl: './buscar-empleos.component.html',
  styleUrls: ['./buscar-empleos.component.css']
})
export class BuscarEmpleosComponent implements OnInit {
  empleos: EmpleoPublico[] = [];
  empleoSeleccionado: any = null;
  mostrarModalAplicacion = false;
  mostrarDetalleEmpleo = false;
  cargando = false;
  total = 0;
  paginaActual = 1;
  limite = 12;

  misCVs: CVUsuario[] = [];
  
  filtros: FiltrosEmpleos = {
    categoria: '',
    modalidad: '',
    experiencia: '',
    busqueda: ''
  };

  categorias = [
    { valor: 'informatica', nombre: 'Informática' },
    { valor: 'ventas', nombre: 'Ventas' },
    { valor: 'administracion', nombre: 'Administración' },
    { valor: 'telecomunicaciones', nombre: 'Telecomunicaciones' },
    { valor: 'marketing', nombre: 'Marketing' },
    { valor: 'recursos_humanos', nombre: 'Recursos Humanos' },
    { valor: 'contabilidad', nombre: 'Contabilidad' },
    { valor: 'ingenieria', nombre: 'Ingeniería' }
  ];

  modalidades = [
    { valor: 'remoto', nombre: 'Remoto' },
    { valor: 'presencial', nombre: 'Presencial' },
    { valor: 'hibrido', nombre: 'Híbrido' }
  ];

  experiencias = [
    { valor: 'sin_experiencia', nombre: 'Sin experiencia' },
    { valor: '0-1 años', nombre: '0-1 años' },
    { valor: '1-3 años', nombre: '1-3 años' },
    { valor: '3-5 años', nombre: '3-5 años' },
    { valor: '5+ años', nombre: '5+ años' }
  ];

  aplicacion: CrearAplicacion = {
    empleo_id: 0,
    cv_id: 0,
    carta_presentacion: '',
    salario_esperado: undefined,
    disponibilidad_inicio: undefined,
    notas_candidato: ''
  };

  constructor(
    private postulacionesService: PostulacionesService
  ) {}

  ngOnInit(): void {
    this.cargarEmpleos();
    this.cargarMisCVs();
  }

  cargarMisCVs(): void {
    this.postulacionesService.getMisCVs().subscribe({
      next: (cvs: CVUsuario[]) => {
        this.misCVs = cvs;
        const cvActivo = cvs.find((cv: CVUsuario) => cv.activo);
        if (cvActivo) {
          this.aplicacion.cv_id = cvActivo.id;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar CVs:', error);
      }
    });
  }

  cargarEmpleos(): void {
    this.cargando = true;
    const filtrosLimpios = { 
      ...this.filtros, 
      limite: this.limite, 
      pagina: this.paginaActual 
    };
    
    Object.keys(filtrosLimpios).forEach(key => {
      if (!filtrosLimpios[key as keyof typeof filtrosLimpios]) {
        delete filtrosLimpios[key as keyof typeof filtrosLimpios];
      }
    });

    this.postulacionesService.getEmpleosPublicos(filtrosLimpios).subscribe({
      next: (response: {empleos: EmpleoPublico[], total: number}) => {
        this.empleos = response.empleos;
        this.total = response.total;
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar empleos:', error);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarEmpleos();
  }

  limpiarFiltros(): void {
    this.filtros = {
      categoria: '',
      modalidad: '',
      experiencia: '',
      busqueda: ''
    };
    this.aplicarFiltros();
  }

  verDetalle(empleo: EmpleoPublico): void {
    this.postulacionesService.getDetalleEmpleo(empleo.id).subscribe({
      next: (detalle: EmpleoPublico | null) => {
        this.empleoSeleccionado = detalle;
        this.mostrarDetalleEmpleo = true;
      },
      error: (error: any) => {
        console.error('Error al cargar detalle:', error);
      }
    });
  }

  abrirModalAplicacion(empleo: EmpleoPublico): void {
    if (this.misCVs.length === 0) {
      alert('Debes crear un CV primero para poder aplicar a empleos');
      return;
    }

    this.empleoSeleccionado = empleo;
    this.aplicacion = {
      empleo_id: empleo.id,
      cv_id: this.misCVs.find(cv => cv.activo)?.id || this.misCVs[0]?.id || 0,
      carta_presentacion: '',
      salario_esperado: undefined,
      disponibilidad_inicio: undefined,
      notas_candidato: ''
    };
    this.mostrarModalAplicacion = true;
  }

  cerrarModalAplicacion(): void {
    this.mostrarModalAplicacion = false;
    this.empleoSeleccionado = null;
  }

  cerrarDetalleEmpleo(): void {
    this.mostrarDetalleEmpleo = false;
    this.empleoSeleccionado = null;
  }

  enviarAplicacion(): void {
    if (!this.aplicacion.carta_presentacion.trim()) {
      alert('La carta de presentación es requerida');
      return;
    }

    if (!this.aplicacion.cv_id) {
      alert('Debes seleccionar un CV para aplicar');
      return;
    }

    this.cargando = true;
    
    this.postulacionesService.aplicarAEmpleo(this.aplicacion).subscribe({
      next: (response: {success: boolean, message: string}) => {
        if (response.success) {
          alert(response.message);
          this.cerrarModalAplicacion();
          this.cargarEmpleos();
        } else {
          alert(response.message);
        }
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al enviar aplicación:', error);
        alert('Error al enviar la aplicación');
        this.cargando = false;
      }
    });
  }

  onCVSeleccionado(cvId: number): void {
    this.aplicacion.cv_id = cvId;
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.cargarEmpleos();
  }

  formatearSalario(salario: any): string {
    return this.postulacionesService.formatearSalario(salario);
  }

  obtenerModalidades(lugar_trabajo: any): string {
    return this.postulacionesService.obtenerModalidades(lugar_trabajo);
  }

  getTotalPaginas(): number {
    return Math.ceil(this.total / this.limite);
  }

  getPaginasArray(): number[] {
    const totalPaginas = this.getTotalPaginas();
    return Array.from({length: totalPaginas}, (_, i) => i + 1);
  }
}