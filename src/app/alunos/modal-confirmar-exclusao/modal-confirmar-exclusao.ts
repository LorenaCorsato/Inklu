import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-modal-confirmar-exclusao',
  imports: [LucideAlertTriangle, LucideX],
  templateUrl: './modal-confirmar-exclusao.html',
  styleUrl: './modal-confirmar-exclusao.scss',
})
export class ModalConfirmarExclusao {
  @Input() isOpen = false;
  @Input() alunoNome = '';
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  naoMostrarNovamente = false;

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  close() {
    this.naoMostrarNovamente = false;
    this.closed.emit();
  }

  confirmar() {
    this.confirmed.emit(this.naoMostrarNovamente);
    this.naoMostrarNovamente = false;
  }

  toggleNaoMostrarNovamente() {
    this.naoMostrarNovamente = !this.naoMostrarNovamente;
  }
}
