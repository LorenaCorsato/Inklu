import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  LucideAlertTriangle,
  LucideCalendarDays,
  LucideCheck,
  LucideChevronRight,
  LucideFileText,
  LucideInbox,
  LucidePlus,
  LucideSearch,
  LucideSend,
  LucideTrash2,
  LucideUpload,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { ToastService } from '../shared/toast/toast.service';
import { ModalSolicitarAjuste } from './modal-solicitar-ajuste/modal-solicitar-ajuste';

type Prioridade = 'revisar' | 'completo' | 'urgente' | 'normal';
type Filtro = 'todas' | 'urgentes' | 'minhas';

interface Subtarefa {
  id: string;
  titulo: string;
  concluida: boolean;
}

interface Documento {
  id: string;
  nome: string;
  tamanho: string;
  formato: string;
}

interface Comentario {
  id: string;
  autor: string;
  iniciais: string;
  quando: string;
  texto: string;
  meu?: boolean;
}

interface Tarefa {
  id: string;
  titulo: string;
  secao: string;
  status: string;
  prioridade: Prioridade;
  prazo: string;
  entregueEm: string;
  responsavel: string;
  turma: string;
  descricao: string;
  destinatario: string;
  subtarefas: Subtarefa[];
  documentos: Documento[];
  comentarios: Comentario[];
  aprovada: boolean;
  ajusteSolicitado: boolean;
  ajusteDetalhe?: string;
}

const TAREFAS_INICIAIS: Tarefa[] = [
  {
    id: 't1',
    titulo: 'Relatório de Progresso – Lucas H.',
    secao: 'Relatórios · 3º ano A',
    status: 'Revisar',
    prioridade: 'revisar',
    prazo: '12/06',
    entregueEm: '12 Jun 2026',
    responsavel: 'Carlos Souza (Apoio)',
    turma: '3° Ano A',
    destinatario: 'Carlos Souza (Apoio) para sua Revisão',
    descricao:
      'Realizar o relatório de acompanhamento de Lucas Henrique com foco em comportamento e estratégias aplicadas durante as atividades de hipérfoco em dinossauros. Esse material deve ser integrado e revisado com a regência.',
    subtarefas: [
      { id: 's1', titulo: 'Adaptar Prova Trimestral (João Victor)', concluida: true },
      { id: 's2', titulo: 'Relatório de Acompanhamento (Lucas H.)', concluida: false },
      { id: 's3', titulo: 'Revisar e Assinar Relatório Final (Vocoa)', concluida: false },
    ],
    documentos: [{ id: 'd1', nome: 'relatorio_lucas_2026.pdf', tamanho: '142 KB', formato: 'PDF' }],
    comentarios: [
      {
        id: 'c1',
        autor: 'Prof. Carlos Souza',
        iniciais: 'C',
        quando: 'há 1 hora',
        texto:
          'Enviei o rascunho do Lucas Henrique para sua revisão, Ana. De uma olhada se falta algo de matemática.',
      },
      {
        id: 'c2',
        autor: 'Você',
        iniciais: 'A',
        quando: 'há 30 min',
        texto: 'Fico excelente, Carlos! Vou revisar os dados e adicionar a nota das dinâmicas hoje à tarde.',
        meu: true,
      },
    ],
    aprovada: false,
    ajusteSolicitado: false,
  },
  {
    id: 't2',
    titulo: 'Adaptar Prova – João Victor',
    secao: 'Relatórios · 3º ano A',
    status: 'Completo',
    prioridade: 'completo',
    prazo: '10/06',
    entregueEm: '10 Jun 2026',
    responsavel: 'Ana Ribeiro',
    turma: '3° Ano A',
    destinatario: 'Ana Ribeiro',
    descricao:
      'Versão adaptada da prova trimestral com apoio visual e ampliação de fonte, pronta para aplicação em sala.',
    subtarefas: [
      { id: 's4', titulo: 'Revisar questões com a regência', concluida: true },
      { id: 's5', titulo: 'Enviar versão final para impressão', concluida: true },
    ],
    documentos: [{ id: 'd2', nome: 'prova_adaptada_joao.pdf', tamanho: '98 KB', formato: 'PDF' }],
    comentarios: [
      {
        id: 'c3',
        autor: 'Você',
        iniciais: 'A',
        quando: 'há 2 dias',
        texto: 'Prova adaptada finalizada e enviada para a equipe pedagógica.',
        meu: true,
      },
    ],
    aprovada: true,
    ajusteSolicitado: false,
  },
  {
    id: 't3',
    titulo: 'Relatório Mensal – Mariana S.',
    secao: 'Acompanhamento · 5º ano B',
    status: 'Urgente',
    prioridade: 'urgente',
    prazo: '20/06',
    entregueEm: '20 Jun 2026',
    responsavel: 'Ana Ribeiro',
    turma: '5° Ano B',
    destinatario: 'Coordenação Pedagógica',
    descricao:
      'Consolidar os registros mensais de acompanhamento da Mariana, incluindo metas do PEI e encaminhamentos definidos na última reunião.',
    subtarefas: [
      { id: 's6', titulo: 'Coletar registros dos professores', concluida: false },
      { id: 's7', titulo: 'Atualizar metas do PEI', concluida: false },
    ],
    documentos: [],
    comentarios: [],
    aprovada: false,
    ajusteSolicitado: false,
  },
];

