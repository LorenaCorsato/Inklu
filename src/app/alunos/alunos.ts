import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { LucideSearch, LucidePlus, LucideLayoutGrid, LucideList, LucideLoader2, LucideBookOpen, LucideX, LucideTrash2, LucideEdit2 } from '@lucide/angular';
import { CardAluno, Aluno } from './card-aluno/card-aluno';
import { AlunoService } from './aluno.service';
import { MateriaService, Materia } from './materia.service';

import { ModalAluno, AlunoForm } from './modal-aluno/modal-aluno';
import { ModalConfirmarExclusao } from './modal-confirmar-exclusao/modal-confirmar-exclusao';
import { Toast } from '../shared/toast/toast';

@Component({
  selector: 'app-alunos',
  // O ModalAluno inserido corretamente nos imports do Component:
  imports: [FormsModule, LucideSearch, LucidePlus, LucideLayoutGrid, LucideList, LucideLoader2, LucideBookOpen, LucideX, LucideTrash2, LucideEdit2, CardAluno, ModalAluno, ModalConfirmarExclusao, Toast],
  templateUrl: './alunos.html',
  styleUrl: './alunos.scss',
})
export class Alunos implements OnInit {
  searchTerm = '';
  viewMode: 'grid' | 'list' = 'grid';
  activeTab: 'ativos' | 'inativos' = 'ativos';
  alunos: Aluno[] = [];
  
  isModalOpen = false;
  alunoEmEdicao: Aluno | null = null;
  isLoading = true; 
  isConfirmModalOpen = false;
  alunoParaExcluir: Aluno | null = null;

  // MEDIDA PROVISÓRIA: Estado para controle do modal simples de Gerir Matéria
  isGerirMateriaModalOpen = false;
  materias: Materia[] = [];
  isMateriasLoading = false;
  // MEDIDA PROVISÓRIA: Campos do formulário de adicionar matéria
  novaMateriaNome = '';
  novaMateriaArea = '';
  materiaEmEdicaoId: string | null = null;

  toastOpen = false;
  toastMessage = '';
  toastType: 'error' | 'success' | 'info' = 'error';

  constructor(
    private alunoService: AlunoService,
    private materiaService: MateriaService,
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
formatarDiagnostico(diagnosticoDb: any): string {
    if (!diagnosticoDb) return 'Não informado';

    try {
      const listaDiagnosticos = typeof diagnosticoDb === 'string' 
        ? JSON.parse(diagnosticoDb) 
        : diagnosticoDb;

      if (Array.isArray(listaDiagnosticos) && listaDiagnosticos.length > 0) {
        const nomes = listaDiagnosticos.map((item: any) => item.diagnóstico || item.diagnostico);
        
        return nomes.join(', '); 
      }
      
      return 'Não informado';
    } catch (error) {
      return typeof diagnosticoDb === 'string' ? diagnosticoDb : 'Diagnóstico inválido';
    }
  }
  get filteredAlunos(): Aluno[] {
    const statusFilter = this.activeTab === 'ativos' ? 1 : 2;
    let alunosFiltrados = this.alunos.filter((aluno) => aluno.status === statusFilter);

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      alunosFiltrados = alunosFiltrados.filter(
        (aluno) =>
          aluno.nome.toLowerCase().includes(term) ||
          aluno.ano.toLowerCase().includes(term) ||
          aluno.deficiencia.toLowerCase().includes(term)
      );
    }

    return alunosFiltrados;
  }

  // --- MUDANÇA DA BRANCH DEV AQUI ---
  openAdicionarAluno() {
    this.router.navigate(['/alunos/adicionar']);
  }
  // ----------------------------------

  // MEDIDA PROVISÓRIA: Funções para abrir e fechar o modal simples de Gerir Matéria
  openGerirMateriaModal() {
    this.isGerirMateriaModalOpen = true;
    this.carregarMaterias();
  }

  closeGerirMateriaModal() {
    this.isGerirMateriaModalOpen = false;
    this.cancelarEdicaoMateria();
  }

