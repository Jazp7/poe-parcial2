import { Tarea, type Prioridad, type FiltroPrioridad, type FiltroEstado } from '../models/Tarea.ts';

export class TareaView {
  // Elementos de formulario
  private formulario: HTMLFormElement;
  private inputTitulo: HTMLInputElement;
  private selectPrioridad: HTMLSelectElement;
  private inputFechaLimite: HTMLInputElement;
  private inputCategoria: HTMLInputElement;
  private encabezadoFormulario: HTMLElement;
  private botonAgregar: HTMLButtonElement;
  private botonCancelarEdicion: HTMLButtonElement;
  private tareaEnEdicion: string | null = null;

  // Elementos de filtros y orden
  private filtroEstado: HTMLSelectElement;
  private filtroPrioridad: HTMLSelectElement;
  private filtroCategoria: HTMLSelectElement;
  private ordenCriterio: HTMLSelectElement;
  private botonNotificaciones: HTMLButtonElement;
  private estadoNotificaciones: HTMLElement;

  // Elementos de lista y estado
  private listaTareas: HTMLUListElement;
  private emptyState: HTMLElement;

  // Estadísticas
  private statTotal: HTMLElement;
  private statPendientes: HTMLElement;
  private statCompletadas: HTMLElement;
  private statAlta: HTMLElement;
  private statMedia: HTMLElement;
  private statBaja: HTMLElement;

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
    this.inputFechaLimite = this.obtenerElemento<HTMLInputElement>('#input-fecha-limite');
    this.inputCategoria = this.obtenerElemento<HTMLInputElement>('#input-categoria');
    this.encabezadoFormulario = this.obtenerElemento<HTMLElement>('#form-heading');
    this.botonAgregar = this.obtenerElemento<HTMLButtonElement>('#btn-agregar');
    this.botonCancelarEdicion = this.obtenerElemento<HTMLButtonElement>('#btn-cancelar-edicion');

    this.filtroEstado = this.obtenerElemento<HTMLSelectElement>('#filtro-estado');
    this.filtroPrioridad = this.obtenerElemento<HTMLSelectElement>('#filtro-prioridad');
    this.filtroCategoria = this.obtenerElemento<HTMLSelectElement>('#filtro-categoria');
    this.ordenCriterio = this.obtenerElemento<HTMLSelectElement>('#orden-criterio');
    this.botonNotificaciones = this.obtenerElemento<HTMLButtonElement>('#btn-notificaciones');
    this.estadoNotificaciones = this.obtenerElemento<HTMLElement>('#notification-status');

    this.listaTareas = this.obtenerElemento<HTMLUListElement>('#lista-tareas');
    this.emptyState = this.obtenerElemento<HTMLElement>('#empty-state');

    this.statTotal = this.obtenerElemento<HTMLElement>('#stat-total');
    this.statPendientes = this.obtenerElemento<HTMLElement>('#stat-pendientes');
    this.statCompletadas = this.obtenerElemento<HTMLElement>('#stat-completadas');
    this.statAlta = this.obtenerElemento<HTMLElement>('#stat-alta');
    this.statMedia = this.obtenerElemento<HTMLElement>('#stat-media');
    this.statBaja = this.obtenerElemento<HTMLElement>('#stat-baja');

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
      li.className = `task-item prio-border-${tarea.prioridad} ${tarea.completada ? 'completed' : ''} ${tarea.vencida ? 'overdue' : ''}`;
      li.dataset.id = tarea.id;

