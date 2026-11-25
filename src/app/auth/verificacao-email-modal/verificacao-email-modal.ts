import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';

import { SEGUNDOS_REENVIO_EMAIL } from '../auth.config';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { VerificacaoEmailModalService } from './verificacao-email-modal.service';

/**
 * Modal global que pede a verificação do e-mail após cadastro/login com
 * e-mail/senha. Renderizado no shell (`app.html`), fora das páginas.
 */
@Component({
  selector: 'app-verificacao-email-modal',
  templateUrl: './verificacao-email-modal.html',
  styleUrl: './verificacao-email-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificacaoEmailModal implements OnDestroy {
  readonly modal = inject(VerificacaoEmailModalService);
  private readonly auth = inject(AuthService);
  private readonly firebase = inject(FirebaseAuthService);
  private readonly toast = inject(ToastService);

  readonly email = computed(() => this.firebase.usuarioAtual?.email ?? '');
  readonly reenviando = signal(false);
  readonly verificando = signal(false);
  readonly cooldown = signal(0);
  readonly mensagem = signal<string | null>(null);
  readonly erro = signal<string | null>(null);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Ao abrir, o foco vai para o título (WCAG 2.4.3).
    effect(() => {
      if (this.modal.aberto()) {
        this.mensagem.set(null);
        this.erro.set(null);
        setTimeout(() => {
          document.getElementById('verif-email-modal-titulo')?.focus();
        }, 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.pararTimer();
  }

  fechar(): void {
    this.modal.fechar();
  }

  fecharAoClicarFora(evento: MouseEvent): void {
    if ((evento.target as HTMLElement).classList.contains('verif-modal__overlay')) {
      this.fechar();
    }
  }

  reenviar(): void {
    if (this.cooldown() > 0 || this.reenviando()) return;
    this.reenviando.set(true);
    this.erro.set(null);
    this.mensagem.set(null);

    this.auth.reenviarVerificacao(this.email()).subscribe({
      next: () => {
        this.reenviando.set(false);
        this.mensagem.set('Reenviamos o link. Confira sua caixa de entrada e o spam.');
        this.iniciarCooldown();
      },
      error: (erro: unknown) => {
        this.reenviando.set(false);
        const mapeado = mapearErro(erro);
        this.erro.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
      },
    });
  }

  async jaVerifiquei(): Promise<void> {
    if (this.verificando()) return;
    this.verificando.set(true);
    this.erro.set(null);

    const atualizado = await this.firebase.recarregar();
    this.verificando.set(false);

    if (atualizado?.emailVerified) {
      this.toast.sucesso('E-mail verificado com sucesso!');
      this.fechar();
    } else {
      this.erro.set(
        'Ainda não identificamos a confirmação. Abra o link do e-mail e tente de novo.',
      );
    }
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
