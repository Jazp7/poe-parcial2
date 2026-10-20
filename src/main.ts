import { StorageService } from './services/StorageService.ts';
import { TareaView } from './views/TareaView.ts';
import { TareaController } from './controllers/TareaController.ts';

document.addEventListener('DOMContentLoaded', () => {
  const storageService = new StorageService();
  const view = new TareaView('app');
  const controller = new TareaController(view, storageService);

  controller.inicializar();
});
