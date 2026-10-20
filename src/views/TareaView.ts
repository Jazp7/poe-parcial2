import { Tarea, type Prioridad, type FiltroPrioridad, type FiltroEstado } from '../models/Tarea.ts';

export class TareaView {
  // Elementos de formulario
  private formulario: HTMLFormElement;
  private inputTitulo: HTMLInputElement;
  private selectPrioridad: HTMLSelectElement;

  // Elementos de filtros y orden
  private filtroEstado: HTMLSelectElement;
  private filtroPrioridad: HTMLSelectElement;
  private ordenCriterio: HTMLSelectElement;

  // Elementos de lista y estado
  private listaTareas: HTMLUListElement;
  private emptyState: HTMLElement;

  // Estadísticas
  private statTotal: HTMLElement;
  private statPendientes: HTMLElement;
  private statCompletadas: HTMLElement;

  // Modal de confirmación
  private modalConfirmacion: HTMLElement;
  private modalTareaTitulo: HTMLElement;
  private btnModalCancelar: HTMLButtonElement;
  private btnModalConfirmar: HTMLButtonElement;

  // Callback temporal para confirmación de eliminación
  private accionConfirmadaPendiente: (() => void) | null = null;

  constructor(_contenedorId?: string) {
    this.formulario = this.obtenerElemento<HTMLFormElement>('#formulario-tarea');
    this.inputTitulo = this.obtenerElemento<HTMLInputElement>('#input-titulo');
    this.selectPrioridad = this.obtenerElemento<HTMLSelectElement>('#select-prioridad');

    this.filtroEstado = this.obtenerElemento<HTMLSelectElement>('#filtro-estado');
    this.filtroPrioridad = this.obtenerElemento<HTMLSelectElement>('#filtro-prioridad');
    this.ordenCriterio = this.obtenerElemento<HTMLSelectElement>('#orden-criterio');

    this.listaTareas = this.obtenerElemento<HTMLUListElement>('#lista-tareas');
    this.emptyState = this.obtenerElemento<HTMLElement>('#empty-state');

    this.statTotal = this.obtenerElemento<HTMLElement>('#stat-total');
    this.statPendientes = this.obtenerElemento<HTMLElement>('#stat-pendientes');
    this.statCompletadas = this.obtenerElemento<HTMLElement>('#stat-completadas');

    this.modalConfirmacion = this.obtenerElemento<HTMLElement>('#modal-confirmacion');
    this.modalTareaTitulo = this.obtenerElemento<HTMLElement>('#modal-tarea-titulo');
    this.btnModalCancelar = this.obtenerElemento<HTMLButtonElement>('#btn-modal-cancelar');
    this.btnModalConfirmar = this.obtenerElemento<HTMLButtonElement>('#btn-modal-confirmar');

    this.inicializarEventosModal();
  }

  private obtenerElemento<T extends HTMLElement>(selector: string): T {
    const el = document.querySelector(selector);
    if (!el) {
      throw new Error(`Elemento no encontrado en el DOM: ${selector}`);
    }
    return el as T;
  }

