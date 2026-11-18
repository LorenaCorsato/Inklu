import { describe, expect, it } from 'vitest';

import { validarNome } from './validarNome';
import { validarEmail } from './validarEmail';
import { forcaSenha, validarSenha } from './validarSenha';
import { validarConfirmacao } from './validarConfirmacao';
import { validarCnpj, mascararCnpj } from './validarCnpj';

describe('validadores', () => {
  it('[TDD-001] [BDD-002] validarNome rejeita vazio e nome com uma palavra', () => {
    expect(validarNome('')).toEqual({
      valido: false,
      erro: 'Informe seu nome completo',
    });
    expect(validarNome('Ana')).toEqual({
      valido: false,
      erro: 'Informe seu nome completo',
    });
    expect(validarNome('Ana Souza')).toEqual({ valido: true });
  });

  it('[TDD-002] [BDD-002] validarEmail rejeita "ana@x" e aceita "ana@x.com"', () => {
    expect(validarEmail('ana@x')).toEqual({
      valido: false,
      erro: 'Informe um e-mail válido',
    });
    expect(validarEmail('ana@x.com')).toEqual({ valido: true });
  });

  it('[TDD-003] [BDD-002] validarSenha rejeita menos de 8 caracteres', () => {
    expect(validarSenha('curta')).toEqual({
      valido: false,
      erro: 'A senha deve ter pelo menos 8 caracteres',
    });
  });

  it('[TDD-004] [BDD-002] validarSenha rejeita senha só com letras', () => {
    expect(validarSenha('senhafraca')).toEqual({
      valido: false,
      erro: 'A senha deve ter letras e números',
    });
  });

  it('[TDD-005] [BDD-002] validarSenha rejeita senha que contém o e-mail', () => {
    expect(validarSenha('ana@x.com1', { email: 'ana@x.com' })).toEqual({
      valido: false,
      erro: 'A senha não pode conter seu e-mail',
    });
    expect(validarSenha('Senha1234', { email: 'ana@x.com' })).toEqual({ valido: true });
  });

  it('[TDD-006] [BDD-002] validarSenha rejeita senha em lista de comuns', () => {
    expect(validarSenha('senha1234')).toEqual({
      valido: false,
      erro: 'Esta senha é muito comum. Escolha outra',
    });
  });

  it('[TDD-007] [BDD-002] validarSenha rejeita mais de 128 caracteres', () => {
    expect(validarSenha('A1'.repeat(70))).toEqual({
      valido: false,
      erro: 'A senha deve ter no máximo 128 caracteres',
    });
  });

  it('[TDD-008] [BDD-002] validarConfirmacao rejeita senhas diferentes', () => {
    expect(validarConfirmacao('Senha1234', 'Senha9999')).toEqual({
      valido: false,
      erro: 'As senhas não coincidem',
    });
    expect(validarConfirmacao('Senha1234', 'Senha1234')).toEqual({ valido: true });
  });

  it('[TDD-009] [BDD-003] forcaSenha retorna texto, não só cor', () => {
    expect(forcaSenha('abc')).toEqual({ nivel: 'fraca', rotulo: 'Senha fraca' });
    expect(forcaSenha('Senha1234')).toEqual({
      nivel: 'razoavel',
      rotulo: 'Senha razoável',
    });
    expect(forcaSenha('Senha1234!xyz')).toEqual({
      nivel: 'forte',
      rotulo: 'Senha forte',
    });
  });

  it('[TDD-010] [BDD-031] validarCNPJ rejeita dígitos verificadores incorretos', () => {
    expect(validarCnpj('11.222.333/0001-82')).toEqual({
      valido: false,
      erro: 'CNPJ inválido',
    });
    expect(validarCnpj('11111111111111')).toEqual({
      valido: false,
      erro: 'CNPJ inválido',
    });
  });

  it('[TDD-011] [BDD-031] validarCNPJ aceita CNPJ válido com ou sem máscara', () => {
    expect(validarCnpj('11.222.333/0001-81')).toEqual({ valido: true });
    expect(validarCnpj('11222333000181')).toEqual({ valido: true });
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
});
