import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowLeft, LucideSave, LucideZoomIn, LucideZoomOut } from '@lucide/angular';
import DOMPurify from 'dompurify';

// --- Extensões do TipTap (engine ProseMirror) ------------------------------
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { Table as TableExtension } from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import UnderlineExtension from '@tiptap/extension-underline';
import TextAlignExtension from '@tiptap/extension-text-align';

import { EditorCanvas } from './components/editor-canvas/editor-canvas';
import { EditorPages } from './components/editor-pages/editor-pages';
import { EditorToolbar } from './components/editor-toolbar/editor-toolbar';
import { ModalSaida } from './components/modal-saida/modal-saida';
import { ModalPagina } from './components/modal-pagina/modal-pagina';
import { DocumentConverterService } from './services/document-converter.service';
import { EditorStateService } from './services/editor-state.service';
import { PendingChangesAware } from './pending-changes.guard';
import { PlanoService } from './services/plano.service';
import { EditablePlano, PlanoSaveMode, StatusPlano, TipoPlano } from './models/plano.model';
import { PlanField, PlanFixed } from './plan-nodes';
import {
  DEFAULT_TOOLBAR_STATE,
  EditableDocumentFormat,
  EditorCommandName,
  EditorToolbarState,
  TextAlignment,
  PageSettings,
  DEFAULT_PAGE_SETTINGS,
} from './models/editor-document.model';

/** Altura de uma página A4 (29,7 cm) em pixels CSS (1 cm = 96/2,54 px). */
const PX_PER_CM = 96 / 2.54;
/** Respiro superior ao rolar para uma página. */
const PAGE_SCROLL_MARGIN = 24;

/** Tamanhos de papel em cm (largura x altura). */
const PAPER_SIZES_CM: Record<string, { width: number; height: number }> = {
  A4: { width: 21, height: 29.7 },
  A3: { width: 29.7, height: 42 },
  A2: { width: 42, height: 59.4 },
  Letter: { width: 21.6, height: 27.9 },
};

/** Margens predefinidas em cm. */
const MARGIN_PRESETS_CM: Record<string, { top: number; right: number; bottom: number; left: number }> = {
  normal: { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 },
  narrow: { top: 1.27, right: 1.27, bottom: 1.27, left: 1.27 },
  letter: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 },
};

/**
 * Tela de edição de documentos (rota em tela cheia).
 *
 * Fluxo: lê o `:id` da rota → busca o HTML convertido (ou um fallback local) →
 * monta o TipTap na folha A4 → sincroniza toolbar, páginas e estado → salva.
 * A saída é protegida pelo `pendingChangesGuard`, que aciona o modal de saída.
 */
@Component({
  selector: 'app-documento-editor',
  imports: [
    CommonModule,
    FormsModule,
    LucideArrowLeft,
    LucideSave,
    LucideZoomIn,
    LucideZoomOut,
    EditorToolbar,
    EditorCanvas,
    EditorPages,
    ModalSaida,
    ModalPagina,
  ],
  templateUrl: './documento-editor.html',
  styleUrl: './documento-editor.scss',
})
export class DocumentoEditor implements OnInit, AfterViewInit, OnDestroy, PendingChangesAware {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly converter = inject(DocumentConverterService);
  private readonly state = inject(EditorStateService);
  private readonly planos = inject(PlanoService);

  /** Referência ao canvas para descobrir o elemento onde montar o TipTap. */
  @ViewChild(EditorCanvas) private canvas?: EditorCanvas;
  /** Container rolável usado no cálculo das páginas. */
  @ViewChild('viewport') private viewport?: ElementRef<HTMLElement>;

  private editor: Editor | null = null;
  /** Aguarda o view estar pronto antes de montar o editor. */
  private viewInitialized = false;
  private pendingContent: string | null = null;
  /** Resolve a navegação pendente aguardando a resposta do modal de saída. */
  private pendingExit: ((canLeave: boolean) => void) | null = null;
  private pendingExitPromise: Promise<boolean> | null = null;
  private pendingSaveMode: ((mode: PlanoSaveMode | null) => void) | null = null;
  /** Evita abrir o modal duas vezes quando a saída já foi confirmada. */
  private skipGuard = false;

