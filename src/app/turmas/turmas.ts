import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideSearch, LucidePlus, LucideEdit, LucideTrash2, LucideLoader2, LucideChevronLeft, LucideChevronRight, LucideRotateCcw, LucideX } from '@lucide/angular';
import { TurmaService, Turma } from './turma.service';
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

@Component({
  selector: 'app-turmas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, LucidePlus, LucideEdit, LucideTrash2, LucideLoader2, LucideChevronLeft, LucideChevronRight, LucideRotateCcw, LucideX, ModalExcluirTurma, ModalEditarTurma, Toast],
  templateUrl: './turmas.html',
  styleUrl: './turmas.scss',
})
export class Turmas implements OnInit {
  searchTerm = '';
  activeTab: 'ativas' | 'inativas' = 'ativas';
  turmas: Turma[] = [];
  isLoading = true;
  page = 1;
  pageSize = 10;
  totalPages = 1;
  isTurmaModalOpen = false;
  isSavingTurma = false;
  isDeleteModalOpen = false;
  turmaToDelete: Turma | null = null;
  isEditModalOpen = false;
  turmaToEdit: Turma | null = null;
  isSavingEdit = false;
  reactivatingId: string | null = null;
  toastOpen = false;
  toastMessage = '';
  toastType: 'error' | 'success' | 'info' = 'success';

  openDeleteModal(turma: Turma) {
    this.turmaToDelete = turma;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.turmaToDelete = null;
  }

  confirmDelete() {
    if (!this.turmaToDelete?.id_turma) {
      this.closeDeleteModal();
      return;
    }

    this.turmaService.excluirTurma(this.turmaToDelete.id_turma).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.carregarTurmas();
        this.showToast('Turma excluída com sucesso!', 'success');
      },
      error: (err) => {
        console.error('Erro ao excluir turma', err);
        this.closeDeleteModal();
        alert('Não foi possível excluir a turma.');
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
    const filteredCount = this.filteredTurmas.length;
    this.totalPages = Math.max(1, Math.ceil(filteredCount / this.pageSize));
    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }
  }

  goToPage(page: number) {
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    this.page = page;
  }

  get paginatedTurmas(): Turma[] {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredTurmas.slice(start, end);
  }

  constructor(
    private turmaService: TurmaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarTurmas();
  }

  get filteredTurmas(): Turma[] {
    const statusFilter = this.activeTab === 'ativas' ? 1 : 2;
    let filtered = this.turmas.filter((t) => Number((t as Turma).status ?? 1) === statusFilter);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.nome?.toLowerCase().includes(term) ||
          (t.ano?.toString() ?? '').includes(term) ||
          (t.turno?.toLowerCase() ?? '').includes(term) ||
          (t.serie?.toLowerCase() ?? '').includes(term)
      );
    }
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    if (this.page > this.totalPages) this.page = this.totalPages;
    return filtered;
  }

  carregarTurmas(): void {
    this.isLoading = true;
    this.turmaService.listarTurmas().subscribe({
      next: (data) => {
        this.turmas = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar turmas', err);
        this.turmas = [];
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
      },
      error: (err) => {
        console.error('Erro ao reativar turma', err);
        this.reactivatingId = null;
        this.cdr.detectChanges();
        alert('Não foi possível reativar a turma.');
      },
    });
  }
}
