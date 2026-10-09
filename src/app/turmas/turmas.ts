import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideSearch, LucidePlus, LucideEdit, LucideTrash2, LucideLoader2, LucideChevronLeft, LucideChevronRight, LucideRotateCcw, LucideX } from '@lucide/angular';
import { TurmaService, Turma, TurmaDependencias } from './turma.service';
import { ModalExcluirTurma } from './modal-excluir-turma/modal-excluir-turma';
import { ModalEditarTurma, TurmaEditPayload } from './modal-editar-turma/modal-editar-turma';
import { Toast } from '../shared/toast/toast';

interface TurmaForm {
  nome: string;
  serie: string;
  periodo: string;
  ano: number;
  qtd_alunos: number;
}

type CampoFiltroTurma = 'nome' | 'serie' | 'ano' | 'periodo';

@Component({
  selector: 'app-turmas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, LucidePlus, LucideEdit, LucideTrash2, LucideLoader2, LucideChevronLeft, LucideChevronRight, LucideRotateCcw, LucideX, ModalExcluirTurma, ModalEditarTurma, Toast],
  templateUrl: './turmas.html',
  styleUrl: './turmas.scss',
})
export class Turmas implements OnInit {
  searchTerm = '';
  filtros: Record<CampoFiltroTurma, string> = { nome: '', serie: '', ano: '', periodo: '' };
  readonly camposFiltro: { campo: CampoFiltroTurma; label: string }[] = [
    { campo: 'nome', label: 'Nome' },
    { campo: 'serie', label: 'Série' },
    { campo: 'ano', label: 'Ano' },
    { campo: 'periodo', label: 'Período' },
  ];
  activeTab: 'ativas' | 'inativas' = 'ativas';
  turmas: Turma[] = [];
  isLoading = true;
  page = 1;
  readonly pageSize = 10;
  isTurmaModalOpen = false;
  isSavingTurma = false;
  isDeleteModalOpen = false;
  turmaToDelete: Turma | null = null;
  turmaDependencies: TurmaDependencias | null = null;
  isCheckingDependencies = false;
  isDeletingTurma = false;
  deleteErrorMessage = '';
  private deleteModalRequestId = 0;
  isEditModalOpen = false;
  turmaToEdit: Turma | null = null;
  isSavingEdit = false;
  reactivatingId: string | null = null;
  toastOpen = false;
  toastMessage = '';
  toastType: 'error' | 'success' | 'info' = 'success';

  openDeleteModal(turma: Turma) {
    if (this.isDeletingTurma) return;
    this.deleteModalRequestId++;
    this.turmaToDelete = turma;
    this.turmaDependencies = null;
    this.deleteErrorMessage = '';
    this.isDeleteModalOpen = true;
    this.verificarDependenciasTurma();
  }

  closeDeleteModal() {
    if (this.isDeletingTurma) return;
    this.deleteModalRequestId++;
    this.isDeleteModalOpen = false;
    this.turmaToDelete = null;
    this.turmaDependencies = null;
    this.isCheckingDependencies = false;
    this.deleteErrorMessage = '';
  }

  private verificarDependenciasTurma(): void {
    if (!this.turmaToDelete?.id_turma) return;
    const requestId = this.deleteModalRequestId;
    this.isCheckingDependencies = true;
    this.deleteErrorMessage = '';
    this.turmaService.verificarDependencias(this.turmaToDelete.id_turma).subscribe({
      next: (dependencias) => {
        if (requestId !== this.deleteModalRequestId) return;
        this.turmaDependencies = dependencias;
        this.isCheckingDependencies = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (requestId !== this.deleteModalRequestId) return;
        console.error('Erro ao verificar alunos da turma', err);
        this.isCheckingDependencies = false;
        this.deleteErrorMessage = 'Não foi possível verificar os alunos vinculados. Tente novamente.';
        this.cdr.detectChanges();
      },
    });
  }

