import HTMLtoDOCX from 'html-to-docx';
import puppeteer from 'puppeteer';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { escapeHtml, sanitizeDocument } from './document-parser.service';
import { FormatoPlano } from '../models/plano.model';
import { normalizeDocx } from './docx-normalizer';

export class DocumentGeneratorService {
  async generateFromHtml(html: string, format: FormatoPlano, name = 'Plano'): Promise<Buffer> {
    const document = parse(sanitizeDocument(html));
    const style = (selector: string, declarations: string) => {
      for (const element of document.querySelectorAll(selector)) {
        element.setAttribute('style', `${element.getAttribute('style') || ''}; ${declarations}`);
      }
    };
    // html-to-docx lê estilos inline, mas não as regras da folha CSS.
    style('[data-plan-title]', 'margin-bottom: 18pt');
    style('[data-plan-title] h1, [data-plan-title] p', 'text-align: center; font-size: 14pt; margin-top: 0; margin-bottom: 0; line-height: 1.5');
    style('[data-plan-letterhead] table', 'width: 100%; border-collapse: collapse; border: none; margin: 0');
    style('[data-plan-letterhead] td', 'border: none; padding: 0; vertical-align: middle');
    style('[data-plan-letterhead] td:first-child', 'width: 85px; padding-right: 12px');
    style('[data-plan-letterhead] td:last-child', 'width: 508px');
    style('[data-plan-letterhead] p', 'text-align: center; font-size: 11pt; margin: 0; line-height: 1.25');
    style('[data-plan-letterhead] img', 'width: 85px; height: 81px');
    style('[data-plan-fixed="footer"] h2', 'text-align: center; font-size: 11pt; margin: 0');
    style('[data-plan-signature]', 'display: flow-root');
    style('[data-plan-signature] p', 'text-align: center; font-size: 11pt; margin: 0; line-height: 1.25');
    style('[data-plan-signature] p:first-child', 'margin-top: 40pt');
    const letterhead = document.querySelector('[data-plan-letterhead]');
    if (format === 'docx') {
      // O conversor interpreta border:none como uma borda inválida no Word.
      const table = letterhead?.querySelector('table');
      table?.setAttribute('border', '0');
      table?.setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 0');
      // A grade do conversor divide colunas igualmente; cinco colunas dão
      // ao texto institucional a largura necessária ao lado do brasão.
      letterhead?.querySelector('td:last-child')?.setAttribute('colspan', '5');
    }
    const headerHtml = letterhead?.outerHTML;
    if (format !== 'html') letterhead?.remove();
    if (format === 'docx') {
      const signatures = document.querySelector('[data-plan-fixed="footer"]');
      signatures?.insertAdjacentHTML('beforebegin', '<div class="page-break"></div>');
    }
    const safe = document.toString();
    const styled = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${escapeHtml(name)}</title><style>
      body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; margin: 0; }
      h1 { font-size: 16pt; text-align: center; } h2 { font-size: 13pt; } h3 { font-size: 11pt; }
      h1,h2,h3 { break-after: avoid; } p { margin: 0 0 8pt; } img { max-width: 100%; }
      table { border-collapse: collapse; width: 100%; } td,th { border: 1px solid #888; padding: 6pt; }
      @page { size: A4; } div[data-plan-field] { margin-bottom: 14pt; }
      [data-plan-letterhead] { margin-bottom: 18pt; }
      [data-plan-fixed="footer"] { break-before: page; page-break-before: always; break-inside: avoid; text-align: center; }
      [data-plan-signature] { break-inside: avoid; }
    </style></head><body>${safe}</body></html>`;
    if (format === 'html') return Buffer.from(styled);
    if (format === 'docx') {
      const options = {
        title: name, font: 'Arial', fontSize: 22,
        header: !!headerHtml,
        pageSize: { width: 11906, height: 16838 },
        margins: { top: headerHtml ? 2268 : 1417, bottom: 1417, left: 1417, right: 1417, header: 567, footer: 567, gutter: 0 },
        table: { row: { cantSplit: true } }, lang: 'pt-BR',
      };
      const output = await HTMLtoDOCX(styled, headerHtml || null, options);
      return normalizeDocx(Buffer.from(output as ArrayBuffer));
    }
    const systemChrome = process.platform === 'win32' ? join(process.env['PROGRAMFILES'] || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe') : '';
    const executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'] || (systemChrome && existsSync(systemChrome) ? systemChrome : undefined);
    const browser = await puppeteer.launch({ headless: true, executablePath });
    try {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (/^(data:|about:)/.test(request.url())) void request.continue(); else void request.abort();
      });
      await page.setContent(styled, { waitUntil: 'load' });
      return Buffer.from(await page.pdf({
        format: 'A4', printBackground: true,
        displayHeaderFooter: !!headerHtml,
        headerTemplate: headerHtml ? `<div style="width:100%; margin: 0 2.5cm; padding-top: .5cm; font-family: Arial, sans-serif; color: #1a1a1a">${headerHtml}</div>` : undefined,
        footerTemplate: '<div></div>',
        margin: { top: headerHtml ? '4cm' : '2.5cm', right: '2.5cm', bottom: '2.5cm', left: '2.5cm' },
      }));
    } finally { await browser.close(); }
  }
}
