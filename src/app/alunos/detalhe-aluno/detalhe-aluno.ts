import { Component, ElementRef } from '@angular/core';
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
  LucideTrash2,
  LucideShare2,
  LucideFilePlus,
  LucideFilter,
  LucideX,
  LucideCheck,
} from '@lucide/angular';
import { Aluno } from '../card-aluno/card-aluno';
import { ModalDocumento } from './modal-documento/modal-documento';

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
    LucideTrendingUp,
    LucidePencil,
    LucideTrash2,
    LucideShare2,
    LucideFilePlus,
    LucideFilter,
    LucideX,
    LucideCheck,
    ModalDocumento,
  ],
  templateUrl: './detalhe-aluno.html',
  styleUrl: './detalhe-aluno.scss',
})
export class DetalheAluno {
  aluno: Aluno | null = null;
  isOptionsMenuOpen = false;
  isDocumentoModalOpen = false;

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

  constructor(private route: ActivatedRoute, private router: Router, private elementRef: ElementRef) {
    this.onDocumentClick = (event: Event) => {
      if (this.isOptionsMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
        this.isOptionsMenuOpen = false;
      }
      if (this.isFilterOpen && !this.elementRef.nativeElement.contains(event.target)) {
        this.isFilterOpen = false;
      }
    };
  }

  ngOnInit() {
    document.addEventListener('click', this.onDocumentClick, true);
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.aluno = this.getAlunoById(id);
    });
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

  openDocumentoModal() {
    this.isDocumentoModalOpen = true;
  }

  closeDocumentoModal() {
    this.isDocumentoModalOpen = false;
  }

  private getAlunoById(id: number): Aluno | null {
    const alunos: Aluno[] = [
      { id: 1, nome: 'Alex Oliveira', ano: '3º Ano', deficiencia: 'Autismo', genero: 'Masculino', fotoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop' },
      { id: 2, nome: 'Alex Oliveira', ano: '3º Ano', deficiencia: 'Autismo', genero: 'Masculino', fotoUrl: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=400&h=300&fit=crop' },
      { id: 3, nome: 'Alex Oliveira', ano: '3º Ano', deficiencia: 'Autismo', genero: 'Masculino', fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop' },
      { id: 4, nome: 'Alex Oliveira', ano: '3º Ano', deficiencia: 'Autismo', genero: 'Masculino', fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop' },
      { id: 5, nome: 'Alex Oliveira', ano: '3º Ano', deficiencia: 'Autismo', genero: 'Masculino', fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop' },
      { id: 6, nome: 'Alex Oliveira', ano: '3º Ano', deficiencia: 'Autismo', genero: 'Masculino', fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop' },
      { id: 7, nome: 'Alex Oliveira', ano: '3º Ano', deficiencia: 'Autismo', genero: 'Masculino', fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop' },
      { id: 8, nome: 'Alex Oliveira', ano: '3º Ano', deficiencia: 'Autismo', genero: 'Masculino', fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop' },
    ];
    return alunos.find(a => a.id === id) ?? null;
  }
}
