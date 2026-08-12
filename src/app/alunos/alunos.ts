import { Component, signal } from '@angular/core';
import { LucideSearch, LucidePlus, LucideLayoutGrid, LucideList } from '@lucide/angular';
import { CardAluno, Aluno } from './card-aluno/card-aluno';
import { ModalAluno, AlunoForm } from './modal-aluno/modal-aluno';
import { AlunoService } from './aluno.service';

@Component({
  selector: 'app-alunos',
  imports: [LucideSearch, LucidePlus, LucideLayoutGrid, LucideList, CardAluno, ModalAluno],
  templateUrl: './alunos.html',
  styleUrl: './alunos.scss',
})
export class Alunos {
  searchTerm: string = '';
  viewMode: 'grid' | 'list' = 'grid';

  alunos: Aluno[] = [
    {
      id: 1,
      nome: 'Alex Oliveira',
      ano: '3º Ano',
      deficiencia: 'Autismo',
      genero: 'Masculino',
      fotoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      nome: 'Alex Oliveira',
      ano: '3º Ano',
      deficiencia: 'Autismo',
      genero: 'Masculino',
      fotoUrl: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      nome: 'Alex Oliveira',
      ano: '3º Ano',
      deficiencia: 'Autismo',
      genero: 'Masculino',
      fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      nome: 'Alex Oliveira',
      ano: '3º Ano',
      deficiencia: 'Autismo',
      genero: 'Masculino',
      fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      nome: 'Alex Oliveira',
      ano: '3º Ano',
      deficiencia: 'Autismo',
      genero: 'Masculino',
      fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop'
    },
    {
      id: 6,
      nome: 'Alex Oliveira',
      ano: '3º Ano',
      deficiencia: 'Autismo',
      genero: 'Masculino',
      fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop'
    },
    {
      id: 7,
      nome: 'Alex Oliveira',
      ano: '3º Ano',
      deficiencia: 'Autismo',
      genero: 'Masculino',
      fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop'
    },
    {
      id: 8,
      nome: 'Alex Oliveira',
      ano: '3º Ano',
      deficiencia: 'Autismo',
      genero: 'Masculino',
      fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop'
    }
  ];

  get filteredAlunos(): Aluno[] {
    if (!this.searchTerm.trim()) {
      return this.alunos;
    }
    const term = this.searchTerm.toLowerCase();
    return this.alunos.filter(aluno =>
      aluno.nome.toLowerCase().includes(term) ||
      aluno.ano.toLowerCase().includes(term) ||
      aluno.deficiencia.toLowerCase().includes(term)
    );
  }

  isModalOpen = false;

  constructor(private alunoService: AlunoService) {}

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onAlunoSaved(alunoForm: AlunoForm) {
    console.log('Dados recebidos do modal:', alunoForm);

    // 1. Mapeia os dados do modal para o formato esperado pelo backend/Supabase
    const payloadBanco = {
      nome_completo: alunoForm.nomeCompleto,
      
      // Correção: Trocamos o 'null' por 'undefined'
      data_de_nascimento: alunoForm.dataNascimento ? alunoForm.dataNascimento : undefined, 
      
      genero: this.getGeneroLabel(alunoForm.genero),
      serie: this.getSerieLabel(alunoForm.serieAno),
      diagnostico: this.getDiagnosticoLabel(alunoForm.diagnostico),
      
      // Se você estiver enviando a foto, lembre-se que no banco a coluna chama 'foto'
      foto: alunoForm.fotoUrl ? alunoForm.fotoUrl : undefined 
    };

    // 2. Chama o serviço para enviar ao backend
    this.alunoService.cadastrarAluno(payloadBanco).subscribe({
      next: (respostaDoBanco: any) => {
        console.log('Aluno cadastrado com sucesso!', respostaDoBanco);
        
        // 3. Atualiza a lista da tela com o aluno salvo
        const alunoCriado = Array.isArray(respostaDoBanco) ? respostaDoBanco[0] : respostaDoBanco;

        const newAluno: Aluno = {
          id: alunoCriado.id,
          nome: alunoCriado.nome_completo,
          ano: alunoCriado.serie,
          deficiencia: alunoCriado.diagnostico,
          genero: alunoCriado.genero,
          fotoUrl: alunoCriado.fotoUrl || undefined,
        };
        
        this.alunos = [...this.alunos, newAluno];
        this.closeModal();
        alert('Cadastro realizado com sucesso!');
      },
      error: (erro: any) => {
        console.error('Erro ao salvar no banco:', erro);
        alert('Falha ao cadastrar aluno. Tente novamente.');
      }
    });
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
  }

  private getSerieLabel(value: string): string {
    return this.series.find(s => s.value === value)?.label || '';
  }

  private getDiagnosticoLabel(value: string): string {
    return this.diagnosticos.find(d => d.value === value)?.label || '';
  }

  private getGeneroLabel(value: string): string {
    return this.generos.find(g => g.value === value)?.label || '';
  }

  private series = [
    { value: '1ano', label: '1º Ano' },
    { value: '2ano', label: '2º Ano' },
    { value: '3ano', label: '3º Ano' },
    { value: '4ano', label: '4º Ano' },
    { value: '5ano', label: '5º Ano' },
  ];

  private diagnosticos = [
    { value: 'tdah', label: 'TDAH' },
    { value: 'autismo', label: 'Autismo' },
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
