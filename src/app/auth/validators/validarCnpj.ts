import { mensagem } from '../auth.messages';
import type { ResultadoValidacao } from './tipos';

export function somenteDigitos(valor: string): string {
  return (valor ?? '').replace(/\D/g, '');
}

/** Valida os 14 dígitos e os dois dígitos verificadores do CNPJ. */
export function validarCnpj(cnpj: string | null | undefined): ResultadoValidacao {
  const digitos = somenteDigitos(cnpj ?? '');

  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) {
    return { valido: false, erro: mensagem('campo.cnpj.invalido') };
  }

  const calcularDigito = (base: string): number => {
    let peso = base.length - 7;
    let soma = 0;
    for (const caractere of base) {
      soma += Number(caractere) * peso;
      peso -= 1;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(digitos.slice(0, 12));
  const segundo = calcularDigito(digitos.slice(0, 12) + String(primeiro));

  if (Number(digitos[12]) !== primeiro || Number(digitos[13]) !== segundo) {
    return { valido: false, erro: mensagem('campo.cnpj.invalido') };
  }

  return { valido: true };
}

/** Máscara progressiva: aceita colagem e não exige digitar pontuação. */
export function mascararCnpj(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function mascararCep(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
