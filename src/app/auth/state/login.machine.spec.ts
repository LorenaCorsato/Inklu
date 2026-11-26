import { describe, expect, it } from 'vitest';

import { estadoInicialLogin, reduzirLogin } from './login.machine';
import { mapearErro } from '../api/mapear-erro';
import { ApiError } from '../api/api-error';

const AGORA = 1_000_000;

describe('máquina de estados do login', () => {
  it('[TDD-030] [BDD-060] resposta ok leva a redirecionar_painel', () => {
    const estado = reduzirLogin(estadoInicialLogin('ana@x.com'), {
      tipo: 'resposta',
      status: 'ok',
      agora: AGORA,
    });
    expect(estado.estado).toBe('redirecionar_painel');
  });

  it('[TDD-031] [BDD-061] escolher_contexto leva a redirecionar_contexto', () => {
    const estado = reduzirLogin(estadoInicialLogin('ana@x.com'), {
      tipo: 'resposta',
      status: 'escolher_contexto',
      agora: AGORA,
    });
    expect(estado.estado).toBe('redirecionar_contexto');
  });

  it('[TDD-032] [BDD-062] sem_vinculo leva a redirecionar_sem_acesso', () => {
    const estado = reduzirLogin(estadoInicialLogin('ana@x.com'), {
      tipo: 'resposta',
      status: 'sem_vinculo',
      agora: AGORA,
    });
    expect(estado.estado).toBe('redirecionar_sem_acesso');
  });

  it('[TDD-033] [BDD-067] mfa_requerido leva a aguardando_mfa', () => {
    const estado = reduzirLogin(estadoInicialLogin('ana@x.com'), {
      tipo: 'resposta',
      status: 'mfa_requerido',
      agora: AGORA,
    });
    expect(estado.estado).toBe('aguardando_mfa');
  });

  it('[TDD-034] [BDD-005] erro de rede volta para inicial preservando o e-mail', () => {
    const enviando = reduzirLogin(estadoInicialLogin(''), {
      tipo: 'enviar',
      email: 'ana@x.com',
      agora: AGORA,
    });
    expect(enviando.estado).toBe('enviando');

    const estado = reduzirLogin(enviando, {
      tipo: 'erro',
      erro: mapearErro(new TypeError('offline')),
      agora: AGORA,
    });

    expect(estado.estado).toBe('inicial');
    expect(estado.email).toBe('ana@x.com');
    expect(estado.mensagem).toBe(
      'Não foi possível conectar. Verifique sua internet e tente de novo',
    );
  });

  it('[TDD-035] [BDD-065] 429 bloqueia e agenda o desbloqueio', () => {
    const estado = reduzirLogin(estadoInicialLogin('ana@x.com'), {
      tipo: 'erro',
      erro: mapearErro(new ApiError(429, 'bloqueado', undefined, 300)),
      agora: AGORA,
    });

    expect(estado.estado).toBe('bloqueado');
    expect(estado.desbloqueiaEm).toBe(AGORA + 300_000);
    expect(estado.segundosRestantes).toBe(300);
  });

  it('[TDD-036] bloqueado não aceita envio até o timer terminar', () => {
    const bloqueado = reduzirLogin(estadoInicialLogin('ana@x.com'), {
      tipo: 'erro',
      erro: mapearErro(new ApiError(429, 'bloqueado', undefined, 60)),
      agora: AGORA,
    });

    const aindaBloqueado = reduzirLogin(bloqueado, {
      tipo: 'enviar',
      email: 'ana@x.com',
      agora: AGORA + 1_000,
    });
    expect(aindaBloqueado.estado).toBe('bloqueado');

    const desbloqueado = reduzirLogin(aindaBloqueado, {
      tipo: 'tick',
      agora: AGORA + 60_000,
    });
    expect(desbloqueado.estado).toBe('inicial');
    expect(desbloqueado.segundosRestantes).toBe(0);
  });

  it('[TDD-037] [BDD-064] email_nao_verificado leva ao estado correspondente', () => {
    const estado = reduzirLogin(estadoInicialLogin('ana@x.com'), {
      tipo: 'erro',
      erro: mapearErro(new ApiError(403, 'email_nao_verificado')),
      agora: AGORA,
    });
    expect(estado.estado).toBe('email_nao_verificado');
  });
});
