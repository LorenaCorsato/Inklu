import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-modal-solicitar-ajuste',
  standalone: true,
  imports: [LucideAlertTriangle, LucideX],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (isOpen) {
      <div class="modal-overlay" (click)="onBackdropClick($event)">
        <div
          class="modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="solicitar-ajuste-title"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <span class="modal-icon" aria-hidden="true">
              <svg lucideAlertTriangle [size]="16" [strokeWidth]="2"></svg>
            </span>
            <h2 class="modal-title" id="solicitar-ajuste-title">Solicitar ajuste</h2>
            <button
              class="btn-close"
              type="button"
              aria-label="Fechar"
              [disabled]="isSending"
              (click)="close()"
            >
              <svg lucideX [size]="16" [strokeWidth]="2"></svg>
            </button>
          </div>

          @if (tarefaTitulo) {
            <p class="modal-target">{{ tarefaTitulo }}</p>
          }

          <div class="modal-body">
            <label class="campo" for="ajuste-detalhes">
              <span class="campo__rotulo">Qual ajuste você precisa?</span>
              <textarea
                id="ajuste-detalhes"
                rows="4"
                maxlength="1000"
                placeholder="Descreva o que deve ser corrigido ou complementado"
                [value]="detalhe"
                [disabled]="isSending"
                (input)="atualizar($event)"
              ></textarea>
            </label>
            <div class="campo__rodape">
              @if (erro) {
                <p class="campo__erro" role="alert">{{ erro }}</p>
              } @else {
                <p class="campo__dica">Seja específico para o responsável saber por onde começar.</p>
              }
              <p class="campo__contador">{{ detalhe.length }}/1000</p>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn btn-cancel"
              type="button"
              [disabled]="isSending"
              (click)="close()"
            >
              Cancelar
            </button>
            <button
              class="btn btn-send"
              type="button"
              [disabled]="!detalhe.trim() || isSending"
              (click)="confirm()"
            >
              {{ isSending ? 'Enviando...' : 'Enviar solicitação' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        z-index: 1100;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgb(16 24 32 / 48%);
      }
      .modal-container {
        display: flex;
        width: min(100%, 480px);
        max-height: 90vh;
        flex-direction: column;
        border: 1px solid var(--ds-border);
        border-radius: 16px;
        background: var(--ds-surface, #fff);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      }
      .modal-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 16px 0;
      }
      .modal-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--ds-warning-soft, #fff4e0);
        color: var(--ds-warning, #b45309);
      }
      .modal-title {
        margin: 0;
        flex: 1;
        min-width: 0;
        font-size: 1rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        transition:
          background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
          color 150ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .btn-close:hover:not(:disabled) {
        background: var(--ds-neutral-100, #f0f0f0);
        color: var(--ds-body, #111);
      }
      .modal-target {
        margin: 12px 16px 0;
        color: var(--ds-muted, #666);
        font-size: 0.8rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .modal-body {
        padding: 12px 16px 16px;
        overflow-y: auto;
      }
      .campo {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .campo__rotulo {
        color: var(--ds-body, #111);
        font-size: 0.8rem;
        font-weight: 500;
      }
      textarea {
        min-height: 96px;
        max-height: 240px;
        padding: 12px;
        border: 1px solid var(--ds-border);
        border-radius: 8px;
        resize: vertical;
        background: transparent;
        color: var(--ds-body, #111);
        font: inherit;
        font-size: 0.85rem;
        line-height: 1.5;
      }
      textarea::placeholder {
        color: var(--ds-muted, #666);
      }
      textarea:focus-visible {
        outline: none;
        border-color: var(--ds-brand, #1653ff);
        box-shadow: 0 0 0 3px var(--ds-primary-soft);
      }
      .campo__rodape {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-top: 8px;
      }
      .campo__dica,
      .campo__contador {
        margin: 0;
        color: var(--ds-muted, #666);
        font-size: 0.75rem;
      }
      .campo__contador {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .campo__erro {
        margin: 0;
        color: var(--ds-danger, #c0392b);
        font-size: 0.75rem;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 16px;
        border-top: 1px solid var(--ds-border, #e5e5e5);
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 16px;
        border-radius: 8px;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition:
          background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
          border-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .btn:active:not(:disabled) {
        transform: scale(0.98);
      }
      .btn-cancel {
        border: 1px solid var(--ds-border, #ddd);
        background: var(--ds-surface, #fff);
        color: var(--ds-body, #111);
      }
      .btn-cancel:hover:not(:disabled) {
        background: var(--ds-neutral-100, #f0f0f0);
      }
      .btn-send {
        border: 1px solid var(--ds-brand, #1653ff);
        background: var(--ds-brand, #1653ff);
        color: #fff;
      }
      .btn-send:hover:not(:disabled) {
        filter: brightness(0.94);
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ModalSolicitarAjuste {
  @Input() isOpen = false;
  @Input() tarefaTitulo = '';
  @Input() isSending = false;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<string>();

  detalhe = '';
  erro = '';

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

  atualizar(event: Event): void {
    this.detalhe = (event.target as HTMLTextAreaElement).value;
    if (this.erro && this.detalhe.trim()) {
      this.erro = '';
    }
  }

  close(): void {
    if (this.isSending) return;
    this.closed.emit();
  }

  confirm(): void {
    const texto = this.detalhe.trim();
    if (!texto) {
      this.erro = 'Descreva o ajuste para enviar a solicitação.';
      return;
    }
    if (this.isSending) return;
    this.confirmed.emit(texto);
  }

  reset(): void {
    this.detalhe = '';
    this.erro = '';
  }
}
