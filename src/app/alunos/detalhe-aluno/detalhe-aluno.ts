import { Component, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideUser,
  LucideDownload,
  LucideMoreVertical,
  LucideGraduationCap,
  LucideAccessibility,
  LucideCalendar,
  LucideTrendingUp,
  LucidePencil,
  LucideUserRoundX,
  LucideShare2,
  LucideFilePlus,
  LucideFilter,
  LucideX,
  LucideCheck,
  LucidePen,
} from '@lucide/angular';
import { Aluno } from '../card-aluno/card-aluno';
import { ModalDocumento } from './modal-documento/modal-documento';
import { ModalDadosAdicionais, DadosAdicionais } from './modal-dados-adicionais/modal-dados-adicionais';
import { AlunoService } from '../aluno.service';

export interface Arquivo {
  data: string;
  nome: string;
  alteracao: string;
  materia: string;
}

@Component({
  selector: 'app-detalhe-aluno',
  imports: [
    CommonModule,
    FormsModule,
    LucideArrowLeft,
    LucideUser,
    LucideDownload,
    LucideMoreVertical,
    LucideGraduationCap,
    LucideAccessibility,
    LucideCalendar,
    LucidePencil,
    LucideUserRoundX,
    LucideShare2,
    LucideFilePlus,
    LucideFilter,
    LucidePen,
    LucideX,
    LucideCheck,
    ModalDocumento,
    ModalDadosAdicionais,
  ],
  templateUrl: './detalhe-aluno.html',
  styleUrl: './detalhe-aluno.scss',
})
export class DetalheAluno {
  aluno: Aluno | null = null;
  isOptionsMenuOpen = false;
  isDocumentoModalOpen = false;
  isDadosAdicionaisModalOpen = false;

  dadosAdicionais: DadosAdicionais = { interesses: [], preferencias: '' };

  searchQuery = '';
  isFilterOpen = false;
  selectedMaterias: Set<string> = new Set();
  dateFrom = '';
  dateTo = '';

  materias = ['Matemática', 'Artes', 'Português', 'Ciências'];

  arquivos: Arquivo[] = [
    { data: '2025-01-01', nome: 'Atividade_de_matematica', alteracao: 'Adição de jogos lúdicos para melhor entendimento', materia: 'Matemática' },
    { data: '2025-01-01', nome: 'Atividade_de_desenhos_artes', alteracao: 'Adição de desenhos menos coloridos', materia: 'Artes' },
    { data: '2025-01-01', nome: 'Atividade_portugues', alteracao: 'Remoção de cores', materia: 'Português' },
    { data: '2025-01-01', nome: 'Atividade_de_ciencia', alteracao: 'Adaptação com dinossauros', materia: 'Ciências' },
  ];

  get filteredArquivos(): Arquivo[] {
    return this.arquivos.filter(arquivo => {
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchesSearch =
          arquivo.nome.toLowerCase().includes(q) ||
          arquivo.alteracao.toLowerCase().includes(q) ||
          arquivo.materia.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (this.selectedMaterias.size > 0 && !this.selectedMaterias.has(arquivo.materia)) {
        return false;
      }

      if (this.dateFrom || this.dateTo) {
        const arquivoDate = new Date(arquivo.data);
        if (this.dateFrom) {
          const from = new Date(this.dateFrom);
          if (arquivoDate < from) return false;
        }
        if (this.dateTo) {
          const to = new Date(this.dateTo);
          if (arquivoDate > to) return false;
        }
      }

      return true;
    });
  }

  private readonly onDocumentClick: (event: Event) => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private elementRef: ElementRef,
    private alunoService: AlunoService,
    private cdr: ChangeDetectorRef
) {
    this.onDocumentClick = (event: Event) => {
      if (this.isOptionsMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
        this.isOptionsMenuOpen = false;
      }
      if (this.isFilterOpen && !this.elementRef.nativeElement.contains(event.target)) {
        this.isFilterOpen = false;
      }
    };
  }

  alunoOriginal: any = null;
  diagnosticosLista: Array<{diagnóstico?: string, diagnostico?: string, descricao: string}> = [];
  interessesList: string[] = [];
  preferenciasList: string[] = [];
  isLoading = true;

  ngOnInit() {
    document.addEventListener('click', this.onDocumentClick, true);
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.carregarAluno(id);
      }
    });

    this.route.queryParamMap.subscribe(queryParams => {
      if (queryParams.get('preencher') === 'true') {
        this.isDadosAdicionaisModalOpen = true;
      }
    });
  }

