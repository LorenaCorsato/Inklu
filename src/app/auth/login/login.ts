import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ROTAS } from '../auth.config';
import { formatarMMSS, mensagem } from '../auth.messages';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { VerificacaoEmailModalService } from '../verificacao-email-modal/verificacao-email-modal.service';
import { ToastService } from '../../shared/toast/toast.service';
import { SessaoStore } from '../state/sessao.store';
import {
  estadoInicialLogin,
  LoginState,
  reduzirLogin,
  EventoLogin,
} from '../state/login.machine';
import { validarEmail } from '../validators/validarEmail';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(SessaoStore);
  private readonly toast = inject(ToastService);
  private readonly firebase = inject(FirebaseAuthService);
  private readonly modalVerificacao = inject(VerificacaoEmailModalService);

  readonly rotas = ROTAS;

  readonly email = signal('');
  readonly senha = signal('');
  readonly senhaVisivel = signal(false);
  readonly sessaoExpirada = signal(false);
  readonly erroEmail = signal<string | null>(null);
  readonly erroSenha = signal<string | null>(null);
  readonly anuncio = signal('');
  readonly entrandoGoogle = signal(false);

  readonly estado = signal<LoginState>(estadoInicialLogin());

  private timer: ReturnType<typeof setInterval> | null = null;
  private ultimoMinutoAnunciado = 0;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.sessaoExpirada.set(params.get('motivo') === 'sessao_expirada');

    const emailDaUrl = params.get('email');
    if (emailDaUrl) this.email.set(emailDaUrl);

    this.timer = setInterval(() => this.aplicarTick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  enviando(): boolean {
    return this.estado().estado === 'enviando';
  }

  bloqueado(): boolean {
    return this.estado().estado === 'bloqueado';
  }

  tempoRestante(): string {
    return formatarMMSS(this.estado().segundosRestantes);
  }

  entrar(): void {
    if (this.enviando() || this.bloqueado()) return;

    this.erroEmail.set(null);
    this.erroSenha.set(null);

    const email = this.email().trim();
    const validacaoEmail = validarEmail(email);
    if (!validacaoEmail.valido) {
      this.erroEmail.set(validacaoEmail.erro);
      this.focar('login-email');
      return;
    }

    if (!this.senha()) {
      this.erroSenha.set('Informe sua senha');
      this.focar('login-senha');
      return;
    }

    this.despachar({ tipo: 'enviar', email, agora: Date.now() });

    this.auth.login(email, this.senha()).subscribe({
      next: (resposta) => {
        this.despachar({ tipo: 'resposta', status: resposta.status, agora: Date.now() });
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        this.senha.set('');

        switch (resposta.status) {
          case 'ok':
            // Atualiza a sessão antes de entrar, para a navbar exibir o
            // nome real do usuário (e não o perfil demo).
            this.auth.carregarSessao(true).subscribe({
              next: () => this.irParaInicio(redirect),
              error: () => this.irParaInicio(redirect),
            });
            break;
          case 'mfa_requerido':
            this.store.marcarSessaoPendenteMfa(email);
            void this.router.navigate([ROTAS.mfa], {
              queryParams: redirect ? { redirect } : {},
            });
            break;
          case 'escolher_contexto':
            void this.router.navigate([ROTAS.contexto]);
            break;
          case 'sem_vinculo':
            void this.router.navigate([ROTAS.semAcesso]);
            break;
        }
      },
      error: (erro: unknown) => {
        const mapeado = mapearErro(erro);
        this.despachar({ tipo: 'erro', erro: mapeado, agora: Date.now() });

        // Falhas de autenticação também aparecem no toast global do rodapé.
        if (mapeado.tipo !== 'campo') this.toast.erro(mapeado.mensagem);

        if (mapeado.tipo === 'campo') {
          this.erroEmail.set(mapeado.mensagem);
          this.focar('login-email');
        } else if (mapeado.tipo === 'credenciais') {
          this.senha.set('');
          this.focar('login-alerta');
        } else if (mapeado.tipo === 'email_nao_verificado') {
          this.focar('login-alerta');
        } else if (mapeado.tipo === 'bloqueado') {
          this.anunciarMinuto(true);
          this.focar('login-alerta');
        } else {
          this.focar('login-alerta');
        }
      },
    });
  }

  entrarComGoogle(): void {
    if (this.entrandoGoogle() || this.enviando() || this.bloqueado()) return;

    this.erroEmail.set(null);
    this.erroSenha.set(null);
    this.entrandoGoogle.set(true);

    this.auth.loginComGoogle().subscribe({
      next: (resposta) => {
        this.entrandoGoogle.set(false);
        // Pop-up fechado pelo usuário: volta ao repouso, sem erro nem toast.
        if (!resposta) return;
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        this.senha.set('');
        this.auth.carregarSessao(true).subscribe({
          next: () => this.irParaInicio(redirect),
          error: () => this.irParaInicio(redirect),
        });
      },
      error: (erro: unknown) => {
        this.entrandoGoogle.set(false);
        const mapeado = mapearErro(erro);
        this.toast.erro(mapeado.mensagem);
        this.focar('login-alerta');
      },
    });
  }

  reenviarVerificacao(): void {
    void this.router.navigate([ROTAS.verificarEmail], {
      state: { email: this.email().trim(), modo: 'reenvio', nome: '' },
    });
  }

  private irParaInicio(redirect: string | null): void {
    // Quem entrou com e-mail/senha e ainda não confirmou o endereço vê o
    // modal global "Verifique seu e-mail" na tela inicial.
    if (this.firebase.precisaVerificarEmail()) this.modalVerificacao.abrir();
    void this.router.navigateByUrl(redirect || ROTAS.inicio);
  }

  private despachar(evento: EventoLogin): void {
    this.estado.update((atual) => reduzirLogin(atual, evento));
  }

  private aplicarTick(): void {
    this.despachar({ tipo: 'tick', agora: Date.now() });
    if (this.bloqueado()) this.anunciarMinuto(false);
  }

  /**
   * A contagem visível muda a cada segundo, mas o leitor de tela só recebe
   * uma atualização por minuto (TDD-074).
   */
  private anunciarMinuto(forcar: boolean): void {
    const estado = this.estado();
    if (estado.estado !== 'bloqueado') {
      this.anuncio.set('');
      return;
    }

    const minutos = Math.max(1, Math.ceil(estado.segundosRestantes / 60));
    if (!forcar && minutos === this.ultimoMinutoAnunciado) return;

    this.ultimoMinutoAnunciado = minutos;
    this.anuncio.set(
      mensagem('api.bloqueado', {
        tempo: `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`,
      }),
    );
  }

  private focar(id: string): void {
    setTimeout(() => {
      const elemento = document.getElementById(id);
      elemento?.focus();
    }, 0);
  }
}