  carregarMaterias() {
    this.isMateriasLoading = true;
    this.materiaService.listarMaterias().subscribe({
      next: (dados) => {
        // Filtrar para mostrar apenas as ativas (exclui status "inativa" e "2")
        this.materias = dados.filter(m => m.status !== 'inativa' && m.status !== '2');
        console.log('[DEBUG] Primeiro objeto materia recebido:', JSON.stringify(this.materias[0]));
        this.isMateriasLoading = false;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar matérias', erro);
        this.isMateriasLoading = false;
        this.showToast('Erro ao carregar matérias.');
        this.cdr.detectChanges();
      }
    });
  }

  // MEDIDA PROVISÓRIA: Prepara o formulário para editar matéria existente
  prepararEdicaoMateria(materia: any) {
    this.materiaEmEdicaoId = materia.id_materia;
    this.novaMateriaNome = materia.nome;
    this.novaMateriaArea = materia.area_conhecimento || '';
    this.cdr.detectChanges();
  }

  // MEDIDA PROVISÓRIA: Cancela a edição e limpa o formulário
  cancelarEdicaoMateria() {
    this.materiaEmEdicaoId = null;
    this.novaMateriaNome = '';
    this.novaMateriaArea = '';
  }

  // MEDIDA PROVISÓRIA: Lógica para adicionar ou atualizar uma matéria
  salvarMateria() {
    if (!this.novaMateriaNome.trim()) {
      this.showToast('O nome da matéria é obrigatório.');
      return;
    }

    const payload = {
      nome: this.novaMateriaNome,
      area_conhecimento: this.novaMateriaArea,
      status: '1'  // MEDIDA PROVISÓRIA: status como string conforme padrão da tabela 'materia'
    };

    if (this.materiaEmEdicaoId) {
      this.materiaService.atualizarMateria(this.materiaEmEdicaoId, payload).subscribe({
        next: () => {
          this.showToast('Matéria atualizada com sucesso.', 'success');
          this.cancelarEdicaoMateria();
          this.carregarMaterias();
        },
        error: (erro) => {
          console.error('Erro ao atualizar matéria', erro);
          this.showToast('Erro ao atualizar matéria.');
        }
      });
    } else {
      this.materiaService.adicionarMateria(payload).subscribe({
        next: () => {
          this.showToast('Matéria adicionada com sucesso.', 'success');
          this.cancelarEdicaoMateria();
          this.carregarMaterias();
        },
        error: (erro) => {
          console.error('Erro ao adicionar matéria', erro);
          this.showToast('Erro ao adicionar matéria.');
        }
      });
    }
  }

  // MEDIDA PROVISÓRIA: Lógica para excluir (inativar) uma matéria
  excluirMateria(id: string) {
    console.log('[DEBUG] excluirMateria chamado com id:', id, '| tipo:', typeof id);
    if (!id) {
      this.showToast('ID da matéria não encontrado. Recarregue o modal e tente novamente.');
      return;
    }
    if (confirm('Tem certeza que deseja inativar esta matéria?')) {
      this.materiaService.excluirMateria(id).subscribe({
        next: (resposta) => {
          console.log('[DEBUG] Exclusão OK:', resposta);
          this.showToast('Matéria inativada com sucesso.', 'success');
          this.carregarMaterias();
        },
        error: (erro) => {
          console.error('[DEBUG] Erro ao excluir matéria — status HTTP:', erro.status, '| mensagem:', erro.error);
          this.showToast('Erro ao excluir matéria.');
        }
      });
    }
  }

  openModal() {
    this.alunoEmEdicao = null;
    this.isModalOpen = true;
  }

