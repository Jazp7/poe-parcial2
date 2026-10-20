# Gestor de Tareas por Prioridad (Arquitectura MVC)

Aplicación web desarrollada en **TypeScript** bajo el patrón de arquitectura de software **Modelo-Vista-Controlador (MVC)**. Permite gestionar tareas pendientes y completadas clasificadas por niveles de prioridad (`alta`, `media`, `baja`), con capacidades avanzadas de ordenación dinámica, filtros combinados, diálogo de confirmación y persistencia local continua en el navegador a través de `localStorage`.

---

## 🏛️ Arquitectura del Sistema (MVC)

El proyecto separa estrictamente la lógica de datos, la presentación visual y la coordinación de eventos:

```text
┌─────────────────┐       Eventos UI       ┌─────────────────────┐
│    TareaView    ├───────────────────────►│   TareaController   │
│     (Vista)     │◄───────────────────────┤    (Controlador)    │
└─────────────────┘   Renderiza datos      └────┬───────────┬────┘
                                                │           │
                          Manipula instancias   │           │ Persiste / Recupera
                                                ▼           ▼
                                       ┌──────────────┐ ┌────────────────┐
                                       │    Tarea     │ │ StorageService │
                                       │   (Modelo)   │ │   (Servicio)   │
                                       └──────────────┘ └───────┬────────┘
                                                                │
                                                                ▼
                                                        ┌──────────────┐
                                                        │ localStorage │
                                                        └──────────────┘
```

### Componentes y Responsabilidades

1. **Modelo (`src/models/Tarea.ts`)**:
   - Representa la entidad de dominio con propiedades: `id`, `titulo`, `prioridad`, `completada` y `fecha`.
   - Incluye métodos para validación de datos, cálculo de peso numérico de prioridad (`alta: 3`, `media: 2`, `baja: 1`), alternancia de estado y serialización/deserialización segura.

2. **Vista (`src/views/TareaView.ts`)**:
   - Gestiona el DOM, renderiza las tarjetas de tareas con códigos de color e indicadores según prioridad:
     - 🔴 **Alta**: Acentos en rojo carmesí.
     - 🟡 **Media**: Acentos en amarillo ámbar.
     - 🟢 **Baja**: Acentos en verde esmeralda.
   - Provee el modal de confirmación antes de la eliminación de cualquier tarea.
   - Refleja contadores de estado (Total, Pendientes, Completadas).
   - Expone métodos desacoplados para suscribir manejadores de eventos.

3. **Servicio (`src/services/StorageService.ts`)**:
   - Encapsula la comunicación con la API Web `localStorage`.
   - Proporciona persistencia segura con control de excepciones y reconstrucción de tipos.

4. **Controlador (`src/controllers/TareaController.ts`)**:
   - Orquesta el flujo de negocio: procesa el registro, la alternancia de estado y la eliminación de tareas.
   - Implementa los algoritmos de filtrado combinado (por prioridad y por estado) y ordenamiento dinámico (cronológico y por ponderación de prioridad).
   - Mantiene sincronizada la persistencia en `StorageService` y la representación en `TareaView`.

---

## 📁 Estructura del Proyecto

```text
poe-lab2/
├── index.html                  # Plantilla semántica principal y modal
├── package.json                # Configuración de dependencias y scripts
├── tsconfig.json               # Configuración del compilador de TypeScript
├── pnpm-lock.yaml              # Archivo de bloqueo de dependencias
├── README.md                   # Documentación técnica completa
└── src/
    ├── main.ts                 # Punto de entrada e inicialización de MVC
    ├── models/
    │   └── Tarea.ts            # Entidad y tipos del Modelo
    ├── views/
    │   └── TareaView.ts        # Renderizado del DOM y gestión de la Vista
    ├── controllers/
    │   └── TareaController.ts  # Lógica de negocio y Controlador
    ├── services/
    │   └── StorageService.ts   # Persistencia en localStorage
    └── styles/
        └── styles.css          # Estilos modernos, diseño responsive y temas de prioridad
```

---

## 🚀 Requisitos y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [pnpm](https://pnpm.io/) (versión 9 o superior)

### Instalación de dependencias
```bash
pnpm install
```

### Ejecutar en entorno de desarrollo local
```bash
pnpm dev
```
Abre la URL proporcionada en la terminal (por ejemplo, `http://localhost:5173`) en tu navegador web.

### Validar tipado y compilar a producción
```bash
pnpm build
```

### Previsualizar la versión compilada
```bash
pnpm preview
```

---

## ✨ Funcionalidades Comprobadas
- [x] **Registro de tareas**: Título no vacío con asignación de nivel de prioridad.
- [x] **Identificación visual**: Distintivos y bordes temáticos por nivel de prioridad.
- [x] **Filtrado cruzado**: Filtrado simultáneo por estado (Todas / Pendientes / Completadas) y por nivel de prioridad.
- [x] **Ordenamiento versátil**: Selección de ordenación por fecha (ascendente/descendente) o por prioridad jerárquica.
- [x] **Completado**: Marcado reactivo con estilo tachado y actualización instantánea de contadores.
- [x] **Eliminación protegida**: Modal accesible de confirmación con prevención de borrado accidental.
- [x] **Persistencia continua**: Sincronización automática de todos los cambios en `localStorage`.
