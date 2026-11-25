import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import {
  LucideCalendarDays,
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
} from '@lucide/angular';

type Visao = 'dias' | 'meses' | 'anos';

export interface DiaCelula {
  iso: string;
  dia: number;
  fora: boolean;
  hoje: boolean;
  selecionado: boolean;
  marcado: boolean;
  desabilitado: boolean;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function paraISO(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function deISO(iso: string): { ano: number; mes: number; dia: number } {
  const [a, m, d] = iso.split('-').map(Number);
  return { ano: a ?? 1970, mes: (m ?? 1) - 1, dia: d ?? 1 };
}

function hojeISO(): string {
  const agora = new Date();
  return paraISO(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

function deslocarMes(ano: number, mes: number, delta: number): { ano: number; mes: number } {
  const indice = ano * 12 + mes + delta;
  return { ano: Math.floor(indice / 12), mes: ((indice % 12) + 12) % 12 };
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Campo de data com calendário interativo (substitui `<input type="date">`).
 * Popup em `position: fixed` com trava nos limites da tela (vira para cima
 * e desloca na horizontal quando necessário).
 */
@Component({
  selector: 'app-date-picker',
  imports: [LucideCalendarDays, LucideChevronDown, LucideChevronLeft, LucideChevronRight],
  host: {
    style: 'display: block; width: 100%',
    '(document:pointerdown)': 'aoClicarFora($event)',
  },
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
})
export class DatePicker {
  /** Data no formato YYYY-MM-DD. */
  readonly value = input('');
  readonly placeholder = input('dd/mm/aaaa');
  readonly hint = input('Escolha uma data');
  readonly clearLabel = input('Limpar');
  readonly disabled = input(false);
  readonly min = input('');
  readonly max = input('');
  /** ISOs (YYYY-MM-DD) que ganham o ponto indicador abaixo do dia. */
  readonly marcadores = input<string[]>([]);
  readonly locale = input('pt-BR');
  /** `id` do rótulo visual externo (ex.: `<span id="x">Data</span>`). */
  readonly etiquetaId = input('');
  readonly rotuloCampo = input('Escolher data');

  readonly valueChange = output<string>();

  private readonly hospedeiro = inject(ElementRef);
  private readonly popupRef = viewChild<ElementRef<HTMLElement>>('popup');
  private readonly gatilhoRef = viewChild<ElementRef<HTMLButtonElement>>('gatilho');

  readonly aberto = signal(false);
  readonly visao = signal<Visao>('dias');
  readonly anoRef = signal(0);
  readonly mesRef = signal(0);
  readonly anuncio = signal('');
  readonly topoPx = signal(0);
  readonly esquerdaPx = signal(0);
  readonly larguraPx = signal(320);

  private readonly hoje = hojeISO();
  private aoRolagemGlobal = (): void => this.reposicionar();

  readonly diasSemana = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    // 2026-11-01 foi um domingo: base para Sun…Sat independente do locale.
    return Array.from({ length: 7 }, (_, i) =>
      capitalizar(fmt.format(new Date(2026, 10, 1 + i)).replace('.', '')),
    );
  });

  readonly rotuloMes = computed(() =>
    capitalizar(new Intl.DateTimeFormat(this.locale(), { month: 'long' }).format(new Date(this.anoRef(), this.mesRef(), 1))),
  );

  readonly meses = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { month: 'long' });
    return Array.from({ length: 12 }, (_, m) => ({
      indice: m,
      nome: capitalizar(fmt.format(new Date(2026, m, 1))),
      desabilitado: this.mesDesabilitado(this.anoRef(), m),
    }));
  });

  readonly anosGrade = computed(() => {
    const inicio = this.anoRef() - 5;
    const min = this.min();
    const max = this.max();
    return Array.from({ length: 12 }, (_, i) => {
      const ano = inicio + i;
      const antesMin = min !== '' && paraISO(ano, 11, 31) < min;
      const depoisMax = max !== '' && paraISO(ano, 0, 1) > max;
      return { ano, desabilitado: antesMin || depoisMax };
    });
  });

