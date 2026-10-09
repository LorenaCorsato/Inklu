import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  LucideAlignCenter,
  LucideAlignLeft,
  LucideAlignRight,
  LucideBold,
  LucideHeading1,
  LucideHeading2,
  LucideImage,
  LucideItalic,
  LucideTable,
  LucideUnderline,
  LucideFilePen
} from '@lucide/angular';
import {
  DEFAULT_TOOLBAR_STATE,
  EditorCommandName,
  EditorToolbarState,
  FONT_SIZES,
} from '../../models/editor-document.model';

/**
 * Barra de ferramentas de formatação.
 *
 * Componente puramente apresentacional: recebe o estado atual da seleção e
 * emite comandos. Toda a interação com o TipTap fica no componente principal.
 */
@Component({
  selector: 'app-editor-toolbar',
  imports: [
    LucideAlignCenter,
    LucideAlignLeft,
    LucideAlignRight,
    LucideBold,
    LucideHeading1,
    LucideHeading2,
    LucideImage,
    LucideItalic,
    LucideTable,
    LucideUnderline,
    LucideFilePen
  ],
  templateUrl: './editor-toolbar.html',
  styleUrl: './editor-toolbar.scss',
})
export class EditorToolbar {
  @Input() state: EditorToolbarState = DEFAULT_TOOLBAR_STATE;
  @Input() fontSize = '11';
  @Input() disabled = false;

  @Output() command = new EventEmitter<EditorCommandName>();
  @Output() fontSizeChange = new EventEmitter<string>();
  @Output() editPage = new EventEmitter<void>();

  readonly fontSizes = FONT_SIZES;

  onFontSizeChange(event: Event): void {
    this.fontSizeChange.emit((event.target as HTMLSelectElement).value);
  }

  onEditPage(): void {
    this.editPage.emit();
  }
}
