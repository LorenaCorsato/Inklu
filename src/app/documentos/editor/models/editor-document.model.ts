/**
 * Contratos de dados da tela de editor.
 *
 * Espelham propositalmente os DTOs do plano de implementação
 * (backend/src/models/document.model.ts) para que, quando o backend de conversão
 * existir, o frontend já fale exatamente o mesmo "idioma" de payload.
 */

/** Formatos de origem suportados pela conversão para HTML editável. */
export type EditableDocumentFormat = 'docx' | 'pdf';

/** Formatos de saída suportados na exportação/salvamento. */
export type ExportFormat = 'docx' | 'pdf' | 'html';

/** Alinhamentos de texto expostos na toolbar. */
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

/** Documento já convertido para HTML e pronto para edição no TipTap. */
export interface EditableDocument {
  id: string;
  name: string;
  originalFormat: EditableDocumentFormat;
  htmlContent: string;
  metadata?: {
    convertedAt: string;
    pageCount?: number;
  };
}

/** Estado "espelho" da seleção atual do editor, usado pela toolbar. */
export interface EditorToolbarState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  currentHeading: number | null;
  currentFontSize: string;
  alignment: TextAlignment;
}

/** Opções repassadas ao backend ao salvar/exportar o documento. */
export interface SaveDocumentOptions {
  name?: string;
  fontSize?: number;
  fontFamily?: string;
}

/** Resposta do endpoint de salvamento (ou do fallback local). */
export interface SaveDocumentResponse {
  success: boolean;
  downloadUrl?: string;
  newVersionId?: string;
  message?: string;
  /** true quando o arquivo foi gerado localmente (API indisponível). */
  local?: boolean;
}

/**
 * Comandos emitidos pela toolbar. O componente principal traduz cada um
 * numa cadeia de comandos do TipTap.
 */
export type EditorCommandName =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'heading1'
  | 'heading2'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'image'
  | 'table';

/** Estado inicial da toolbar (nenhuma formatação ativa). */
export const DEFAULT_TOOLBAR_STATE: EditorToolbarState = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  currentHeading: null,
  currentFontSize: '11',
  alignment: 'left',
};

/** Tamanhos de fonte disponíveis no seletor da toolbar. */
export const FONT_SIZES = ['9', '10', '11', '12', '14', '18', '24'] as const;

/** Opções de margem predefinidas. */
export type MarginPreset = 'normal' | 'narrow' | 'letter' | 'custom';

/** Tamanhos de papel suportados. */
export type PaperSize = 'A4' | 'A3' | 'A2' | 'Letter' | 'Custom';

/** Orientação da página. */
export type PageOrientation = 'portrait' | 'landscape';

/** Configurações de página para o editor. */
export interface PageSettings {
  margin: MarginPreset;
  customMargin?: { top: number; right: number; bottom: number; left: number };
  paperSize: PaperSize;
  customPaperSize?: { width: number; height: number };
  lineSpacing: number;
  showPageNumber: boolean;
  orientation: PageOrientation;
}

/** Configurações padrão de página. */
export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  margin: 'normal',
  paperSize: 'A4',
  lineSpacing: 1.6,
  showPageNumber: false,
  orientation: 'portrait',
};
