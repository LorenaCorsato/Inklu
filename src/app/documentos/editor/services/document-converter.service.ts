import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  EditableDocument,
  ExportFormat,
  SaveDocumentOptions,
  SaveDocumentResponse,
} from '../models/editor-document.model';

/**
 * Comunicação com a API de documentos (conversão HTML <-> DOCX/PDF).
 *
 * A API ainda não existe neste repositório, então todo método tem um
 * "fallback local": em vez de quebrar a tela, devolvemos um documento de
 * exemplo para o usuário conseguir navegar e testar o editor.
 */
@Injectable({ providedIn: 'root' })
export class DocumentConverterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/documents';

  /**
   * Busca o documento já convertido para HTML no backend.
   * Se a API estiver indisponível, monta um documento local de demonstração.
   */
  async getDocumentForEditing(id: string, fallbackName?: string): Promise<EditableDocument> {
    try {
      return await firstValueFrom(this.http.get<EditableDocument>(`${this.apiUrl}/${id}/editable`));
    } catch {
      return this.buildLocalDocument(id, fallbackName);
    }
  }

  /**
   * Envia o HTML editado para o backend gerar DOCX/PDF.
   * Se a API estiver indisponível, sinaliza `local: true` para o componente
   * oferecer o download do HTML diretamente no navegador.
   */
  async saveDocument(
    id: string,
    htmlContent: string,
    targetFormat: ExportFormat,
    options?: SaveDocumentOptions,
  ): Promise<SaveDocumentResponse> {
    try {
      return await firstValueFrom(
        this.http.post<SaveDocumentResponse>(`${this.apiUrl}/${id}/save`, {
          htmlContent,
          targetFormat,
          options,
        }),
      );
    } catch {
      return {
        success: true,
        local: true,
        message: 'API de conversão indisponível. O arquivo foi gerado localmente.',
      };
    }
  }

  /** Documento de exemplo usado quando não há backend de conversão ativo. */
  private buildLocalDocument(id: string, name?: string): EditableDocument {
    const documentName = name ?? 'Documento de exemplo';
    const title = documentName.replace(/\.[^.]+$/, '');

    return {
      id,
      name: documentName,
      originalFormat: documentName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx',
      htmlContent: `
        <h1>${title}</h1>
        <p>
          Este conteúdo foi carregado localmente porque a API de conversão não está
          disponível. Use a barra de ferramentas para formatar o texto, inserir imagens
          e tabelas — tudo é atualizado em tempo real.
        </p>
        <h2>Planejamento</h2>
        <p>
          Substitua este texto pelo conteúdo real do documento. As alterações são
          marcadas automaticamente e podem ser salvas no botão <strong>Salvar</strong>.
        </p>
        <table>
          <tbody>
            <tr>
              <th>Etapa</th>
              <th>Descrição</th>
              <th>Responsável</th>
            </tr>
            <tr>
              <td>1</td>
              <td>Revisar o material</td>
              <td>Professor</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Adaptar as atividades</td>
              <td>Equipe de apoio</td>
            </tr>
          </tbody>
        </table>
      `,
      metadata: {
        convertedAt: new Date().toISOString(),
        pageCount: 1,
      },
    };
  }
}
