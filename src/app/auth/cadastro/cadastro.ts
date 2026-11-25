import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ROTAS } from '../auth.config';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { VerificacaoEmailModalService } from '../verificacao-email-modal/verificacao-email-modal.service';
import { ToastService } from '../../shared/toast/toast.service';
import { validarEmail } from '../validators/validarEmail';
import { validarNome } from '../validators/validarNome';
import { validarConfirmacao } from '../validators/validarConfirmacao';
import { forcaSenha, validarSenha } from '../validators/validarSenha';
import type { ResultadoValidacao } from '../validators/tipos';

@Component({
  selector: 'app-cadastro',
  imports: [FormsModule, RouterLink],
  templateUrl: './cadastro.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cadastro implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly firebase = inject(FirebaseAuthService);
  private readonly modalVerificacao = inject(VerificacaoEmailModalService);

  readonly rotas = ROTAS;

  readonly nome = signal('');
  readonly email = signal('');
  readonly senha = signal('');
  readonly confirmacao = signal('');

  readonly senhaVisivel = signal(false);
  readonly confirmacaoVisivel = signal(false);

  readonly nomeTocado = signal(false);
  readonly emailTocado = signal(false);
  readonly senhaTocado = signal(false);
  readonly confirmacaoTocado = signal(false);

  readonly errosServidor = signal<Record<string, string>>({});
  readonly erroRede = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly criandoGoogle = signal(false);

  readonly forca = computed(() => forcaSenha(this.senha()));
  readonly emailEmUso = computed(() => Boolean(this.errosServidor()['email']));

  readonly erroNome = computed(() =>
    this.errosServidor()['nome'] ??
    (this.nomeTocado() ? this.erro(validarNome(this.nome())) : null),
  );

  readonly erroEmail = computed(() =>
    this.errosServidor()['email'] ??
    (this.emailTocado() ? this.erro(validarEmail(this.email())) : null),
  );

  readonly erroSenha = computed(() =>
    this.errosServidor()['senha'] ??
    (this.senhaTocado()
      ? this.erro(validarSenha(this.senha(), { email: this.email() }))
      : null),
  );

  readonly erroConfirmacao = computed(() =>
    this.errosServidor()['confirmacao'] ??
    (this.confirmacaoTocado()
      ? this.erro(validarConfirmacao(this.senha(), this.confirmacao()))
      : null),
  );

  ngOnInit(): void {
    // Preserva nome/e-mail ao voltar de "Usar outro e-mail". A senha nunca
    // trafega em estado de navegação.
    const estado = (window.history.state ?? {}) as Record<string, unknown>;
    const nome = estado['nome'];
    const email = estado['email'];
    if (typeof nome === 'string') this.nome.set(nome);
    if (typeof email === 'string') this.email.set(email);
  }

  criarConta(): void {
    if (this.enviando()) return;

    this.errosServidor.set({});
    this.erroRede.set(null);

    const validacoes: { campo: string; id: string; resultado: ResultadoValidacao }[] = [
      { campo: 'nome', id: 'cadastro-nome', resultado: validarNome(this.nome()) },
      { campo: 'email', id: 'cadastro-email', resultado: validarEmail(this.email()) },
      {
        campo: 'senha',
        id: 'cadastro-senha',
        resultado: validarSenha(this.senha(), { email: this.email() }),
      },
      {
        campo: 'confirmacao',
        id: 'cadastro-confirmacao',
        resultado: validarConfirmacao(this.senha(), this.confirmacao()),
      },
    ];

    this.nomeTocado.set(true);
    this.emailTocado.set(true);
    this.senhaTocado.set(true);
    this.confirmacaoTocado.set(true);

    const primeiroInvalido = validacoes.find((item) => !item.resultado.valido);
    if (primeiroInvalido) {
      this.focar(primeiroInvalido.id);
      return;
    }

    const email = this.email().trim();
    this.enviando.set(true);

    this.auth
      .registrar({ nome: this.nome().trim(), email, senha: this.senha() })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.senha.set('');
          this.confirmacao.set('');
          // Atualiza a sessão antes de entrar, para a navbar e a home
          // exibirem o nome real do usuário (e não o perfil demo).
          this.auth.carregarSessao(true).subscribe({
            next: () => this.irParaInicio(),
            error: () => this.irParaInicio(),
          });
        },
        error: (erro: unknown) => {
          this.enviando.set(false);
          const mapeado = mapearErro(erro);

          if (mapeado.tipo === 'campo') {
            this.errosServidor.set({ [mapeado.campo]: mapeado.mensagem });
            this.focar(`cadastro-${mapeado.campo}`);
            return;
          }

          if (mapeado.tipo === 'campos') {
            this.errosServidor.set(mapeado.campos);
            const primeiro = Object.keys(mapeado.campos)[0];
            if (primeiro) this.focar(`cadastro-${primeiro}`);
            return;
          }

          this.erroRede.set(mapeado.mensagem);
          this.toast.erro(mapeado.mensagem);
          this.focar('cadastro-alerta');
        },
      });
  }

  entrarComGoogle(): void {
    if (this.criandoGoogle() || this.enviando()) return;

    this.errosServidor.set({});
    this.erroRede.set(null);
    this.criandoGoogle.set(true);

    this.auth.loginComGoogle().subscribe({
      next: (resposta) => {
        this.criandoGoogle.set(false);
        // Pop-up fechado pelo usuário: volta ao repouso, sem erro nem toast.
        if (!resposta) return;
        this.auth.carregarSessao(true).subscribe({
          next: () => this.irParaInicio(),
          error: () => this.irParaInicio(),
        });
      },
      error: (erro: unknown) => {
        this.criandoGoogle.set(false);
        const mapeado = mapearErro(erro);
        this.erroRede.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
        this.focar('cadastro-alerta');
      },
    });
  }

  private irParaInicio(): void {
    // Conta criada já sai logada na tela inicial; o modal global pede a
    // verificação do e-mail (só aparece para e-mail/senha).
    void this.router.navigate([ROTAS.inicio]);
    if (this.firebase.precisaVerificarEmail()) this.modalVerificacao.abrir();
  }

  private erro(resultado: ResultadoValidacao): string | null {
    return resultado.valido ? null : resultado.erro;
  }

  private focar(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  }
}
