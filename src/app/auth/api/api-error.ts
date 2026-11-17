/**
 * Erro normalizado das chamadas de autenticação.
 *
 * O interceptor converte respostas HTTP do backend neste tipo para que as
 * telas nunca precisem conhecer detalhes do transporte.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly codigo?: string;
  readonly campos?: Record<string, string>;
  readonly retryAfterSeg?: number;

  constructor(
    status: number,
    codigo?: string,
    campos?: Record<string, string>,
    retryAfterSeg?: number,
  ) {
    super(codigo ?? `Erro HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
    this.retryAfterSeg = retryAfterSeg;
  }
}

interface CorpoErroApi {
  codigo?: unknown;
  campos?: unknown;
  retryAfterSeg?: unknown;
}

interface ErroSemelhanteHttp {
  status?: unknown;
  error?: unknown;
}

function numeroOuIndefinido(valor: unknown): number | undefined {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : undefined;
}

function textoOuIndefinido(valor: unknown): string | undefined {
  return typeof valor === 'string' ? valor : undefined;
}

function camposOuIndefinido(valor: unknown): Record<string, string> | undefined {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return undefined;
  const resultado: Record<string, string> = {};
  for (const [chave, mensagem] of Object.entries(valor as Record<string, unknown>)) {
    if (typeof mensagem === 'string') resultado[chave] = mensagem;
  }
  return resultado;
}

/** Converte qualquer falha (HTTP, TypeError de rede, ApiError) em ApiError. */
export function paraApiError(erro: unknown): ApiError {
  if (erro instanceof ApiError) return erro;

  if (erro instanceof TypeError) {
    return new ApiError(0);
  }

  if (erro && typeof erro === 'object') {
    const semelhante = erro as ErroSemelhanteHttp;
    const status = numeroOuIndefinido(semelhante.status);

    if (status !== undefined) {
      const corpo =
        semelhante.error && typeof semelhante.error === 'object'
          ? (semelhante.error as CorpoErroApi)
          : undefined;

      return new ApiError(
        status,
        textoOuIndefinido(corpo?.codigo),
        camposOuIndefinido(corpo?.campos),
        numeroOuIndefinido(corpo?.retryAfterSeg),
      );
    }
  }

  return new ApiError(0);
}
