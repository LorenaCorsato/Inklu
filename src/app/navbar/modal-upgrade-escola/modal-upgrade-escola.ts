import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-modal-upgrade-escola',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './modal-upgrade-escola.html',
  styleUrl: './modal-upgrade-escola.scss',
})
export class ModalUpgradeEscola {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('upgrade-overlay')) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
