import type { StatusLogin } from '../auth.models';
import type { ErroMapeado } from '../api/mapear-erro';
import { mensagem } from '../auth.messages';

export type EstadoLogin =
  | 'inicial'
  | 'enviando'
  | 'bloqueado'
  | 'email_nao_verificado'
  | 'aguardando_mfa'
  | 'redirecionar_painel'
  | 'redirecionar_contexto'
  | 'redirecionar_sem_acesso';

export interface LoginState {
  estado: EstadoLogin;
  email: string;
  mensagem?: string;
  /** Instante (epoch ms) em que o bloqueio termina. */
  desbloqueiaEm?: number;
  segundosRestantes: number;
}

export type EventoLogin =
  | { tipo: 'enviar'; email: string; agora: number }
  | { tipo: 'resposta'; status: StatusLogin; agora: number }
  | { tipo: 'erro'; erro: ErroMapeado; agora: number }
  | { tipo: 'tick'; agora: number };

export function estadoInicialLogin(email = ''): LoginState {
  return { estado: 'inicial', email, segundosRestantes: 0 };
}

/**
 * Máquina de estados pura do login (seção 4.2 e TDD-030 a TDD-037).
 *
 * A tela apenas renderiza o estado; a decisão de navegação continua no
 * componente, que lê `estado` depois de cada transição.
 */
export function reduzirLogin(estado: LoginState, evento: EventoLogin): LoginState {
  switch (evento.tipo) {
    case 'enviar': {
      if (estado.estado === 'bloqueado') {
        const restante = calcularRestante(estado, evento.agora);
        if (restante > 0) return { ...estado, segundosRestantes: restante };
        return { ...estadoInicialLogin(evento.email), estado: 'enviando' };
      }
      if (estado.estado === 'enviando') return estado;
      return {
        ...estadoInicialLogin(evento.email),
        estado: 'enviando',
      };
    }

    case 'resposta': {
      switch (evento.status) {
        case 'ok':
          return { ...estadoInicialLogin(estado.email), estado: 'redirecionar_painel' };
        case 'mfa_requerido':
          return { ...estadoInicialLogin(estado.email), estado: 'aguardando_mfa' };
        case 'escolher_contexto':
          return { ...estadoInicialLogin(estado.email), estado: 'redirecionar_contexto' };
        case 'sem_vinculo':
          return { ...estadoInicialLogin(estado.email), estado: 'redirecionar_sem_acesso' };
      }
      return estado;
    }

    case 'erro': {
      const erro = evento.erro;
      if (erro.tipo === 'bloqueado') {
        return {
          estado: 'bloqueado',
          email: estado.email,
          mensagem: erro.mensagem,
          desbloqueiaEm: evento.agora + erro.segundos * 1000,
          segundosRestantes: erro.segundos,
        };
      }

      if (erro.tipo === 'email_nao_verificado') {
        return {
          estado: 'email_nao_verificado',
          email: estado.email,
          mensagem: erro.mensagem,
          segundosRestantes: 0,
        };
      }

      return {
        estado: 'inicial',
        email: estado.email,
        mensagem: erro.mensagem,
        segundosRestantes: 0,
      };
    }

    case 'tick': {
      if (estado.estado !== 'bloqueado' || estado.desbloqueiaEm === undefined) {
        return estado;
      }
      const restante = calcularRestante(estado, evento.agora);
      if (restante <= 0) {
        return {
          estado: 'inicial',
          email: estado.email,
          segundosRestantes: 0,
        };
      }
      if (restante === estado.segundosRestantes) return estado;
      return {
        ...estado,
        segundosRestantes: restante,
        mensagem: mensagem('api.bloqueado', {
          tempo: `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(
            restante % 60,
          ).padStart(2, '0')}`,
        }),
      };
    }
  }
}

function calcularRestante(estado: LoginState, agora: number): number {
  if (estado.desbloqueiaEm === undefined) return 0;
  return Math.max(0, Math.ceil((estado.desbloqueiaEm - agora) / 1000));
}
