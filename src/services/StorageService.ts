import { Tarea, type ITarea } from '../models/Tarea.ts';

export class StorageService {
  private readonly claveAlmacenamiento: string;

  constructor(clave: string = 'gestor_tareas_prioridad_data') {
    this.claveAlmacenamiento = clave;
  }

  /**
   * Guarda la colección de tareas en localStorage.
   * Retorna true si la operación fue exitosa, false en caso de error.
   */
  public guardarTareas(tareas: Tarea[]): boolean {
    try {
      const serializado = JSON.stringify(tareas.map(t => t.aJSON()));
      localStorage.setItem(this.claveAlmacenamiento, serializado);
      return true;
    } catch (error) {
      console.error('Error al guardar las tareas en localStorage:', error);
      return false;
    }
  }

  /**
   * Obtiene la colección de tareas almacenadas en localStorage.
   * Retorna una lista de instancias de Tarea.
   */
  public obtenerTareas(): Tarea[] {
    try {
      const datosCrudos = localStorage.getItem(this.claveAlmacenamiento);
      if (!datosCrudos) {
        return [];
      }

      const lista = JSON.parse(datosCrudos) as Partial<ITarea>[];
      if (!Array.isArray(lista)) {
        return [];
      }

      return lista.map(item => Tarea.desdeObjeto(item));
    } catch (error) {
      console.error('Error al leer o parsear las tareas de localStorage:', error);
      return [];
    }
  }

  /**
   * Elimina los datos persistidos de las tareas.
   */
  public limpiar(): boolean {
    try {
      localStorage.removeItem(this.claveAlmacenamiento);
      return true;
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
      return false;
    }
  }
}