  /**
   * Configura el comportamiento de cierre y confirmación del modal.
   */
  private inicializarEventosModal(): void {
    this.btnModalCancelar.addEventListener('click', () => {
      this.ocultarModalConfirmacion();
    });

    this.btnModalConfirmar.addEventListener('click', () => {
      if (this.accionConfirmadaPendiente) {
        this.accionConfirmadaPendiente();
      }
      this.ocultarModalConfirmacion();
    });

    // Cerrar al hacer click en el backdrop
    this.modalConfirmacion.addEventListener('click', (e) => {
      if (e.target === this.modalConfirmacion) {
        this.ocultarModalConfirmacion();
      }
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalConfirmacion.classList.contains('hidden')) {
        this.ocultarModalConfirmacion();
      }
    });
  }

  /**
   * Renderiza la lista de tareas en el DOM con colores según prioridad.
   */
  public renderizarLista(tareas: Tarea[]): void {
    this.listaTareas.innerHTML = '';

    if (tareas.length === 0) {
      this.emptyState.classList.remove('hidden');
      return;
    }

    this.emptyState.classList.add('hidden');

    const fragment = document.createDocumentFragment();

    tareas.forEach((tarea) => {
      const li = document.createElement('li');
      li.className = `task-item prio-border-${tarea.prioridad} ${tarea.completada ? 'completed' : ''}`;
      li.dataset.id = tarea.id;

      li.innerHTML = `
        <div class="task-left">
          <label class="task-checkbox-container" title="${tarea.completada ? 'Marcar como pendiente' : 'Marcar como completada'}">
            <input 
              type="checkbox" 
              class="task-checkbox btn-toggle-estado" 
              data-id="${tarea.id}" 
              ${tarea.completada ? 'checked' : ''} 
            />
          </label>
          <div class="task-content">
            <span class="task-title">${this.escaparHTML(tarea.titulo)}</span>
            <div class="task-meta">
              <span class="priority-badge badge-${tarea.prioridad}">
                ${this.obtenerEtiquetaPrioridad(tarea.prioridad)}
              </span>
              <span class="task-date">📅 ${tarea.formatearFecha()}</span>
            </div>
          </div>
        </div>
        <button 
          type="button" 
          class="btn-delete-task" 
          data-id="${tarea.id}" 
          title="Eliminar tarea"
          aria-label="Eliminar tarea ${this.escaparHTML(tarea.titulo)}"
        >
          🗑️
        </button>
      `;

      fragment.appendChild(li);
    });

    this.listaTareas.appendChild(fragment);
  }

  /**
   * Alias de renderizarLista para compatibilidad directa.
   */
  public renderizar(tareas: Tarea[]): void {
    this.renderizarLista(tareas);
  }

  /**
   * Actualiza el contador de tareas en la barra de estadísticas.
   */
  public actualizarEstadisticas(total: number, pendientes: number, completadas: number): void {
    this.statTotal.textContent = total.toString();
    this.statPendientes.textContent = pendientes.toString();
    this.statCompletadas.textContent = completadas.toString();
  }

  /**
   * Muestra el modal de confirmación antes de eliminar una tarea.
   */
  public mostrarModalConfirmacion(tituloTarea: string, alConfirmar: () => void): void {
    this.modalTareaTitulo.textContent = `"${tituloTarea}"`;
    this.accionConfirmadaPendiente = alConfirmar;
    this.modalConfirmacion.classList.remove('hidden');
    this.btnModalConfirmar.focus();
  }

  /**
   * Oculta el modal de confirmación.
   */
  public ocultarModalConfirmacion(): void {
    this.modalConfirmacion.classList.add('hidden');
    this.accionConfirmadaPendiente = null;
  }

  /**
   * Limpia y resetea el formulario de entrada.
   */
  public limpiarFormulario(): void {
    this.formulario.reset();
    this.selectPrioridad.value = 'media';
    this.inputTitulo.focus();
  }

  /**
   * Vincula el evento de envío del formulario de nueva tarea.
   */
  public vincularAgregarTarea(manejador: (titulo: string, prioridad: Prioridad) => void): void {
    this.formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      const titulo = this.inputTitulo.value;
      const prioridad = this.selectPrioridad.value as Prioridad;
      manejador(titulo, prioridad);
    });
  }

  /**
   * Vincula la acción de alternar el estado de completitud de una tarea.
   */
  public vincularAlternarTarea(manejador: (id: string) => void): void {
    this.listaTareas.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('.btn-toggle-estado')) {
        const id = target.getAttribute('data-id');
        if (id) {
          manejador(id);
        }
      }
    });
  }

  /**
   * Vincula el clic en el botón de eliminar tarea.
   */
  public vincularSolicitarEliminacion(manejador: (id: string) => void): void {
    this.listaTareas.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.btn-delete-task');
      if (btn) {
        const id = btn.getAttribute('data-id');
        if (id) {
          manejador(id);
        }
      }
    });
  }

  /**
   * Vincula el cambio en el selector de filtro por estado.
   */
  public vincularCambioFiltroEstado(manejador: (estado: FiltroEstado) => void): void {
    this.filtroEstado.addEventListener('change', () => {
      manejador(this.filtroEstado.value as FiltroEstado);
    });
  }

  /**
   * Vincula el cambio en el selector de filtro por prioridad.
   */
  public vincularCambioFiltroPrioridad(manejador: (prioridad: FiltroPrioridad) => void): void {
    this.filtroPrioridad.addEventListener('change', () => {
      manejador(this.filtroPrioridad.value as FiltroPrioridad);
    });
  }

  /**
   * Vincula el cambio en el selector de criterio de ordenación.
   */
  public vincularCambioOrden(manejador: (valorOrden: string) => void): void {
    this.ordenCriterio.addEventListener('change', () => {
      manejador(this.ordenCriterio.value);
    });
  }

  private obtenerEtiquetaPrioridad(prioridad: Prioridad): string {
    switch (prioridad) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Media';
      case 'baja':
        return 'Baja';
    }
  }

  private escaparHTML(texto: string): string {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }
}
