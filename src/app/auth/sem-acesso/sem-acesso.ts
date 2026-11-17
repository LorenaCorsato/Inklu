import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ROTAS } from '../auth.config';
import { AuthService } from '../services/auth.service';
import { SessaoStore } from '../state/sessao.store';

@Component({
  selector: 'app-sem-acesso',
  templateUrl: './sem-acesso.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemAcesso {
  private readonly auth = inject(AuthService);
  private readonly store = inject(SessaoStore);
  private readonly router = inject(Router);

  readonly saindo = signal(false);
  readonly podeEscolherFuncao = computed(
    () => !this.store.usuario()?.funcao && this.store.vinculos().length === 0,
  );

  escolherFuncao(): void {
    void this.router.navigate([ROTAS.escolherFuncao]);
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
}
