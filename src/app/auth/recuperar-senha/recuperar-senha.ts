import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { validarEmail } from '../validators/validarEmail';

@Component({
  selector: 'app-recuperar-senha',
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperar-senha.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarSenha {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly email = signal('');
  readonly enviando = signal(false);
  readonly enviado = signal(false);
  readonly erro = signal<string | null>(null);
  readonly erroRede = signal<string | null>(null);

  enviar(): void {
    if (this.enviando()) return;

    this.erro.set(null);
    this.erroRede.set(null);

    const validacao = validarEmail(this.email());
    if (!validacao.valido) {
      this.erro.set(validacao.erro);
      this.focar('recuperar-email');
      return;
    }

    this.enviando.set(true);
    this.auth.esquecerSenha(this.email().trim()).subscribe({
      next: () => {
        this.enviando.set(false);
        // Sucesso idêntico exista ou não a conta (BDD-070/071).
        this.enviado.set(true);
      },
      error: (erro: unknown) => {
        this.enviando.set(false);
        const mapeado = mapearErro(erro);
        this.erroRede.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
        this.focar('recuperar-alerta');
      },
    });
  }

  private focar(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  }
}
