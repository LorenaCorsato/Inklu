import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ROTAS } from '../auth.config';
import { rotuloFuncao, type Convite } from '../auth.models';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { SessaoStore } from '../state/sessao.store';
import { validarConfirmacao } from '../validators/validarConfirmacao';
import { validarNome } from '../validators/validarNome';
import { forcaSenha, validarSenha } from '../validators/validarSenha';

@Component({
  selector: 'app-aceitar-convite',
  imports: [FormsModule],
  templateUrl: './aceitar-convite.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AceitarConvite implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly store = inject(SessaoStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly token = signal('');
  readonly convite = signal<Convite | null>(null);
  readonly carregando = signal(true);
  readonly enviando = signal(false);
  readonly erroCarga = signal<string | null>(null);
  readonly erro = signal<string | null>(null);
  readonly erroRede = signal<string | null>(null);

  readonly nome = signal('');
  readonly senha = signal('');
  readonly confirmacao = signal('');
  readonly senhaVisivel = signal(false);
  readonly confirmacaoVisivel = signal(false);
  readonly nomeTocado = signal(false);
  readonly senhaTocado = signal(false);
  readonly confirmacaoTocado = signal(false);

  readonly autenticado = computed(() => this.store.autenticado());
  readonly forca = computed(() => forcaSenha(this.senha()));

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.token.set(token);
    if (!token) {
      void this.router.navigate([ROTAS.conviteInvalido], { replaceUrl: true });
      return;
    }
    this.carregar(token);
  }

  rotulo(): string {
    return rotuloFuncao(this.convite()?.funcao);
  }

  erroNome(): string | null {
    return this.nomeTocado() ? this.mensagemErro(validarNome(this.nome())) : null;
  }

  erroSenha(): string | null {
    return this.senhaTocado()
      ? this.mensagemErro(validarSenha(this.senha(), { email: this.convite()?.email }))
      : null;
  }

  erroConfirmacao(): string | null {
    return this.confirmacaoTocado()
      ? this.mensagemErro(validarConfirmacao(this.senha(), this.confirmacao()))
      : null;
  }

  entrarEAceitar(): void {
    void this.router.navigate([ROTAS.login], {
      queryParams: { redirect: this.router.url },
    });
  }

  aceitar(): void {
    const convite = this.convite();
    if (!convite || this.enviando()) return;

    this.erro.set(null);
    this.erroRede.set(null);

    if (convite.contaExistente) {
      this.enviar({});
      return;
    }

    const nome = validarNome(this.nome());
    const senha = validarSenha(this.senha(), { email: convite.email });
    const confirmacao = validarConfirmacao(this.senha(), this.confirmacao());

    this.nomeTocado.set(true);
    this.senhaTocado.set(true);
    this.confirmacaoTocado.set(true);

    if (!nome.valido) {
      this.focar('convite-nome');
      return;
    }
    if (!senha.valido) {
      this.focar('convite-senha');
      return;
    }
    if (!confirmacao.valido) {
      this.focar('convite-confirmacao');
      return;
    }

    this.enviar({ nome: this.nome().trim(), senha: this.senha() });
  }

  private carregar(token: string): void {
    this.carregando.set(true);
    this.auth.obterConvite(token).subscribe({
      next: (convite) => {
        this.convite.set(convite);
        this.carregando.set(false);
      },
      error: (erro: unknown) => {
        this.carregando.set(false);
        const mapeado = mapearErro(erro, undefined, { contexto: 'convite' });
        if (
          mapeado.tipo === 'expirado' ||
          mapeado.tipo === 'usado' ||
          mapeado.tipo === 'invalido'
        ) {
          void this.router.navigate([ROTAS.conviteInvalido], {
            state: { codigo: mapeado.tipo },
            replaceUrl: true,
          });
          return;
        }
        this.erroCarga.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
      },
    });
  }

  private enviar(dados: { nome?: string; senha?: string }): void {
    this.enviando.set(true);
    this.auth.aceitarConvite(this.token(), dados).subscribe({
      next: () => {
        this.enviando.set(false);
        this.finalizar();
      },
      error: (erro: unknown) => {
        this.enviando.set(false);
        const mapeado = mapearErro(erro, undefined, { contexto: 'convite' });

        if (
          mapeado.tipo === 'expirado' ||
          mapeado.tipo === 'usado' ||
          mapeado.tipo === 'invalido'
        ) {
          void this.router.navigate([ROTAS.conviteInvalido], {
            state: { codigo: mapeado.tipo },
            replaceUrl: true,
          });
          return;
        }

        if (mapeado.tipo === 'credenciais') {
          this.entrarEAceitar();
          return;
        }

        this.erroRede.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
        this.focar('convite-alerta');
      },
    });
  }

  private finalizar(): void {
    const escola = this.convite()?.escolaNome ?? '';
    const aviso = escola ? `Você agora faz parte de ${escola}.` : 'Convite aceito.';

    this.auth.carregarSessao(true).subscribe({
      next: (snapshot) => {
        const destino = snapshot.vinculos.length > 1 ? ROTAS.contexto : ROTAS.painel;
        // replaceUrl remove o token da barra de endereço (BDD-054).
        void this.router.navigate([destino], { replaceUrl: true, state: { aviso } });
      },
      error: () => {
        void this.router.navigate([ROTAS.painel], { replaceUrl: true, state: { aviso } });
      },
    });
  }

  private mensagemErro(resultado: { valido: boolean; erro?: string }): string | null {
    return resultado.valido ? null : (resultado.erro ?? null);
  }

  private focar(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  }
}
