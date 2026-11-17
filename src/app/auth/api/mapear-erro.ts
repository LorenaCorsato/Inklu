import { ApiError, paraApiError } from './api-error';
import { mensagem as m } from '../auth.messages';

export type ContextoErro = 'auth' | 'convite' | 'escola' | 'redefinicao';

export interface OpcoesMapearErro {
  retryAfterSeg?: number;
  campos?: Record<string, string>;
  contexto?: ContextoErro;
}

export type ErroMapeado =
  | { tipo: 'campo'; campo: string; mensagem: string; codigo?: string }
  | { tipo: 'campos'; campos: Record<string, string>; mensagem: string }
  | { tipo: 'credenciais'; codigo: 'credenciais_invalidas'; mensagem: string }
  | { tipo: 'email_nao_verificado'; codigo: 'email_nao_verificado'; mensagem: string }
  | { tipo: 'bloqueado'; codigo: 'bloqueado'; mensagem: string; segundos: number }
  | { tipo: 'expirado'; codigo: string; mensagem: string }
  | { tipo: 'usado'; codigo: string; mensagem: string }
  | { tipo: 'invalido'; codigo: string; mensagem: string }
  | { tipo: 'mensagem'; codigo?: string; mensagem: string }
  | { tipo: 'offline'; mensagem: string }
  | { tipo: 'generico'; mensagem: string };

function normalizar(entrada: number | unknown, extras: OpcoesMapearErro): ApiError {
  if (typeof entrada === 'number') {
    return new ApiError(
      entrada,
      undefined,
      extras.campos,
      extras.retryAfterSeg,
    );
  }
  const erro = paraApiError(entrada);
  return new ApiError(
    erro.status,
    erro.codigo,
    erro.campos ?? extras.campos,
    erro.retryAfterSeg ?? extras.retryAfterSeg,
  );
}

/**
 * Traduz códigos de erro do backend para um estado de tela.
 *
 * Aceita tanto `mapearErro(409, 'email_em_uso')` quanto o próprio erro do
 * transporte. Códigos desconhecidos caem em `sistema.generico` sem vazar
 * detalhe técnico.
 */
export function mapearErro(
  entrada: number | unknown,
  codigo?: string,
  extras: OpcoesMapearErro = {},
): ErroMapeado {
  const erro = normalizar(entrada, extras);
  const codigoFinal = codigo ?? erro.codigo;
  const contexto = extras.contexto ?? 'auth';

  if (erro.status === 0) {
    return { tipo: 'offline', mensagem: m('sistema.rede') };
  }

  if (erro.status === 429 || codigoFinal === 'bloqueado') {
    const segundos = erro.retryAfterSeg ?? extras.retryAfterSeg ?? 60;
    return {
      tipo: 'bloqueado',
      codigo: 'bloqueado',
      mensagem: m('api.bloqueado', { tempo: formatarTempo(segundos) }),
      segundos,
    };
  }

  switch (codigoFinal) {
    case 'email_em_uso':
      return {
        tipo: 'campo',
        campo: 'email',
        codigo: codigoFinal,
        mensagem: m('api.email_em_uso'),
      };

    case 'cnpj_em_uso':
      return {
        tipo: 'campo',
        campo: 'cnpj',
        codigo: codigoFinal,
        mensagem: m('api.cnpj_em_uso'),
      };

    case 'credenciais_invalidas':
      return {
        tipo: 'credenciais',
        codigo: 'credenciais_invalidas',
        mensagem: m('api.credenciais_invalidas'),
      };

    case 'email_nao_verificado':
      return {
        tipo: 'email_nao_verificado',
        codigo: 'email_nao_verificado',
        mensagem: m('api.email_nao_verificado'),
      };

    case 'mfa_invalido':
    case 'codigo_invalido':
      return { tipo: 'mensagem', codigo: codigoFinal, mensagem: m('api.mfa_invalido') };

    case 'token_expirado':
      return {
        tipo: 'expirado',
        codigo: codigoFinal,
        mensagem:
          contexto === 'convite'
            ? m('api.convite_expirado')
            : m('api.token_expirado'),
      };

    case 'expirado':
      return {
        tipo: 'expirado',
        codigo: codigoFinal,
        mensagem:
          contexto === 'convite' ? m('api.convite_expirado') : m('api.token_expirado'),
      };

    case 'ja_utilizado':
    case 'convite_usado':
      return {
        tipo: 'usado',
        codigo: codigoFinal,
        mensagem: m('api.convite_usado'),
      };

    case 'token_invalido':
      return {
        tipo: 'invalido',
        codigo: codigoFinal,
        mensagem:
          contexto === 'convite' ? m('api.convite_invalido') : m('api.token_invalido'),
      };

    case 'ja_vinculado':
      return { tipo: 'mensagem', codigo: codigoFinal, mensagem: m('api.ja_vinculado') };

    case 'funcao_ja_definida':
      return {
        tipo: 'mensagem',
        codigo: codigoFinal,
        mensagem: m('api.funcao_ja_definida'),
      };

    case 'sem_permissao':
      return { tipo: 'mensagem', codigo: codigoFinal, mensagem: m('sistema.sem_permissao') };
  }

  if (erro.status === 401) {
    return {
      tipo: 'credenciais',
      codigo: 'credenciais_invalidas',
      mensagem: m('api.credenciais_invalidas'),
    };
  }

  if (erro.status === 403) {
    return { tipo: 'mensagem', mensagem: m('sistema.sem_permissao') };
  }

  if (erro.status === 410) {
    return {
      tipo: 'expirado',
      codigo: 'token_expirado',
      mensagem: contexto === 'convite' ? m('api.convite_expirado') : m('api.token_expirado'),
    };
  }

  if (erro.status === 404) {
    return {
      tipo: 'invalido',
      codigo: 'token_invalido',
      mensagem:
        contexto === 'convite' ? m('api.convite_invalido') : m('api.token_invalido'),
    };
  }

  if (erro.status === 409) {
    return { tipo: 'mensagem', mensagem: m('sistema.generico') };
  }

  if (erro.status === 422 && erro.campos) {
    return {
      tipo: 'campos',
      campos: erro.campos,
      mensagem: m('sistema.generico'),
    };
  }

  return { tipo: 'generico', mensagem: m('sistema.generico') };
}

function formatarTempo(segundos: number): string {
  const minutos = Math.ceil(segundos / 60);
  if (segundos < 60) return `${segundos} segundos`;
  return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
}
