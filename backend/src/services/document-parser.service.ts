import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import sanitizeHtml from 'sanitize-html';
import { PlanoError } from '../models/plano.model';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

export function sanitizeDocument(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'section', 'h1', 'h2'],
    allowedAttributes: {
      '*': ['style'],
      div: ['data-plan-field', 'data-plan-content', 'data-plan-fixed', 'data-plan-hint', 'data-plan-letterhead', 'data-plan-title', 'data-plan-signature', 'data-plan-selected'],
      p: ['data-plan-option', 'data-plan-period'],
      section: ['data-plan-field'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['data'], // Exportação não acessa URLs externas ou arquivos locais.
    allowedSchemesByTag: { img: ['data'] },
    allowedStyles: { '*': {
      'text-align': [/^(left|center|right|justify)$/],
      'font-size': [/^\d+(?:\.\d+)?(?:pt|px)$/],
      color: [/^#[0-9a-f]{3,8}$/i],
      'background-color': [/^#[0-9a-f]{3,8}$/i],
    } },
    transformTags: { img: (tagName, attrs) => ({ tagName, attribs: /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(attrs.src ?? '') ? attrs : {} }) },
  });
}

export class DocumentParserService {
  async parse(buffer: Buffer, format: 'docx' | 'pdf') {
    if (buffer.length === 0 || buffer.length > 15 * 1024 * 1024) {
      throw new PlanoError(400, 'O arquivo deve ter até 15 MB e não pode estar vazio.');
    }
    if (format === 'docx') {
      if (buffer.length < 2 || buffer.readUInt16LE(0) !== 0x4b50) throw new PlanoError(400, 'Arquivo DOCX inválido.');
      const result = await mammoth.convertToHtml({ buffer }, {
        convertImage: mammoth.images.imgElement(async image => ({
          src: `data:${image.contentType};base64,${await image.read('base64')}`,
        })),
      });
      return { html: sanitizeDocument(result.value), warnings: result.messages.map(message => message.message) };
    }
    if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new PlanoError(400, 'Arquivo PDF inválido.');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const text = result.text.replace(/-- \d+ of \d+ --/g, '').trim();
      if (!text) {
        if (result.total > 20) throw new PlanoError(422, 'PDF digitalizado muito extenso. Envie até 20 páginas por arquivo.');
        const screenshots = await parser.getScreenshot({ desiredWidth: 1000 });
        return {
          html: screenshots.pages.map(page => `<p><img src="data:image/png;base64,${Buffer.from(page.data).toString('base64')}" alt="Página ${page.pageNumber} do PDF importado"></p>`).join(''),
          warnings: ['PDF digitalizado: as páginas foram preservadas como imagens. O texto das imagens não é editável; preencha as respostas do modelo para finalizar.'],
        };
      }
      const images = await parser.getImage({ imageThreshold: 0, imageBuffer: false });
      return {
        html: sanitizeDocument(result.pages.map(page => {
          const paragraphs = page.text.split(/\n/).filter(line => line.trim()).map(line => `<p>${escapeHtml(line)}</p>`).join('');
          const pageImages = images.pages.find(images => images.pageNumber === page.num)?.images ?? [];
          return paragraphs + pageImages.map(image => `<p><img src="${image.dataUrl}" alt="Imagem da página ${page.num}"></p>`).join('');
        }).join('')),
        warnings: ['PDF convertido a partir do texto. Revise a formatação, as imagens e as tabelas antes de finalizar.'],
      };
    } finally { await parser.destroy(); }
  }
}
