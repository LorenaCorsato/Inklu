export type ResultadoValidacao =
  | { valido: true }
  | { valido: false; erro: string };
