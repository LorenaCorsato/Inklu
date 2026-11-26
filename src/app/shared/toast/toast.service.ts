import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'error' | 'success' | 'info';

/**
 * Notificações globais. O toast é renderizado na shell do app, centralizado
 * no rodapé, para que qualquer tela possa informar falhas sem duplicar markup.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly aberto = signal(false);
  readonly mensagem = signal('');
  readonly tipo = signal<ToastTipo>('error');

  erro(mensagem: string): void {
    this.mostrar(mensagem, 'error');
  }

  sucesso(mensagem: string): void {
    this.mostrar(mensagem, 'success');
  }

  info(mensagem: string): void {
    this.mostrar(mensagem, 'info');
  }

  mostrar(mensagem: string, tipo: ToastTipo = 'error'): void {
    if (!mensagem) return;

    this.tipo.set(tipo);
    this.mensagem.set(mensagem);

    // Reabre para reiniciar o temporizador quando o mesmo erro se repete.
    if (this.aberto()) {
      this.aberto.set(false);
      setTimeout(() => this.aberto.set(true), 0);
      return;
    }

    this.aberto.set(true);
  }

  fechar(): void {
    this.aberto.set(false);
  }
}