  // ─── Estado exposto ao template (delegado ao EditorStateService) ──────────
  readonly documentName = this.state.documentName;
  readonly isSaving = this.state.isSaving;
  readonly hasUnsavedChanges = this.state.hasUnsavedChanges;
  readonly zoomLevel = this.state.zoomLevel;
  readonly fontSize = this.state.fontSize;
  readonly pageSettings = this.state.pageSettings;

  readonly documentId = signal<string | null>(null);
  readonly originalFormat = signal<EditableDocumentFormat>('docx');
  readonly isLoading = signal(true);
  readonly editorReady = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly wordCount = signal(0);
  readonly toolbarState = signal<EditorToolbarState>(DEFAULT_TOOLBAR_STATE);
  readonly planoType = signal<TipoPlano | null>(null);
  readonly alunoId = signal<string | null>(null);
  readonly baseVersionId = signal<string | null>(null);
  readonly versionNumber = signal(1);
  readonly bimestre = signal('1');
  readonly anoLetivo = signal(new Date().getFullYear());
  readonly planoStatus = signal<StatusPlano>('rascunho');
  readonly readOnly = signal(false);
  readonly warnings = signal<string[]>([]);
  readonly successMessage = signal('');
  readonly isExporting = signal(false);
  readonly canExport = computed(() => !!this.baseVersionId() && !this.hasUnsavedChanges() && !this.isLoading() && !this.isSaving() && !this.isExporting() && !this.saveDialogOpen());

  // ─── Páginas e modais ─────────────────────────────────────────────────────
  readonly pageCount = signal(1);
  readonly currentPage = signal(1);
  readonly exitDialogOpen = signal(false);
  readonly saveDialogOpen = signal(false);
  readonly pageDialogOpen = signal(false);

  /** Só permite salvar quando há alterações reais e conteúdo não vazio. */
  readonly canSave = computed(
    () => this.planoType()
      ? this.editorReady() && !this.isLoading() && !this.isSaving() && !this.readOnly() && !this.saveDialogOpen()
      : !this.isSaving() && this.hasUnsavedChanges() && this.wordCount() > 0,
  );

  /** Altura útil de conteúdo da página em pixels CSS, baseada nas configurações atuais. */
  readonly pageContentHeightPx = computed(() => {
    const settings = this.pageSettings();
    const paperSize = settings.paperSize;
    const orientation = settings.orientation;

    // Obtém dimensões do papel
    let dimensions = PAPER_SIZES_CM[paperSize] ?? PAPER_SIZES_CM['A4'];
    if (settings.paperSize === 'Custom' && settings.customPaperSize) {
      dimensions = settings.customPaperSize;
    }

    // Troca largura/altura se landscape
    const pageHeightCm = orientation === 'landscape' ? dimensions.width : dimensions.height;

    // Obtém margens
    let margins = MARGIN_PRESETS_CM[settings.margin] ?? MARGIN_PRESETS_CM['normal'];
    if (settings.margin === 'custom' && settings.customMargin) {
      margins = settings.customMargin;
    }

    const contentHeightCm = pageHeightCm - margins.top - margins.bottom;
    return contentHeightCm * PX_PER_CM;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      void this.router.navigate(['/documentos']);
      return;
    }

    this.state.reset();
    this.currentPage.set(1);
    this.documentId.set(id);
    const alunoId = this.route.snapshot.paramMap.get('alunoId');
    const type = this.route.snapshot.paramMap.get('tipo');
    if (alunoId) {
      if (type !== 'pei' && type !== 'paee') {
        this.isLoading.set(false);
        this.errorMessage.set('Tipo de plano inválido.');
        return;
      }
      this.alunoId.set(alunoId);
      this.planoType.set(type);
      this.readOnly.set(this.route.snapshot.queryParamMap.get('leitura') === '1');
    }
    void this.loadDocument(id);
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    // O conteúdo pode chegar antes do view; nesse caso montamos agora.
    if (this.pendingContent !== null) {
      this.initEditor(this.pendingContent);
      this.pendingContent = null;
    }
  }

