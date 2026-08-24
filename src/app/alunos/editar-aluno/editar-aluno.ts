import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowLeft, LucideTrash2 } from '@lucide/angular';
import { ModalCrop } from '../modal-crop/modal-crop';
import { AlunoService } from '../aluno.service';

export interface DiagnosticoItem {
  diagnostico: string;
  descricao: string;
}

export interface ResponsavelItem {
  id?: string;
  nome: string;
  parentesco: string;
  email: string;
  telefone: string;
}

export interface AlunoForm {
  nomeCompleto: string;
  fotoUrl: string | null;
  dataNascimento: string;
  genero: string;
  serieAno: string;
  turmaSala: string;
  diagnosticos: DiagnosticoItem[];
  responsaveis: ResponsavelItem[];
}

@Component({
  selector: 'app-editar-aluno',
  imports: [FormsModule, LucideArrowLeft, LucideTrash2, ModalCrop],
  templateUrl: './editar-aluno.html',
  styleUrl: './editar-aluno.scss',
})
export class EditarAluno implements OnInit {
  alunoId: string | null = null;
  isLoading = true;

  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'outro', label: 'Outro' },
  ];

  series = [
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

  turmas = [
    { value: 'turma-a', label: 'Turma A' },
    { value: 'turma-b', label: 'Turma B' },
    { value: 'turma-c', label: 'Turma C' },
    { value: 'turma-d', label: 'Turma D' },
  ];

  diagnosticos = [
    { value: 'tdah', label: 'TDAH (Transtorno do Déficit de Atenção com Hiperatividade)' },
    { value: 'autismo', label: 'TEA (Transtorno do Espectro Autista)' },
    { value: 'deficiencia-fisica', label: 'Deficiência Física' },
    { value: 'deficiencia-visual', label: 'Deficiência Visual' },
    { value: 'deficiencia-auditiva', label: 'Deficiência Auditiva' },
    { value: 'intelectual', label: 'Deficiência Intelectual' },
    { value: 'outro', label: 'Outro' },
  ];

  form: AlunoForm = {
    nomeCompleto: '',
    fotoUrl: null,
    dataNascimento: '',
    genero: '',
    serieAno: '',
    turmaSala: '',
    diagnosticos: [],
    responsaveis: [],
  };

  previewUrl: string | null = null;
  isCropModalOpen = false;
  tempImageSrc: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private alunoService: AlunoService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.alunoId = params.get('id');
      if (this.alunoId) {
        this.carregarAluno(this.alunoId);
      } else {
        this.router.navigate(['/alunos']);
      }
    });
  }

  carregarAluno(id: string) {
    this.isLoading = true;
    this.alunoService.buscarAlunoPorId(id).subscribe({
      next: (dados) => {
        const alunoDb = Array.isArray(dados) ? dados[0] : dados;
        this.preencherFormulario(alunoDb);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar aluno:', err);
        this.isLoading = false;
        alert('Erro ao carregar os dados do aluno.');
        this.router.navigate(['/alunos']);
      }
    });
  }

  preencherFormulario(aluno: any) {
    this.form.nomeCompleto = aluno.nome_completo || '';
    this.form.dataNascimento = aluno.data_de_nascimento || '';
    this.form.genero = this.getGeneroValue(aluno.genero) || '';
    this.form.serieAno = this.getSerieValue(aluno.serie) || '';
    this.form.fotoUrl = aluno.foto || null;
    this.previewUrl = aluno.fotoUrl ?? aluno.foto ?? null;

    // Popula Responsáveis (Baseado no Join do backend)
    if (aluno.responsaveis && aluno.responsaveis.length > 0) {
      this.form.responsaveis = aluno.responsaveis.map((r: any) => ({
        id: r.id,
        nome: r.nome,
        parentesco: r.parentesco,
        email: r.email,
        telefone: r.telefone
      }));
    } else {
      // Fallback para 1 vazio se não vier do banco
      this.form.responsaveis = [{ nome: '', parentesco: '', email: '', telefone: '' }];
    }

    if (aluno.diagnostico) {
      try {
        const listaDiagnosticos = typeof aluno.diagnostico === 'string'
          ? JSON.parse(aluno.diagnostico)
          : aluno.diagnostico;

        if (Array.isArray(listaDiagnosticos)) {
          this.form.diagnosticos = listaDiagnosticos.map((d: any) => ({
            diagnostico: this.getDiagnosticoValue(d.diagnóstico || d.diagnostico) || 'outro',
            descricao: d.descricao || '',
          }));
        }
      } catch (e) {
        console.error('Erro ao processar diagnósticos:', e);
        this.form.diagnosticos = [];
      }
    }
  }

  get isFormValid(): boolean {
    return !!(
      this.form.nomeCompleto?.trim() &&
      this.form.dataNascimento &&
      this.form.genero &&
      this.form.serieAno &&
      this.form.turmaSala &&
      this.form.responsaveis.every(r => r.nome?.trim() && r.parentesco && r.telefone?.trim()) &&
      this.form.diagnosticos.length > 0
    );
  }

  // --- MÉTODOS DE RESPONSÁVEIS ---
  adicionarResponsavel() {
    this.form.responsaveis.push({ nome: '', parentesco: '', email: '', telefone: '' });
  }

  removerResponsavel(index: number) {
    if (this.form.responsaveis.length > 1) {
      this.form.responsaveis.splice(index, 1);
    }
  }

  aplicaMascaraTelefone(event: any, index: number) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }

    let formato = valor;
    if (valor.length > 2 && valor.length <= 6) {
      formato = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    } else if (valor.length > 6 && valor.length <= 10) {
      formato = `(${valor.substring(0, 2)}) ${valor.substring(2, 6)}-${valor.substring(6)}`;
    } else if (valor.length === 11) {
      formato = `(${valor.substring(0, 2)}) ${valor.substring(2, 7)}-${valor.substring(7)}`;
    }

    event.target.value = formato;
    this.form.responsaveis[index].telefone = formato;
  }
  // ------------------------------

  get availableDiagnosticos() {
    const usedValues = this.form.diagnosticos.map(d => d.diagnostico);
    return this.diagnosticos.filter(d => !usedValues.includes(d.value));
  }

  voltar() {
    this.router.navigate(['/alunos']);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.tempImageSrc = reader.result as string;
        this.isCropModalOpen = true;
        input.value = '';
        this.cdr.detectChanges();
      };

      reader.readAsDataURL(file);
    }
  }

  onCropComplete(croppedImage: string) {
    this.form.fotoUrl = croppedImage;
    this.previewUrl = croppedImage;
    this.isCropModalOpen = false;
    this.tempImageSrc = null;
    this.cdr.detectChanges();
  }

  onCropClosed() {
    this.isCropModalOpen = false;
    this.tempImageSrc = null;
    this.cdr.detectChanges();
  }

  save() {
    if (!this.isFormValid) {
      alert('Por favor, preencha todos os campos obrigatórios antes de salvar.');
      return;
    }

    const diagnosticosFormatados = this.form.diagnosticos.map(d => ({
      diagnostico: this.getDiagnosticoLabel(d.diagnostico),
      descricao: d.descricao,
    }));

    const payloadBanco = {
      nome_completo: this.form.nomeCompleto,
      data_de_nascimento: this.form.dataNascimento || undefined,
      genero: this.getGeneroLabel(this.form.genero),
      serie: this.getSerieLabel(this.form.serieAno),
      diagnostico: diagnosticosFormatados,
      descricao_diagnostico: JSON.stringify(diagnosticosFormatados),
      foto: this.form.fotoUrl || undefined,
      responsaveis: this.form.responsaveis
    };

    this.alunoService.atualizarAluno(this.alunoId, payloadBanco).subscribe({
      next: () => {
        alert('Aluno atualizado com sucesso!');
        this.router.navigate(['/alunos']);
      },
      error: (erro: any) => {
        console.error('Erro ao atualizar no banco:', erro);
        alert('Falha ao atualizar aluno. Tente novamente.');
      },
    });
  }

  removeDiagnostico(index: number) {
    this.form.diagnosticos.splice(index, 1);
    this.cdr.detectChanges();
  }

  selectDiagnostico(value: string) {
    if (value && !this.form.diagnosticos.some(d => d.diagnostico === value)) {
      this.form.diagnosticos.push({
        diagnostico: value,
        descricao: '',
      });
      this.cdr.detectChanges();
    }
  }

  onDiagnosticoSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.selectDiagnostico(select.value);
      select.value = '';
    }
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  private getGeneroValue(label: string): string {
    if (!label) return '';
    const genero = this.generos.find(g => g.label.toLowerCase() === label.toLowerCase());
    return genero?.value || '';
  }

  private getSerieValue(label: string): string {
    if (!label) return '';
    const serie = this.series.find(s => s.label === label);
    return serie?.value || '';
  }

  private getDiagnosticoValue(label: string): string {
    if (!label) return '';
    const diag = this.diagnosticos.find(d => d.label === label || d.label.startsWith(label));
    return diag?.value || '';
  }

  private getGeneroLabel(value: string): string {
    return this.generos.find((g) => g.value === value)?.label || '';
  }

  private getSerieLabel(value: string): string {
    return this.series.find((s) => s.value === value)?.label || '';
  }

  getDiagnosticoLabel(value: string): string {
    return this.diagnosticos.find((d) => d.value === value)?.label || '';
  }
}