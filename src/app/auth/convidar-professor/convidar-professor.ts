import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ROTAS } from '../auth.config';
import { rotuloFuncao, type ConviteEnviado, type Funcao } from '../auth.models';
import { mapearErro } from '../api/mapear-erro';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { EscolaService } from '../services/escola.service';
import { validarEmail } from '../validators/validarEmail';

@Component({
  selector: 'app-convidar-professor',
  imports: [FormsModule],
  templateUrl: './convidar-professor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvidarProfessor implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly escolaService = inject(EscolaService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly email = signal('');
  readonly funcao = signal<Funcao>('professor_regente');
  readonly turmasSelecionadas = signal<string[]>([]);
  readonly materiasSelecionadas = signal<string[]>([]);
  readonly erroEmail = signal<string | null>(null);
  readonly erro = signal<string | null>(null);
  readonly erroRede = signal<string | null>(null);
  readonly mensagemSucesso = signal('');
  readonly enviando = signal(false);

  readonly turmas = signal<{ id: string; nome: string }[]>([]);
  readonly materias = signal<{ id: string; nome: string }[]>([]);

  readonly convites = signal<ConviteEnviado[]>([]);
  readonly carregandoLista = signal(true);
  readonly erroLista = signal<string | null>(null);
  readonly conviteParaCancelar = signal<ConviteEnviado | null>(null);

  readonly rotuloFuncao = rotuloFuncao;

  readonly funcoesConvite = computed(() =>
    ['professor_regente', 'professor_apoio'].map((valor) => ({
      valor: valor as Funcao,
      rotulo: rotuloFuncao(valor),
    })),
  );

  private gatilhoDialogo: HTMLElement | null = null;

  ngOnInit(): void {
    this.escolaService.listarTurmas().subscribe({
      next: (turmas) => this.turmas.set(turmas),
      error: () => this.turmas.set([]),
    });
    this.escolaService.listarMaterias().subscribe({
      next: (materias) => this.materias.set(materias),
      error: () => this.materias.set([]),
    });
    this.carregarConvites();
  }

  mostrarTurmasMaterias(): boolean {
    return this.funcao() === 'professor_regente';
  }

  escolherFuncao(valor: string): void {
    this.funcao.set(valor as Funcao);
    if (valor !== 'professor_regente') {
      this.turmasSelecionadas.set([]);
      this.materiasSelecionadas.set([]);
    }
  }

  alternarTurma(id: string, marcado: boolean): void {
    this.turmasSelecionadas.update((atuais) =>
      marcado ? [...atuais, id] : atuais.filter((item) => item !== id),
    );
  }

  alternarMateria(id: string, marcado: boolean): void {
    this.materiasSelecionadas.update((atuais) =>
      marcado ? [...atuais, id] : atuais.filter((item) => item !== id),
    );
  }

  turmaMarcada(id: string): boolean {
    return this.turmasSelecionadas().includes(id);
  }

  materiaMarcada(id: string): boolean {
    return this.materiasSelecionadas().includes(id);
  }

  convidar(): void {
    if (this.enviando()) return;

    this.erroEmail.set(null);
    this.erro.set(null);
    this.erroRede.set(null);

    const validacao = validarEmail(this.email());
    if (!validacao.valido) {
      this.erroEmail.set(validacao.erro);
      this.focar('convite-form-email');
      return;
    }

    const email = this.email().trim();
    const payload: {
      email: string;
      funcao: Funcao;
      turmaIds?: string[];
      materiaIds?: string[];
    } = { email, funcao: this.funcao() };

    if (this.mostrarTurmasMaterias()) {
      if (this.turmasSelecionadas().length) {
        payload.turmaIds = [...this.turmasSelecionadas()];
      }
      if (this.materiasSelecionadas().length) {
        payload.materiaIds = [...this.materiasSelecionadas()];
      }
    }

    this.enviando.set(true);
    this.auth.enviarConvite(payload).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensagemSucesso.set(`Convite enviado para ${email}`);
        this.email.set('');
        this.funcao.set('professor_regente');
        this.turmasSelecionadas.set([]);
        this.materiasSelecionadas.set([]);
        this.carregarConvites();
      },
      error: (erro: unknown) => {
        this.enviando.set(false);
        const mapeado = mapearErro(erro);

        if (mapeado.tipo === 'mensagem' && mapeado.codigo === 'ja_vinculado') {
          this.erro.set(mapeado.mensagem);
          this.toast.erro(mapeado.mensagem);
          this.focar('convites-alerta');
          return;
        }

        if (mapeado.tipo === 'mensagem' && mapeado.mensagem.includes('permissão')) {
          void this.router.navigate([ROTAS.painel], {
            queryParams: { aviso: 'sem_permissao' },
          });
          return;
        }

        this.erroRede.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
        this.focar('convites-alerta');
      },
    });
  }

  carregarConvites(): void {
    this.carregandoLista.set(true);
    this.erroLista.set(null);

    this.auth.listarConvites().subscribe({
      next: (convites) => {
        this.convites.set(convites);
        this.carregandoLista.set(false);
      },
      error: (erro: unknown) => {
        this.carregandoLista.set(false);
        const mapeado = mapearErro(erro);
        if (mapeado.tipo === 'mensagem' && mapeado.mensagem.includes('permissão')) {
          void this.router.navigate([ROTAS.painel], {
            queryParams: { aviso: 'sem_permissao' },
          });
          return;
        }
        this.convites.set([]);
        this.erroLista.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
      },
    });
  }

  reenviarConvite(convite: ConviteEnviado): void {
    this.auth.reenviarConvite(convite.id).subscribe({
      next: () => this.carregarConvites(),
      error: (erro: unknown) => {
        const texto = mapearErro(erro).mensagem;
        this.erroLista.set(texto);
        this.toast.erro(texto);
      },
    });
  }

  abrirDialogoCancelamento(convite: ConviteEnviado, evento: Event): void {
    this.gatilhoDialogo = evento.currentTarget as HTMLElement;
    this.conviteParaCancelar.set(convite);
    setTimeout(() => document.getElementById('dialogo-manter')?.focus(), 0);
  }

  fecharDialogo(): void {
    this.conviteParaCancelar.set(null);
    this.gatilhoDialogo?.focus();
    this.gatilhoDialogo = null;
  }

  confirmarCancelamento(): void {
    const convite = this.conviteParaCancelar();
    if (!convite) return;

    this.auth.cancelarConvite(convite.id).subscribe({
      next: () => {
        this.convites.update((lista) =>
          lista.map((item) =>
            item.id === convite.id ? { ...item, status: 'cancelado' as const } : item,
          ),
        );
        this.fecharDialogo();
        this.carregarConvites();
      },
      error: (erro: unknown) => {
        const texto = mapearErro(erro).mensagem;
        this.erroLista.set(texto);
        this.toast.erro(texto);
        this.fecharDialogo();
      },
    });
  }

  /** Mantém o foco preso no diálogo e fecha com Esc (seção 8.3). */
  aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      this.fecharDialogo();
      return;
    }

    if (evento.key !== 'Tab') return;

    const dialogo = document.getElementById('dialogo-cancelar');
    if (!dialogo) return;

    const focaveis = Array.from(
      dialogo.querySelectorAll<HTMLElement>('button, [href], input, select, textarea'),
    ).filter((elemento) => !elemento.hasAttribute('disabled'));

    if (focaveis.length === 0) return;

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const ativo = document.activeElement;

    if (evento.shiftKey && ativo === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  focarFormulario(): void {
    this.focar('convite-form-email');
  }

  statusRotulo(status: ConviteEnviado['status']): string {
    const rotulos: Record<ConviteEnviado['status'], string> = {
      pendente: 'Pendente',
      aceito: 'Aceito',
      expirado: 'Expirado',
      cancelado: 'Cancelado',
    };
    return rotulos[status];
  }

  private focar(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  }
}
