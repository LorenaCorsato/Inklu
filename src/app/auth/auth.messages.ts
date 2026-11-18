/**
 * Catálogo único de mensagens da especificação (seção 10).
 *
 * Nenhum texto de erro deve ser escrito solto nos componentes. Assim a
 * revisão contra o catálogo fica mecânica.
 */
export const MENSAGENS = {
  'campo.nome.obrigatorio': 'Informe seu nome completo',
  'campo.email.invalido': 'Informe um e-mail válido',
  'campo.senha.curta': 'A senha deve ter pelo menos 8 caracteres',
  'campo.senha.longa': 'A senha deve ter no máximo 128 caracteres',
  'campo.senha.sem_letra_ou_numero': 'A senha deve ter letras e números',
  'campo.senha.contem_email': 'A senha não pode conter seu e-mail',
  'campo.senha.comum': 'Esta senha é muito comum. Escolha outra',
  'campo.senha.confirmacao': 'As senhas não coincidem',
  'campo.cnpj.invalido': 'CNPJ inválido',
  'campo.cep.invalido': 'Informe um CEP válido',
  'campo.obrigatorio': 'Campo obrigatório',
  'api.email_em_uso': 'Já existe uma conta com este e-mail. Entrar?',
  'api.cnpj_em_uso': 'Já existe uma escola cadastrada com este CNPJ',
  'api.credenciais_invalidas': 'E-mail ou senha inválidos',
  'api.email_nao_verificado': 'Confirme seu e-mail para continuar',
  'api.bloqueado': 'Muitas tentativas. Tente de novo em {tempo}',
  'api.mfa_invalido': 'Código incorreto. Confira no seu aplicativo',
  'api.token_expirado': 'Este link expirou',
  'api.token_invalido': 'Este link não é válido. Ele pode já ter sido usado',
  'api.convite_expirado':
    'Este convite expirou. Peça à coordenação da escola para enviar um novo',
  'api.convite_usado': 'Este convite já foi usado. Se você já aceitou, entre na sua conta',
  'api.convite_invalido': 'Este link não é válido. Confira se copiou o endereço completo',
  'api.ja_vinculado': 'Este professor já faz parte da escola',
  'api.funcao_ja_definida': 'Sua função já está definida',
  'sistema.rede': 'Não foi possível conectar. Verifique sua internet e tente de novo',
  'sistema.lento': 'Isso está demorando mais que o normal',
  'sistema.sessao_expirada': 'Sua sessão expirou. Entre novamente',
  'sistema.sem_permissao': 'Você não tem permissão para acessar esta área',
  'sistema.generico': 'Algo deu errado. Tente novamente em alguns instantes',
  'sistema.acesso_negado': 'Você não tem permissão para acessar esta área',
  'sistema.escolha_funcao': 'Sua função já está definida',
} as const;

export type CodigoMensagem = keyof typeof MENSAGENS;

export function mensagem(codigo: CodigoMensagem, substituicoes?: Record<string, string>): string {
  let texto: string = MENSAGENS[codigo];
  if (substituicoes) {
    for (const [chave, valor] of Object.entries(substituicoes)) {
      texto = texto.replaceAll(`{${chave}}`, valor);
    }
  }
  return texto;
}

/** Formata segundos como MM:SS, com minutos podendo passar de 59. */
export function formatarMMSS(totalSegundos: number): string {
  const segundos = Math.max(0, Math.floor(totalSegundos));
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}
