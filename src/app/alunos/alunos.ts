import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideSearch, LucidePlus, LucideLayoutGrid, LucideList, LucideLoader2 } from '@lucide/angular';
import { CardAluno, Aluno } from './card-aluno/card-aluno';
import { AlunoService } from './aluno.service';

@Component({
  selector: 'app-alunos',
  imports: [LucideSearch, LucidePlus, LucideLayoutGrid, LucideList, LucideLoader2, CardAluno],
  templateUrl: './alunos.html',
  styleUrl: './alunos.scss',
})
export class Alunos implements OnInit {
  searchTerm = '';
  viewMode: 'grid' | 'list' = 'grid';
  alunos: Aluno[] = [];
  
  // Mantemos as suas variáveis de controle do modal e carregamento
  isModalOpen = false;
  alunoEmEdicao: Aluno | null = null;
  isLoading = true; 

  constructor(
    private alunoService: AlunoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigationEvent = event as NavigationEnd;

        if (navigationEvent.urlAfterRedirects.startsWith('/alunos') && !navigationEvent.urlAfterRedirects.includes('/alunos/')) {
          this.carregarAlunos();
        }
      });
  }

  ngOnInit(): void {
    this.carregarAlunos();
  }

  get filteredAlunos(): Aluno[] {
    if (!this.searchTerm.trim()) {
      return this.alunos;
    }

    const term = this.searchTerm.toLowerCase();
    return this.alunos.filter(
      (aluno) =>
        aluno.nome.toLowerCase().includes(term) ||
        aluno.ano.toLowerCase().includes(term) ||
        aluno.deficiencia.toLowerCase().includes(term)
    );
  }

  openModal() {
    this.alunoEmEdicao = null;
    this.isModalOpen = true;
  }

  abrirModalEdicao(aluno: Aluno) {
    this.alunoEmEdicao = aluno;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  carregarAlunos(): void {
    this.isLoading = true;

    this.alunoService.listarAlunos().subscribe({
      next: (alunosBanco) => {
        this.alunos = alunosBanco.map((alunoBanco) => this.mapAlunoBancoParaTela(alunoBanco));
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (erro) => {
        console.error('Erro ao carregar alunos do banco:', erro);
        this.alunos = [];
        this.isLoading = false;
        this.cdr.detectChanges(); 
        alert('Falha ao carregar os alunos.');
      },
    });
  }

  onAlunoSaved(alunoForm: AlunoForm) {
    const payloadBanco = {
      nome_completo: alunoForm.nomeCompleto,
      data_de_nascimento: alunoForm.dataNascimento ? alunoForm.dataNascimento : undefined,
      genero: this.getGeneroLabel(alunoForm.genero),
      serie: this.getSerieLabel(alunoForm.serieAno),
      diagnostico: this.getDiagnosticoLabel(alunoForm.diagnostico),
      foto: alunoForm.fotoUrl || undefined,
    };

    const alunoId = this.alunoEmEdicao?.id ?? alunoForm.id;

    if (alunoId !== undefined && alunoId !== null && alunoId !== '') {
      this.alunoService.atualizarAluno(alunoId, payloadBanco).subscribe({
        next: () => {
          this.carregarAlunos();
          this.closeModal();
          alert('Aluno atualizado com sucesso!');
        },
        error: (erro: any) => {
          console.error('Erro ao atualizar no banco:', erro);
          alert('Falha ao atualizar aluno.');
        },
      });
    } else if (!this.alunoEmEdicao) {
      this.alunoService.cadastrarAluno(payloadBanco).subscribe({
        next: () => {
          this.carregarAlunos();
          this.closeModal();
          alert('Cadastro realizado com sucesso!');
        },
        error: (erro: any) => {
          console.error('Erro ao salvar no banco:', erro);
          alert('Falha ao cadastrar aluno.');
        },
      });
    } else {
      console.error('Não foi possível atualizar o aluno: ID não encontrado.', this.alunoEmEdicao);
      alert('Não foi possível atualizar este aluno porque o ID não foi encontrado.');
    }
  }

  onExcluirAluno(aluno: Aluno) {
    const confirmacao = confirm(`Tem certeza que deseja excluir o aluno(a) ${aluno.nome}?`);

    if (confirmacao) {
      this.isLoading = true;

      this.alunoService.excluirAluno(aluno.id).subscribe({
        next: () => {
          alert('Aluno excluído com sucesso!');
          this.carregarAlunos();
        },
        error: (erro) => {
          console.error('Erro ao excluir aluno:', erro);
          alert('Falha ao excluir o aluno.');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
  }

  private mapAlunoBancoParaTela(alunoBanco: any): Aluno {
    return {
      id: alunoBanco.id, 
      nome: alunoBanco.nome_completo ?? 'Aluno sem nome',
      ano: alunoBanco.serie ?? 'Sem série',
      deficiencia: alunoBanco.diagnostico ?? 'Sem diagnóstico',
      genero: alunoBanco.genero ?? 'Não informado',
      fotoUrl: alunoBanco.fotoUrl ?? alunoBanco.foto ?? undefined,
      originalData: alunoBanco,
    };
  }

  // --- Funções Auxiliares Restauradas ---

  private getSerieLabel(value: string): string {
    return this.series.find((s) => s.value === value)?.label || '';
  }

  private getDiagnosticoLabel(value: string): string {
    return this.diagnosticos.find((d) => d.value === value)?.label || '';
  }

  private getGeneroLabel(value: string): string {
    return this.generos.find((g) => g.value === value)?.label || '';
  }

  private series = [
    { value: '1ano', label: '1º Ano' },
    { value: '2ano', label: '2º Ano' },
    { value: '3ano', label: '3º Ano' },
    { value: '4ano', label: '4º Ano' },
    { value: '5ano', label: '5º Ano' },
    { value: '6ano', label: '6º Ano' },
    { value: '7ano', label: '7º Ano' },
    { value: '8ano', label: '8º Ano' },
    { value: '9ano', label: '9º Ano' },
  ];

  private diagnosticos = [
    { value: 'tdah', label: 'TDAH (Transtorno do Déficit de Atenção com Hiperatividade)' },
    { value: 'autismo', label: 'TEA (Transtorno do Espectro Autista)' },
    { value: 'deficiencia-fisica', label: 'Deficiência Física' },
    { value: 'deficiencia-visual', label: 'Deficiência Visual' },
    { value: 'deficiencia-auditiva', label: 'Deficiência Auditiva' },
    { value: 'intelectual', label: 'Deficiência Intelectual' },
    { value: 'outro', label: 'Outro' },
  ];

  private generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'outro', label: 'Outro' },
  ];
}