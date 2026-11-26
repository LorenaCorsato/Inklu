import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ROTAS, SEGUNDOS_REENVIO_EMAIL } from '../auth.config';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

type Modo = 'aguardando' | 'confirmando' | 'expirado' | 'invalido';

@Component({
  selector: 'app-verificar-email',
  imports: [RouterLink],
  templateUrl: './verificar-email.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificarEmail implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly rotas = ROTAS;

  readonly modo = signal<Modo>('aguardando');
  readonly email = signal('');
  readonly nome = signal('');
  readonly cooldown = signal(0);
  readonly mensagemReenvio = signal('');
  readonly erroRede = signal<string | null>(null);
  readonly enviandoReenvio = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const estado = (window.history.state ?? {}) as Record<string, unknown>;
    const email = estado['email'];
    const nome = estado['nome'];
    if (typeof email === 'string') this.email.set(email);
    if (typeof nome === 'string') this.nome.set(nome);

    // Links do Firebase chegam como `?mode=verifyEmail&oobCode=…`; o formato
    // legado `?token=…` continua aceito.
    const params = new URLSearchParams(window.location.search);
    const token = params.get('oobCode') ?? params.get('token');
    if (token) {
      this.modo.set('confirmando');
      this.confirmar(token);
      return;
    }

    if (!this.email()) {
      void this.router.navigate([ROTAS.login], { replaceUrl: true });
    }
  }

  ngOnDestroy(): void {
    this.pararTimer();
  }

  reenviar(): void {
    if (this.cooldown() > 0 || this.enviandoReenvio()) return;

    if (!this.email()) {
      void this.router.navigate([ROTAS.cadastro]);
      return;
    }

    this.enviandoReenvio.set(true);
    this.erroRede.set(null);

    this.auth.reenviarVerificacao(this.email()).subscribe({
      next: () => {
        this.enviandoReenvio.set(false);
        this.mensagemReenvio.set(
          'Reenviado. Verifique sua caixa de entrada e a pasta de spam.',
        );
        this.iniciarCooldown();
      },
      error: (erro: unknown) => {
        this.enviandoReenvio.set(false);
        const mapeado = mapearErro(erro);
        this.erroRede.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
      },
    });
  }

  usarOutroEmail(): void {
    void this.router.navigate([ROTAS.cadastro], {
      state: { email: this.email(), nome: this.nome() },
    });
  }

  private confirmar(token: string): void {
    this.auth.verificarEmail(token).subscribe({
      next: () => {
        // E-mail confirmado: usuário segue já logado na tela inicial.
        this.toast.sucesso('E-mail verificado com sucesso!');
        void this.router.navigate([ROTAS.inicio], { replaceUrl: true });
      },
      error: (erro: unknown) => {
        const mapeado = mapearErro(erro);
        if (mapeado.tipo === 'expirado') {
          this.modo.set('expirado');
        } else if (mapeado.tipo === 'invalido') {
          this.modo.set('invalido');
        } else {
          this.modo.set('aguardando');
          this.erroRede.set(mapeado.mensagem);
          this.toast.erro(mapeado.mensagem);
        }
      },
    });
  }

  private iniciarCooldown(): void {
    this.pararTimer();
    this.cooldown.set(SEGUNDOS_REENVIO_EMAIL);
    this.timer = setInterval(() => {
      const restante = this.cooldown() - 1;
      this.cooldown.set(Math.max(0, restante));
      if (restante <= 0) this.pararTimer();
    }, 1000);
  }

  private pararTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
