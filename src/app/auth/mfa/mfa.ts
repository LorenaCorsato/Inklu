import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ROTAS } from '../auth.config';
import { formatarMMSS, mensagem } from '../auth.messages';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { SessaoStore } from '../state/sessao.store';

@Component({
  selector: 'app-mfa',
  imports: [FormsModule, RouterLink],
  templateUrl: './mfa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Mfa implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(SessaoStore);
  private readonly toast = inject(ToastService);

  readonly codigo = signal('');
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly erroRede = signal<string | null>(null);
  readonly bloqueadoAte = signal<number | null>(null);
  readonly segundosRestantes = signal(0);
  readonly anuncio = signal('');

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly inicio = Date.now();
  private ultimoMinuto = 0;

  ngOnInit(): void {
    this.timer = setInterval(() => this.atualizarBloqueio(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  aoDigitar(valor: string): void {
    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 6);
    this.codigo.set(apenasDigitos);
  }

  bloqueado(): boolean {
    return this.segundosRestantes() > 0;
  }

  tempoRestante(): string {
    return formatarMMSS(this.segundosRestantes());
  }

  verificar(): void {
    if (this.enviando() || this.bloqueado()) return;
    if (this.codigo().length !== 6) {
      this.erro.set('Informe o código de 6 dígitos.');
      this.focar('mfa-codigo');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    this.erroRede.set(null);

    this.auth.verificarMfa(this.codigo()).subscribe({
      next: () => {
        this.enviando.set(false);
        const redirect = this.lerRedirect();
        void this.router.navigateByUrl(redirect || ROTAS.painel, { replaceUrl: true });
      },
      error: (erro: unknown) => {
        this.enviando.set(false);
        const mapeado = mapearErro(erro);
        this.toast.erro(mapeado.mensagem);

        if (mapeado.tipo === 'bloqueado') {
          this.bloquear(mapeado.segundos);
          this.focar('mfa-alerta');
          return;
        }

        if (mapeado.tipo === 'mensagem') {
          this.erro.set(mensagem('api.mfa_invalido'));
          this.focar('mfa-codigo');
          return;
        }

        this.erroRede.set(mapeado.mensagem);
        this.focar('mfa-alerta');
      },
    });
  }

  usarOutraConta(): void {
    this.store.mfaPendente.set(false);
    this.auth.logout().subscribe();
    void this.router.navigate([ROTAS.login], { replaceUrl: true });
  }

  private lerRedirect(): string | null {
    return new URLSearchParams(window.location.search).get('redirect');
  }

  private bloquear(segundos: number): void {
    this.bloqueadoAte.set(Date.now() + segundos * 1000);
    this.segundosRestantes.set(segundos);
    this.anunciarMinuto(true);
  }

  private atualizarBloqueio(): void {
    const ate = this.bloqueadoAte();
    if (ate === null) return;

    const restante = Math.max(0, Math.ceil((ate - Date.now()) / 1000));
    this.segundosRestantes.set(restante);
    if (restante === 0) {
      this.bloqueadoAte.set(null);
      this.erro.set(null);
      this.anuncio.set('');
      return;
    }
    this.anunciarMinuto(false);
  }

  private anunciarMinuto(forcar: boolean): void {
    const minutos = Math.max(1, Math.ceil(this.segundosRestantes() / 60));
    if (!forcar && minutos === this.ultimoMinuto) return;
    this.ultimoMinuto = minutos;
    this.anuncio.set(
      mensagem('api.bloqueado', {
        tempo: `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`,
      }),
    );
  }

  /** Mantido para quando o relógio do teste precisar do início da sessão. */
  protected get inicioSessao(): number {
    return this.inicio;
  }

  private focar(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  }
}
