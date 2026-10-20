export type Prioridad = 'alta' | 'media' | 'baja';
export type CriterioOrden = 'prioridad' | 'fecha';
export type DireccionOrden = 'asc' | 'desc';
export type FiltroPrioridad = 'todas' | Prioridad;
export type FiltroEstado = 'todas' | 'pendientes' | 'completadas';

export interface ITarea {
  id: string;
  titulo: string;
  prioridad: Prioridad;
  completada: boolean;
  fecha: string; // Formato ISO 8601
}

export class Tarea implements ITarea {
  public id: string;
  public titulo: string;
  public prioridad: Prioridad;
  public completada: boolean;
  public fecha: string;

  constructor(
    id: string,
    titulo: string,
    prioridad: Prioridad,
    completada: boolean = false,
    fecha: string = new Date().toISOString()
  ) {
    this.id = id;
    this.titulo = titulo.trim();
    this.prioridad = prioridad;
    this.completada = completada;
    this.fecha = fecha;
  }

  /**
   * Crea una nueva instancia de Tarea validando sus campos obligatorios.
   */
  public static crear(titulo: string, prioridad: Prioridad): Tarea {
    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) {
      throw new Error('El título de la tarea no puede estar vacío.');
    }

    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tarea_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Tarea(id, tituloLimpio, prioridad, false, new Date().toISOString());
  }

  /**
   * Reconstruye una instancia de Tarea a partir de un objeto plano deserializado de JSON.
   */
  public static desdeObjeto(obj: Partial<ITarea>): Tarea {
    const id = obj.id || `tarea_${Date.now()}`;
    const titulo = obj.titulo || 'Sin título';
    const prioridad: Prioridad = (obj.prioridad === 'alta' || obj.prioridad === 'media' || obj.prioridad === 'baja')
      ? obj.prioridad
      : 'media';
    const completada = Boolean(obj.completada);
    const fecha = obj.fecha || new Date().toISOString();

    return new Tarea(id, titulo, prioridad, completada, fecha);
  }

  /**
   * Obtiene el valor numérico ponderado de la prioridad para facilitar ordenamientos.
   * alta: 3, media: 2, baja: 1
   */
  public static obtenerPesoPrioridad(prioridad: Prioridad): number {
    switch (prioridad) {
      case 'alta':
        return 3;
      case 'media':
        return 2;
      case 'baja':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Peso numérico de la prioridad de esta tarea.
   */
  public get pesoPrioridad(): number {
    return Tarea.obtenerPesoPrioridad(this.prioridad);
  }

  /**
   * Alterna el estado de completitud de la tarea.
   */
  public alternarEstado(): void {
    this.completada = !this.completada;
  }

  /**
   * Retorna una representación legible de la fecha de creación en formato local.
   */
  public formatearFecha(): string {
    try {
      const date = new Date(this.fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return this.fecha;
    }
  }

  /**
   * Serializa la instancia a un objeto plano compatible con ITarea.
   */
  public aJSON(): ITarea {
    return {
      id: this.id,
      titulo: this.titulo,
      prioridad: this.prioridad,
      completada: this.completada,
      fecha: this.fecha
    };
  }
}