  abrirModalEdicao(aluno: Aluno) {
    this.router.navigate(['/alunos', aluno.id, 'editar']);
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
        this.showToast('Falha ao carregar os alunos.');
      },
    });
  }

  onAlunoSaved(alunoForm: AlunoForm) {
    const payloadBanco = {
      nome_completo: alunoForm.nomeCompleto,
      data_de_nascimento: alunoForm.dataNascimento ? alunoForm.dataNascimento : undefined,
      genero: this.getGeneroLabel(alunoForm.genero),
      id_turma: alunoForm.id_turma,
      diagnostico: this.getDiagnosticoLabel(alunoForm.diagnostico),
      foto: alunoForm.fotoUrl || undefined,
      status: alunoForm.status ?? 1   
     };

    const alunoId = this.alunoEmEdicao?.id ?? alunoForm.id;

    if (alunoId !== undefined && alunoId !== null && alunoId !== '') {
      this.alunoService.atualizarAluno(alunoId, payloadBanco).subscribe({
        next: () => {
          this.carregarAlunos();
          this.closeModal();
          this.showToast('Aluno atualizado com sucesso!', 'success');
        },
        error: (erro: any) => {
          console.error('Erro ao atualizar no banco:', erro);
          this.showToast('Falha ao atualizar aluno.');
        },
      });
    } else if (!this.alunoEmEdicao) {
      this.alunoService.cadastrarAluno(payloadBanco).subscribe({
        next: () => {
          this.carregarAlunos();
          this.closeModal();
          this.showToast('Cadastro realizado com sucesso!', 'success');
        },
        error: (erro: any) => {
          console.error('Erro ao salvar no banco:', erro);
          this.showToast('Falha ao cadastrar aluno.');
        },
      });
    }
  }

  onExcluirAluno(aluno: Aluno) {
    const deveMostrarModal = localStorage.getItem('naoMostrarModalExclusao') !== 'true';

    if (deveMostrarModal) {
      this.alunoParaExcluir = aluno;
      this.isConfirmModalOpen = true;
    } else {
      this.executarExclusao(aluno);
    }
  }

  onConfirmarExclusao(naoMostrarNovamente: boolean) {
    if (naoMostrarNovamente) {
      localStorage.setItem('naoMostrarModalExclusao', 'true');
    }

    if (this.alunoParaExcluir) {
      this.executarExclusao(this.alunoParaExcluir);
    }

    this.fecharModalConfirmacao();
  }

  onAtivarAluno(aluno: Aluno) {
    this.isLoading = true;
    this.alunoService.atualizarAluno(aluno.id, { status: 1 }).subscribe({
      next: () => {
        this.carregarAlunos();
      },
      error: (erro) => {
        console.error('Erro ao ativar aluno:', erro);
        this.showToast('Falha ao ativar o aluno.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fecharModalConfirmacao() {
    this.isConfirmModalOpen = false;
    this.alunoParaExcluir = null;
  }

  private executarExclusao(aluno: Aluno) {
    this.isLoading = true;

    this.alunoService.excluirAluno(aluno.id).subscribe({
      next: () => {
        this.carregarAlunos();
      },
      error: (erro) => {
        console.error('Erro ao excluir aluno:', erro);
        this.showToast('Falha ao excluir o aluno.');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  setActiveTab(tab: 'ativos' | 'inativos') {
    this.activeTab = tab;
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
  }

  showToast(message: string, type: 'error' | 'success' | 'info' = 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastOpen = true;
  }

  closeToast(): void {
    this.toastOpen = false;
  }

  private mapAlunoBancoParaTela(alunoBanco: any): Aluno {
    return {
      id: alunoBanco.id, 
      nome: alunoBanco.nome_completo ?? 'Aluno sem nome',
      ano: alunoBanco.turma ? `${alunoBanco.turma.serie} ${alunoBanco.turma.nome}` : 'Não informada',
      deficiencia: this.formatarDiagnostico(alunoBanco.diagnostico),
      genero: alunoBanco.genero ?? 'Não informado',
      fotoUrl: alunoBanco.fotoUrl ?? alunoBanco.foto ?? undefined,
      originalData: alunoBanco,
      status: alunoBanco.status ?? 1,
    };
  }

  private getDiagnosticoLabel(value: string): string {
    return this.diagnosticos.find((d) => d.value === value)?.label || '';
  }

  private getGeneroLabel(value: string): string {
    return this.generos.find((g) => g.value === value)?.label || '';
  }

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