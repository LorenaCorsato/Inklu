/**
 * Base da API. Os endpoints de autenticação da especificação ficam sob
 * `/auth`; os demais (`/escolas`, `/convites`) compartilham a mesma base.
 */
export const AUTH_API_BASE = 'http://localhost:3000/api';

export const SEGUNDOS_REENVIO_EMAIL = 60;
export const SEGUNDOS_BLOQUEIO_PADRAO = 60;
export const CACHE_SESSAO_MS = 30_000;

export const ROTAS = {
  login: '/entrar',
  mfa: '/entrar/mfa',
  cadastro: '/cadastro',
  verificarEmail: '/verificar-email',
  escolherFuncao: '/cadastro/funcao',
  recuperarSenha: '/recuperar-senha',
  redefinirSenha: '/redefinir-senha',
  contexto: '/contexto',
  semAcesso: '/sem-acesso',
  conviteInvalido: '/convite/invalido',
  cadastroEscola: '/escola/cadastro',
  convitesEscola: '/escola/convites',
  painel: '/painel',
} as const;
