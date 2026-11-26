import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { FirebaseAuthService } from '../../services/firebase-auth.service';

/**
 * Componente de exemplo (standalone) que consome o `FirebaseAuthService`.
 *
 * Demonstra:
 * - login com e-mail/senha,
 * - cadastro com e-mail/senha,
 * - login com Google (pop-up),
 * - tratamento de erros com mensagens em pt-BR,
 * - exibição do estado atual do usuário via `currentUser$` + `AsyncPipe`.
 *
 * Rota sugerida: `{ path: 'entrar-firebase', component: LoginFirebase }`.
 */
@Component({
  selector: 'app-login-firebase',
  standalone: true,
  imports: [FormsModule, RouterLink, AsyncPipe],
  templateUrl: './login-firebase.html',
  styleUrl: './login-firebase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFirebase {
  private readonly firebaseAuth = inject(FirebaseAuthService);

  /** Estado reativo do usuário logado (null = deslogado). */
  readonly currentUser$ = this.firebaseAuth.currentUser$;

  readonly email = signal('');
  readonly senha = signal('');
  readonly senhaVisivel = signal(false);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);

  private async executar(acao: () => Promise<unknown>, mensagemOk: string): Promise<void> {
    if (this.carregando()) return;
    this.erro.set(null);
    this.sucesso.set(null);

    const email = this.email().trim();
    if (!email || !email.includes('@')) {
      this.erro.set('Informe um e-mail válido.');
      return;
    }
    if (!this.senha()) {
      this.erro.set('Informe sua senha.');
      return;
    }

    this.carregando.set(true);
    try {
      await acao();
      this.sucesso.set(mensagemOk);
      this.senha.set('');
    } catch (e) {
      this.erro.set(this.firebaseAuth.traduzirErro(e));
    } finally {
      this.carregando.set(false);
    }
  }

  entrar(): Promise<void> {
    const email = this.email().trim();
    const senha = this.senha();
    return this.executar(
      () => this.firebaseAuth.login(email, senha),
      'Login realizado com sucesso!',
    );
  }

  cadastrar(): Promise<void> {
    const email = this.email().trim();
    const senha = this.senha();
    return this.executar(
      () => this.firebaseAuth.register(email, senha),
      'Conta criada com sucesso!',
    );
  }

  async entrarComGoogle(): Promise<void> {
    if (this.carregando()) return;
    this.erro.set(null);
    this.sucesso.set(null);
    this.carregando.set(true);
    try {
      await this.firebaseAuth.loginWithGoogle();
      this.sucesso.set('Login com Google realizado!');
    } catch (e) {
      this.erro.set(this.firebaseAuth.traduzirErro(e));
    } finally {
      this.carregando.set(false);
    }
  }

  async sair(): Promise<void> {
    this.erro.set(null);
    this.sucesso.set(null);
    try {
      await this.firebaseAuth.logout();
      this.sucesso.set('Você saiu da conta.');
    } catch (e) {
      this.erro.set(this.firebaseAuth.traduzirErro(e));
    }
  }
}
