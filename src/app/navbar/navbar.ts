import {
  Component,
  ElementRef,
  HostBinding,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBookOpen,
  LucideCalendar,
  LucideCalendarCheck,
  LucideCheck,
  LucideChevronsUpDown,
  LucideCircleHelp,
  LucideFile,
  LucideGraduationCap,
  LucideHome,
  LucideIdCard,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePlus,
  LucideSearch,
  LucideSettings,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { rotuloFuncao } from '../auth/auth.models';
import { SessaoStore } from '../auth/state/sessao.store';
import {
  DocumentoFile,
  ModalDocumento,
} from '../alunos/detalhe-aluno/modal-documento/modal-documento';
import { DocumentosService } from '../services/documentos.service';

type IconeNav =
  | 'inicio'
  | 'tarefas'
  | 'calendario'
  | 'alunos'
  | 'turmas'
  | 'materias'
  | 'documentos';

interface ItemNav {
  readonly rotulo: string;
  readonly rota: string;
  readonly icone: IconeNav;
  /** Só casa com a URL exata (usado no item de início). */
  readonly exato?: boolean;
}

interface GrupoNav {
  readonly id: string;
  readonly titulo: string;
  readonly itens: readonly ItemNav[];
}

/** Objetos estáveis: recriá-los a cada ciclo faria o RouterLinkActive reavaliar. */
const LINK_EXATO = { exact: true } as const;
const LINK_PARCIAL = { exact: false } as const;

type OpcoesLinkAtivo = typeof LINK_EXATO | typeof LINK_PARCIAL;

/** Remove acentos para que "materias" encontre "Matérias". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideBookOpen,
    LucideCalendar,
    LucideCalendarCheck,
    LucideCheck,
    LucideChevronsUpDown,
    LucideCircleHelp,
    LucideFile,
    LucideGraduationCap,
    LucideHome,
    LucideIdCard,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucidePlus,
    LucideSearch,
    LucideSettings,
    LucideUsers,
    LucideX,
    ModalDocumento,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  host: {
    '(document:keydown)': 'aoTeclarNoDocumento($event)',
    '(document:click)': 'aoClicarNoDocumento($event)',
  },
})
export class Navbar {
  private readonly documentos = inject(DocumentosService);
  private readonly sessao = inject(SessaoStore);

  private readonly campoBusca = viewChild<ElementRef<HTMLInputElement>>('campoBusca');

  isCollapsed = false;
  isDocumentoModalOpen = false;
  contaAberta = false;

  readonly busca = signal('');
  private readonly elemento = inject(ElementRef);

  /** Pastas oferecidas no modal de "Adicionar documento" da navbar. */
  readonly folderOptions = this.documentos.folderOptions;

  /** Nome e função vêm da sessão; sem sessão o protótipo usa o perfil demo. */
  readonly nome = computed(() => this.sessao.usuario()?.nome?.trim() || 'Sara Wood');
  readonly funcao = computed(() => rotuloFuncao(this.sessao.funcao()) || 'Professor');
  readonly iniciais = computed(() => {
    const partes = this.nome().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes.at(-1)![0]}`.toUpperCase();
  });

  private readonly grupos: readonly GrupoNav[] = [
    {
      id: 'geral',
      titulo: 'Geral',
      itens: [
        { rotulo: 'Início', rota: '/', icone: 'inicio', exato: true },
        { rotulo: 'Tarefas', rota: '/tarefas', icone: 'tarefas' },
        { rotulo: 'Calendário', rota: '/calendario', icone: 'calendario' },
      ],
    },
    {
      id: 'gestao',
      titulo: 'Gestão',
      itens: [
        { rotulo: 'Alunos', rota: '/alunos', icone: 'alunos' },
        { rotulo: 'Turmas', rota: '/turmas', icone: 'turmas' },
        { rotulo: 'Matérias', rota: '/materias', icone: 'materias' },
      ],
    },
    {
      id: 'organizacao',
      titulo: 'Organização',
      itens: [{ rotulo: 'Documentos', rota: '/documentos', icone: 'documentos' }],
    },
  ];

  /** Grupos com os itens que casam com a busca atual (todos, quando vazia). */
  readonly gruposVisiveis = computed<readonly GrupoNav[]>(() => {
    const termo = normalizar(this.busca());
    if (!termo) return this.grupos;

    return this.grupos
      .map((grupo) => ({
        ...grupo,
        itens: grupo.itens.filter((item) => normalizar(item.rotulo).includes(termo)),
      }))
      .filter((grupo) => grupo.itens.length > 0);
  });

  readonly semResultados = computed(
    () => normalizar(this.busca()).length > 0 && this.gruposVisiveis().length === 0,
  );

  /** Contas (vínculos com escolas) exibidas no dropdown. Sem sessão, mostra a conta demo. */
  readonly contas = computed(() => this.sessao.vinculos());
  readonly contextoId = computed(() => this.sessao.contexto()?.id ?? this.contas()[0]?.id ?? null);
  readonly temVariasContas = computed(() => this.contas().length > 1);

  @HostBinding('class.collapsed') get collapsed() {
    return this.isCollapsed;
  }

  opcoesLink(item: ItemNav): OpcoesLinkAtivo {
    return item.exato ? LINK_EXATO : LINK_PARCIAL;
  }

  toggleNavbar() {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) {
      this.busca.set('');
      this.contaAberta = false;
    }
  }

  alternarConta(): void {
    this.contaAberta = !this.contaAberta;
  }

  fecharConta(): void {
    this.contaAberta = false;
  }

  trocarConta(vinculoId: string): void {
    this.sessao.definirContexto(vinculoId);
    this.contaAberta = false;
  }

  iniciaisConta(escolaNome: string): string {
    const partes = escolaNome.split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes.at(-1)![0]}`.toUpperCase();
  }

  aoClicarNoDocumento(evento: MouseEvent): void {
    if (!this.contaAberta) return;
    const alvo = evento.target as HTMLElement | null;
    if (alvo && this.elemento.nativeElement.contains(alvo)) return;
    this.contaAberta = false;
  }

  /** Expande a barra e devolve o foco ao campo de busca. */
  abrirBusca(): void {
    this.isCollapsed = false;
    this.focarBusca();
  }

  onBusca(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }

  limparBusca(): void {
    this.busca.set('');
  }

  /**
   * Atalho "/" para a busca do menu, como o selo do campo sugere. Ignora
   * quando o usuário está digitando em outro campo.
   */
  aoTeclarNoDocumento(evento: KeyboardEvent): void {
    if (evento.key === 'Escape' && this.contaAberta) {
      this.contaAberta = false;
      return;
    }
    if (evento.key !== '/' || evento.metaKey || evento.ctrlKey || evento.altKey) return;

    const alvo = evento.target as HTMLElement | null;
    const digitando =
      alvo?.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo?.tagName ?? '');
    if (digitando) return;

    evento.preventDefault();
    this.abrirBusca();
  }

  openDocumentoModal() {
    this.isDocumentoModalOpen = true;
  }

  closeDocumentoModal() {
    this.isDocumentoModalOpen = false;
  }

  onDocumentoFilesAdded(files: DocumentoFile[]) {
    this.documentos.addFiles(files, files[0]?.folderId ?? null);
  }

  /**
   * O campo fica escondido enquanto a barra está recolhida, então o foco só
   * pode ser aplicado depois que o layout expandir. Tenta por alguns frames
   * em vez de apostar num tempo fixo de transição.
   */
  private focarBusca(tentativas = 12): void {
    const tentar = () => {
      const campo = this.campoBusca()?.nativeElement;
      if (campo && campo.offsetParent !== null) {
        campo.focus();
        campo.select();
        return;
      }
      if (tentativas-- > 0) agendarFrame(tentar);
    };
    agendarFrame(tentar);
  }
}

function agendarFrame(callback: () => void): void {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 16);
  }
}
