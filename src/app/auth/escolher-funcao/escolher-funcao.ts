import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ROTAS } from '../auth.config';
import { FUNCOES, type Funcao } from '../auth.models';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-escolher-funcao',
  imports: [FormsModule],
  templateUrl: './escolher-funcao.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscolherFuncao {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly opcoes = FUNCOES.filter(
    (funcao) => funcao.valor === 'professor_regente' || funcao.valor === 'professor_apoio',
  );

  readonly selecionada = signal<Funcao | null>(null);
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);

  escolher(valor: Funcao): void {
    this.selecionada.set(valor);
  }

  continuar(): void {
    const funcao = this.selecionada();
    if (!funcao || this.enviando()) return;

    this.enviando.set(true);
    this.erro.set(null);

    this.auth.definirFuncao(funcao).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigate([ROTAS.painel], { replaceUrl: true });
      },
      error: (erro: unknown) => {
        this.enviando.set(false);
        const mapeado = mapearErro(erro);

        if ('codigo' in mapeado && mapeado.codigo === 'funcao_ja_definida') {
          void this.router.navigate([ROTAS.painel], {
            state: { aviso: 'funcao_ja_definida' },
            replaceUrl: true,
          });
          return;
        }

        this.erro.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
      },
    });
  }
}
