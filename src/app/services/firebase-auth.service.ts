import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  applyActionCode,
  Auth,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

let firebaseApp: FirebaseApp | undefined;

/** Inicializa o Firebase uma única vez (idempotente, seguro em SSR/testes). */
function getFirebaseApp(): FirebaseApp | null {
  try {
    if (firebaseApp) return firebaseApp;
    firebaseApp = getApps().length ? getApps()[0]! : initializeApp(environment.firebaseConfig);
    return firebaseApp;
  } catch {
    return null;
  }
}

/**
 * Serviço de autenticação Firebase (moderno: `providedIn: 'root'` + `inject()`).
 *
 * Usa o SDK modular `firebase/auth` — que já vem com o pacote `firebase`
 * instalado no projeto — então **não exige instalar `@angular/fire`**.
 *
 * Nomeado `FirebaseAuthService` (e não `AuthService`) para não colidir com o
 * `AuthService` do backend próprio em `src/app/auth/services/auth.service.ts`.
 *
 * > Se preferir o padrão `@angular/fire` do enunciado, rode
 * > `npm i @angular/fire` e registre no `app.config.ts`:
 * > `provideFirebaseApp(() => initializeApp(environment.firebaseConfig))` +
 * > `provideAuth(() => getAuth())`, trocando os imports deste serviço para
 * > `@angular/fire/auth`. A API pública abaixo permanece idêntica.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth: Auth | null = isPlatformBrowser(this.platformId)
    ? getAuth(getFirebaseApp() ?? undefined)
    : null;

  /**
   * Emite o usuário logado (ou `null`) sempre que o estado muda.
   * Fora do browser (SSR) emite `null` sem tocar no SDK.
   */
  readonly currentUser$: Observable<User | null> = new Observable<User | null>(
    (subscriber) => {
      if (!this.auth) {
        subscriber.next(null);
        subscriber.complete();
        return;
      }
      subscriber.next(this.auth.currentUser);
      return onAuthStateChanged(this.auth, (user) => subscriber.next(user));
    },
  );

  private exigirAuth(): Auth {
    if (!this.auth) throw { code: 'auth/network-request-failed' };
    return this.auth;
  }

  login(email: string, pass: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.exigirAuth(), email.trim(), pass);
  }

  register(email: string, pass: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.exigirAuth(), email.trim(), pass);
  }

  loginWithGoogle(): Promise<UserCredential> {
    return signInWithPopup(this.exigirAuth(), new GoogleAuthProvider());
  }

  logout(): Promise<void> {
    return this.auth ? signOut(this.auth) : Promise.resolve();
  }

  /** Usuário atual em cache (síncrono). Null quando deslogado ou fora do browser. */
  get usuarioAtual(): User | null {
    return this.auth?.currentUser ?? null;
  }

  /** 'google' quando entrou com Google, 'senha' quando usou e-mail/senha. */
  provedorAtual(): 'google' | 'senha' | null {
    const id = this.usuarioAtual?.providerData[0]?.providerId;
    if (id === 'google.com') return 'google';
    if (id === 'password') return 'senha';
    return null;
  }

  /**
   * Deve exibir o modal "verifique seu e-mail"? Só para quem entrou com
   * e-mail/senha (login Google já é verificado pelo próprio Google) e ainda
   * não confirmou o endereço.
   */
  precisaVerificarEmail(): boolean {
    const user = this.usuarioAtual;
    return !!user && this.provedorAtual() !== 'google' && !user.emailVerified;
  }

  async atualizarNome(nome: string): Promise<void> {
    const user = this.exigirAuth().currentUser;
    const limpo = nome.trim();
    if (user && limpo) await updateProfile(user, { displayName: limpo });
  }

  /** Reenvia o e-mail de verificação para o usuário logado. */
  async enviarVerificacao(): Promise<void> {
    const user = this.exigirAuth().currentUser;
    if (user) await sendEmailVerification(user, this.urlAcao('/verificar-email'));
  }

  /** Recarrega o usuário do servidor (atualiza `emailVerified`). */
  async recarregar(): Promise<User | null> {
    const user = this.usuarioAtual;
    if (!user) return null;
    try {
      await reload(user);
    } catch {
      // Rede falhou: mantém o cache local em vez de deslogar.
    }
    return this.usuarioAtual;
  }

  /** Envia o e-mail de recuperação (link volta para `/redefinir-senha`). */
  async enviarResetSenha(email: string): Promise<void> {
    await sendPasswordResetEmail(this.exigirAuth(), email.trim(), this.urlAcao('/redefinir-senha'));
  }

  /** Aplica o `oobCode` do link de verificação recebido por e-mail. */
  async aplicarCodigoVerificacao(codigo: string): Promise<void> {
    await applyActionCode(this.exigirAuth(), codigo);
  }

  /** Conclui a redefinição de senha com o `oobCode` do link. */
  async confirmarResetSenha(codigo: string, novaSenha: string): Promise<void> {
    await confirmPasswordReset(this.exigirAuth(), codigo, novaSenha);
  }

  private urlAcao(caminho: string): { url: string } | undefined {
    if (typeof window === 'undefined') return undefined;
    return { url: `${window.location.origin}${caminho}` };
  }

  /** Traduz os códigos `auth/*` do Firebase para mensagens amigáveis (pt-BR). */
  traduzirErro(erro: unknown): string {
    const code =
      typeof erro === 'object' && erro !== null && 'code' in erro
        ? String((erro as { code: unknown }).code)
        : '';
    switch (code) {
      case 'auth/invalid-email':
        return 'E-mail inválido. Confira e tente de novo.';
      case 'auth/missing-password':
      case 'auth/missing-email':
        return 'Informe e-mail e senha.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está em uso. Tente entrar.';
      case 'auth/weak-password':
        return 'A senha precisa de pelo menos 6 caracteres.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Login com Google cancelado.';
      case 'auth/popup-blocked':
        return 'O navegador bloqueou o pop-up. Permita pop-ups e tente de novo.';
      case 'auth/network-request-failed':
        return 'Falha de rede. Verifique sua conexão.';
      case 'auth/operation-not-allowed':
        return 'Este método de login não está habilitado no Firebase Console.';
      default:
        return 'Não foi possível entrar. Tente novamente.';
    }
  }
}
