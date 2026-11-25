import { Component, computed, inject, signal } from '@angular/core';
import {
  LucideCalendarDays,
  LucideChevronLeft,
  LucideChevronRight,
  LucideClock,
  LucideMapPin,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { ToastService } from '../shared/toast/toast.service';
import { DatePicker } from '../shared/date-picker/date-picker';
import { CartaoTarefa } from './cartoes/cartao-tarefa';

export type VisaoCalendario = 'semana' | 'mes' | 'ano';
export type TipoEvento = 'aula' | 'prova' | 'entrega' | 'reuniao' | 'relatorio' | 'outro';

export interface EventoCalendario {
  id: string;
  titulo: string;
  /** Data no formato YYYY-MM-DD (horário local). */
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: TipoEvento;
  turma: string;
  responsavel: string;
  local: string;
  descricao: string;
}

interface DiaMes {
  data: Date;
  iso: string;
  numero: number;
  foraDoMes: boolean;
  hoje: boolean;
}

export const TIPOS_EVENTO: { id: TipoEvento; rotulo: string }[] = [
  { id: 'aula', rotulo: 'Aula' },
  { id: 'prova', rotulo: 'Prova' },
  { id: 'entrega', rotulo: 'Entrega' },
  { id: 'reuniao', rotulo: 'Reunião' },
  { id: 'relatorio', rotulo: 'Relatório' },
  { id: 'outro', rotulo: 'Outro' },
];

const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_CURTO = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/** Meio-dia local: evita que o fuso desloque o dia ao converter. */
function meioDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12, 0, 0, 0);
}

