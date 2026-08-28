import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideX, LucideCheck, LucideClock } from '@lucide/angular';

@Component({
  selector: 'app-modal-confirmacao',
  imports: [CommonModule, LucideX, LucideCheck, LucideClock],
  templateUrl: './modal-confirmacao.html',
  styleUrl: './modal-confirmacao.scss',
})
export class ModalConfirmacao {
  @Input() isOpen = false;
  @Input() nomeAluno = '';
  @Output() confirmed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.dismiss();
    }
  }

  confirm() {
    this.confirmed.emit();
  }

  dismiss() {
    this.dismissed.emit();
  }
}
