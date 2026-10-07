import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideX, LucideFilePen, LucideMaximize2, LucideMinimize2 } from '@lucide/angular';
import { PageSettings, MarginPreset, PaperSize, PageOrientation, DEFAULT_PAGE_SETTINGS } from '../../models/editor-document.model';

/**
 * Modal de configurações de página.
 *
 * Permite editar margem, tamanho do papel, espaçamento entre linhas,
 * número da página e orientação.
 */
@Component({
  selector: 'app-modal-pagina',
  imports: [CommonModule, FormsModule, LucideX, LucideFilePen, LucideMaximize2, LucideMinimize2],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './modal-pagina.html',
  styleUrl: './modal-pagina.scss',
})
export class ModalPagina {
  @Input() isOpen = false;
  @Input() settings: PageSettings = DEFAULT_PAGE_SETTINGS;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<PageSettings>();

  readonly marginPresets: { value: MarginPreset; label: string }[] = [
    { value: 'normal', label: 'Normal (2,5 cm)' },
    { value: 'narrow', label: 'Estreita (1,27 cm)' },
    { value: 'letter', label: 'Carta (2,54 cm)' },
    { value: 'custom', label: 'Personalizada' },
  ];

  readonly paperSizes: { value: PaperSize; label: string }[] = [
    { value: 'A4', label: 'A4 (21 × 29,7 cm)' },
    { value: 'A3', label: 'A3 (29,7 × 42 cm)' },
    { value: 'A2', label: 'A2 (42 × 59,4 cm)' },
    { value: 'Letter', label: 'Carta (21,6 × 27,9 cm)' },
    { value: 'Custom', label: 'Personalizado' },
  ];

  readonly orientations: { value: PageOrientation; label: string; icon: 'maximize' | 'minimize' }[] = [
    { value: 'portrait', label: 'Vertical', icon: 'minimize' },
    { value: 'landscape', label: 'Horizontal', icon: 'maximize' },
  ];

  protected readonly DEFAULT_PAGE_SETTINGS = DEFAULT_PAGE_SETTINGS;

  customMargin = { top: 25, right: 25, bottom: 25, left: 25 };
  customPaperSize = { width: 21, height: 29.7 };
  lineSpacing = 1.6;

  ngOnChanges(): void {
    this.syncFormValues();
  }

  private syncFormValues(): void {
    this.customMargin = this.settings.customMargin ?? { top: 25, right: 25, bottom: 25, left: 25 };
    this.customPaperSize = this.settings.customPaperSize ?? { width: 21, height: 29.7 };
    this.lineSpacing = this.settings.lineSpacing ?? 1.6;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }

  onEscape(): void {
    if (this.isOpen) {
      this.closed.emit();
    }
  }

  onSave(): void {
    const updatedSettings: PageSettings = {
      ...this.settings,
      margin: this.settings.margin,
      paperSize: this.settings.paperSize,
      lineSpacing: this.lineSpacing,
      showPageNumber: this.settings.showPageNumber,
      orientation: this.settings.orientation,
    };

    if (this.settings.margin === 'custom') {
      updatedSettings.customMargin = { ...this.customMargin };
    }

    if (this.settings.paperSize === 'Custom') {
      updatedSettings.customPaperSize = { ...this.customPaperSize };
    }

    this.saved.emit(updatedSettings);
  }

  onMarginChange(preset: MarginPreset): void {
    this.settings = { ...this.settings, margin: preset };
  }

  onPaperSizeChange(size: PaperSize): void {
    this.settings = { ...this.settings, paperSize: size };
  }

  onOrientationChange(orientation: PageOrientation): void {
    this.settings = { ...this.settings, orientation };
  }

  onLineSpacingChange(value: number): void {
    this.lineSpacing = value;
  }

  onPageNumberToggle(checked: boolean): void {
    this.settings = { ...this.settings, showPageNumber: checked };
  }
}