@Component({
  selector: 'app-tarefas',
  imports: [
    LucideAlertTriangle,
    LucideCalendarDays,
    LucideCheck,
    LucideChevronRight,
    LucideFileText,
    LucideInbox,
    LucidePlus,
    LucideSearch,
    LucideSend,
    LucideTrash2,
    LucideUpload,
    LucideUsers,
    LucideX,
    ModalSolicitarAjuste,
  ],
  templateUrl: './tarefas.html',
  styleUrl: './tarefas.scss',
})
export class Tarefas {
  private readonly toast = inject(ToastService);

  private readonly tarefas = signal<Tarefa[]>(TAREFAS_INICIAIS);
  private proximoId = 4;

  readonly busca = signal('');
  readonly filtro = signal<Filtro>('todas');
  readonly selecionadaId = signal('t1');
  readonly novaSubtarefa = signal('');
  readonly novoComentario = signal('');
  readonly modalAjusteAberto = signal(false);

  private readonly modalAjuste = viewChild(ModalSolicitarAjuste);

  readonly filtros: { id: Filtro; rotulo: string }[] = [
    { id: 'todas', rotulo: 'Todas' },
    { id: 'urgentes', rotulo: 'Urgentes' },
    { id: 'minhas', rotulo: 'Minhas' },
  ];

  readonly tarefasVisiveis = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    const filtro = this.filtro();

