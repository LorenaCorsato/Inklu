import { mensagem } from '../auth.messages';
import type { ResultadoValidacao } from './tipos';

/** Nome completo: obrigatório e com pelo menos duas palavras. */
export function validarNome(nome: string | null | undefined): ResultadoValidacao {
  const valor = (nome ?? '').trim();
  if (!valor) {
    return { valido: false, erro: mensagem('campo.nome.obrigatorio') };
  }

  const partes = valor.split(/\s+/).filter(Boolean);
  if (partes.length < 2) {
    return { valido: false, erro: mensagem('campo.nome.obrigatorio') };
  }

  return { valido: true };
}
