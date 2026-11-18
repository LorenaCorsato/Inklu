import { Injectable, signal } from '@angular/core';

/**
 * Controla o modal global "Verifique seu e-mail".
 *
 * O modal é renderizado no shell do app (`app.html`), então qualquer tela
 * pode sugeri-lo sem alterar seu próprio template — basta chamar `abrir()`
 * após login/cadastro com e-mail/senha.
 */
@Injectable({ providedIn: 'root' })
export class VerificacaoEmailModalService {
  readonly aberto = signal(false);

  abrir(): void {
    this.aberto.set(true);
  }

  fechar(): void {
    this.aberto.set(false);
  }
}
