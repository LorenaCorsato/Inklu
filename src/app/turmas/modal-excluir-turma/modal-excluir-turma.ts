import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';
import { Turma } from '../turma.service';

@Component({
  selector: 'app-modal-excluir-turma',
  standalone: true,
  imports: [CommonModule, LucideAlertTriangle, LucideX],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (isOpen) {
      <div class="modal-overlay" (click)="onBackdropClick($event)">
        <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="excluir-turma-title" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span class="modal-icon" aria-hidden="true">
              <svg lucideAlertTriangle [size]="24" [strokeWidth]="2"></svg>
            </span>
            <button class="btn-close" type="button" aria-label="Fechar" (click)="close()">
              <svg lucideX [size]="20" [strokeWidth]="2"></svg>
            </button>
          </div>

          <div class="modal-body">
            <h2 class="modal-title" id="excluir-turma-title">Deseja realmente excluir?</h2>
            @if (turma?.nome) {
              <p class="modal-target">{{ turma!.nome }}</p>
            }
            <p class="modal-message">Esta ação irá inativar a turma e não poderá ser desfeita facilmente.</p>
          </div>

          <div class="modal-footer">
            <button class="btn btn-cancel" type="button" (click)="close()">Cancelar</button>
            <button class="btn btn-delete" type="button" (click)="confirm()">Sim, excluir</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      z-index: 1100;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgb(16 24 32 / 48%);
    }
    .modal-container {
      display: flex;
      width: min(100%, 420px);
      max-height: 90vh;
      flex-direction: column;
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-lg, 12px);
      background: var(--ds-surface, #fff);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1rem 0;
    }
    .modal-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: var(--ds-danger-soft, #fdecec);
      color: var(--ds-danger, #c0392b);
    }
    .btn-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--ds-muted, #666);
      cursor: pointer;
    }
    .btn-close:hover { background: var(--ds-neutral-100, #f0f0f0); color: var(--ds-body, #111); }
    .modal-body { padding: 1rem; }
    .modal-title { margin: 0; font-size: 1.125rem; font-weight: 700; }
    .modal-target { margin: 0.75rem 0 0; font-weight: 600; overflow-wrap: anywhere; }
    .modal-message { margin: 0.5rem 0 0; color: var(--ds-muted, #666); line-height: 1.5; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem;
      border-top: 1px solid var(--ds-border, #e5e5e5);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 1rem;
      border: 1px solid var(--ds-border, #ddd);
      border-radius: 8px;
      background: var(--ds-surface, #fff);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-cancel:hover { background: var(--ds-neutral-100, #f0f0f0); }
    .btn-delete { border-color: var(--ds-danger, #c0392b); background: var(--ds-danger, #c0392b); color: #fff; }
    .btn-delete:hover { filter: brightness(0.94); }
  `]
})
export class ModalExcluirTurma {
  @Input() isOpen = false;
  @Input() turma: Turma | null = null;
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