    return this.tarefas().filter((tarefa) => {
      if (filtro === 'urgentes' && tarefa.prioridade !== 'urgente' && tarefa.prioridade !== 'revisar') {
        return false;
      }
      if (filtro === 'minhas' && tarefa.responsavel !== 'Ana Ribeiro') {
        return false;
      }
      if (!termo) return true;
      return `${tarefa.titulo} ${tarefa.secao} ${tarefa.status}`.toLocaleLowerCase('pt-BR').includes(termo);
    });
  });

  readonly secoes = computed(() => {
    const mapa = new Map<string, Tarefa[]>();
    for (const tarefa of this.tarefasVisiveis()) {
      const lista = mapa.get(tarefa.secao) ?? [];
      lista.push(tarefa);
      mapa.set(tarefa.secao, lista);
    }
    return [...mapa.entries()].map(([nome, itens]) => ({ nome, itens }));
  });

  readonly selecionada = computed(
    () => this.tarefas().find((tarefa) => tarefa.id === this.selecionadaId()) ?? null,
  );

  readonly progresso = computed(() => {
    const tarefa = this.selecionada();
    if (!tarefa || tarefa.subtarefas.length === 0) return 0;
    const feitas = tarefa.subtarefas.filter((item) => item.concluida).length;
    return Math.round((feitas / tarefa.subtarefas.length) * 100);
  });

  atualizarBusca(event: Event): void {
    this.busca.set((event.target as HTMLInputElement).value);
  }

  limparBusca(): void {
    this.busca.set('');
  }

  definirFiltro(filtro: Filtro): void {
    this.filtro.set(filtro);
  }

  selecionar(id: string): void {
    this.selecionadaId.set(id);
    this.novaSubtarefa.set('');
    this.novoComentario.set('');
  }

  alternarSubtarefa(id: string): void {
    const tarefa = this.selecionada();
    if (!tarefa) return;
    this.tarefas.update((itens) =>
      itens.map((item) =>
        item.id === tarefa.id
          ? {
              ...item,
              subtarefas: item.subtarefas.map((sub) =>
                sub.id === id ? { ...sub, concluida: !sub.concluida } : sub,
              ),
            }
          : item,
      ),
    );
  }

  adicionarSubtarefa(event: Event): void {
    event.preventDefault();
    const titulo = this.novaSubtarefa().trim();
    const tarefa = this.selecionada();
    if (!titulo || !tarefa) return;

    this.tarefas.update((itens) =>
      itens.map((item) =>
        item.id === tarefa.id
          ? {
              ...item,
              subtarefas: [
                ...item.subtarefas,
                { id: `s${this.proximoId++}`, titulo, concluida: false },
              ],
            }
          : item,
      ),
    );
    this.novaSubtarefa.set('');
  }

  atualizarNovaSubtarefa(event: Event): void {
    this.novaSubtarefa.set((event.target as HTMLInputElement).value);
  }

  adicionarDocumento(): void {
    const tarefa = this.selecionada();
    if (!tarefa) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => {
      const arquivo = input.files?.[0];
      if (!arquivo) return;
      this.tarefas.update((itens) =>
        itens.map((item) =>
          item.id === tarefa.id
            ? {
                ...item,
                documentos: [
                  ...item.documentos,
                  {
                    id: `d${this.proximoId++}`,
                    nome: arquivo.name,
                    tamanho: this.formatarTamanho(arquivo.size),
                    formato: (arquivo.name.split('.').pop() ?? 'ARQ').toUpperCase(),
                  },
                ],
              }
            : item,
        ),
      );
      this.toast.sucesso(`Documento “${arquivo.name}” anexado à tarefa.`);
    };
    input.click();
  }

  removerDocumento(id: string): void {
    const tarefa = this.selecionada();
    if (!tarefa) return;
    const doc = tarefa.documentos.find((item) => item.id === id);
    this.tarefas.update((itens) =>
      itens.map((item) =>
        item.id === tarefa.id
          ? { ...item, documentos: item.documentos.filter((item) => item.id !== id) }
          : item,
      ),
    );
    if (doc) {
      this.toast.info(`Documento “${doc.nome}” removido da tarefa.`);
    }
  }

  atualizarNovoComentario(event: Event): void {
    this.novoComentario.set((event.target as HTMLTextAreaElement).value);
  }

  enviarComentario(event: Event): void {
    event.preventDefault();
    const texto = this.novoComentario().trim();
    const tarefa = this.selecionada();
    if (!texto || !tarefa) return;

    this.tarefas.update((itens) =>
      itens.map((item) =>
        item.id === tarefa.id
          ? {
              ...item,
              comentarios: [
                ...item.comentarios,
                {
                  id: `c${this.proximoId++}`,
                  autor: 'Você',
                  iniciais: 'A',
                  quando: 'agora',
                  texto,
                  meu: true,
                },
              ],
            }
          : item,
      ),
    );
    this.novoComentario.set('');
  }

  abrirModalAjuste(): void {
    if (!this.selecionada()) return;
    this.modalAjuste()?.reset();
    this.modalAjusteAberto.set(true);
  }

  fecharModalAjuste(): void {
    this.modalAjusteAberto.set(false);
  }

  confirmarAjuste(detalhe: string): void {
    const tarefa = this.selecionada();
    if (!tarefa) return;
    const texto = detalhe.trim();
    if (!texto) return;
    this.tarefas.update((itens) =>
      itens.map((item) =>
        item.id === tarefa.id
          ? { ...item, ajusteSolicitado: true, ajusteDetalhe: texto }
          : item,
      ),
    );
    this.modalAjusteAberto.set(false);
    this.modalAjuste()?.reset();
    this.toast.info(`Ajuste solicitado para “${tarefa.titulo}”.`);
  }

  aprovar(): void {
    const tarefa = this.selecionada();
    if (!tarefa) return;
    this.tarefas.update((itens) =>
      itens.map((item) =>
        item.id === tarefa.id
          ? { ...item, aprovada: true, ajusteSolicitado: false, ajusteDetalhe: undefined }
          : item,
      ),
    );
    this.toast.sucesso(`PDF de “${tarefa.titulo}” aprovado e assinado.`);
  }

  private formatarTamanho(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
