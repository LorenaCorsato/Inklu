import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideSearch, LucidePlus, LucideEdit, LucideTrash2, LucideLoader2, LucideChevronLeft, LucideChevronRight, LucideRotateCcw, LucideX } from '@lucide/angular';
import { MateriaService, Materia, MateriaDependencias } from './materia.service';
import { ModalExcluirMateria } from './modal-excluir-materia/modal-excluir-materia';
import { ModalEditarMateria, MateriaEditPayload } from './modal-editar-materia/modal-editar-materia';
import { Toast } from '../shared/toast/toast';

interface MateriaForm {
  nome: string;
  area_conhecimento: string;
}

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, LucidePlus, LucideEdit, LucideTrash2, LucideLoader2, LucideChevronLeft, LucideChevronRight, LucideRotateCcw, LucideX, ModalExcluirMateria, ModalEditarMateria, Toast],
  templateUrl: './materias.html',
  styleUrl: './materias.scss',
})
export class Materias implements OnInit {
  searchTerm = '';
  activeTab: 'ativas' | 'inativas' = 'ativas';
  materias: Materia[] = [];
  isLoading = true;
  isMateriaModalOpen = false;
  isSavingMateria = false;
  isDeleteModalOpen = false;
  materiaToDelete: Materia | null = null;
  materiaDependencies: MateriaDependencias | null = null;
  isCheckingDependencies = false;
  isDeletingMateria = false;
  deleteErrorMessage = '';
  isEditModalOpen = false;
  materiaToEdit: Materia | null = null;
  isSavingEdit = false;
  reactivatingId: string | null = null;
  toastOpen = false;
  toastMessage = '';
  toastType: 'error' | 'success' | 'info' = 'success';

  page = 1;
  readonly pageSize = 10;

  materiaForm: MateriaForm = {
    nome: '',
    area_conhecimento: '',
  };

  constructor(
    private materiaService: MateriaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarMaterias();
  }

