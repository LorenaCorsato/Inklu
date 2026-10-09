import { CanDeactivateFn } from '@angular/router';

/** Contrato que o componente do editor expõe para o guard. */
export interface PendingChangesAware {
  canDeactivate(): boolean | Promise<boolean>;
}

/**
 * Impede a saída do editor enquanto houver alterações não salvas.
 *
 * O próprio componente abre o modal de confirmação e resolve a Promise com
 * `true` (pode sair) ou `false` (permanece na tela).
 */
export const pendingChangesGuard: CanDeactivateFn<PendingChangesAware> = (component) =>
  component.canDeactivate();
