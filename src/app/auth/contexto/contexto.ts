import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { ROTAS } from '../auth.config';
import { rotuloFuncao, type Vinculo } from '../auth.models';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { SessaoStore } from '../state/sessao.store';

@Component({
  selector: 'app-contexto',
  templateUrl: './contexto.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contexto implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly store = inject(SessaoStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly vinculos = computed(() => this.store.vinculos());
  readonly carregando = signal(false);
  readonly enviandoId = signal<string | null>(null);
  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.store.carregada()) this.recarregar();
  }

  nomeVinculo(vinculo: Vinculo): string {
    return vinculo.escolaNome?.trim() ? vinculo.escolaNome : 'Conta individual';
  }

  rotulo(vinculo: Vinculo): string {
    return rotuloFuncao(vinculo.funcao);
  }

  escolher(vinculo: Vinculo): void {
    if (this.enviandoId()) return;

    this.enviandoId.set(vinculo.id);
    this.erro.set(null);

    this.auth.escolherContexto(vinculo.id).subscribe({
      next: () => {
        this.enviandoId.set(null);
        void this.router.navigate([ROTAS.painel], { replaceUrl: true });
      },
      error: (erro: unknown) => {
        this.enviandoId.set(null);
        const mapeado = mapearErro(erro);
        const texto =
          mapeado.tipo === 'offline'
            ? mapeado.mensagem
            : 'Este vínculo não está mais ativo.';
        this.erro.set(texto);
        this.toast.erro(texto);
        this.recarregar();
      },
    });
  }

  recarregar(): void {
    this.carregando.set(true);
    this.auth.carregarSessao(true).subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.carregando.set(false);
        const texto = mapearErro(new TypeError('rede')).mensagem;
        this.erro.set(texto);
        this.toast.erro(texto);
      },
    });
  }
}
