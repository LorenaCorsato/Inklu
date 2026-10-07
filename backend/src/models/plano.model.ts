export type TipoPlano = 'pei' | 'paee';
export type StatusPlano = 'rascunho' | 'finalizado';
export type FormatoPlano = 'docx' | 'pdf' | 'html';

export interface CampoPlano {
  id: string;
  label: string;
  required: boolean;
}

export interface PerfilPlano {
  nome: string;
  nascimento: string;
  genero: string;
  escola: string;
  turno: string;
  turma: string;
  serie: string;
  diagnostico: string;
  preferencias: string;
  interesses: string;
}

/** Os dados estruturados cabem nas colunas TEXT existentes, sem alterar o schema. */
export interface ConteudoPlano {
  schemaVersion: 1;
  rootId: string;
  parentId: string | null;
  versionNumber?: number;
  status: StatusPlano;
  name: string;
  perfil: PerfilPlano;
  fields: Record<string, string>;
  selectedSupports?: string[];
  originalFormat: 'docx' | 'pdf';
  warnings: string[];
}

export interface PlanoRow {
  id_pei?: string;
  id_paee?: string;
  id_aluno: string;
  id_professor: number | null;
  bimestre: string;
  ano_letivo: number;
  contexto?: string | null;
  metas?: string | null;
  conteudo?: string | null;
  habilidades?: string | null;
  data_de_criacao: string;
  data_de_alteracao: string | null;
}

export class PlanoError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function tipoPlano(value: unknown): TipoPlano {
  if (value !== 'pei' && value !== 'paee') throw new PlanoError(400, 'Tipo de plano inválido.');
  return value;
}

export function validarUuid(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)) {
    throw new PlanoError(400, 'Identificador inválido.');
  }
}
