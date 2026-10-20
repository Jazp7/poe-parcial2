import { Tarea, type Prioridad, type FiltroPrioridad, type FiltroEstado } from '../models/Tarea.ts';
import { TareaModel } from '../models/TareaModel.ts';
import { TareaView } from '../views/TareaView.ts';
import { StorageService } from '../services/StorageService.ts';

export type CriterioOrdenSeleccionado =
  | 'fecha-desc'
  | 'fecha-asc'
  | 'prioridad-desc'
  | 'prioridad-asc'
  | 'fechaLimite-asc'
  | 'fechaLimite-desc'
  | 'titulo-asc'
  | 'titulo-desc';

export class TareaController {
  private readonly model = new TareaModel();
  private filtroEstado: FiltroEstado = 'todas';
  private filtroPrioridad: FiltroPrioridad = 'todas';
  private filtroCategoria = 'todas';
  private criterioOrden: CriterioOrdenSeleccionado = 'fecha-desc';
  constructor(
    private view: TareaView,
    private storageService: StorageService
  ) {}

  /**
   * Inicializa el controlador: carga datos guardados, vincula eventos de la vista y actualiza el DOM.
   */
  public inicializar(): void {
    this.model.establecerTareas(this.storageService.obtenerTareas());
    this.configurarManejadoresVista();
    this.actualizarVista();
    this.view.actualizarEstadoNotificaciones('Activa las notificaciones para recibir avisos de tareas próximas a vencer.', false);
  }

  /**
   * Conecta los eventos de la vista con la lógica de negocio del controlador.
   */
  private configurarManejadoresVista(): void {
    // Formulario para agregar tarea
    this.view.vincularAgregarTarea((titulo, prioridad, fechaLimite, categoria, id) => {
      if (id) {
        this.handleUpdate(id, titulo, prioridad, fechaLimite, categoria);
      } else {
        this.agregarTarea(titulo, prioridad, fechaLimite, categoria);
      }
    });

    this.view.vincularEdicion(id => this.handleEdit(id));
    this.view.vincularNotificaciones(() => void this.activarNotificaciones());

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

    this.view.vincularCambioFiltroCategoria(categoria => {
      this.filtroCategoria = categoria;
      this.actualizarVista();
    });

    // Selector de ordenamiento
    this.view.vincularCambioOrden((criterio: string) => {
      this.cambiarCriterioOrden(criterio as CriterioOrdenSeleccionado);
    });
  }

