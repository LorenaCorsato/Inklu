import { mensagem } from '../auth.messages';
import { ehSenhaComum } from './senhas-comuns';
import type { ResultadoValidacao } from './tipos';

export interface OpcoesSenha {
  /** E-mail da conta: a senha não pode contê-lo. */
  email?: string;
  /** Permite injetar outra lista em testes ou quando o back fornecer uma. */
  senhasComuns?: readonly string[];
}

/**
 * Regras da seção 1.2, na ordem em que o usuário deve receber o primeiro
 * problema: comprimento, relação com o e-mail, senha comum, composição.
 */
export function validarSenha(
  senha: string | null | undefined,
  opcoes: OpcoesSenha = {},
): ResultadoValidacao {
  const valor = senha ?? '';

  if (valor.length < 8) {
    return { valido: false, erro: mensagem('campo.senha.curta') };
  }

  if (valor.length > 128) {
    return { valido: false, erro: mensagem('campo.senha.longa') };
  }

  const email = (opcoes.email ?? '').trim().toLowerCase();
  if (email && valor.toLowerCase().includes(email)) {
    return { valido: false, erro: mensagem('campo.senha.contem_email') };
  }

  const comuns = opcoes.senhasComuns ?? null;
  const comum = comuns ? comuns.includes(valor) : ehSenhaComum(valor);
  if (comum) {
    return { valido: false, erro: mensagem('campo.senha.comum') };
  }

  const temLetra = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(valor);
  const temNumero = /\d/.test(valor);
  if (!temLetra || !temNumero) {
    return { valido: false, erro: mensagem('campo.senha.sem_letra_ou_numero') };
  }

  return { valido: true };
}

export type NivelForca = 'fraca' | 'razoavel' | 'forte';

export interface ForcaSenha {
  nivel: NivelForca;
  rotulo: string;
}

/**
 * Indicador de força sempre em texto (nunca só cor). Não substitui
 * `validarSenha`: uma senha "forte" ainda pode ser inválida por conter o
 * e-mail, por exemplo.
 */
export function forcaSenha(senha: string | null | undefined): ForcaSenha {
  const valor = senha ?? '';
  if (!valor) return { nivel: 'fraca', rotulo: 'Senha fraca' };

  let pontos = 0;
  if (valor.length >= 8) pontos += 1;
  if (valor.length >= 12) pontos += 1;
  if (/[a-z]/.test(valor) && /[A-Z]/.test(valor)) pontos += 1;
  if (/\d/.test(valor)) pontos += 1;
  if (/[^A-Za-z0-9]/.test(valor)) pontos += 1;

  if (pontos <= 1) return { nivel: 'fraca', rotulo: 'Senha fraca' };
  if (pontos <= 3) return { nivel: 'razoavel', rotulo: 'Senha razoável' };
  return { nivel: 'forte', rotulo: 'Senha forte' };
}
