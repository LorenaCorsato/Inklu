import { EditableDocument } from './editor-document.model';

export type TipoPlano = 'pei' | 'paee';
export type StatusPlano = 'rascunho' | 'finalizado';
export type PlanoSaveMode = 'overwrite' | 'version';

export interface PlanoSummary {
  id: string;
  type: TipoPlano;
  alunoId: string;
  bimestre: string;
  anoLetivo: number;
  name: string;
  status: StatusPlano;
  rootId: string;
  parentId: string | null;
  versionNumber?: number;
  createdAt: string;
  modifiedAt?: string;
}

export interface EditablePlano extends EditableDocument {
  type: TipoPlano;
  alunoId: string;
  bimestre: string;
  anoLetivo: number;
  status: StatusPlano;
  rootId: string;
  parentId: string | null;
  versionNumber?: number;
  createdAt?: string;
  warnings: string[];
  fields: Array<{ id: string; label: string; required: boolean }>;
}

export interface SavePlano {
  name: string;
  bimestre: string;
  anoLetivo: number;
  status: StatusPlano;
  htmlContent: string;
  baseVersionId: string | null;
  originalFormat: 'docx' | 'pdf';
  saveMode?: PlanoSaveMode;
}
