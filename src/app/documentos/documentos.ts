import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideChevronRight,
  LucideEllipsis,
  LucideFilePlus,
  LucideFolderInput,
  LucideFolderOpen,
  LucideFolderPlus,
  LucideLayoutGrid,
  LucideList,
  LucidePencilLine,
  LucideSquarePen,
  LucidePlus,
  LucideRotateCcw,
  LucideSearch,
  LucideSlidersHorizontal,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import {
  DocumentoFile,
  ModalDocumento,
} from '../alunos/detalhe-aluno/modal-documento/modal-documento';
import {
  DocumentoArquivo,
  DocumentoFolder,
  DocumentosService,
} from '../services/documentos.service';
import { ModalExclusao } from './modal-exclusao/modal-exclusao';
import {
  ItemDialogDestination,
  ItemDialogKind,
  ItemDialogMode,
  ItemDialogResult,
  ModalItem,
} from './modal-item/modal-item';

export type FileCategory = 'document' | 'image' | 'spreadsheet' | 'other';
export type SortOrder = 'recent' | 'name' | 'type' | 'modified';

interface ItemRef {
  kind: ItemDialogKind;
  id: string;
}

@Component({
  selector: 'app-documentos',
  imports: [
    LucideArrowLeft,
    LucideChevronRight,
    LucideEllipsis,
    LucideFilePlus,
    LucideFolderInput,
    LucideFolderOpen,
    LucideFolderPlus,
    LucideLayoutGrid,
    LucideList,
    LucidePencilLine,
    LucideSquarePen,
    LucidePlus,
    LucideRotateCcw,
    LucideSearch,
    LucideSlidersHorizontal,
    LucideTrash2,
    LucideX,
    ModalDocumento,
    ModalExclusao,
    ModalItem,
  ],
  host: {
    '(document:click)': 'closeItemMenus()',
    '(document:keydown.escape)': 'closeItemMenus()',
  },
  templateUrl: './documentos.html',
  styleUrl: './documentos.scss',
})
export class Documentos {
  private readonly router = inject(Router);
  private readonly store = inject(DocumentosService);

