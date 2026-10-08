import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';
import { Materia, MateriaDependencias, MateriaDependenciaAluno, MateriaDependenciaUsuario } from '../materia.service';

@Component({
  selector: 'app-modal-excluir-materia',
  standalone: true,
  imports: [CommonModule, LucideAlertTriangle, LucideX],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (isOpen) {
      <div class="modal-overlay" (click)="onBackdropClick($event)">
        <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="excluir-materia-title" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span class="modal-icon" aria-hidden="true">
              <svg lucideAlertTriangle [size]="24" [strokeWidth]="2"></svg>
            </span>
            <button class="btn-close" type="button" aria-label="Fechar" (click)="close()">
              <svg lucideX [size]="20" [strokeWidth]="2"></svg>
            </button>
          </div>

          <div class="modal-body">
            <h2 class="modal-title" id="excluir-materia-title">Deseja realmente excluir?</h2>
            @if (materia?.nome) {
              <p class="modal-target">{{ materia!.nome }}</p>
            }
            @if (!dependencias) {
              <p class="modal-message">Esta ação irá inativar a matéria. Antes de continuar, vamos verificar se há materiais ou professores vinculados.</p>
            } @else {
              @if (dependencias.temDependencias) {
                <p class="modal-message">Esta matéria possui vínculos. Revise-os antes de confirmar a inativação.</p>
                @if (dependencias.quantidadeMateriais > 0) {
                  <section class="dependency-section" aria-labelledby="materia-materiais-title">
                    <h3 id="materia-materiais-title" class="dependency-title">Materiais ({{ dependencias.quantidadeMateriais }})</h3>
                    <ul class="dependency-list">
                      @for (material of dependencias.materiais; track material.id_material) {
                        <li>
                          <strong>{{ material.nome_do_arquivo || 'Material sem nome' }}</strong>
                          @if (material.aluno; as aluno) {
                            <span> — Aluno: {{ nomeAluno(aluno) }}</span>
                          }
                          @if (material.tipo_de_material) {
                            <span> ({{ material.tipo_de_material }})</span>
                          }
                        </li>
                      }
                    </ul>
                  </section>
                }
                @if (dependencias.quantidadeProfessores > 0) {
                  <section class="dependency-section" aria-labelledby="materia-professores-title">
                    <h3 id="materia-professores-title" class="dependency-title">Professores de apoio ({{ dependencias.quantidadeProfessores }})</h3>
                    <ul class="dependency-list">
                      @for (professor of dependencias.professores; track professor.id_professor_apoio) {
                        <li>{{ nomeProfessor(professor.usuario) }}</li>
                      }
                    </ul>
                  </section>
                }
                <p class="modal-message">Se continuar, a matéria será inativada, mas os vínculos permanecerão.</p>
              } @else {
                <p class="modal-message">Nenhum material ou professor de apoio está vinculado. A matéria será inativada.</p>
              }
            }
            @if (errorMessage) {
              <p class="error-message" role="alert">{{ errorMessage }}</p>
            }
          </div>

          <div class="modal-footer">
            <button class="btn btn-cancel" type="button" (click)="close()" [disabled]="isBusy">Cancelar</button>
            <button class="btn btn-delete" type="button" (click)="confirm()" [disabled]="isBusy">
              @if (isVerifying) {
                Verificando vínculos...
              } @else if (isDeleting) {
                Inativando...
              } @else if (dependencias?.temDependencias) {
                Inativar mesmo assim
              } @else if (dependencias) {
                Inativar matéria
              } @else {
                Verificar vínculos
              }
            </button>
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
      width: min(100%, 560px);
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
    .modal-body { padding: 1rem; overflow-y: auto; }
    .modal-title { margin: 0; font-size: 1.125rem; font-weight: 700; }
    .modal-target { margin: 0.75rem 0 0; font-weight: 600; overflow-wrap: anywhere; }
    .modal-message { margin: 0.5rem 0 0; color: var(--ds-muted, #666); line-height: 1.5; }
    .dependency-section { margin-top: 1rem; }
    .dependency-title { margin: 0 0 0.5rem; font-size: 0.95rem; font-weight: 700; }
    .dependency-list { display: grid; gap: 0.35rem; margin: 0; padding-left: 1.25rem; overflow-wrap: anywhere; }
    .error-message { margin: 0.75rem 0 0; color: var(--ds-danger, #c0392b); }
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
    .btn:disabled { cursor: not-allowed; opacity: 0.65; }
  `]
})
export class ModalExcluirMateria {
  @Input() isOpen = false;
  @Input() materia: Materia | null = null;
  @Input() dependencias: MateriaDependencias | null = null;
  @Input() isVerifying = false;
  @Input() isDeleting = false;
  @Input() errorMessage = '';
  @Output() confirmed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  get isBusy(): boolean {
    return this.isVerifying || this.isDeleting;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  onEscape(): void {
    if (this.isOpen && !this.isBusy) {
      this.close();
    }
  }

  close(): void {
    if (!this.isBusy) {
      this.closed.emit();
    }
  }

  confirm(): void {
    if (!this.isBusy) {
      this.confirmed.emit();
    }
  }

  nomeAluno(aluno: MateriaDependenciaAluno | MateriaDependenciaAluno[]): string {
    const item = Array.isArray(aluno) ? aluno[0] : aluno;
    return item?.nome_completo || 'Aluno não identificado';
  }

  nomeProfessor(usuario: MateriaDependenciaUsuario | MateriaDependenciaUsuario[] | null | undefined): string {
    const item = Array.isArray(usuario) ? usuario[0] : usuario;
    return item?.nome || 'Professor não identificado';
  }
}
