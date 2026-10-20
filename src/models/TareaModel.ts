import { Tarea, type Prioridad } from './Tarea.ts';

export class TareaModel {
  private tareas: Tarea[] = [];

  public establecerTareas(tareas: Tarea[]): void {
    this.tareas = tareas;
  }

  public obtenerTareas(): Tarea[] {
    return [...this.tareas];
  }

  public obtenerTarea(id: string): Tarea | undefined {
    return this.tareas.find(tarea => tarea.id === id);
  }

  public agregarTarea(tarea: Tarea): void {
    this.tareas.unshift(tarea);
  }

  public updateTarea(
    id: string,
    titulo: string,
    prioridad: Prioridad,
    fechaLimite: string | null,
    categoria: string
  ): boolean {
    const tarea = this.obtenerTarea(id);
    if (!tarea) {
      return false;
    }

    const actualizada = Tarea.crear(titulo, prioridad, fechaLimite, categoria);
    tarea.titulo = actualizada.titulo;
    tarea.prioridad = actualizada.prioridad;
    tarea.fechaLimite = actualizada.fechaLimite;
    tarea.categoria = actualizada.categoria;
    return true;
  }

  public deleteTarea(id: string): boolean {
    const cantidadAnterior = this.tareas.length;
    this.tareas = this.tareas.filter(tarea => tarea.id !== id);
    return this.tareas.length !== cantidadAnterior;
  }

  public getTareasVencidas(): Tarea[] {
    return this.tareas.filter(tarea => tarea.vencida);
  }

  public getContadorPorPrioridad(): Record<Prioridad, number> {
    return this.tareas.reduce<Record<Prioridad, number>>((contador, tarea) => {
      contador[tarea.prioridad] += 1;
      return contador;
    }, { alta: 0, media: 0, baja: 0 });
  }
}
