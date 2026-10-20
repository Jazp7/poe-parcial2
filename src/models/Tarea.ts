export type Prioridad = 'alta' | 'media' | 'baja';
export type CriterioOrden = 'prioridad' | 'fecha' | 'fechaLimite' | 'titulo';
export type DireccionOrden = 'asc' | 'desc';
export type FiltroPrioridad = 'todas' | Prioridad;
export type FiltroEstado = 'todas' | 'pendientes' | 'completadas';

export interface ITarea {
  id: string;
  titulo: string;
  prioridad: Prioridad;
  completada: boolean;
  fecha: string; // Formato ISO 8601
  fechaLimite: string | null;
  categoria: string;
}

export class Tarea implements ITarea {
  public id: string;
  public titulo: string;
  public prioridad: Prioridad;
  public completada: boolean;
  public fecha: string;
  public fechaLimite: string | null;
  public categoria: string;

  constructor(
    id: string,
    titulo: string,
    prioridad: Prioridad,
    completada: boolean = false,
    fecha: string = new Date().toISOString(),
    fechaLimite: string | null = null,
    categoria: string = 'General'
  ) {
    this.id = id;
    this.titulo = titulo.trim();
    this.prioridad = prioridad;
    this.completada = completada;
    this.fecha = fecha;
    this.fechaLimite = fechaLimite;
    this.categoria = categoria.trim() || 'General';
  }

  /**
   * Crea una nueva instancia de Tarea validando sus campos obligatorios.
   */
  public static crear(
    titulo: string,
    prioridad: Prioridad,
    fechaLimite: string | null = null,
    categoria: string = 'General'
  ): Tarea {
    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) {
      throw new Error('El título de la tarea no puede estar vacío.');
    }
    if (!['alta', 'media', 'baja'].includes(prioridad)) {
      throw new Error('Selecciona una prioridad válida.');
    }
    if (fechaLimite && !Tarea.esFechaValida(fechaLimite)) {
      throw new Error('La fecha límite no es válida.');
    }
    if (categoria.trim().length > 40) {
      throw new Error('La categoría no puede superar los 40 caracteres.');
    }

    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tarea_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Tarea(id, tituloLimpio, prioridad, false, new Date().toISOString(), fechaLimite, categoria);
  }

  private static esFechaValida(fecha: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return false;
    }
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaParseada = new Date(Date.UTC(anio, mes - 1, dia));
    return fechaParseada.getUTCFullYear() === anio &&
      fechaParseada.getUTCMonth() === mes - 1 &&
      fechaParseada.getUTCDate() === dia;
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
    const fechaLimite = typeof obj.fechaLimite === 'string' && Tarea.esFechaValida(obj.fechaLimite)
      ? obj.fechaLimite
      : null;
    const categoria = typeof obj.categoria === 'string' && obj.categoria.trim()
      ? obj.categoria.trim()
      : 'General';

    return new Tarea(id, titulo, prioridad, completada, fecha, fechaLimite, categoria);
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

  public get vencida(): boolean {
    if (this.completada || !this.fechaLimite) {
      return false;
    }
    const hoy = new Date();
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    return this.fechaLimite < fechaHoy;
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
      fecha: this.fecha,
      fechaLimite: this.fechaLimite,
      categoria: this.categoria
    };
  }
}
