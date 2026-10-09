import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-modal-exclusao',
  imports: [LucideAlertTriangle, LucideX],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './modal-exclusao.html',
  styleUrl: './modal-exclusao.scss',
})
export class ModalExclusao {
  @Input() isOpen = false;
  @Input() title = 'Deseja realmente excluir?';
  @Input() itemName = '';
  @Input() message = 'Esta ação não pode ser desfeita.';
  @Input() confirmLabel = 'Sim, excluir';
  @Output() confirmed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }

  confirm(): void {
    this.confirmed.emit();
  }
}