  /**
   * Crea y almacena una nueva tarea.
   */
  public agregarTarea(
    titulo: string,
    prioridad: Prioridad,
    fechaLimite: string | null = null,
    categoria: string = 'General'
  ): void {
    try {
      const nuevaTarea = Tarea.crear(titulo, prioridad, fechaLimite, categoria);
      this.model.agregarTarea(nuevaTarea);
      this.persistirCambios();
      this.view.limpiarFormulario();
      this.actualizarVista();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        console.error('Error inesperado al crear la tarea:', error);
      }
    }
  }

  /**
   * Alterna el estado completado/pendiente de una tarea existente.
   */
  public alternarCompletada(id: string): void {
    const tarea = this.model.obtenerTarea(id);
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
    const tarea = this.model.obtenerTarea(id);
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
    this.deleteTarea(id);
  }

  public deleteTarea(id: string): void {
    if (!this.model.deleteTarea(id)) {
      return;
    }
    this.persistirCambios();
    this.actualizarVista();
  }

  public handleEdit(id: string): void {
    const tarea = this.model.obtenerTarea(id);
    if (tarea) {
      this.view.prepararEdicion(tarea);
    }
  }

  public handleUpdate(
    id: string,
    titulo: string,
    prioridad: Prioridad,
    fechaLimite: string | null,
    categoria: string
  ): void {
    this.updateTarea(id, titulo, prioridad, fechaLimite, categoria);
  }

  public updateTarea(
    id: string,
    titulo: string,
    prioridad: Prioridad,
    fechaLimite: string | null,
    categoria: string
  ): void {
    try {
      if (!this.model.updateTarea(id, titulo, prioridad, fechaLimite, categoria)) {
        return;
      }
      this.persistirCambios();
      this.view.limpiarFormulario();
      this.actualizarVista();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        console.error('Error inesperado al actualizar la tarea:', error);
      }
    }
  }

  public getTareasVencidas(): Tarea[] {
    return this.model.getTareasVencidas();
  }

  public getContadorPorPrioridad(): Record<Prioridad, number> {
    return this.model.getContadorPorPrioridad();
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
   * Aplica los filtros combinados y el orden seleccionado sobre las tareas.
   */
  public obtenerTareasProcesadas(): Tarea[] {
    // 1. Filtrado
    const filtradas = this.model.obtenerTareas().filter(tarea => {
      // Filtro de estado
      const cumpleEstado =
        this.filtroEstado === 'todas' ||
        (this.filtroEstado === 'pendientes' && !tarea.completada) ||
        (this.filtroEstado === 'completadas' && tarea.completada);

      // Filtro de prioridad
      const cumplePrioridad =
        this.filtroPrioridad === 'todas' ||
        tarea.prioridad === this.filtroPrioridad;

      const cumpleCategoria =
        this.filtroCategoria === 'todas' ||
        tarea.categoria === this.filtroCategoria;

      return cumpleEstado && cumplePrioridad && cumpleCategoria;
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
        case 'fechaLimite-asc':
          return this.compararFechasLimite(a, b, 'asc');
        case 'fechaLimite-desc':
          return this.compararFechasLimite(a, b, 'desc');
        case 'titulo-asc':
          return a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' });
        case 'titulo-desc':
          return b.titulo.localeCompare(a.titulo, 'es', { sensitivity: 'base' });
        default:
          return 0;
      }
    });
  }

  private compararFechasLimite(a: Tarea, b: Tarea, direccion: 'asc' | 'desc'): number {
    if (!a.fechaLimite) return b.fechaLimite ? 1 : 0;
    if (!b.fechaLimite) return -1;
    if (a.fechaLimite === b.fechaLimite) {
      return a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' });
    }
    const comparacion = a.fechaLimite.localeCompare(b.fechaLimite);
    return direccion === 'asc' ? comparacion : -comparacion;
  }

  private async activarNotificaciones(): Promise<void> {
    if (!('Notification' in window)) {
      this.view.actualizarEstadoNotificaciones('Este navegador no admite notificaciones.', false);
      return;
    }
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        this.view.actualizarEstadoNotificaciones(
          permiso === 'denied' ? 'Permiso denegado. Puedes habilitarlo desde la configuración del navegador.' : 'No se concedió permiso para notificaciones.',
          false
        );
        return;
      }
      this.view.actualizarEstadoNotificaciones('Notificaciones activas para tareas que vencen hoy o mañana.', true);
      this.revisarTareasProximasAVencer();
      window.setInterval(() => this.revisarTareasProximasAVencer(), 60_000);
    } catch (error) {
      console.error('No se pudo activar las notificaciones del navegador:', error);
      this.view.actualizarEstadoNotificaciones('No se pudieron activar las notificaciones.', false);
    }
  }

  private revisarTareasProximasAVencer(): void {
    if (Notification.permission !== 'granted') {
      return;
    }
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    for (const tarea of this.model.obtenerTareas()) {
      if (!tarea.fechaLimite || tarea.completada) continue;
      const [anio, mes, dia] = tarea.fechaLimite.split('-').map(Number);
      const fechaLimite = new Date(anio, mes - 1, dia);
      const diasRestantes = Math.round((fechaLimite.getTime() - hoy.getTime()) / 86_400_000);
      if (diasRestantes < 0 || diasRestantes > 1) continue;

      const claveAviso = `gestor_tareas_aviso_${tarea.id}_${tarea.fechaLimite}`;
      try {
        if (localStorage.getItem(claveAviso)) continue;
        new Notification(`Tarea próxima a vencer: ${tarea.titulo}`, {
          body: diasRestantes === 0 ? 'Vence hoy.' : 'Vence mañana.',
          tag: claveAviso
        });
        localStorage.setItem(claveAviso, '1');
      } catch (error) {
        console.error(`No se pudo notificar la tarea "${tarea.titulo}":`, error);
      }
    }
  }

  /**
   * Sincroniza la lista completa de tareas con localStorage.
   */
  private persistirCambios(): void {
    this.storageService.guardarTareas(this.model.obtenerTareas());
  }

  /**
   * Refresca las estadísticas generales y renderiza las tareas procesadas en la vista.
   */
  private actualizarVista(): void {
    const tareas = this.model.obtenerTareas();
    const total = tareas.length;
    const pendientes = tareas.filter(t => !t.completada).length;
    const completadas = total - pendientes;

    this.view.actualizarEstadisticas(total, pendientes, completadas, this.getContadorPorPrioridad());
    this.view.actualizarCategorias([...new Set(tareas.map(tarea => tarea.categoria))].sort((a, b) => a.localeCompare(b, 'es')));

    const tareasAMostrar = this.obtenerTareasProcesadas();
    this.view.renderizarLista(tareasAMostrar);
  }
}
