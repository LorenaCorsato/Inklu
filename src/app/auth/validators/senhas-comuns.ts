/**
 * Lista embutida de senhas comuns (seção 14, item 6: ainda a confirmar com o
 * backend). Mantida pequena e minúscula; comparação é feita sem diferenciar
 * maiúsculas de minúsculas.
 */
export const SENHAS_COMUNS: readonly string[] = [
  '12345678',
  '123456789',
  '1234567890',
  'senha123',
  'senha1234',
  'password',
  'password1',
  'password123',
  'qwerty123',
  'abc12345',
  'abcd1234',
  'admin123',
  'administrador',
  'brasil123',
  'escola123',
  'professor',
  'professor123',
  'mudar123',
  'trocar123',
  'inklu123',
] as const;

export function ehSenhaComum(senha: string): boolean {
  // Comparação exata: a lista é de senhas inteiras, não de fragmentos.
  return SENHAS_COMUNS.includes(senha);
}