  readonly folderColors = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#22A06B' },
    { name: 'Amarelo', value: '#E8B931' },
    { name: 'Laranja', value: '#E87932' },
    { name: 'Vermelho', value: '#D94F5C' },
    { name: 'Rosa', value: '#D65A9E' },
    { name: 'Roxo', value: '#805AD5' },
    { name: 'Cinza', value: '#718096' },
  ];
  readonly searchTerm = signal('');
  readonly sortOrder = signal<SortOrder>('recent');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly filterOpen = signal(false);
  readonly openItemMenu = signal<string | null>(null);
  readonly folderDialogOpen = signal(false);
  readonly folderName = signal('');
  readonly selectedFolderColor = signal(this.folderColors[0].value);
  readonly fileType = signal<'all' | FileCategory>('all');
  readonly modifiedPeriod = signal<'any' | 'today' | 'week' | 'month'>('any');
  readonly currentFolderId = signal<string | null>(null);

  readonly folders = this.store.folders;
  readonly files = this.store.files;

  readonly isDocumentoModalOpen = signal(false);
  private readonly uploadTargetFolderId = signal<string | null>(null);

  readonly itemDialog = signal<(ItemRef & { mode: ItemDialogMode }) | null>(null);
  readonly deleteTarget = signal<ItemRef | null>(null);

  readonly currentFolder = computed(
    () => this.folders().find((folder) => folder.id === this.currentFolderId()) ?? null,
  );

  readonly breadcrumb = computed(() => {
    const folders = this.folders();
    const path: DocumentoFolder[] = [];
    let id = this.currentFolderId();

    while (id) {
      const folder = folders.find((item) => item.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parentId;
    }

    return path;
  });

  readonly visibleFolders = computed(() => {
    const parentId = this.currentFolderId();
    const term = this.searchTerm().trim().toLowerCase();
    const order = this.sortOrder();
    const folders = this.folders().filter((folder) => folder.parentId === parentId);

    return folders
      .filter((folder) => !term || folder.name.toLowerCase().includes(term))
      .sort((first, second) =>
        order === 'name' || order === 'type'
          ? first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' })
          : Date.parse(second.modifiedAt) - Date.parse(first.modifiedAt),
      );
  });

  readonly visibleFiles = computed(() => {
    const parentId = this.currentFolderId();
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.fileType();
    const period = this.modifiedPeriod();
    const order = this.sortOrder();

    return this.files()
      .filter((file) => file.folderId === parentId)
      .filter((file) => !term || file.name.toLowerCase().includes(term))
      .filter((file) => category === 'all' || this.categoryOf(file) === category)
      .filter((file) => this.withinPeriod(file.modifiedAt, period))
      .sort((first, second) => {
        switch (order) {
          case 'name':
            return first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' });
          case 'type':
            return (
              this.categoryOf(first).localeCompare(this.categoryOf(second)) ||
              first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' })
            );
          default:
            return Date.parse(second.modifiedAt) - Date.parse(first.modifiedAt);
        }
      });
  });

  readonly isEmpty = computed(
    () => this.visibleFolders().length === 0 && this.visibleFiles().length === 0,
  );
  readonly hasActiveFilters = computed(
    () => this.fileType() !== 'all' || this.modifiedPeriod() !== 'any',
  );
  readonly filterCount = computed(
    () => (this.fileType() === 'all' ? 0 : 1) + (this.modifiedPeriod() === 'any' ? 0 : 1),
  );
  readonly folderSuggestionLabel = computed(() =>
    ['Documentos', ...this.breadcrumb().map((folder) => folder.name)].join(' / '),
  );

  // ─── Item dialog (renomear / editar / mover) ──────────────────────────────
  readonly itemDialogOpen = computed(() => this.itemDialog() !== null);
  readonly itemDialogMode = computed(() => this.itemDialog()?.mode ?? 'rename');
  readonly itemDialogKind = computed(() => this.itemDialog()?.kind ?? 'file');
  readonly itemDialogName = computed(() => this.itemDialogItem()?.name ?? '');
  readonly itemDialogDescription = computed(() => this.itemDialogFile()?.description ?? '');
  readonly itemDialogParentIdValue = computed(() => this.itemDialogParentId());
  readonly itemDialogLocation = computed(() => this.folderPathLabel(this.itemDialogParentId()));
  readonly itemDialogDestinations = computed<ItemDialogDestination[]>(() => {
    const target = this.itemDialog();
    const blocked = target?.kind === 'folder' ? this.collectFolderIds(target.id) : [];
    const currentParentId = this.itemDialogParentId();
    const options: ItemDialogDestination[] = [{ id: null, label: 'Documentos (raiz)' }];

    const walk = (parentId: string | null, depth: number): void => {
      this.folders()
        .filter((folder) => folder.parentId === parentId && !blocked.includes(folder.id))
        .sort((first, second) =>
          first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' }),
        )
        .forEach((folder) => {
          const current = folder.id === currentParentId ? ' (atual)' : '';
          options.push({ id: folder.id, label: `${'— '.repeat(depth)}${folder.name}${current}` });
          walk(folder.id, depth + 1);
        });
    };

    walk(null, 0);
    return options;
  });

  // ─── Delete dialog ────────────────────────────────────────────────────────
  readonly deleteDialogOpen = computed(() => this.deleteTarget() !== null);
  readonly deleteDialogName = computed(() => {
    const target = this.deleteTarget();
    if (!target) return '';
    return target.kind === 'folder'
      ? (this.folderById(target.id)?.name ?? '')
      : (this.fileById(target.id)?.name ?? '');
  });
  readonly deleteDialogMessage = computed(() => {
    const target = this.deleteTarget();
    if (!target) return '';

    if (target.kind === 'file') {
      return 'O arquivo será excluído permanentemente. Esta ação não pode ser desfeita.';
    }

    const ids = this.collectFolderIds(target.id);
    const folders = ids.length - 1;
    const files = this.files().filter((file) => ids.includes(file.folderId ?? '')).length;
    const parts: string[] = [];

    if (folders > 0) parts.push(`${folders} ${folders === 1 ? 'subpasta' : 'subpastas'}`);
    if (files > 0) parts.push(`${files} ${files === 1 ? 'arquivo' : 'arquivos'}`);

    const content = parts.length > 0 ? ` e todo o seu conteúdo (${parts.join(' e ')})` : '';
    return `A pasta${content} será excluída permanentemente. Esta ação não pode ser desfeita.`;
  });

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  updateSort(event: Event): void {
    this.sortOrder.set((event.target as HTMLSelectElement).value as SortOrder);
  }

  updateFileType(event: Event): void {
    this.fileType.set((event.target as HTMLSelectElement).value as 'all' | FileCategory);
  }

  updateModifiedPeriod(event: Event): void {
    this.modifiedPeriod.set(
      (event.target as HTMLSelectElement).value as 'any' | 'today' | 'week' | 'month',
    );
  }

  resetFilters(): void {
    this.fileType.set('all');
    this.modifiedPeriod.set('any');
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.resetFilters();
    this.filterOpen.set(false);
  }

  goToFolder(folderId: string | null): void {
    this.currentFolderId.set(folderId);
    this.closeItemMenus();
  }

  goToParent(): void {
    this.goToFolder(this.currentFolder()?.parentId ?? null);
  }

  folderSummary(folderId: string): string {
    const folders = this.folders().filter((folder) => folder.parentId === folderId).length;
    const files = this.files().filter((file) => file.folderId === folderId).length;
    const parts: string[] = [];

    if (folders > 0) parts.push(`${folders} ${folders === 1 ? 'pasta' : 'pastas'}`);
    if (files > 0) parts.push(`${files} ${files === 1 ? 'arquivo' : 'arquivos'}`);

    return parts.join(' • ') || 'Vazio';
  }

  toggleItemMenu(itemId: string, event: Event): void {
    event.stopPropagation();
    this.openItemMenu.update((openId) => (openId === itemId ? null : itemId));
  }

  closeItemMenus(): void {
    this.openItemMenu.set(null);
  }

  openFolderDialog(): void {
    this.folderName.set('');
    this.selectedFolderColor.set(this.folderColors[0].value);
    this.folderDialogOpen.set(true);
  }

  updateFolderName(event: Event): void {
    this.folderName.set((event.target as HTMLInputElement).value);
  }

  addFolder(event: Event): void {
    event.preventDefault();
    const name = this.folderName().trim();

    if (!name) return;

    const now = new Date().toISOString();
    this.folders.update((folders) => [
      ...folders,
      {
        id: this.store.createId(),
        name,
        color: this.selectedFolderColor(),
        parentId: this.currentFolderId(),
        createdAt: now,
        modifiedAt: now,
      },
    ]);
    this.folderDialogOpen.set(false);
  }

  // ─── Item actions ─────────────────────────────────────────────────────────
  openRenameDialog(kind: ItemDialogKind, id: string): void {
    this.openItemDialog('rename', kind, id);
  }

  openEditDialog(file: DocumentoArquivo): void {
    this.openItemDialog('edit', 'file', file.id);
  }

  openMoveDialog(kind: ItemDialogKind, id: string): void {
    this.openItemDialog('move', kind, id);
  }

  closeItemDialog(): void {
    this.itemDialog.set(null);
  }

  saveItemDialog(result: ItemDialogResult): void {
    const target = this.itemDialog();
    if (!target) return;

    if (target.kind === 'folder') {
      this.folders.update((folders) =>
        folders.map((folder) =>
          folder.id === target.id
            ? {
                ...folder,
                name: target.mode === 'move' ? folder.name : result.name,
                parentId: target.mode === 'move' ? result.destinationId : folder.parentId,
              }
            : folder,
        ),
      );
    } else {
      this.files.update((files) =>
        files.map((file) =>
          file.id === target.id
            ? {
                ...file,
                name: target.mode === 'move' ? file.name : result.name,
                description: target.mode === 'move' ? file.description : result.description,
                folderId: target.mode === 'move' ? result.destinationId : file.folderId,
              }
            : file,
        ),
      );
    }

    this.itemDialog.set(null);
  }

  askDelete(kind: ItemDialogKind, id: string): void {
    this.deleteTarget.set({ kind, id });
    this.closeItemMenus();
  }

  closeDeleteDialog(): void {
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    if (target.kind === 'folder') {
      this.deleteFolder(target.id);
    } else {
      this.files.update((files) => files.filter((file) => file.id !== target.id));
    }

    this.deleteTarget.set(null);
  }

  private deleteFolder(folderId: string): void {
    const ids = this.collectFolderIds(folderId);
    const parentId = this.folderById(folderId)?.parentId ?? null;
    const currentId = this.currentFolderId();

    this.folders.update((folders) => folders.filter((folder) => !ids.includes(folder.id)));
    this.files.update((files) => files.filter((file) => !ids.includes(file.folderId ?? '')));

    if (currentId && ids.includes(currentId)) {
      this.currentFolderId.set(parentId);
    }

    this.closeItemMenus();
  }

  // ─── Editor de documentos ─────────────────────────────────────────────────

  /**
   * Abre a tela de editor para o arquivo informado.
   * Só navega para formatos editáveis; o nome vai por query string porque o
   * backend ainda não expõe os metadados do documento.
   */
  openEditor(fileId: string): void {
    const file = this.fileById(fileId);
    if (!file || !this.isEditable(file)) return;

    this.closeItemMenus();
    void this.router.navigate(['/documentos/editor', file.id], {
      queryParams: { name: file.name },
    });
  }

  /** Indica se o arquivo pode ser aberto no editor de documentos. */
  isEditable(file: DocumentoArquivo): boolean {
    const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
    return ['docx', 'doc', 'pdf', 'txt', 'odt', 'rtf'].includes(extension);
  }

  openFileDialog(folderId: string | null = this.currentFolderId()): void {
    this.uploadTargetFolderId.set(folderId);
    this.closeItemMenus();
    this.isDocumentoModalOpen.set(true);
  }

  closeDocumentoModal(): void {
    this.isDocumentoModalOpen.set(false);
  }

  onFilesAdded(selected: DocumentoFile[]): void {
    // Se o modal exibiu o seletor de pasta, vale a escolha do usuário; senão,
    // vale a pasta de onde o upload foi disparado.
    const folderId = selected[0]?.folderId ?? this.uploadTargetFolderId();
    this.store.addFiles(selected, folderId);
    this.isDocumentoModalOpen.set(false);
  }

  categoryOf(file: DocumentoArquivo): FileCategory {
    const source = `${file.type} ${file.name}`.toLowerCase();

    if (/pdf|word|document|text|\.docx?|\.pptx?|\.txt/.test(source)) return 'document';
    if (/image|\.png|\.jpe?g|\.gif|\.webp|\.svg/.test(source)) return 'image';
    if (/sheet|excel|csv|\.xlsx?/.test(source)) return 'spreadsheet';
    return 'other';
  }

  fileBadge(file: DocumentoArquivo): string {
    const extension = file.name.includes('.') ? file.name.split('.').pop()! : '';
    return extension ? extension.slice(0, 4).toUpperCase() : 'ARQ';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('pt-BR');
  }

  private openItemDialog(mode: ItemDialogMode, kind: ItemDialogKind, id: string): void {
    this.itemDialog.set({ mode, kind, id });
    this.closeItemMenus();
  }

  private itemDialogItem(): DocumentoFolder | DocumentoArquivo | null {
    const target = this.itemDialog();
    if (!target) return null;
    return (
      (target.kind === 'folder' ? this.folderById(target.id) : this.fileById(target.id)) ?? null
    );
  }

  private itemDialogFile(): DocumentoArquivo | null {
    const target = this.itemDialog();
    return (target?.kind === 'file' ? this.fileById(target.id) : null) ?? null;
  }

  private itemDialogParentId(): string | null {
    const target = this.itemDialog();
    if (!target) return null;
    return target.kind === 'folder'
      ? (this.folderById(target.id)?.parentId ?? null)
      : (this.fileById(target.id)?.folderId ?? null);
  }

  private folderById(folderId: string): DocumentoFolder | undefined {
    return this.folders().find((folder) => folder.id === folderId);
  }

  private fileById(fileId: string): DocumentoArquivo | undefined {
    return this.files().find((file) => file.id === fileId);
  }

  private folderPathLabel(folderId: string | null): string {
    const names: string[] = [];
    let id = folderId;

    while (id) {
      const folder = this.folderById(id);
      if (!folder) break;
      names.unshift(folder.name);
      id = folder.parentId;
    }

    return ['Documentos', ...names].join(' / ');
  }

  private withinPeriod(isoDate: string, period: 'any' | 'today' | 'week' | 'month'): boolean {
    if (period === 'any') return true;

    const days = period === 'today' ? 0 : period === 'week' ? 7 : 30;
    const limit = new Date();

    if (period === 'today') {
      limit.setHours(0, 0, 0, 0);
    } else {
      limit.setDate(limit.getDate() - days);
    }

    return Date.parse(isoDate) >= limit.getTime();
  }

  private collectFolderIds(folderId: string): string[] {
    const children = this.folders().filter((folder) => folder.parentId === folderId);
    return [folderId, ...children.flatMap((folder) => this.collectFolderIds(folder.id))];
  }
}