carregarAluno(id: string) {
    this.isLoading = true;

    this.alunoService.buscarAlunoPorId(id).subscribe({
      next: (dados) => {

        const alunoDb = Array.isArray(dados) ? dados[0] : dados;
        this.alunoOriginal = alunoDb;

        this.processarDiagnosticos(alunoDb.diagnostico);

        try {
          this.interessesList = alunoDb.interesses ? JSON.parse(alunoDb.interesses) : [];
        } catch(e) { 
          this.interessesList = []; 
        }

        if (alunoDb.preferencias) {
           this.preferenciasList = alunoDb.preferencias.split('\n').filter((p: string) => p.trim() !== '');
        } else {
           this.preferenciasList = [];
        }

        this.dadosAdicionais = {
           interesses: this.interessesList,
           preferencias: alunoDb.preferencias || ''
        };

        this.aluno = {
          id: alunoDb.id,
          nome: alunoDb.nome_completo ?? 'Sem nome',
          ano: alunoDb.turma ? `${alunoDb.turma.serie} ${alunoDb.turma.nome}` : 'Não informada',
          deficiencia: this.diagnosticosLista.length > 0
            ? (this.diagnosticosLista[0].diagnóstico || this.diagnosticosLista[0].diagnostico || 'Ver detalhes')
            : 'Não informado',
          genero: alunoDb.genero ?? 'Não informado',
          fotoUrl: alunoDb.fotoUrl ?? alunoDb.foto ?? undefined,
          originalData: alunoDb
        };


        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar aluno:', err);
        this.isLoading = false;
        alert('Erro ao carregar os dados do aluno.');
        this.voltar();
      }
    });
  }

  processarDiagnosticos(diagnosticoDb: any) {
    if (!diagnosticoDb) {
      this.diagnosticosLista = [];
      return;
    }

    try {
      this.diagnosticosLista = typeof diagnosticoDb === 'string'
        ? JSON.parse(diagnosticoDb)
        : diagnosticoDb;
    } catch (e) {
      console.error('Erro ao ler diagnósticos:', e);
      this.diagnosticosLista = [];
    }
  }
  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick, true);
  }

  voltar() {
    this.router.navigate(['/alunos']);
  }

  toggleOptionsMenu(event: Event) {
    event.stopPropagation();
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
  }

  closeOptionsMenu() {
    this.isOptionsMenuOpen = false;
  }

  toggleFilter(event: Event) {
    event.stopPropagation();
    this.isFilterOpen = !this.isFilterOpen;
  }

  toggleMateria(materia: string) {
    if (this.selectedMaterias.has(materia)) {
      this.selectedMaterias.delete(materia);
    } else {
      this.selectedMaterias.add(materia);
    }
  }

  isMateriaSelected(materia: string): boolean {
    return this.selectedMaterias.has(materia);
  }

  clearFilters() {
    this.selectedMaterias.clear();
    this.dateFrom = '';
    this.dateTo = '';
    this.searchQuery = '';
  }

  get hasActiveFilters(): boolean {
    return this.selectedMaterias.size > 0 || !!this.dateFrom || !!this.dateTo;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  }
  calcularIdade(dataNascimento: string | null | undefined): string {
    if (!dataNascimento) return 'Não informada';

    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    if (isNaN(nascimento.getTime())) return 'Data inválida';

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const diferencaMeses = hoje.getMonth() - nascimento.getMonth();

    if (diferencaMeses < 0 || (diferencaMeses === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return `${idade} anos`;
  }

  openDocumentoModal() {
    this.isDocumentoModalOpen = true;
  }

  closeDocumentoModal() {
    this.isDocumentoModalOpen = false;
  }

  openDadosAdicionaisModal() {
    this.isDadosAdicionaisModalOpen = true;
  }

  closeDadosAdicionaisModal() {
    this.isDadosAdicionaisModalOpen = false;
  }

  onDadosAdicionaisSaved(dados: DadosAdicionais) {
    this.dadosAdicionais = dados;
    
    if (this.aluno && this.aluno.id) {
      const payload = {
        interesses: JSON.stringify(dados.interesses),
        preferencias: dados.preferencias
      };
      
      this.alunoService.atualizarAluno(this.aluno.id, payload).subscribe({
        next: () => {
          this.carregarAluno(this.aluno!.id);
        },
        error: (err) => {
          console.error('Erro ao salvar dados adicionais:', err);
          alert('Erro ao salvar dados adicionais.');
        }
      });
    }
  }

}