function paraISO(data: Date): string {
  const d = meioDia(data);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function deISO(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

function isoDeslocado(base: Date, dias: number): string {
  const copia = meioDia(base);
  copia.setDate(copia.getDate() + dias);
  return paraISO(copia);
}

function formatarDataExtensa(iso: string): string {
  const texto = deISO(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarDataCurta(iso: string): string {
  return deISO(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function criarEventosIniciais(hoje: Date): EventoCalendario[] {
  const iso = (deslocamento: number) => isoDeslocado(hoje, deslocamento);
  return [
    {
      id: 'e1',
      titulo: 'Prova adaptada — João Victor',
      data: iso(0),
      horaInicio: '08:00',
      horaFim: '09:30',
      tipo: 'prova',
      turma: '3º ano A',
      responsavel: 'Ana Ribeiro',
      local: 'Sala 4',
      descricao:
        'Aplicar a versão adaptada da prova trimestral com apoio visual e fonte ampliada. Levar cronômetro e folha de apoio.',
    },
    {
      id: 'e2',
      titulo: 'Reunião com regência — 3º ano',
      data: iso(0),
      horaInicio: '14:00',
      horaFim: '15:00',
      tipo: 'reuniao',
      turma: '3º ano A',
      responsavel: 'Ana Ribeiro',
      local: 'Sala dos professores',
      descricao: 'Alinhar estratégias do PEI do Lucas Henrique com a professora regente.',
    },
    {
      id: 'e3',
      titulo: 'Relatório de progresso — Lucas H.',
      data: iso(1),
      horaInicio: '10:00',
      horaFim: '11:00',
      tipo: 'relatorio',
      turma: '3º ano A',
      responsavel: 'Carlos Souza (apoio)',
      local: '',
      descricao: 'Fechar o relatório de acompanhamento com foco em comportamento e hipérfoco em dinossauros.',
    },
    {
      id: 'e4',
      titulo: 'Aula de apoio — leitura',
      data: iso(-2),
      horaInicio: '09:00',
      horaFim: '10:00',
      tipo: 'aula',
      turma: '5º ano B',
      responsavel: 'Ana Ribeiro',
      local: 'Sala de recursos',
      descricao: 'Sessão de leitura guiada com a Mariana S. usando material ampliado.',
    },
    {
      id: 'e5',
      titulo: 'Entregar PEI atualizado',
      data: iso(2),
      horaInicio: '17:00',
      horaFim: '18:00',
      tipo: 'entrega',
      turma: '5º ano B',
      responsavel: 'Ana Ribeiro',
      local: 'Coordenação',
      descricao: 'Protocolar a versão revisada do PEI na coordenação pedagógica.',
    },
    {
      id: 'e6',
      titulo: 'Observação em sala — 2º ano',
      data: iso(3),
      horaInicio: '08:30',
      horaFim: '09:30',
      tipo: 'aula',
      turma: '2º ano C',
      responsavel: 'Ana Ribeiro',
      local: 'Sala 2',
      descricao: 'Observar rotina de acolhimento para ajustar o plano de mediação.',
    },
    {
      id: 'e7',
      titulo: 'Conversa com família — Mariana S.',
      data: iso(-5),
      horaInicio: '16:00',
      horaFim: '16:45',
      tipo: 'reuniao',
      turma: '5º ano B',
      responsavel: 'Ana Ribeiro',
      local: 'Online',
      descricao: 'Devolutiva mensal com a família sobre as metas do PEI.',
    },
    {
      id: 'e8',
      titulo: 'Relatório mensal — turma 5º B',
      data: iso(6),
      horaInicio: '13:00',
      horaFim: '14:30',
      tipo: 'relatorio',
      turma: '5º ano B',
      responsavel: 'Ana Ribeiro',
      local: '',
      descricao: 'Consolidar registros mensais e encaminhamentos da última reunião.',
    },
    {
      id: 'e9',
      titulo: 'Formação — desenho universal',
      data: iso(-9),
      horaInicio: '19:00',
      horaFim: '21:00',
      tipo: 'outro',
      turma: '—',
      responsavel: 'Ana Ribeiro',
      local: 'Auditório',
      descricao: 'Encontro de formação sobre desenho universal para a aprendizagem.',
    },
    {
      id: 'e10',
      titulo: 'Prova de matemática — 5º ano',
      data: iso(9),
      horaInicio: '08:00',
      horaFim: '09:30',
      tipo: 'prova',
      turma: '5º ano B',
      responsavel: 'Ana Ribeiro',
      local: 'Sala 7',
      descricao: 'Aplicar prova com tempo estendido para os alunos com adaptação.',
    },
  ];
}

@Component({
  selector: 'app-calendario',
  imports: [
    CartaoTarefa,
    DatePicker,
    LucideCalendarDays,
    LucideChevronLeft,
    LucideChevronRight,
    LucideClock,
    LucideMapPin,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
  host: {
    '(document:keydown.escape)': 'aoTeclarEscape()',
  },
})
export class Calendario {
  private readonly toast = inject(ToastService);

  readonly nomesDiasSemana = DIAS_SEMANA_CURTO;
  readonly tipos = TIPOS_EVENTO;

  readonly visao = signal<VisaoCalendario>('mes');
  readonly referencia = signal<Date>(meioDia(new Date()));
  readonly eventos = signal<EventoCalendario[]>(criarEventosIniciais(new Date()));
  readonly detalheId = signal<string | null>(null);
  readonly editorAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly arrastandoId = signal<string | null>(null);
  readonly diaAlvo = signal<string | null>(null);
  readonly diaExpandido = signal<string | null>(null);

  // ─── Formulário do editor (criar/editar) ───
  readonly fTitulo = signal('');
  readonly fData = signal('');
  readonly fInicio = signal('08:00');
  readonly fFim = signal('09:00');
  readonly fTipo = signal<TipoEvento>('aula');
  readonly fTurma = signal('');
  readonly fLocal = signal('');
  readonly fDescricao = signal('');
  readonly fErro = signal('');

  private proximoId = 11;
  readonly hojeISO = paraISO(new Date());

  // ─── Derivados ───
  readonly detalhe = computed(
    () => this.eventos().find((evento) => evento.id === this.detalheId()) ?? null,
  );

  /** Datas com tarefa: ponto indicador no date picker do editor. */
  readonly datasComEvento = computed(() =>
    [...new Set(this.eventos().map((evento) => evento.data))].sort(),
  );

  readonly tituloPeriodo = computed(() => {
    const ref = this.referencia();
    if (this.visao() === 'ano') return String(ref.getFullYear());
    if (this.visao() === 'semana') {
      const inicio = this.inicioDaSemana(ref);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
      const mesmoMes = inicio.getMonth() === fim.getMonth();
      const fmt = (d: Date) => `${d.getDate()} de ${MESES_CURTO[d.getMonth()]}`;
      return mesmoMes
        ? `${inicio.getDate()} a ${fim.getDate()} de ${this.nomeMes(inicio)} de ${inicio.getFullYear()}`
        : `${fmt(inicio)} a ${fmt(fim)} de ${fim.getFullYear()}`;
    }
    return `${this.nomeMes(ref)} de ${ref.getFullYear()}`;
  });

  readonly diasMes = computed<DiaMes[]>(() => {
    const ref = this.referencia();
    const primeiro = new Date(ref.getFullYear(), ref.getMonth(), 1, 12);
    const inicioGrade = new Date(primeiro);
    inicioGrade.setDate(inicioGrade.getDate() - primeiro.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const data = new Date(inicioGrade);
      data.setDate(data.getDate() + i);
      const iso = paraISO(data);
      return {
        data,
        iso,
        numero: data.getDate(),
        foraDoMes: data.getMonth() !== ref.getMonth(),
        hoje: iso === this.hojeISO,
      };
    });
  });

  readonly diasDaSemana = computed<DiaMes[]>(() => {
    const inicio = this.inicioDaSemana(this.referencia());
    return Array.from({ length: 7 }, (_, i) => {
      const data = new Date(inicio);
      data.setDate(data.getDate() + i);
      const iso = paraISO(data);
      return { data, iso, numero: data.getDate(), foraDoMes: false, hoje: iso === this.hojeISO };
    });
  });

  readonly mesesDoAno = computed(() => {
    const ano = this.referencia().getFullYear();
    const porDia = new Map<string, number>();
    for (const evento of this.eventos()) {
      porDia.set(evento.data, (porDia.get(evento.data) ?? 0) + 1);
    }
    return Array.from({ length: 12 }, (_, mes) => {
      const primeiroDiaSemana = new Date(ano, mes, 1, 12).getDay();
      const diasNoMes = new Date(ano, mes + 1, 0, 12).getDate();
      const celulas: ({ iso: string; numero: number; total: number } | null)[] = [];
      for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
      for (let dia = 1; dia <= diasNoMes; dia++) {
        const iso = paraISO(new Date(ano, mes, dia, 12));
        celulas.push({ iso, numero: dia, total: porDia.get(iso) ?? 0 });
      }
      return { mes, nome: this.nomeMes(new Date(ano, mes, 1, 12)), celulas };
    });
  });

  readonly totalNaReferencia = computed(() => {
    const ref = this.referencia();
    if (this.visao() === 'ano') {
      return this.eventos().filter((e) => deISO(e.data).getFullYear() === ref.getFullYear()).length;
    }
    if (this.visao() === 'semana') {
      const dias = new Set(this.diasDaSemana().map((d) => d.iso));
      return this.eventos().filter((e) => dias.has(e.data)).length;
    }
    return this.eventos().filter((e) => {
      const d = deISO(e.data);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    }).length;
  });

  // ─── Navegação ───
  definirVisao(visao: VisaoCalendario): void {
    this.visao.set(visao);
    this.diaExpandido.set(null);
  }

  irParaHoje(): void {
    this.referencia.set(meioDia(new Date()));
    this.diaExpandido.set(null);
  }

  passo(anterior: boolean): void {
    const delta = anterior ? -1 : 1;
    const ref = new Date(this.referencia());
    if (this.visao() === 'ano') {
      ref.setFullYear(ref.getFullYear() + delta);
    } else if (this.visao() === 'semana') {
      ref.setDate(ref.getDate() + delta * 7);
    } else {
      ref.setMonth(ref.getMonth() + delta);
    }
    this.referencia.set(meioDia(ref));
    this.diaExpandido.set(null);
  }

  irParaDia(iso: string, visao: VisaoCalendario = 'semana'): void {
    this.referencia.set(deISO(iso));
    this.visao.set(visao);
    this.diaExpandido.set(null);
  }

  irParaMes(mes: number): void {
    const ref = new Date(this.referencia());
    ref.setMonth(mes, 1);
    this.referencia.set(meioDia(ref));
    this.visao.set('mes');
    this.diaExpandido.set(null);
  }

  // ─── Consulta ───
  eventosDoDia(iso: string): EventoCalendario[] {
    return this.eventos()
      .filter((evento) => evento.data === iso)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  temEventoNoDia(iso: string): boolean {
    return this.eventos().some((evento) => evento.data === iso);
  }

  rotuloTipo(tipo: TipoEvento): string {
    return TIPOS_EVENTO.find((t) => t.id === tipo)?.rotulo ?? 'Outro';
  }

  // ─── Arrastar e soltar ───
  aoIniciarArrasto(event: DragEvent, id: string): void {
    this.arrastandoId.set(id);
    this.diaExpandido.set(null);
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  aoTerminarArrasto(): void {
    this.arrastandoId.set(null);
    this.diaAlvo.set(null);
  }

  aoSobreDia(event: DragEvent, iso: string): void {
    if (!this.arrastandoId()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (this.diaAlvo() !== iso) this.diaAlvo.set(iso);
  }

  aoSairDoDia(iso: string): void {
    if (this.diaAlvo() === iso) this.diaAlvo.set(null);
  }

  aoSoltarNoDia(event: DragEvent, iso: string): void {
    event.preventDefault();
    const id = event.dataTransfer?.getData('text/plain') ?? this.arrastandoId();
    this.arrastandoId.set(null);
    this.diaAlvo.set(null);
    if (!id) return;
    this.moverEvento(id, iso);
  }

  moverEvento(id: string, novoISO: string): void {
    const atual = this.eventos().find((evento) => evento.id === id);
    if (!atual || atual.data === novoISO) return;
    this.eventos.update((itens) =>
      itens.map((evento) => (evento.id === id ? { ...evento, data: novoISO } : evento)),
    );
    this.toast.sucesso(`“${atual.titulo}” movida para ${formatarDataCurta(novoISO)}.`);
  }

  // ─── Detalhe ───
  abrirDetalhe(id: string): void {
    this.detalheId.set(id);
  }

  fecharDetalhe(): void {
    this.detalheId.set(null);
  }

  excluirEvento(id: string): void {
    const alvo = this.eventos().find((evento) => evento.id === id);
    this.eventos.update((itens) => itens.filter((evento) => evento.id !== id));
    this.fecharDetalhe();
    this.fecharEditor();
    if (alvo) this.toast.info(`“${alvo.titulo}” excluída do calendário.`);
  }

  // ─── Criar / editar ───
  abrirCriacao(iso?: string): void {
    this.editandoId.set(null);
    this.fTitulo.set('');
    this.fData.set(iso ?? paraISO(this.referencia()));
    this.fInicio.set('08:00');
    this.fFim.set('09:00');
    this.fTipo.set('aula');
    this.fTurma.set('');
    this.fLocal.set('');
    this.fDescricao.set('');
    this.fErro.set('');
    this.editorAberto.set(true);
  }

  abrirEdicao(id: string): void {
    const evento = this.eventos().find((item) => item.id === id);
    if (!evento) return;
    this.fecharDetalhe();
    this.editandoId.set(id);
    this.fTitulo.set(evento.titulo);
    this.fData.set(evento.data);
    this.fInicio.set(evento.horaInicio);
    this.fFim.set(evento.horaFim);
    this.fTipo.set(evento.tipo);
    this.fTurma.set(evento.turma);
    this.fLocal.set(evento.local);
    this.fDescricao.set(evento.descricao);
    this.fErro.set('');
    this.editorAberto.set(true);
  }

  fecharEditor(): void {
    this.editorAberto.set(false);
    this.editandoId.set(null);
    this.fErro.set('');
  }

  salvarEvento(): void {
    const titulo = this.fTitulo().trim();
    if (!titulo) {
      this.fErro.set('Dê um título para a tarefa.');
      return;
    }
    if (!this.fData()) {
      this.fErro.set('Escolha a data da tarefa.');
      return;
    }
    if (this.fInicio() && this.fFim() && this.fFim() < this.fInicio()) {
      this.fErro.set('O horário de término deve ser depois do início.');
      return;
    }

    const editando = this.editandoId();
    if (editando) {
      this.eventos.update((itens) =>
        itens.map((evento) =>
          evento.id === editando
            ? {
                ...evento,
                titulo,
                data: this.fData(),
                horaInicio: this.fInicio(),
                horaFim: this.fFim(),
                tipo: this.fTipo(),
                turma: this.fTurma().trim(),
                local: this.fLocal().trim(),
                descricao: this.fDescricao().trim(),
              }
            : evento,
        ),
      );
      this.toast.sucesso('Tarefa atualizada no calendário.');
    } else {
      const novo: EventoCalendario = {
        id: `e${this.proximoId++}`,
        titulo,
        data: this.fData(),
        horaInicio: this.fInicio() || '08:00',
        horaFim: this.fFim() || '09:00',
        tipo: this.fTipo(),
        turma: this.fTurma().trim(),
        responsavel: 'Ana Ribeiro',
        local: this.fLocal().trim(),
        descricao: this.fDescricao().trim(),
      };
      this.eventos.update((itens) => [...itens, novo]);
      this.toast.sucesso(`Tarefa criada para ${formatarDataCurta(novo.data)}.`);
    }
    this.fecharEditor();
  }

  alternarExpandido(iso: string): void {
    this.diaExpandido.set(this.diaExpandido() === iso ? null : iso);
  }

  aoTeclarEscape(): void {
    if (this.editorAberto()) this.fecharEditor();
    else if (this.detalheId()) this.fecharDetalhe();
  }

  // ─── Handlers de formulário ───
  atualizarTitulo(event: Event): void {
    this.fTitulo.set((event.target as HTMLInputElement).value);
  }
  definirData(valor: string): void {
    this.fData.set(valor);
  }
  atualizarInicio(event: Event): void {
    this.fInicio.set((event.target as HTMLInputElement).value);
  }
  atualizarFim(event: Event): void {
    this.fFim.set((event.target as HTMLInputElement).value);
  }
  atualizarTipo(event: Event): void {
    this.fTipo.set((event.target as HTMLSelectElement).value as TipoEvento);
  }
  atualizarTurma(event: Event): void {
    this.fTurma.set((event.target as HTMLInputElement).value);
  }
  atualizarLocal(event: Event): void {
    this.fLocal.set((event.target as HTMLInputElement).value);
  }
  atualizarDescricao(event: Event): void {
    this.fDescricao.set((event.target as HTMLTextAreaElement).value);
  }

  nomeDiaSemana(data: Date): string {
    return data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  }

  private inicioDaSemana(ref: Date): Date {
    const copia = meioDia(ref);
    copia.setDate(copia.getDate() - copia.getDay());
    return copia;
  }

  private nomeMes(data: Date): string {
    const nome = data.toLocaleDateString('pt-BR', { month: 'long' });
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  readonly formatarDataExtensa = formatarDataExtensa;
  readonly formatarDataCurta = formatarDataCurta;
}
