import { mensagem } from '../auth.messages';
import type { ResultadoValidacao } from './tipos';

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validação local: formato apenas. Existência é sempre decidida pelo servidor. */
export function validarEmail(email: string | null | undefined): ResultadoValidacao {
  const valor = (email ?? '').trim();
  if (!valor || !FORMATO_EMAIL.test(valor)) {
    return { valido: false, erro: mensagem('campo.email.invalido') };
  }
  return { valido: true };
}
