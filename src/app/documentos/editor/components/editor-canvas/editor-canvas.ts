import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { PageSettings, PaperSize, DEFAULT_PAGE_SETTINGS } from '../../models/editor-document.model';

/**
 * Wrapper da folha A4.
 *
 * O TipTap (ProseMirror) é montado diretamente no elemento `#sheet` exposto
 * pelo getter `element`, mantendo o componente principal no controle do editor.
 * As guias de página são um overlay separado da folha (para não interferir no
 * conteúdo gerenciado pelo ProseMirror).
 */
@Component({
  selector: 'app-editor-canvas',
  templateUrl: './editor-canvas.html',
  styleUrl: './editor-canvas.scss',
})
export class EditorCanvas {
  /** Nível de zoom da folha, em porcentagem. */
  @Input() zoom = 100;
  /** Exibe o estado visual de carregamento enquanto o conteúdo é convertido. */
  @Input() isLoading = false;
  /** Quantidade de páginas, usada para desenhar as quebras. */
  @Input() pageCount = 1;
  /** Configurações da página (margens, tamanho, orientação). */
  @Input() pageSettings: PageSettings = DEFAULT_PAGE_SETTINGS;

  @ViewChild('sheet', { static: true }) private readonly sheet!: ElementRef<HTMLElement>;

  /** Elemento DOM onde o TipTap deve ser inicializado. */
  get element(): HTMLElement {
    return this.sheet.nativeElement;
  }

  /** Obtém as dimensões do papel em cm baseado no tamanho selecionado. */
  paperDimensions(): { width: number; height: number } {
    const settings = this.pageSettings;
    const paperSize = settings.paperSize;

    if (paperSize === 'Custom' && settings.customPaperSize) {
      return { width: settings.customPaperSize.width, height: settings.customPaperSize.height };
    }

    const dimensions: Record<PaperSize, { width: number; height: number }> = {
      A4: { width: 21, height: 29.7 },
      A3: { width: 29.7, height: 42 },
      A2: { width: 42, height: 59.4 },
      Letter: { width: 21.6, height: 27.9 },
      Custom: { width: 21, height: 29.7 },
    };

    const dim = dimensions[paperSize] ?? dimensions.A4;

    // Troca largura/altura se orientação for landscape
    if (settings.orientation === 'landscape') {
      return { width: dim.height, height: dim.width };
    }

    return dim;
  }

  /** Obtém as margens em cm. */
  margins(): { top: number; right: number; bottom: number; left: number } {
    const settings = this.pageSettings;

    if (settings.margin === 'custom' && settings.customMargin) {
      return settings.customMargin;
    }

    const presets: Record<string, { top: number; right: number; bottom: number; left: number }> = {
      normal: { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 },
      narrow: { top: 1.27, right: 1.27, bottom: 1.27, left: 1.27 },
      letter: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 },
      custom: { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 },
    };

    return presets[settings.margin] ?? presets['normal'];
  }

  /** Altura útil da página (altura total - margens vertical) em cm. */
  contentHeightCm(): number {
    const dim = this.paperDimensions();
    const margin = this.margins();
    return dim.height - margin.top - margin.bottom;
  }

  /**
   * Guias de quebra: uma linha no fim de cada página.
   * A altura útil é baseada no tamanho do papel e margens configuradas.
   */
  guides(): Array<{ page: number; top: string }> {
    const boundaries = Math.max(0, Math.floor(this.pageCount) - 1);
    const margin = this.margins();
    const contentHeight = this.contentHeightCm();

    return Array.from({ length: boundaries }, (_, index) => ({
      page: index + 2,
      top: `calc(${margin.top}cm + ${index + 1} * ${contentHeight}cm)`,
    }));
  }

  /** Classes CSS dinâmicas para a folha baseadas nas configurações. */
  sheetClasses(): Record<string, boolean> {
    const settings = this.pageSettings;
    return {
      'a4-sheet': true,
      'is-loading': this.isLoading,
      'orientation-landscape': settings.orientation === 'landscape',
      'orientation-portrait': settings.orientation === 'portrait',
    };
  }

  /** Estilos inline para a folha (largura, altura, padding/margens). */
  sheetStyles(): Record<string, string> {
    const dim = this.paperDimensions();
    const margin = this.margins();

    return {
      width: `${dim.width}cm`,
      minHeight: `${dim.height}cm`,
      paddingTop: `${margin.top}cm`,
      paddingRight: `${margin.right}cm`,
      paddingBottom: `${margin.bottom}cm`,
      paddingLeft: `${margin.left}cm`,
    };
  }
}
