import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, from, map, Observable, of, tap, throwError } from 'rxjs';

import { AUTH_API_BASE } from '../auth.config';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import type {
  Convite,
  ConviteEnviado,
  CriarEscolaPayload,
  Funcao,
  RespostaLogin,
  SessaoSnapshot,
  StatusLogin,
} from '../auth.models';
import { ApiError, paraApiError } from '../api/api-error';
import { SessaoStore } from '../state/sessao.store';

/**
 * Fachada de autenticação sobre o Firebase Authentication.
 *
 * Mantém a mesma API pública (métodos e assinaturas) usada pelas telas, de
 * modo que nenhum template precisa mudar: os erros do Firebase são convertidos
 * em `ApiError` com os códigos que `mapearErro` já entende
 * (`credenciais_invalidas`, `email_em_uso`, `bloqueado`, `token_expirado`,
 * `token_invalido`…).
 *
 * Os métodos de backend que dependiam de sessão em cookie (MFA, contexto,
 * convites, escola) foram preservados para as telas que ainda os usam, mas o
 * fluxo principal (login/cadastro/verificação/senha) é 100% Firebase.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(SessaoStore);
  private readonly firebase = inject(FirebaseAuthService);

  private url(caminho: string): string {
    return `${AUTH_API_BASE}${caminho}`;
  }

  // ─── Fluxo principal (Firebase) ────────────────────────────────────────────

  registrar(dados: { nome: string; email: string; senha: string }): Observable<unknown> {
    return from(
      (async () => {
        try {
          await this.firebase.register(dados.email, dados.senha);
          await this.firebase.atualizarNome(dados.nome);
          // Conta criada já sai logada; o e-mail de verificação chega em seguida.
          await this.firebase.enviarVerificacao();
        } catch (erro) {
          throw this.erroCadastro(erro);
        }
      })(),
    ).pipe(tap(() => this.store.invalidarCache()));
  }

  login(email: string, senha: string): Observable<RespostaLogin> {
    return from(
      (async () => {
        try {
          await this.firebase.login(email, senha);
        } catch (erro) {
          throw this.erroLogin(erro);
        }
        return { status: 'ok' as StatusLogin };
      })(),
    ).pipe(
      tap((resposta) => {
        this.store.emailPendente.set(email);
        this.store.mfaPendente.set(resposta.status === 'mfa_requerido');
        this.store.invalidarCache();
      }),
    );
  }

  /**
   * Entra (ou cria a conta) com o pop-up do Google. O Firebase cria o
   * usuário automaticamente no primeiro acesso, então o mesmo método serve
   * para login e cadastro. Resolve `null` quando o usuário fecha o pop-up —
   * nesse caso a tela só volta ao repouso, sem erro nem toast.
   */
  loginComGoogle(): Observable<RespostaLogin | null> {
    return from(
      (async () => {
        try {
          await this.firebase.loginWithGoogle();
        } catch (erro) {
          if (codigoFirebase(erro) === 'auth/popup-closed-by-user') return null;
          if (codigoFirebase(erro) === 'auth/cancelled-popup-request') return null;
          throw this.erroGoogle(erro);
        }
        return { status: 'ok' as StatusLogin };
      })(),
    ).pipe(
      tap((resposta) => {
        if (resposta) this.store.invalidarCache();
      }),
    );
  }

  logout(): Observable<void> {
    return from(this.firebase.logout()).pipe(
      catchError(() => of(undefined)),
      finalize(() => this.store.limpar()),
      map(() => undefined),
    );
  }

  /**
   * Monta a sessão a partir do usuário Firebase (sem HTTP). Um 401 aqui não
   * existe mais: sem usuário, a sessão é anônima — nunca erro.
   */
  carregarSessao(forcar = false): Observable<SessaoSnapshot> {
    if (!forcar && this.store.cacheValido()) {
      return of(this.store.snapshot());
    }

    return from(this.firebase.recarregar()).pipe(
      map((user) => {
        this.store.definirSessaoFirebase(
          user
            ? {
                uid: user.uid,
                email: user.email,
                nome: user.displayName,
                emailVerificado: user.emailVerified,
              }
            : null,
        );
        return this.store.snapshot();
      }),
      catchError((erro: unknown) => {
        const apiError = paraApiError(erro);
        if (apiError.status === 0) return throwError(() => apiError);
        this.store.limpar();
        return of(this.store.snapshot());
      }),
    );
  }

  garantirSessao(): Observable<SessaoSnapshot> {
    return this.carregarSessao(false);
  }

  /**
   * Confirma o e-mail com o código do link (`oobCode` do Firebase ou o
   * `token` legado). Em caso de sucesso o usuário segue já logado.
   */
  verificarEmail(token: string): Observable<{ proximo?: string }> {
    return from(
      (async () => {
        try {
          await this.firebase.aplicarCodigoVerificacao(token);
          await this.firebase.recarregar();
        } catch (erro) {
          throw this.erroCodigo(erro);
        }
        this.store.invalidarCache();
        return { proximo: 'inicio' };
      })(),
    );
  }

  reenviarVerificacao(email: string): Observable<void> {
    return from(
      (async () => {
        try {
          const atual = this.firebase.usuarioAtual;
          if (!atual) throw new ApiError(401, 'credenciais_invalidas');
          if (atual.email && atual.email.toLowerCase() !== email.trim().toLowerCase()) {
            // Outro usuário assumiu a sessão: não vaza informação, só reenvia.
          }
          await this.firebase.enviarVerificacao();
        } catch (erro) {
          if (erro instanceof ApiError) throw erro;
          throw this.erroGenericoOuRede(erro);
        }
      })(),
    );
  }

  esquecerSenha(email: string): Observable<void> {
    // 202 sempre: a resposta não revela se a conta existe — conta inexistente
    // ou e-mail malformado resolvem em sucesso silencioso.
    return from(
      (async () => {
        try {
          await this.firebase.enviarResetSenha(email);
        } catch (erro) {
          const code = codigoFirebase(erro);
          if (code === 'auth/user-not-found' || code === 'auth/invalid-email') return;
          throw this.erroGenericoOuRede(erro);
        }
      })(),
    );
  }

  redefinirSenha(token: string, senha: string): Observable<unknown> {
    return from(
      (async () => {
        try {
          await this.firebase.confirmarResetSenha(token, senha);
        } catch (erro) {
          const code = codigoFirebase(erro);
          if (code === 'auth/weak-password') {
            throw new ApiError(422, 'validacao', {
              senha: 'A senha deve ter pelo menos 8 caracteres',
            });
          }
          throw this.erroCodigo(erro);
        }
      })(),
    );
  }

  // ─── Conversão de erros do Firebase ─────────────────────────────────────────

  private erroLogin(erro: unknown): ApiError {
    switch (codigoFirebase(erro)) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
      case 'auth/missing-password':
        return new ApiError(401, 'credenciais_invalidas');
      case 'auth/too-many-requests':
        return new ApiError(429, 'bloqueado', undefined, 60);
      case 'auth/network-request-failed':
        return new ApiError(0);
      default:
        return new ApiError(500, 'login_falhou');
    }
  }

  private erroGoogle(erro: unknown): ApiError {
    switch (codigoFirebase(erro)) {
      case 'auth/popup-blocked':
        return new ApiError(500, 'google_popup_bloqueado');
      case 'auth/network-request-failed':
        return new ApiError(0);
      default:
        return new ApiError(500, 'login_falhou');
    }
  }

  private erroCadastro(erro: unknown): ApiError {
    switch (codigoFirebase(erro)) {
      case 'auth/email-already-in-use':
        return new ApiError(409, 'email_em_uso');
      case 'auth/invalid-email':
        return new ApiError(422, 'validacao', { email: 'Informe um e-mail válido' });
      case 'auth/weak-password':
        return new ApiError(422, 'validacao', {
          senha: 'A senha deve ter pelo menos 8 caracteres',
        });
      case 'auth/network-request-failed':
        return new ApiError(0);
      default:
        return new ApiError(500, 'cadastro_falhou');
    }
  }

  private erroCodigo(erro: unknown): ApiError {
    switch (codigoFirebase(erro)) {
      case 'auth/expired-action-code':
        return new ApiError(410, 'token_expirado');
      case 'auth/invalid-action-code':
      case 'auth/user-not-found':
        return new ApiError(404, 'token_invalido');
      case 'auth/network-request-failed':
        return new ApiError(0);
      default:
        return new ApiError(500, 'codigo_falhou');
    }
  }

  private erroGenericoOuRede(erro: unknown): ApiError {
    return codigoFirebase(erro) === 'auth/network-request-failed'
      ? new ApiError(0)
      : new ApiError(500, 'operacao_falhou');
  }

  // ─── Legado backend (telas fora do fluxo principal) ─────────────────────────

  definirFuncao(funcao: Funcao): Observable<{ proximo?: string }> {
    return this.http
      .post<{ proximo?: string }>(this.url('/auth/individual/funcao'), { funcao })
      .pipe(tap(() => this.store.invalidarCache()));
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
}

function codigoFirebase(erro: unknown): string {
  return typeof erro === 'object' && erro !== null && 'code' in erro
    ? String((erro as { code: unknown }).code)
    : '';
}

export type { StatusLogin };
