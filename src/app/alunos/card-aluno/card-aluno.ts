import { Component, Input, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { LucideEllipsisVertical, LucideUser, LucidePencil, LucideTrash2, LucideShare2 } from '@lucide/angular';
import { CommonModule } from '@angular/common'; // Importe o CommonModule para usar o *ngIf

export interface Aluno {
  id: number;
  nome: string;
  ano: string;
  deficiencia: string;
  genero: string;
  fotoUrl?: string;
}

@Component({
  selector: 'app-card-aluno',
  // Adicione o CommonModule nos imports para usar *ngIf
  imports: [CommonModule, LucideEllipsisVertical, LucideUser, LucidePencil, LucideTrash2, LucideShare2],
  templateUrl: './card-aluno.html',
  styleUrl: './card-aluno.scss',
})
export class CardAluno {
  @Input({ required: true }) aluno!: Aluno;
  isOptionsMenuOpen = false;

  private readonly onDocumentClick: (event: Event) => void;

  constructor(private router: Router, private elementRef: ElementRef) {
    this.onDocumentClick = (event: Event) => {
      if (this.isOptionsMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
        this.isOptionsMenuOpen = false;
      }
    };
  }

  ngOnInit() {
    document.addEventListener('click', this.onDocumentClick, true);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick, true);
  }

  onCardClick() {
    this.router.navigate(['/alunos', this.aluno.id]);
  }

  toggleOptionsMenu(event: Event) {
    event.stopPropagation();
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
  }

  closeOptionsMenu() {
    this.isOptionsMenuOpen = false;
  }

  // --- NOVAS FUNÇÕES AUXILIARES ---

  // Verifica se o texto já contém a palavra "Deficiência" (ignorando maiúsculas/minúsculas)
  shouldShowDeficienciaLabel(): boolean {
    if (!this.aluno?.deficiencia) return false;
    return !this.aluno.deficiencia.toLowerCase().startsWith('deficiência');
  }

  // Remove a palavra "Deficiência " do início do texto para exibir apenas o tipo
  getDeficienciaDisplay(): string {
    if (!this.aluno?.deficiencia) return '';
    return this.aluno.deficiencia.replace(/^Deficiência\s*/i, '');
  }
}