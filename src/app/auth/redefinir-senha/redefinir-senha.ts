import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ROTAS } from '../auth.config';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { forcaSenha, validarSenha } from '../validators/validarSenha';
import { validarConfirmacao } from '../validators/validarConfirmacao';

type Modo = 'formulario' | 'expirado' | 'invalido' | 'sucesso';

@Component({
  selector: 'app-redefinir-senha',
  imports: [FormsModule, RouterLink],
  templateUrl: './redefinir-senha.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedefinirSenha implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly rotas = ROTAS;

  readonly token = signal('');
  readonly modo = signal<Modo>('formulario');
  readonly senha = signal('');
  readonly confirmacao = signal('');
  readonly senhaVisivel = signal(false);
  readonly confirmacaoVisivel = signal(false);
  readonly enviando = signal(false);
  readonly erroSenha = signal<string | null>(null);
  readonly erroConfirmacao = signal<string | null>(null);
  readonly erroRede = signal<string | null>(null);

  readonly forca = computed(() => forcaSenha(this.senha()));

  ngOnInit(): void {
    // Links do Firebase chegam como `?mode=resetPassword&oobCode=…`; o formato
    // legado `?token=…` continua aceito.
    const params = new URLSearchParams(window.location.search);
    const token = params.get('oobCode') ?? params.get('token') ?? '';
    this.token.set(token);
    if (!token) this.modo.set('invalido');
  }

  redefinir(): void {
    if (this.enviando() || this.modo() !== 'formulario') return;

    this.erroSenha.set(null);
    this.erroConfirmacao.set(null);
    this.erroRede.set(null);

    const senha = validarSenha(this.senha());
    const confirmacao = validarConfirmacao(this.senha(), this.confirmacao());

    if (!senha.valido) {
      this.erroSenha.set(senha.erro);
      this.focar('redefinir-senha');
      return;
    }

    if (!confirmacao.valido) {
      this.erroConfirmacao.set(confirmacao.erro);
      this.focar('redefinir-confirmacao');
      return;
    }

    this.enviando.set(true);
    this.auth.redefinirSenha(this.token(), this.senha()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.senha.set('');
        this.confirmacao.set('');
        this.modo.set('sucesso');
        // Token não pode sobrar na barra de endereço nem no histórico (BDD-072).
        window.history.replaceState(null, '', ROTAS.redefinirSenha);
      },
      error: (erro: unknown) => {
        this.enviando.set(false);
        const mapeado = mapearErro(erro);
        if (mapeado.tipo === 'expirado') {
          this.modo.set('expirado');
        } else if (mapeado.tipo === 'invalido') {
          this.modo.set('invalido');
        } else {
          this.erroRede.set(mapeado.mensagem);
          this.toast.erro(mapeado.mensagem);
          this.focar('redefinir-alerta');
        }
      },
    });
  }

  entrar(): void {
    void this.router.navigate([ROTAS.login]);
  }

  private focar(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  }
}
