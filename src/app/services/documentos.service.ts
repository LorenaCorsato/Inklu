import { Injectable, computed, signal } from '@angular/core';
import {
  DocumentoFile,
  DocumentoFolderOption,
} from '../alunos/detalhe-aluno/modal-documento/modal-documento';

export interface DocumentoFolder {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  createdAt: string;
  modifiedAt: string;
}

export interface DocumentoArquivo {
  id: string;
  name: string;
  size: number;
  type: string;
  folderId: string | null;
  modifiedAt: string;
  description?: string;
}

const daysAgo = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString();

const INITIAL_FOLDERS: DocumentoFolder[] = [
  {
    id: 'f-planejamento',
    name: 'Planejamento',
    color: '#3B82F6',
    parentId: null,
    createdAt: daysAgo(40),
    modifiedAt: daysAgo(3),
  },
  {
    id: 'f-planejamento-mensal',
    name: 'Mensal',
    color: '#3B82F6',
    parentId: 'f-planejamento',
    createdAt: daysAgo(34),
    modifiedAt: daysAgo(3),
  },
  {
    id: 'f-planejamento-semanal',
    name: 'Semanal',
    color: '#22A06B',
    parentId: 'f-planejamento',
    createdAt: daysAgo(30),
    modifiedAt: daysAgo(10),
  },
  {
    id: 'f-materiais',
    name: 'Materiais de apoio',
    color: '#E8B931',
    parentId: null,
    createdAt: daysAgo(25),
    modifiedAt: daysAgo(6),
  },
  {
    id: 'f-adaptadas',
    name: 'Atividades adaptadas',
    color: '#E87932',
    parentId: 'f-materiais',
    createdAt: daysAgo(20),
    modifiedAt: daysAgo(1),
  },
  {
    id: 'f-avaliacoes',
    name: 'Avaliações',
    color: '#D94F5C',
    parentId: null,
    createdAt: daysAgo(12),
    modifiedAt: daysAgo(0),
  },
];

const INITIAL_FILES: DocumentoArquivo[] = [
  {
    id: 'a-plano-anual',
    name: 'Plano anual 2026.pdf',
    size: 512_000,
    type: 'application/pdf',
    folderId: 'f-planejamento',
    modifiedAt: daysAgo(3),
    description: 'Documento base do ano letivo.',
  },
  {
    id: 'a-planejamento-marco',
    name: 'Planejamento março.docx',
    size: 88_000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    folderId: 'f-planejamento-mensal',
    modifiedAt: daysAgo(3),
  },
  {
    id: 'a-rotina-semanal',
    name: 'Rotina semanal.png',
    size: 240_000,
    type: 'image/png',
    folderId: 'f-planejamento-semanal',
    modifiedAt: daysAgo(10),
  },
  {
    id: 'a-cartoes',
    name: 'Cartões de apoio.pdf',
    size: 1_200_000,
    type: 'application/pdf',
    folderId: 'f-adaptadas',
    modifiedAt: daysAgo(1),
  },
  {
    id: 'a-prova-adaptada',
    name: 'Prova adaptada.docx',
    size: 64_000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    folderId: 'f-avaliacoes',
    modifiedAt: daysAgo(0),
  },
  {
    id: 'a-notas-turma',
    name: 'Notas da turma.xlsx',
    size: 32_000,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    folderId: 'f-avaliacoes',
    modifiedAt: daysAgo(0),
  },
  {
    id: 'a-orientacoes',
    name: 'Orientações gerais.pdf',
    size: 420_000,
    type: 'application/pdf',
    folderId: null,
    modifiedAt: daysAgo(8),
  },
];

/**
 * Estado em memória de pastas e arquivos da tela de Documentos.
 * Compartilhado entre a página de Documentos e o modal aberto pela navbar,
 * para que um documento adicionado em qualquer lugar apareça nos dois lugares.
 */
@Injectable({ providedIn: 'root' })
export class DocumentosService {
  readonly folders = signal<DocumentoFolder[]>(INITIAL_FOLDERS);
  readonly files = signal<DocumentoArquivo[]>(INITIAL_FILES);

  /** Pastas em árvore achatadas, prontas para um `<select>` de destino. */
  readonly folderOptions = computed<DocumentoFolderOption[]>(() => {
    const options: DocumentoFolderOption[] = [{ id: null, label: 'Documentos (raiz)' }];
    const walk = (parentId: string | null, depth: number): void => {
      this.folders()
        .filter(folder => folder.parentId === parentId)
        .sort((first, second) =>
          first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' }),
        )
        .forEach(folder => {
          options.push({ id: folder.id, label: `${'— '.repeat(depth)}${folder.name}` });
          walk(folder.id, depth + 1);
        });
    };

    walk(null, 0);
    return options;
  });

  /** Adiciona arquivos enviados pelo modal na pasta informada. */
  addFiles(selected: Pick<DocumentoFile, 'name' | 'size' | 'type'>[], folderId: string | null): void {
    const now = new Date().toISOString();

    this.files.update(files => [
      ...files,
      ...selected.map(file => ({
        id: this.createId(),
        name: file.name,
        size: file.size,
        type: file.type,
        folderId,
        modifiedAt: now,
      })),
    ]);
  }

  createId(): string {
    return Math.random().toString(36).slice(2, 10);
  }
}