  readonly celulas = computed<DiaCelula[]>(() => {
    const ano = this.anoRef();
    const mes = this.mesRef();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const anterior = deslocarMes(ano, mes, -1);
    const diasMesAnterior = new Date(ano, mes, 0).getDate();
    const valor = this.value();
    const marcados = new Set(this.marcadores());
    return Array.from({ length: 42 }, (_, i) => {
      const diaCorrente = i - primeiroDiaSemana + 1;
      let a = ano;
      let m = mes;
      let d = diaCorrente;
      let fora = false;
      if (diaCorrente < 1) {
        a = anterior.ano;
        m = anterior.mes;
        d = diasMesAnterior + diaCorrente;
        fora = true;
      } else if (diaCorrente > new Date(ano, mes + 1, 0).getDate()) {
        const proximo = deslocarMes(ano, mes, 1);
        a = proximo.ano;
        m = proximo.mes;
        d = diaCorrente - new Date(ano, mes + 1, 0).getDate();
        fora = true;
      }
      const iso = paraISO(a, m, d);
      return {
        iso,
        dia: d,
        fora,
        hoje: iso === this.hoje,
        selecionado: iso === valor,
        marcado: marcados.has(iso),
        desabilitado: this.diaDesabilitado(iso),
      };
    });
  });

  readonly textoExibicao = computed(() => {
    const valor = this.value();
    if (!ISO_RE.test(valor)) return '';
    const { ano, mes, dia } = deISO(valor);
    return new Intl.DateTimeFormat(this.locale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(ano, mes, dia, 12));
  });

  readonly tituloAcessivel = computed(
    () => `${this.rotuloMes()} de ${this.anoRef()}. ${this.hint()}`,
  );

  // ─── Abrir / fechar ───
  alternar(): void {
    if (this.disabled()) return;
    if (this.aberto()) this.fechar(false);
    else this.abrir();
  }

  abrir(): void {
    if (this.disabled() || this.aberto()) return;
    const base = ISO_RE.test(this.value()) ? deISO(this.value()) : deISO(this.hoje);
    this.anoRef.set(base.ano);
    this.mesRef.set(base.mes);
    this.visao.set('dias');
    this.aberto.set(true);
    window.addEventListener('scroll', this.aoRolagemGlobal, true);
    window.addEventListener('resize', this.aoRolagemGlobal);
    requestAnimationFrame(() => {
      this.reposicionar();
      // Foco inicial no dia (desktop): selecionado, senão hoje.
      if (window.matchMedia('(pointer: fine)').matches) this.focarDia(this.value() || this.hoje);
    });
  }