  get filteredMaterias(): Materia[] {
    const statusFilter = this.activeTab === 'ativas' ? 1 : 2;
    let filtered = this.materias.filter((materia) => Number(materia.status ?? 1) === statusFilter);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((materia) => materia.nome.toLowerCase().includes(term));
    }
    return filtered;
  }

  updatePagination(): void {
    this.page = Math.max(1, Math.min(this.page, this.totalPages));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredMaterias.length / this.pageSize));
  }

  get paginatedMaterias(): Materia[] {
    const filtered = this.filteredMaterias;
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return filtered.slice(start, end);
  }

  get materiaFormIsValid(): boolean {
    return !!this.materiaForm.nome?.trim() && !!this.materiaForm.area_conhecimento?.trim();
  }

  goToPage(page: number): void {
    this.page = Math.min(Math.max(page, 1), this.totalPages);
  }

  carregarMaterias(): void {
    this.isLoading = true;
    this.materiaService.listarMaterias().subscribe({
      next: (data) => {
        this.materias = data;
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar matérias', err);
        this.materias = [];
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  irParaAdicionarMateria() {
    this.resetMateriaForm();
    this.isMateriaModalOpen = true;
  }

  fecharAdicionarMateria() {
    this.isMateriaModalOpen = false;
    this.isSavingMateria = false;
    this.resetMateriaForm();
  }

  onMateriaBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.fecharAdicionarMateria();
    }
  }

  salvarMateria() {
    if (!this.materiaFormIsValid) {
      return;
    }

    this.isSavingMateria = true;
    this.materiaService
      .criarMateria({
        nome: this.materiaForm.nome.trim(),
        area_conhecimento: this.materiaForm.area_conhecimento.trim(),
        status: '1',
      })
      .subscribe({
        next: () => {
          this.carregarMaterias();
          this.fecharAdicionarMateria();
          this.showToast('Matéria cadastrada com sucesso!', 'success');
        },
        error: (err) => {
          console.error('Erro ao cadastrar matéria', err);
          this.isSavingMateria = false;
          this.cdr.detectChanges();
          alert('Não foi possível cadastrar a matéria. Verifique os dados e tente novamente.');
        },
      });
  }

  private resetMateriaForm() {
    this.materiaForm = {
      nome: '',
      area_conhecimento: '',
    };
  }

  openDeleteModal(materia: Materia) {
    this.materiaToDelete = materia;
    this.materiaDependencies = null;
    this.deleteErrorMessage = '';
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.materiaToDelete = null;
    this.materiaDependencies = null;
    this.isCheckingDependencies = false;
    this.isDeletingMateria = false;
    this.deleteErrorMessage = '';
  }

  confirmDelete() {
    if (!this.materiaToDelete?.id_materia) {
      this.closeDeleteModal();
      return;
    }

    if (this.materiaDependencies) {
      this.inativarMateriaConfirmada();
      return;
    }

    if (this.isCheckingDependencies || this.isDeletingMateria) {
      return;
    }

    this.isCheckingDependencies = true;
    this.deleteErrorMessage = '';
    this.materiaService.verificarDependencias(this.materiaToDelete.id_materia).subscribe({
      next: (dependencias) => {
        this.isCheckingDependencies = false;
        this.materiaDependencies = dependencias;
        this.cdr.detectChanges();
        if (!dependencias.temDependencias) {
          this.inativarMateriaConfirmada();
        }
      },
      error: (err) => {
        console.error('Erro ao verificar dependências da matéria', err);
        this.isCheckingDependencies = false;
        this.deleteErrorMessage = 'Não foi possível verificar os vínculos desta matéria. Tente novamente.';
        this.cdr.detectChanges();
      },
    });
  }

  private inativarMateriaConfirmada(): void {
    if (!this.materiaToDelete?.id_materia || this.isDeletingMateria) {
      return;
    }

    this.isDeletingMateria = true;
    this.deleteErrorMessage = '';
    this.materiaService.excluirMateria(this.materiaToDelete.id_materia).subscribe({
      next: () => {
        this.isDeletingMateria = false;
        this.closeDeleteModal();
        this.carregarMaterias();
        this.showToast('Matéria excluída com sucesso!', 'success');
      },
      error: (err) => {
        console.error('Erro ao inativar matéria', err);
        this.isDeletingMateria = false;
        this.deleteErrorMessage = 'Não foi possível inativar a matéria. Tente novamente.';
        this.cdr.detectChanges();
      },
    });
  }

  editarMateria(materia: Materia) {
    this.openEditModal(materia);
  }

  openEditModal(materia: Materia) {
    this.materiaToEdit = materia;
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.materiaToEdit = null;
    this.isSavingEdit = false;
  }

  saveEdit(payload: MateriaEditPayload) {
    if (!this.materiaToEdit?.id_materia) {
      this.closeEditModal();
      return;
    }

    this.isSavingEdit = true;
    this.materiaService.atualizarMateria(this.materiaToEdit.id_materia, payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.carregarMaterias();
        this.showToast('Matéria atualizada com sucesso!', 'success');
      },
      error: (err) => {
        console.error('Erro ao atualizar matéria', err);
        this.isSavingEdit = false;
        this.cdr.detectChanges();
        alert('Não foi possível salvar as alterações da matéria.');
      },
    });
  }

  excluirMateria(materia: Materia) {
    this.openDeleteModal(materia);
  }

  showToast(message: string, type: 'error' | 'success' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastOpen = true;
  }

  closeToast(): void {
    this.toastOpen = false;
  }

  reativarMateria(materia: Materia) {
    if (!materia?.id_materia || this.reactivatingId) {
      return;
    }

    this.reactivatingId = materia.id_materia;
    this.materiaService.atualizarMateria(materia.id_materia, { status: '1' }).subscribe({
      next: () => {
        this.reactivatingId = null;
        this.carregarMaterias();
        this.showToast('Matéria reativada com sucesso!', 'success');
      },
      error: (err) => {
        console.error('Erro ao reativar matéria', err);
        this.reactivatingId = null;
        this.cdr.detectChanges();
        alert('Não foi possível reativar a matéria.');
      },
    });
  }
}
