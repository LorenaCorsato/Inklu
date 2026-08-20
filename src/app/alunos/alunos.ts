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

  openAdicionarAluno() {
    this.router.navigate(['/alunos/adicionar']);
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

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
  }

  private mapAlunoBancoParaTela(alunoBanco: any): Aluno {
    return {
      id: Number(alunoBanco.id ?? 0),
      nome: alunoBanco.nome_completo ?? 'Aluno sem nome',
      ano: alunoBanco.serie ?? 'Sem série',
      deficiencia: alunoBanco.diagnostico ?? 'Sem diagnóstico',
      genero: alunoBanco.genero ?? 'Não informado',
      fotoUrl: alunoBanco.fotoUrl ?? alunoBanco.foto ?? undefined,
    };
  }
}