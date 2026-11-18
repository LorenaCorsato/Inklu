import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';

import { AUTH_API_BASE } from '../auth.config';
import type {
  Convite,
  ConviteEnviado,
  CriarEscolaPayload,
  Funcao,
  RespostaLogin,
  RespostaMe,
  SessaoSnapshot,
  StatusLogin,
} from '../auth.models';
import { paraApiError } from '../api/api-error';
import { SessaoStore } from '../state/sessao.store';

/**
 * Cliente da API de autenticação e dono do ciclo de vida da sessão local.
 *
 * Nenhum método decide autorização: apenas transporta a resposta do servidor
 * e mantém o cache de `/auth/me`, invalidado em login/logout.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(SessaoStore);

  private url(caminho: string): string {
    return `${AUTH_API_BASE}${caminho}`;
  }

  registrar(dados: { nome: string; email: string; senha: string }): Observable<unknown> {
    return this.http.post(this.url('/auth/register'), dados);
  }

  verificarEmail(token: string): Observable<{ proximo?: string }> {
    return this.http.post<{ proximo?: string }>(this.url('/auth/verify-email'), { token }).pipe(
      tap(() => this.store.invalidarCache()),
    );
  }

  reenviarVerificacao(email: string): Observable<void> {
    // 202 sempre: a resposta não revela se a conta existe.
    return this.http.post<void>(this.url('/auth/resend-verification'), { email });
  }

  definirFuncao(funcao: Funcao): Observable<{ proximo?: string }> {
    return this.http
      .post<{ proximo?: string }>(this.url('/auth/individual/funcao'), { funcao })
      .pipe(tap(() => this.store.invalidarCache()));
  }

  login(email: string, senha: string): Observable<RespostaLogin> {
    return this.http.post<RespostaLogin>(this.url('/auth/login'), { email, senha }).pipe(
      tap((resposta) => {
        this.store.emailPendente.set(email);
        this.store.mfaPendente.set(resposta.status === 'mfa_requerido');
        this.store.invalidarCache();
      }),
    );
  }

  verificarMfa(codigo: string): Observable<unknown> {
    return this.http.post(this.url('/auth/mfa/verificar'), { codigo }).pipe(
      tap(() => {
        this.store.mfaPendente.set(false);
        this.store.invalidarCache();
      }),
    );
  }

  escolherContexto(vinculoId: string): Observable<{ proximo?: string }> {
    return this.http
      .post<{ proximo?: string }>(this.url('/auth/contexto'), { vinculoId })
      .pipe(
        tap(() => {
          this.store.definirContexto(vinculoId);
        }),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.url('/auth/logout'), {}).pipe(
      catchError((erro: unknown) => {
        // Mesmo se o servidor falhar, a sessão local não deve continuar viva.
        return of(undefined);
      }),
      finalize(() => this.store.limpar()),
      map(() => undefined),
    );
  }

  /**
   * Busca a sessão com cache curto. Um 401 significa "anônimo", não erro.
   */
  carregarSessao(forcar = false): Observable<SessaoSnapshot> {
    if (!forcar && this.store.cacheValido()) {
      return of(this.store.snapshot());
    }

    return this.http.get<RespostaMe>(this.url('/auth/me')).pipe(
      tap((resposta) => this.store.definirSessao(resposta)),
      map(() => this.store.snapshot()),
      catchError((erro: unknown) => {
        const apiError = paraApiError(erro);
        if (apiError.status === 401) {
          this.store.limpar();
          return of(this.store.snapshot());
        }
        return throwError(() => apiError);
      }),
    );
  }

  garantirSessao(): Observable<SessaoSnapshot> {
    return this.carregarSessao(false);
  }

  obterConvite(token: string): Observable<Convite> {
    return this.http.get<Convite>(this.url(`/convites/${encodeURIComponent(token)}`));
  }

  aceitarConvite(token: string, dados: { nome?: string; senha?: string }): Observable<unknown> {
    return this.http
      .post(this.url(`/convites/${encodeURIComponent(token)}/aceitar`), dados)
      .pipe(tap(() => this.store.invalidarCache()));
  }

  criarEscola(payload: CriarEscolaPayload): Observable<{ id?: string }> {
    return this.http.post<{ id?: string }>(this.url('/escolas'), payload);
  }

  enviarConvite(payload: {
    email: string;
    funcao: Funcao;
    turmaIds?: string[];
    materiaIds?: string[];
  }): Observable<ConviteEnviado> {
    return this.http.post<ConviteEnviado>(this.url('/convites'), payload);
  }

  listarConvites(): Observable<ConviteEnviado[]> {
    return this.http.get<ConviteEnviado[]>(this.url('/convites'));
  }

  reenviarConvite(id: string): Observable<unknown> {
    return this.http.post(this.url(`/convites/${encodeURIComponent(id)}/reenviar`), {});
  }

  cancelarConvite(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`/convites/${encodeURIComponent(id)}`));
  }

  esquecerSenha(email: string): Observable<void> {
    // 202 sempre, exista ou não a conta.
    return this.http.post<void>(this.url('/auth/senha/esqueci'), { email });
  }

  redefinirSenha(token: string, senha: string): Observable<unknown> {
    return this.http.post(this.url('/auth/senha/redefinir'), { token, senha });
  }
}

export type { StatusLogin };
