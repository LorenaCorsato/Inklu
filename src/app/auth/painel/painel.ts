import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ROTAS } from '../auth.config';
import { mensagem } from '../auth.messages';
import { rotuloFuncao } from '../auth.models';
import { AuthService } from '../services/auth.service';
import { SessaoStore } from '../state/sessao.store';

@Component({
  selector: 'app-painel',
  templateUrl: './painel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Painel {
  private readonly store = inject(SessaoStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = computed(() => this.store.usuario());
  readonly funcao = computed(() => this.store.funcao());
  readonly funcaoRotulo = computed(() => rotuloFuncao(this.store.funcao()));
  readonly vinculos = computed(() => this.store.vinculos());
  readonly contexto = computed(() => this.store.contexto());
  readonly saindo = signal(false);
  readonly aviso = signal<string | null>(this.lerAviso());

  ehCoordenacao(): boolean {
    return this.funcao() === 'coordenacao';
  }

  sair(): void {
    if (this.saindo()) return;
    this.saindo.set(true);
    this.auth.logout().subscribe({
      next: () => {
        this.saindo.set(false);
        void this.router.navigate([ROTAS.login], { replaceUrl: true });
      },
    });
  }

  private lerAviso(): string | null {
    const estado = (window.history.state ?? {}) as Record<string, unknown>;
    const aviso = estado['aviso'];
    if (typeof aviso !== 'string') return null;

    if (aviso === 'funcao_ja_definida') return mensagem('api.funcao_ja_definida');
    if (aviso === 'sem_permissao') return mensagem('sistema.sem_permissao');
    return aviso;
  }
}