  fechar(restaurarFoco: boolean): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    window.removeEventListener('scroll', this.aoRolagemGlobal, true);
    window.removeEventListener('resize', this.aoRolagemGlobal);
    if (restaurarFoco) this.gatilhoRef()?.nativeElement.focus();
  }

  aoClicarFora(event: PointerEvent): void {
    if (!this.aberto()) return;
    const alvo = event.target as Node | null;
    if (alvo && !this.hospedeiro.nativeElement.contains(alvo)) this.fechar(false);
  }

  aoTeclarEscape(event: Event): void {
    // Tratado no popup/gatilho (não no documento): Escape fecha só o
    // calendário, sem acionar o Escape do modal pai (editor de tarefa).
    event.stopPropagation();
    this.fechar(true);
  }

  aoSairFoco(event: FocusEvent): void {
    if (!this.aberto()) return;
    const destino = event.relatedTarget as Node | null;
    if (destino && !this.hospedeiro.nativeElement.contains(destino)) this.fechar(false);
  }

  aoTeclaGatilho(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.aberto()) {
      this.aoTeclarEscape(event);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.abrir();
    }
  }

  /** Mantém o popup dentro da tela: vira para cima e desloca na horizontal. */
  reposicionar(): void {
    if (!this.aberto()) return;
    const gatilho = this.gatilhoRef()?.nativeElement;
    const popup = this.popupRef()?.nativeElement;
    if (!gatilho || !popup) return;
    const alvo = gatilho.getBoundingClientRect();
    const largura = Math.min(320, window.innerWidth - 16);
    const altura = popup.offsetHeight;
    let topo = alvo.bottom + 8;
    if (topo + altura > window.innerHeight - 8) {
      topo = alvo.top - altura - 8;
    }
    if (topo < 8) topo = 8;
    let esquerda = Math.min(alvo.left, window.innerWidth - largura - 8);
    if (esquerda < 8) esquerda = 8;
    this.topoPx.set(topo);
    this.esquerdaPx.set(esquerda);
    this.larguraPx.set(largura);
  }

  // ─── Navegação ───
  passo(delta: number): void {
    if (this.visao() === 'anos') {
      this.anoRef.update((a) => a + delta * 12);
      return;
    }
    if (this.visao() === 'meses') {
      this.anoRef.update((a) => a + delta);
      return;
    }
    const proximo = deslocarMes(this.anoRef(), this.mesRef(), delta);
    this.anoRef.set(proximo.ano);
    this.mesRef.set(proximo.mes);
  }

  alternarVisao(alvo: 'meses' | 'anos'): void {
    this.visao.update((v) => (v === alvo ? 'dias' : alvo));
  }

  escolherMes(m: number): void {
    this.mesRef.set(m);
    this.visao.set('dias');
  }

  escolherAno(ano: number): void {
    this.anoRef.set(ano);
    this.visao.set('dias');
  }

  selecionarDia(iso: string): void {
    if (this.diaDesabilitado(iso)) return;
    this.valueChange.emit(iso);
    const { ano, mes, dia } = deISO(iso);
    this.anuncio.set(
      `${dia} de ${capitalizar(new Intl.DateTimeFormat(this.locale(), { month: 'long' }).format(new Date(ano, mes, 1)))} de ${ano} selecionado`,
    );
    this.fechar(true);
  }

  limpar(): void {
    this.valueChange.emit('');
    this.anuncio.set('Data removida');
  }

  rotuloDia(celula: DiaCelula): string {
    const { ano, mes, dia } = deISO(celula.iso);
    const extenso = new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(ano, mes, dia, 12));
    const sufixos = [
      celula.hoje ? ', hoje' : '',
      celula.marcado ? ', com tarefa' : '',
      celula.desabilitado ? ', indisponível' : '',
    ].join('');
    return capitalizar(extenso) + sufixos;
  }

  /** Setas movem o foco entre os dias; PageUp/Down trocam o mês. */
  aoTeclaGrade(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.aoTeclarEscape(event);
      return;
    }
    const alvo = event.target as HTMLElement | null;
    const iso = alvo?.dataset?.['iso'];
    if (!iso || !ISO_RE.test(iso)) return;
    const { ano, mes, dia } = deISO(iso);
    const base = new Date(ano, mes, dia, 12);
    let destino: Date | null = null;
    let trocarMes = 0;
    if (event.key === 'ArrowRight') destino = new Date(ano, mes, dia + 1, 12);
    else if (event.key === 'ArrowLeft') destino = new Date(ano, mes, dia - 1, 12);
    else if (event.key === 'ArrowDown') destino = new Date(ano, mes, dia + 7, 12);
    else if (event.key === 'ArrowUp') destino = new Date(ano, mes, dia - 7, 12);
    else if (event.key === 'Home') destino = new Date(ano, mes, dia - base.getDay(), 12);
    else if (event.key === 'End') destino = new Date(ano, mes, dia + (6 - base.getDay()), 12);
    else if (event.key === 'PageDown') trocarMes = 1;
    else if (event.key === 'PageUp') trocarMes = -1;
    else return;
    event.preventDefault();
    if (trocarMes !== 0) {
      const proximo = deslocarMes(this.anoRef(), this.mesRef(), trocarMes);
      this.anoRef.set(proximo.ano);
      this.mesRef.set(proximo.mes);
      this.focarDia(paraISO(proximo.ano, proximo.mes, Math.min(dia, new Date(proximo.ano, proximo.mes + 1, 0).getDate())));
      return;
    }
    if (destino) {
      const isoDestino = paraISO(destino.getFullYear(), destino.getMonth(), destino.getDate());
      if (this.diaDesabilitado(isoDestino)) return;
      if (destino.getMonth() !== this.mesRef() || destino.getFullYear() !== this.anoRef()) {
        this.anoRef.set(destino.getFullYear());
        this.mesRef.set(destino.getMonth());
      }
      this.focarDia(isoDestino);
    }
  }

  private focarDia(iso: string): void {
    requestAnimationFrame(() => {
      const popup = this.popupRef()?.nativeElement;
      const botao = popup?.querySelector<HTMLElement>(`[data-iso="${iso}"]`);
      botao?.focus();
    });
  }

  private diaDesabilitado(iso: string): boolean {
    if (this.min() !== '' && iso < this.min()) return true;
    if (this.max() !== '' && iso > this.max()) return true;
    return false;
  }

  private mesDesabilitado(ano: number, mes: number): boolean {
    const min = this.min();
    const max = this.max();
    if (min !== '' && paraISO(ano, mes, new Date(ano, mes + 1, 0).getDate()) < min) return true;
    if (max !== '' && paraISO(ano, mes, 1) > max) return true;
    return false;
  }
}
