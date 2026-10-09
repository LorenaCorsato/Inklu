import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';
import { Materia } from '../materia.service';

export interface MateriaEditPayload {
  nome: string;
  area_conhecimento: string;
}

@Component({
  selector: 'app-modal-editar-materia',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideX],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (isOpen) {
      <div class="modal-overlay" (click)="onBackdropClick($event)">
        <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="editar-materia-title" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 id="editar-materia-title" class="modal-title">Editar Matéria</h2>
            <button class="btn-close" type="button" aria-label="Fechar modal" (click)="close()">
              <svg lucideX [size]="20" [strokeWidth]="2"></svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="editar-materia-nome">Nome</label>
              <input id="editar-materia-nome" class="form-input" type="text" placeholder="Ex.: Matemática" [(ngModel)]="form.nome" />
            </div>

            <div class="form-group">
              <label class="form-label" for="editar-materia-area">Área de conhecimento</label>
              <input id="editar-materia-area" class="form-input" type="text" placeholder="Ex.: Ciências Exatas" [(ngModel)]="form.area_conhecimento" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-cancelar" type="button" (click)="close()">Cancelar</button>
            <button class="btn btn-salvar" type="button" [disabled]="!isValid || isSaving" (click)="save()">
              {{ isSaving ? 'Salvando...' : 'Salvar alterações' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1100;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem; background: rgb(16 24 32 / 48%);
    }
    .modal-container {
      background: var(--ds-surface, #fff);
      border-radius: 12px; width: 100%; max-width: 560px; max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,.15);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--ds-border-subtle, #eee);
    }
    .modal-title { font-size: 1.125rem; font-weight: 700; margin: 0; }
    .btn-close {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; background: transparent;
      border-radius: 8px; color: var(--ds-muted, #666); cursor: pointer;
    }
    .btn-close:hover { background: var(--ds-neutral-100, #f0f0f0); }
    .modal-body { padding: 1.25rem 1.5rem; overflow-y: auto; }
    .form-group { margin-bottom: 1rem; }
    .form-group:last-child { margin-bottom: 0; }
    .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--ds-muted, #666); margin-bottom: 0.5rem; }
    .form-input {
      width: 100%; padding: 0.5rem 0.75rem; font-size: 1rem;
      border: 1px solid var(--ds-border, #ddd); border-radius: 8px; outline: none; box-sizing: border-box;
      background: var(--ds-surface, #fff); color: var(--ds-body, #111);
    }
    .form-input:focus { border-color: var(--ds-primary, #1a73e8); box-shadow: 0 0 0 3px var(--ds-primary-soft, rgba(26,115,232,.15)); }
    .modal-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
      padding: 1rem 1.5rem; border-top: 1px solid var(--ds-border-subtle, #eee);
    }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.5rem 1rem; font-size: 1rem; font-weight: 600;
      border-radius: 8px; cursor: pointer; transition: all .2s ease;
    }
    .btn-cancelar { background: var(--ds-surface, #fff); border: 1px solid var(--ds-border, #ddd); }
    .btn-cancelar:hover { background: var(--ds-neutral-100, #f0f0f0); }
    .btn-salvar { color: #fff; background: var(--ds-primary, #1a73e8); border: 1px solid var(--ds-primary, #1a73e8); }
    .btn-salvar:disabled { opacity: .6; cursor: not-allowed; }
  `]
})
export class ModalEditarMateria implements OnChanges {
  @Input() isOpen = false;
  @Input() materia: Materia | null = null;
  @Input() isSaving = false;
  @Output() saved = new EventEmitter<MateriaEditPayload>();
  @Output() closed = new EventEmitter<void>();

  form: MateriaEditPayload = { nome: '', area_conhecimento: '' };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['materia'] || changes['isOpen']) {
      if (this.isOpen && this.materia) {
        this.form = {
          nome: this.materia.nome ?? '',
          area_conhecimento: this.materia.area_conhecimento ?? '',
        };
      }
    }
  }

  get isValid(): boolean {
    return !!this.form.nome?.trim() && !!this.form.area_conhecimento?.trim();
  }

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

  save(): void {
    if (!this.isValid || this.isSaving) {
      return;
    }
    this.saved.emit({
      nome: this.form.nome.trim(),
      area_conhecimento: this.form.area_conhecimento.trim(),
    });
  }
}
