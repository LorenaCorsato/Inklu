import { Injectable, signal } from '@angular/core';
import { EditableDocument, PageSettings, DEFAULT_PAGE_SETTINGS } from '../models/editor-document.model';

/**
 * Estado compartilhado da tela de editor (dirty check, zoom, metadados).
 *
 * Centralizar aqui evita duplicar signals no componente principal e permite que
 * toolbar/canvas reajam às mesmas fontes de verdade. Como é `providedIn: 'root'`,
 * o estado é reiniciado a cada abertura de documento via `reset()`.
 */
@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private readonly _document = signal<EditableDocument | null>(null);
  private readonly _documentName = signal('Documento sem título');
  private readonly _isSaving = signal(false);
  private readonly _hasUnsavedChanges = signal(false);
  private readonly _zoomLevel = signal(100);
  private readonly _fontSize = signal('11');
  private readonly _pageSettings = signal<PageSettings>(DEFAULT_PAGE_SETTINGS);

  readonly document = this._document.asReadonly();
  readonly documentName = this._documentName.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly hasUnsavedChanges = this._hasUnsavedChanges.asReadonly();
  readonly zoomLevel = this._zoomLevel.asReadonly();
  readonly fontSize = this._fontSize.asReadonly();
  readonly pageSettings = this._pageSettings.asReadonly();

  /** Define o documento carregado e limpa o flag de alterações pendentes. */
  setDocument(document: EditableDocument): void {
    this._document.set(document);
    this._documentName.set(document.name);
    this._hasUnsavedChanges.set(false);
  }

  /** Atualiza o nome do documento e o marca como alterado. */
  setName(name: string): void {
    if (name === this._documentName()) return;
    this._documentName.set(name);
    this.markDirty();
  }

  markDirty(): void {
    this._hasUnsavedChanges.set(true);
  }

  markSaved(): void {
    this._hasUnsavedChanges.set(false);
  }

  setSaving(isSaving: boolean): void {
    this._isSaving.set(isSaving);
  }

  setFontSize(size: string): void {
    this._fontSize.set(size);
  }

  /** Atualiza as configurações de página. */
  setPageSettings(settings: Partial<PageSettings>): void {
    this._pageSettings.update((current) => ({ ...current, ...settings }));
    this.markDirty();
  }

  /** Reseta as configurações de página para os valores padrão. */
  resetPageSettings(): void {
    this._pageSettings.set(DEFAULT_PAGE_SETTINGS);
  }

  zoomIn(): void {
    this._zoomLevel.update((value) => Math.min(value + 10, 200));
  }

  zoomOut(): void {
    this._zoomLevel.update((value) => Math.max(value - 10, 50));
  }

  /** Restaura o estado inicial — chamado ao entrar/sair da rota do editor. */
  reset(): void {
    this._document.set(null);
    this._documentName.set('Documento sem título');
    this._isSaving.set(false);
    this._hasUnsavedChanges.set(false);
    this._zoomLevel.set(100);
    this._fontSize.set('11');
    this._pageSettings.set(DEFAULT_PAGE_SETTINGS);
  }
}