  ngOnDestroy(): void {
    this.onSaveModeChoice(null);
    this.resolveExit(false);
    this.editor?.destroy();
    this.editor = null;
    this.state.reset();
  }

  // ─── Carregamento ─────────────────────────────────────────────────────────

  private async loadDocument(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // O nome pode vir por query string (o backend ainda não expõe metadados).
    const fallbackName = this.route.snapshot.queryParamMap.get('name') ?? undefined;

    try {
      const type = this.planoType();
      const alunoId = this.alunoId();
      const document = type && alunoId
        ? (id === 'novo' ? await this.planos.template(alunoId, type, this.bimestre(), this.anoLetivo()) : await this.planos.get(alunoId, type, id))
        : await this.converter.getDocumentForEditing(id, fallbackName);
      if (type) this.setPlanoMetadata(document as EditablePlano);
      this.state.setDocument(document);
      this.originalFormat.set(document.originalFormat);

      // Sanitiza o HTML antes de injetar no editor (mitiga XSS).
      const safeHtml = DOMPurify.sanitize(document.htmlContent);

      if (this.viewInitialized) {
        this.initEditor(safeHtml);
      } else {
        this.pendingContent = safeHtml;
      }
    } catch (error) {
      console.error('Falha ao carregar documento:', error);
      this.errorMessage.set(this.errorText(error, 'Não foi possível carregar o documento para edição.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private initEditor(content: string): void {
    const element = this.canvas?.element;
    if (!element) return;

    this.editor?.destroy();

    this.editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          // O sublinhado é adicionado explicitamente logo abaixo.
          underline: false,
        }),
        UnderlineExtension,
        TextStyle,
        FontSize,
        TextAlignExtension.configure({ types: ['heading', 'paragraph'] }),
        ImageExtension.configure({ inline: false, allowBase64: true }),
        TableExtension.configure({ resizable: true, HTMLAttributes: { class: 'editor-table' } }),
        TableRowExtension,
        TableHeaderExtension,
        TableCellExtension,
        ...(this.planoType() ? [PlanFixed, PlanField] : []),
      ],
      editable: !this.readOnly() && !this.isSaving(),
      content,
      editorProps: { attributes: { class: 'editor-content' } },
      onUpdate: ({ transaction }) => {
        if (!transaction.docChanged) return;
        // Qualquer edição marca o documento como "sujo" e atualiza a UI.
        this.state.markDirty();
        this.successMessage.set('');
        this.syncToolbarState();
        this.updateWordCount();
        this.recomputePages();
      },
      onSelectionUpdate: () => this.syncToolbarState(),
    });

    this.editorReady.set(true);
    this.syncToolbarState();
    this.updateWordCount();
    this.recomputePages();
    this.currentPage.set(1);
  }

  /** Reflete a formatação da seleção atual na toolbar. */
  private syncToolbarState(): void {
    const editor = this.editor;
    if (!editor) return;

    const textStyle = editor.getAttributes('textStyle') as { fontSize?: string };
    const alignment: TextAlignment = editor.isActive({ textAlign: 'center' })
      ? 'center'
      : editor.isActive({ textAlign: 'right' })
        ? 'right'
        : editor.isActive({ textAlign: 'justify' })
          ? 'justify'
          : 'left';

    this.toolbarState.set({
      isBold: editor.isActive('bold'),
      isItalic: editor.isActive('italic'),
      isUnderline: editor.isActive('underline'),
      currentHeading: editor.isActive('heading', { level: 1 })
        ? 1
        : editor.isActive('heading', { level: 2 })
          ? 2
          : null,
      currentFontSize: (textStyle.fontSize ?? `${this.fontSize()}`).replace('pt', ''),
      alignment,
    });
  }

  private updateWordCount(): void {
    const text = this.editor?.getText().trim() ?? '';
    this.wordCount.set(text ? text.split(/\s+/).length : 0);
  }

  // ─── Páginas ──────────────────────────────────────────────────────────────

  /** Recalcula a quantidade de páginas a partir da altura do conteúdo. */