      li.innerHTML = `
        <div class="task-left">
          <label class="task-checkbox-container" title="${tarea.completada ? 'Marcar como pendiente' : 'Marcar como completada'}">
            <input 
              type="checkbox" 
              class="task-checkbox btn-toggle-estado" 
              data-id="${this.escaparAtributo(tarea.id)}"
              ${tarea.completada ? 'checked' : ''} 
            />
          </label>
          <div class="task-content">
            <span class="task-title">${this.escaparHTML(tarea.titulo)}</span>
            <div class="task-meta">
              ${this.renderBadgePrioridad(tarea.prioridad)}
              <span class="task-date">📅 ${tarea.formatearFecha()}</span>
              <span class="task-category">${this.escaparHTML(tarea.categoria)}</span>
              ${tarea.fechaLimite ? this.renderAlertaVencida(tarea) : ''}
            </div>
          </div>
        </div>
        <div class="task-actions">
          <button
            type="button"
            class="btn-edit-task"
            data-id="${this.escaparAtributo(tarea.id)}"
            title="Editar tarea"
            aria-label="Editar tarea ${this.escaparAtributo(tarea.titulo)}"
          >✏️</button>
        <button 
          type="button" 
          class="btn-delete-task" 
          data-id="${this.escaparAtributo(tarea.id)}"
          title="Eliminar tarea"
          aria-label="Eliminar tarea ${this.escaparAtributo(tarea.titulo)}"
        >
          🗑️
        </button>
        </div>
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
  public actualizarEstadisticas(
    total: number,
    pendientes: number,
    completadas: number,
    porPrioridad: Record<Prioridad, number>
  ): void {
    this.statTotal.textContent = total.toString();
    this.statPendientes.textContent = pendientes.toString();
    this.statCompletadas.textContent = completadas.toString();
    this.statAlta.textContent = porPrioridad.alta.toString();
    this.statMedia.textContent = porPrioridad.media.toString();
    this.statBaja.textContent = porPrioridad.baja.toString();
  }

  public renderBadgePrioridad(prioridad: Prioridad): string {
    return `<span class="priority-badge badge-${prioridad}">${this.obtenerEtiquetaPrioridad(prioridad)}</span>`;
  }

  public renderAlertaVencida(tarea: Tarea): string {
    if (!tarea.fechaLimite) {
      return '';
    }
    const fecha = this.escaparHTML(new Date(`${tarea.fechaLimite}T00:00:00`).toLocaleDateString('es-ES'));
    return `<span class="task-deadline ${tarea.vencida ? 'overdue-alert' : ''}">${tarea.vencida ? 'Vencida' : 'Vence'}: ${fecha}</span>`;
  }

  public actualizarCategorias(categorias: string[]): void {
    const categoriaSeleccionada = this.filtroCategoria.value;
    this.filtroCategoria.replaceChildren(new Option('Todas', 'todas'));
    categorias.forEach(categoria => this.filtroCategoria.add(new Option(categoria, categoria)));
    this.filtroCategoria.value = categorias.includes(categoriaSeleccionada) ? categoriaSeleccionada : 'todas';
  }

  public actualizarEstadoNotificaciones(mensaje: string, activadas: boolean): void {
    this.estadoNotificaciones.textContent = mensaje;
    this.botonNotificaciones.textContent = activadas ? 'Notificaciones activas' : 'Activar notificaciones';
    this.botonNotificaciones.disabled = activadas;
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
    this.inputFechaLimite.value = '';
    this.inputCategoria.value = '';
    this.tareaEnEdicion = null;
    this.encabezadoFormulario.textContent = 'Nueva Tarea';
    this.actualizarTextoBotonAgregar('Agregar');
    this.botonCancelarEdicion.classList.add('hidden');
    this.inputTitulo.focus();
  }

  public prepararEdicion(tarea: Tarea): void {
    this.tareaEnEdicion = tarea.id;
    this.inputTitulo.value = tarea.titulo;
    this.selectPrioridad.value = tarea.prioridad;
    this.inputFechaLimite.value = tarea.fechaLimite ?? '';
    this.inputCategoria.value = tarea.categoria === 'General' ? '' : tarea.categoria;
    this.encabezadoFormulario.textContent = 'Editar Tarea';
    this.actualizarTextoBotonAgregar('Guardar cambios');
    this.botonCancelarEdicion.classList.remove('hidden');
    this.inputTitulo.focus();
    this.formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Vincula el evento de envío del formulario de nueva tarea.
   */
  public vincularAgregarTarea(manejador: (
    titulo: string,
    prioridad: Prioridad,
    fechaLimite: string | null,
    categoria: string,
    id: string | null
  ) => void): void {
    this.formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      const titulo = this.inputTitulo.value;
      const prioridad = this.selectPrioridad.value as Prioridad;
      manejador(titulo, prioridad, this.inputFechaLimite.value || null, this.inputCategoria.value, this.tareaEnEdicion);
    });
    this.botonCancelarEdicion.addEventListener('click', () => this.limpiarFormulario());
  }

  public vincularEdicion(manejador: (id: string) => void): void {
    this.listaTareas.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const boton = target.closest('.btn-edit-task');
      const id = boton?.getAttribute('data-id');
      if (id) {
        manejador(id);
      }
    });
  }

  private actualizarTextoBotonAgregar(texto: string): void {
    const etiqueta = this.botonAgregar.querySelector('span:last-child');
    if (!etiqueta) {
      throw new Error('No se encontró la etiqueta del botón de guardar tarea.');
    }
    etiqueta.textContent = texto;
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

  public vincularCambioFiltroCategoria(manejador: (categoria: string) => void): void {
    this.filtroCategoria.addEventListener('change', () => manejador(this.filtroCategoria.value));
  }

  /**
   * Vincula el cambio en el selector de criterio de ordenación.
   */
  public vincularCambioOrden(manejador: (valorOrden: string) => void): void {
    this.ordenCriterio.addEventListener('change', () => {
      manejador(this.ordenCriterio.value);
    });
  }

  public vincularNotificaciones(manejador: () => void): void {
    this.botonNotificaciones.addEventListener('click', manejador);
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

  private escaparAtributo(texto: string): string {
    return this.escaparHTML(texto).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}