  confirmDelete() {
    if (this.isCheckingDependencies || this.isDeletingTurma) return;
    if (!this.turmaToDelete?.id_turma) {
      this.closeDeleteModal();
      return;
    }

    if (!this.turmaDependencies) {
      this.verificarDependenciasTurma();
      return;
    }

    this.isDeletingTurma = true;
    this.deleteErrorMessage = '';
    this.turmaService.excluirTurma(this.turmaToDelete.id_turma, this.turmaDependencies.temDependencias).subscribe({
      next: () => {
        this.isDeletingTurma = false;
        this.closeDeleteModal();
        this.carregarTurmas();
        this.showToast('Turma inativada com sucesso!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isDeletingTurma = false;
        if (err.status === 409 && err.error?.requerConfirmacao) {
          // Um aluno pode ter sido vinculado depois da consulta inicial.
          this.turmaDependencies = null;
          this.verificarDependenciasTurma();
        } else {
          console.error('Erro ao inativar turma', err);
          this.deleteErrorMessage = 'Não foi possível inativar a turma. Tente novamente.';
        }
        this.cdr.detectChanges();
      },
    });
  }

  turmaForm: TurmaForm = {
    nome: '',
    serie: '',
    periodo: '',
    ano: new Date().getFullYear(),
    qtd_alunos: 0,
  };

  updatePagination() {
    this.page = Math.max(1, Math.min(this.page, this.totalPages));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTurmas.length / this.pageSize));
  }

  goToPage(page: number) {
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    this.page = page;
  }

  get paginatedTurmas(): Turma[] {
    const filtered = this.filteredTurmas;
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return filtered.slice(start, end);
  }

  constructor(
    private turmaService: TurmaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarTurmas();
  }

  get filteredTurmas(): Turma[] {
    let filtered = this.turmas.filter((turma) => this.correspondeAba(turma));
    filtered = filtered.filter((turma) =>
      this.camposFiltro.every(({ campo }) =>
        !this.filtros[campo] || this.valorFiltro(turma, campo) === this.filtros[campo]
      )
    );
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.nome?.toLowerCase().includes(term) ||
          (t.ano?.toString() ?? '').includes(term) ||
          ((t.periodo || t.turno)?.toLowerCase() ?? '').includes(term) ||
          (t.serie?.toLowerCase() ?? '').includes(term)
      );
    }
    return filtered;
  }

  statusTurma(turma: Turma): number {
    return Number(turma.status ?? 1);
  }

  private correspondeAba(turma: Turma): boolean {
    return this.statusTurma(turma) === (this.activeTab === 'ativas' ? 1 : 2);
  }

  private valorFiltro(turma: Turma, campo: CampoFiltroTurma): string {
    const valor = campo === 'periodo' ? turma.periodo || turma.turno : turma[campo];
    return String(valor ?? '').trim();
  }

  opcoesFiltro(campo: CampoFiltroTurma): string[] {
    const valores = this.turmas
      .filter((turma) => this.correspondeAba(turma))
      .map((turma) => this.valorFiltro(turma, campo))
      .filter(Boolean);
    return [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }

  limparFiltros(): void {
    this.filtros = { nome: '', serie: '', ano: '', periodo: '' };
    this.searchTerm = '';
    this.page = 1;
  }

  carregarTurmas(): void {
    this.isLoading = true;
    this.turmaService.listarTurmas().subscribe({
      next: (data) => {
        this.turmas = data;
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar turmas', err);
        this.turmas = [];
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get turmaFormIsValid(): boolean {
    return !!(
      this.turmaForm.nome?.trim() &&
      this.turmaForm.serie?.trim() &&
      this.turmaForm.periodo?.trim() &&
      Number.isInteger(this.turmaForm.ano) &&
      this.turmaForm.ano > 0
    );
  }

  abrirAdicionarTurma() {
    this.resetTurmaForm();
    this.isTurmaModalOpen = true;
  }

  fecharAdicionarTurma() {
    this.isTurmaModalOpen = false;
    this.isSavingTurma = false;
    this.resetTurmaForm();
  }

  onTurmaBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.fecharAdicionarTurma();
    }
  }

  salvarTurma() {
    if (!this.turmaFormIsValid) {
      return;
    }

    this.isSavingTurma = true;
    this.turmaService
      .criarTurma({
        nome: this.turmaForm.nome.trim(),
        serie: this.turmaForm.serie.trim(),
        periodo: this.turmaForm.periodo.trim(),
        ano: Number(this.turmaForm.ano),
        qtd_alunos: this.turmaForm.qtd_alunos ?? 0,
        status: 1,
      })
      .subscribe({
        next: () => {
          this.carregarTurmas();
          this.fecharAdicionarTurma();
          this.showToast('Turma cadastrada com sucesso!', 'success');
        },
        error: (err) => {
          console.error('Erro ao cadastrar turma', err);
          this.isSavingTurma = false;
          this.cdr.detectChanges();
          alert('Não foi possível cadastrar a turma. Verifique os dados e tente novamente.');
        },
      });
  }

  private resetTurmaForm() {
    this.turmaForm = {
      nome: '',
      serie: '',
      periodo: '',
      ano: new Date().getFullYear(),
      qtd_alunos: 0,
    };
  }

  editarTurma(turma: Turma) {
    this.openEditModal(turma);
  }

  openEditModal(turma: Turma) {
    this.turmaToEdit = turma;
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.turmaToEdit = null;
    this.isSavingEdit = false;
  }

  saveEdit(payload: TurmaEditPayload) {
    if (!this.turmaToEdit?.id_turma) {
      this.closeEditModal();
      return;
    }

    this.isSavingEdit = true;
    this.turmaService.atualizarTurma(this.turmaToEdit.id_turma, payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.carregarTurmas();
        this.showToast('Turma atualizada com sucesso!', 'success');
      },
      error: (err) => {
        console.error('Erro ao atualizar turma', err);
        this.isSavingEdit = false;
        this.cdr.detectChanges();
        alert('Não foi possível salvar as alterações da turma.');
      },
    });
  }

  excluirTurma(turma: Turma) {
    this.openDeleteModal(turma);
  }

  showToast(message: string, type: 'error' | 'success' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastOpen = true;
  }

  closeToast(): void {
    this.toastOpen = false;
  }

  reativarTurma(turma: Turma) {
    if (!turma?.id_turma || this.reactivatingId) {
      return;
    }

    this.reactivatingId = turma.id_turma;
    this.turmaService.atualizarTurma(turma.id_turma, { status: 1 }).subscribe({
      next: () => {
        this.reactivatingId = null;
        this.carregarTurmas();
        this.showToast('Turma reativada com sucesso!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao reativar turma', err);
        this.reactivatingId = null;
        this.showToast('Não foi possível reativar a turma.', 'error');
        this.cdr.detectChanges();
      },
    });
  }
}
