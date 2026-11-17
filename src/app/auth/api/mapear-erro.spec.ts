import { describe, expect, it } from 'vitest';

import { mapearErro } from './mapear-erro';
import { ApiError } from './api-error';

describe('mapearErro', () => {
  it('[TDD-020] [BDD-004] 409 email_em_uso aponta para o campo e-mail', () => {
    const mapeado = mapearErro(409, 'email_em_uso');
    expect(mapeado).toMatchObject({
      tipo: 'campo',
      campo: 'email',
      mensagem: 'Já existe uma conta com este e-mail. Entrar?',
    });
  });

  it('[TDD-021] [BDD-063] 401 credenciais_invalidas usa mensagem genérica', () => {
    const mapeado = mapearErro(401, 'credenciais_invalidas');
    expect(mapeado).toMatchObject({
      tipo: 'credenciais',
      mensagem: 'E-mail ou senha inválidos',
    });
    expect(mapeado.mensagem).not.toMatch(/existe|não existe|inexistente/i);
  });

  it('[TDD-022] [BDD-065] 429 vira bloqueado com os segundos informados', () => {
    const mapeado = mapearErro(429, 'bloqueado', { retryAfterSeg: 300 });
    expect(mapeado).toMatchObject({
      tipo: 'bloqueado',
      segundos: 300,
    });
    expect(mapeado.mensagem).toContain('5 minutos');
  });

  it('[TDD-023] [BDD-053] 410 em convite vira estado expirado', () => {
    const mapeado = mapearErro(410, 'expirado', { contexto: 'convite' });
    expect(mapeado).toMatchObject({
      tipo: 'expirado',
      mensagem:
        'Este convite expirou. Peça à coordenação da escola para enviar um novo',
    });
  });

  it('[TDD-024] código desconhecido usa mensagem genérica sem detalhe técnico', () => {
    const mapeado = mapearErro(new ApiError(500, 'erro_interno_bd_42'));
    expect(mapeado).toEqual({
      tipo: 'generico',
      mensagem: 'Algo deu errado. Tente novamente em alguns instantes',
    });
    expect(mapeado.mensagem).not.toContain('erro_interno_bd_42');
  });

  it('[TDD-025] [BDD-005] falha de rede vira estado offline', () => {
    expect(mapearErro(new TypeError('Failed to fetch'))).toEqual({
      tipo: 'offline',
      mensagem: 'Não foi possível conectar. Verifique sua internet e tente de novo',
    });
  });
});
