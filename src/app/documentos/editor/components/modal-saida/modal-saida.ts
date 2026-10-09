import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';

/**
 * Modal exibido quando o usuário tenta sair do editor com alterações pendentes.
 *
 * Emite `closed` (cancelar), `discard` (sair sem salvar) ou `save` (salvar e sair).
 */
@Component({
  selector: 'app-modal-saida',
  imports: [LucideAlertTriangle, LucideX],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './modal-saida.html',
  styleUrl: './modal-saida.scss',
})
export class ModalSaida {
  @Input() isOpen = false;
  @Input() title = 'Sair sem salvar?';
  @Input() message = 'Existem alterações não salvas neste documento. O que deseja fazer?';
  @Input() saving = false;
  @Input() dialogId = 'saida-title';
  @Input() discardLabel = 'Sair sem salvar';
  @Input() saveLabel = 'Salvar e sair';

  @Output() closed = new EventEmitter<void>();
  @Output() discard = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if (!this.saving && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }

  onEscape(): void {
    if (this.isOpen && !this.saving) {
      this.closed.emit();
    }
  }
}
