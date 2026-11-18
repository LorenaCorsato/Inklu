import { mensagem } from '../auth.messages';
import type { ResultadoValidacao } from './tipos';

export function validarConfirmacao(
  senha: string,
  confirmacao: string,
): ResultadoValidacao {
  if (senha !== confirmacao) {
    return { valido: false, erro: mensagem('campo.senha.confirmacao') };
  }
  return { valido: true };
}
