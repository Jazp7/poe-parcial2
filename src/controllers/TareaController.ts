import { Tarea, type Prioridad, type FiltroPrioridad, type FiltroEstado } from '../models/Tarea.ts';
import { TareaView } from '../views/TareaView.ts';
import { StorageService } from '../services/StorageService.ts';

export type CriterioOrdenSeleccionado = 'fecha-desc' | 'fecha-asc' | 'prioridad-desc' | 'prioridad-asc';

export class TareaController {
  private tareas: Tarea[] = [];
  private filtroEstado: FiltroEstado = 'todas';
  private filtroPrioridad: FiltroPrioridad = 'todas';
  private criterioOrden: CriterioOrdenSeleccionado = 'fecha-desc';

  constructor(
    private view: TareaView,
    private storageService: StorageService
  ) {}

  /**
   * Inicializa el controlador: carga datos guardados, vincula eventos de la vista y actualiza el DOM.
   */
  public inicializar(): void {
    this.tareas = this.storageService.obtenerTareas();
    this.configurarManejadoresVista();
    this.actualizarVista();
  }

  /**
   * Conecta los eventos de la vista con la lógica de negocio del controlador.
   */
  private configurarManejadoresVista(): void {
    // Formulario para agregar tarea
    this.view.vincularAgregarTarea((titulo: string, prioridad: Prioridad) => {
      this.agregarTarea(titulo, prioridad);
    });

    // Checkbox para alternar completado
    this.view.vincularAlternarTarea((id: string) => {
      this.alternarCompletada(id);
    });

    // Botón para solicitar eliminación (abre modal)
    this.view.vincularSolicitarEliminacion((id: string) => {
      this.solicitarEliminarTarea(id);
    });

    // Filtro por estado (todas, pendientes, completadas)
    this.view.vincularCambioFiltroEstado((estado: FiltroEstado) => {
      this.cambiarFiltroEstado(estado);
    });

    // Filtro por prioridad (todas, alta, media, baja)
    this.view.vincularCambioFiltroPrioridad((prioridad: FiltroPrioridad) => {
      this.cambiarFiltroPrioridad(prioridad);
    });

    // Selector de ordenamiento
    this.view.vincularCambioOrden((criterio: string) => {
      this.cambiarCriterioOrden(criterio as CriterioOrdenSeleccionado);
    });
  }

  /**
   * Crea y almacena una nueva tarea.
   */
  public agregarTarea(titulo: string, prioridad: Prioridad): void {
    try {
      const nuevaTarea = Tarea.crear(titulo, prioridad);
      this.tareas.unshift(nuevaTarea);
      this.persistirCambios();
      this.view.limpiarFormulario();
      this.actualizarVista();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /**
   * Alterna el estado completado/pendiente de una tarea existente.
   */
  public alternarCompletada(id: string): void {
    const tarea = this.tareas.find(t => t.id === id);
    if (tarea) {
      tarea.alternarEstado();
      this.persistirCambios();
      this.actualizarVista();
    }
  }

  /**
   * Abre el modal de confirmación antes de borrar una tarea.
   */
  public solicitarEliminarTarea(id: string): void {
    const tarea = this.tareas.find(t => t.id === id);
    if (tarea) {
      this.view.mostrarModalConfirmacion(tarea.titulo, () => {
        this.confirmarEliminarTarea(id);
      });
    }
  }

  /**
   * Ejecuta la eliminación tras la confirmación en el modal.
   */
  public confirmarEliminarTarea(id: string): void {
    this.tareas = this.tareas.filter(t => t.id !== id);
    this.persistirCambios();
    this.actualizarVista();
  }

  /**
   * Actualiza el filtro por estado.
   */
  public cambiarFiltroEstado(estado: FiltroEstado): void {
    this.filtroEstado = estado;
    this.actualizarVista();
  }

  /**
   * Actualiza el filtro por prioridad.
   */
  public cambiarFiltroPrioridad(prioridad: FiltroPrioridad): void {
    this.filtroPrioridad = prioridad;
    this.actualizarVista();
  }

  /**
   * Actualiza el criterio de ordenamiento seleccionado.
   */
  public cambiarCriterioOrden(criterio: CriterioOrdenSeleccionado): void {
    this.criterioOrden = criterio;
    this.actualizarVista();
  }

  /**
   * Aplica los filtros combinados (estado y prioridad) y el orden seleccionado sobre las tareas.
   */
  public obtenerTareasProcesadas(): Tarea[] {
    // 1. Filtrado
    const filtradas = this.tareas.filter(tarea => {
      // Filtro de estado
      const cumpleEstado =
        this.filtroEstado === 'todas' ||
        (this.filtroEstado === 'pendientes' && !tarea.completada) ||
        (this.filtroEstado === 'completadas' && tarea.completada);

      // Filtro de prioridad
      const cumplePrioridad =
        this.filtroPrioridad === 'todas' ||
        tarea.prioridad === this.filtroPrioridad;

      return cumpleEstado && cumplePrioridad;
    });

    // 2. Ordenamiento
    return filtradas.sort((a, b) => {
      switch (this.criterioOrden) {
        case 'fecha-desc':
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        case 'fecha-asc':
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        case 'prioridad-desc': {
          const difPrioridad = b.pesoPrioridad - a.pesoPrioridad;
          if (difPrioridad !== 0) return difPrioridad;
          // En caso de empate, más reciente primero
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        }
        case 'prioridad-asc': {
          const difPrioridad = a.pesoPrioridad - b.pesoPrioridad;
          if (difPrioridad !== 0) return difPrioridad;
          // En caso de empate, más reciente primero
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        }
        default:
          return 0;
      }
    });
  }

  /**
   * Sincroniza la lista completa de tareas con localStorage.
   */
  private persistirCambios(): void {
    this.storageService.guardarTareas(this.tareas);
  }

  /**
   * Refresca las estadísticas generales y renderiza las tareas procesadas en la vista.
   */
  private actualizarVista(): void {
    const total = this.tareas.length;
    const pendientes = this.tareas.filter(t => !t.completada).length;
    const completadas = total - pendientes;

    this.view.actualizarEstadisticas(total, pendientes, completadas);

    const tareasAMostrar = this.obtenerTareasProcesadas();
    this.view.renderizarLista(tareasAMostrar);
  }
}
