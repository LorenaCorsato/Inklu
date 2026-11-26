/**
 * Modelos do domínio de autenticação do frontend.
 *
 * Os contratos aqui refletem a seção 1.1 da especificação. O servidor é a
 * fonte da verdade: nenhum destes tipos autoriza nada por conta própria.
 */

export type Funcao = 'professor_regente' | 'professor_apoio' | 'coordenacao';

export const FUNCOES: readonly { valor: Funcao; rotulo: string; descricao: string }[] = [
  {
    valor: 'professor_regente',
    rotulo: 'Professor Regente',
    descricao: 'Responsável pela turma e pelas matérias que leciona.',
  },
  {
    valor: 'professor_apoio',
    rotulo: 'Professor de Apoio',
    descricao: 'Acompanha alunos com necessidades de apoio.',
  },
  {
    valor: 'coordenacao',
    rotulo: 'Coordenação',
    descricao: 'Administra a escola, os convites e os dados institucionais.',
  },
] as const;

export function rotuloFuncao(funcao: Funcao | string | null | undefined): string {
  if (!funcao) return '';
  const encontrada = FUNCOES.find((item) => item.valor === funcao);
  return encontrada?.rotulo ?? String(funcao);
}

export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  emailVerificado: boolean;
  funcao?: Funcao | null;
}

export interface Vinculo {
  id: string;
  escolaNome: string;
  funcao: Funcao;
  ultimoUsado?: boolean;
}

export interface RespostaMe {
  usuario: Usuario;
  vinculos: Vinculo[];
}

export interface SessaoSnapshot {
  usuario: Usuario | null;
  vinculos: Vinculo[];
  contexto: Vinculo | null;
}

export type StatusLogin = 'ok' | 'mfa_requerido' | 'escolher_contexto' | 'sem_vinculo';

export interface RespostaLogin {
  status: StatusLogin;
}

export interface Convite {
  escolaNome: string;
  funcao: Funcao;
  email: string;
  expiraEm?: string;
  contaExistente: boolean;
  turmas?: string[];
  materias?: string[];
}

export interface ConviteEnviado {
  id: string;
  email: string;
  funcao: Funcao;
  status: 'pendente' | 'aceito' | 'expirado' | 'cancelado';
  enviadoEm?: string;
  turmas?: string[];
  materias?: string[];
}

export interface TurmaResumo {
  id: string;
  nome: string;
}

export interface MateriaResumo {
  id: string;
  nome: string;
}

export interface CriarEscolaPayload {
  cnpj: string;
  nomeEscola: string;
  emailInstitucional: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro?: string;
    cidade: string;
    uf: string;
  };
  responsavel: {
    nome: string;
    email: string;
    senha: string;
  };
}