private recomputePages(): void {
  const content = this.editorContent();

  if (!content) {
    this.pageCount.set(1);
    return;
  }

  const pageHeight = this.pageContentHeightPx();
  const signatures = content.querySelector<HTMLElement>(
    '[data-plan-fixed="footer"]'
  );

  if (signatures) {
    signatures.style.paddingTop = '0';

    const zoom = this.zoomLevel() / 100;
    const offset = (
      signatures.getBoundingClientRect().top -
      content.getBoundingClientRect().top
    ) / zoom;

    const nextPage = Math.ceil(offset / pageHeight) * pageHeight;
    signatures.style.paddingTop = `${Math.max(0, nextPage - offset)}px`;
  }

  const count = Math.max(
    1,
    Math.ceil((content.scrollHeight - 1) / pageHeight)
  );

  this.pageCount.set(count);
  this.currentPage.set(Math.min(this.currentPage(), count));
}

  /** Rola o viewport até a página selecionada na ilha lateral. */
  goToPage(page: number): void {
    const viewport = this.viewport?.nativeElement;
    const content = this.editorContent();
    if (!viewport || !content) return;

    const pageHeight = this.pageContentHeightPx() * (this.zoomLevel() / 100);
    const offset = content.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    const delta = offset + (page - 1) * pageHeight - PAGE_SCROLL_MARGIN;

    viewport.scrollBy({ top: delta, behavior: 'smooth' });
    this.currentPage.set(page);
  }

  /** Mantém a página atual em sincronia com a rolagem do usuário. */
  onViewportScroll(): void {
    this.updateCurrentPageFromScroll();
  }

  private updateCurrentPageFromScroll(): void {
    const viewport = this.viewport?.nativeElement;
    const content = this.editorContent();
    if (!viewport || !content) return;

    const pageHeight = this.pageContentHeightPx() * (this.zoomLevel() / 100);
    const offset =
      viewport.getBoundingClientRect().top -
      content.getBoundingClientRect().top +
      PAGE_SCROLL_MARGIN;
    const page = Math.floor(Math.max(0, offset) / pageHeight) + 1;

    this.currentPage.set(Math.min(this.pageCount(), Math.max(1, page)));
  }

  private editorContent(): HTMLElement | null {
    return (this.editor?.view.dom as HTMLElement | undefined) ?? null;
  }

  // ─── Comandos da toolbar ──────────────────────────────────────────────────

  runCommand(command: EditorCommandName): void {
    const editor = this.editor;
    if (!editor) return;

    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'align-left':
        editor.chain().focus().setTextAlign('left').run();
        break;
      case 'align-center':
        editor.chain().focus().setTextAlign('center').run();
        break;
      case 'align-right':
        editor.chain().focus().setTextAlign('right').run();
        break;
      case 'image':
        this.insertImage();
        break;
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
    }

    this.syncToolbarState();
  }

  setFontSize(size: string): void {
    this.state.setFontSize(size);
    this.editor?.chain().focus().setFontSize(`${size}pt`).run();
    this.syncToolbarState();
  }

  /** Abre o seletor de arquivo e insere a imagem como Base64 no documento. */
  private insertImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const base64 = await this.fileToBase64(file);
      this.editor?.chain().focus().setImage({ src: base64 }).run();
    };

    input.click();
  }

  // ─── Header / zoom ────────────────────────────────────────────────────────

  onNameChange(name: string): void {
    this.state.setName(name);
  }

  private setPlanoMetadata(plano: EditablePlano): void {
    this.baseVersionId.set(plano.id === 'novo' ? null : plano.id);
    this.versionNumber.set(plano.versionNumber ?? 1);
    this.bimestre.set(plano.bimestre);
    this.anoLetivo.set(plano.anoLetivo);
    this.planoStatus.set(plano.status);
    this.warnings.set(plano.warnings);
  }

  onPeriodChange(): void {
    const editor = this.editor;
    if (!editor || !this.alunoId() || !this.planoType() || this.readOnly() || this.isSaving() || this.isLoading() || this.saveDialogOpen()) return;
    this.state.markDirty();
    if (!/^[1-4]$/.test(this.bimestre()) || !Number.isInteger(this.anoLetivo()) || this.anoLetivo() < 2000 || this.anoLetivo() > 2100) return;
    const transaction = editor.state.tr.setMeta('addToHistory', false);
    editor.state.doc.forEach((node, position) => {
      if (node.type.name !== 'planFixed' || node.attrs['role'] !== 'header') return;
      const dom = new DOMParser().parseFromString(DOMPurify.sanitize(String(node.attrs['html'])), 'text/html');
      const period = dom.querySelector('[data-plan-period]') ?? Array.from(dom.querySelectorAll('p')).find(p => p.textContent?.startsWith('Período:'));
      if (!period) return;
      const text = document.createElement('strong');
      text.textContent = `Período: ${this.bimestre()}º Bimestre · Ano letivo: ${this.anoLetivo()}`;
      period.replaceChildren(text);
      transaction.setNodeMarkup(position, undefined, { ...node.attrs, html: dom.body.innerHTML });
    });
    if (transaction.docChanged) editor.view.dispatch(transaction);
  }

  async exportPlano(format: 'pdf' | 'docx'): Promise<void> {
    const alunoId = this.alunoId(); const type = this.planoType(); const id = this.baseVersionId();
    if (!alunoId || !type || !id || !this.canExport()) return;
    this.isExporting.set(true); this.errorMessage.set(null);
    try {
      await this.planos.download(alunoId, type, id, format, `${this.documentName().replace(/\.(docx|pdf)$/i, '')} - Versão ${this.versionNumber()}`);
    } catch (error) { this.errorMessage.set(this.errorText(error, 'Não foi possível exportar o plano.')); }
    finally { this.isExporting.set(false); }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) { event.preventDefault(); event.returnValue = ''; }
  }

  private errorText(error: unknown, fallback: string): string {
    const response = error as { error?: { erro?: string }; message?: string };
    return response?.error?.erro || fallback;
  }

  onZoomIn(): void {
    this.state.zoomIn();
    this.schedulePageSync();
  }

  onZoomOut(): void {
    this.state.zoomOut();
    this.schedulePageSync();
  }

  /** O zoom é animado; revalidamos a página após a transição terminar. */
  private schedulePageSync(): void {
    setTimeout(() => this.updateCurrentPageFromScroll(), 180);
  }

  // ─── Salvamento / navegação ───────────────────────────────────────────────

  async save(status: StatusPlano = this.planoStatus(), returnToStudent = true): Promise<boolean> {
    const editor = this.editor;
    const id = this.documentId();
    if (!editor || !id || this.isSaving() || this.readOnly() || this.isLoading() || this.saveDialogOpen()) return false;

    const alunoId = this.alunoId(); const type = this.planoType();
    if (alunoId && type && this.baseVersionId() && !this.hasUnsavedChanges() && status === this.planoStatus()) {
      if (returnToStudent) await this.router.navigate(['/alunos', alunoId], { replaceUrl: true });
      return true;
    }
    const saveMode = alunoId && type && this.baseVersionId() ? await this.requestSaveMode() : 'version';
    if (!saveMode) return false;

    this.state.setSaving(true);
    this.errorMessage.set(null);
    editor.setEditable(false, false);
    let saved = false;

    try {
      const html = editor.getHTML();
      if (alunoId && type) {
        const plano = await this.planos.save(alunoId, type, {
          name: this.documentName(), bimestre: this.bimestre(), anoLetivo: this.anoLetivo(),
          status, htmlContent: html, baseVersionId: this.baseVersionId(), originalFormat: this.originalFormat(), saveMode,
        });
        this.setPlanoMetadata(plano);
        this.state.setDocument(plano);
        this.documentId.set(plano.id);
        this.state.markSaved();
        this.successMessage.set('Plano salvo.');
        saved = true;
      } else {
        const result = await this.converter.saveDocument(id, html, 'docx', {
          name: this.documentName(),
          fontSize: Number.parseInt(this.fontSize(), 10),
        });

        this.state.markSaved();
        saved = true;

        if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank', 'noopener');
        } else if (result.local) {
          // Sem backend: oferece o HTML gerado como download local.
          this.downloadLocalHtml(html);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      this.errorMessage.set(this.errorText(error, 'Não foi possível salvar o documento.'));
    } finally {
      this.state.setSaving(false);
      this.editor?.setEditable(!this.readOnly(), false);
    }
    if (saved && alunoId && returnToStudent) await this.router.navigate(['/alunos', alunoId], { replaceUrl: true });
    return saved;
  }

  private requestSaveMode(): Promise<PlanoSaveMode | null> {
    this.saveDialogOpen.set(true);
    return new Promise(resolve => { this.pendingSaveMode = resolve; });
  }

  onSaveModeChoice(mode: PlanoSaveMode | null): void {
    const resolve = this.pendingSaveMode;
    this.pendingSaveMode = null;
    this.saveDialogOpen.set(false);
    resolve?.(mode);
  }

  goBack(): void {
    if (this.isSaving() || this.saveDialogOpen()) return;
    if (!this.hasUnsavedChanges()) {
      void this.router.navigate(this.alunoId() ? ['/alunos', this.alunoId()] : ['/documentos']);
      return;
    }

    // Com alterações pendentes, pede confirmação via modal antes de navegar.
    void this.requestExit().then((canLeave) => {
      if (!canLeave) return;
      this.skipGuard = true;
      void this.router.navigate(this.alunoId() ? ['/alunos', this.alunoId()] : ['/documentos']);
    });
  }

  // ─── Guard / modal de saída ───────────────────────────────────────────────

  /** Chamado pelo guard (ex.: voltar do navegador): só bloqueia com alterações. */
  canDeactivate(): boolean | Promise<boolean> {
    if (this.isSaving() || this.saveDialogOpen()) return false;
    if (this.skipGuard || !this.hasUnsavedChanges()) return true;
    return this.requestExit();
  }

  /** Abre o modal de saída e resolve conforme a escolha do usuário. */
  private requestExit(): Promise<boolean> {
    if (this.pendingExitPromise) return this.pendingExitPromise;
    this.pendingExitPromise = new Promise<boolean>((resolve) => {
      this.pendingExit = resolve;
      this.exitDialogOpen.set(true);
    });
    return this.pendingExitPromise;
  }

  onExitCancel(): void {
    this.resolveExit(false);
  }

  onExitDiscard(): void {
    this.resolveExit(true);
  }

  async onExitSave(): Promise<void> {
    this.exitDialogOpen.set(false);
    // O guard conclui a navegação original; salvar aqui não inicia outra.
    const saved = await this.save(this.planoStatus(), false);
    this.resolveExit(saved);
  }

  private resolveExit(canLeave: boolean): void {
    const resolve = this.pendingExit;
    this.pendingExit = null;
    this.pendingExitPromise = null;
    this.exitDialogOpen.set(false);
    resolve?.(canLeave);
  }

  // ─── Modal de configurações de página ───────────────────────────────────────

  /** Abre o modal de configurações de página. */
  onEditPage(): void {
    this.pageDialogOpen.set(true);
  }

  /** Fecha o modal de configurações de página sem salvar. */
  onPageCancel(): void {
    this.pageDialogOpen.set(false);
  }

  /** Salva as configurações de página e atualiza o canvas. */
  onPageSave(settings: PageSettings): void {
    this.state.setPageSettings(settings);
    this.applyPageSettings(settings);
    this.pageDialogOpen.set(false);
    this.recomputePages();
  }

  /** Aplica as configurações de página ao editor e canvas. */
  private applyPageSettings(settings: PageSettings): void {
    const editor = this.editor;
    const canvas = this.canvas;
    if (!editor || !canvas) return;

    // Atualiza o espaçamento entre linhas no conteúdo do editor
    const lineHeight = settings.lineSpacing ?? DEFAULT_PAGE_SETTINGS.lineSpacing;
    editor.chain().focus().setLineHeight(`${lineHeight}`).run();
  }

  // ─── Utilidades ───────────────────────────────────────────────────────────

  private downloadLocalHtml(html: string): void {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${this.documentName().replace(/\.[^.]+$/, '')}.html`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
