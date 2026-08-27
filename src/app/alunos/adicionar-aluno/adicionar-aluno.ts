import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideArrowLeft, LucideTrash2 } from '@lucide/angular';
import { ModalCrop } from '../modal-crop/modal-crop';
import { ModalConfirmacao } from './modal-confirmacao/modal-confirmacao';
import { AlunoService } from '../aluno.service';
import { TurmaService, Turma } from '../../turmas/turma.service';

export interface DiagnosticoItem {
  diagnostico: string;
  descricao: string;
}

export interface ResponsavelItem {
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
  id_turma: string;
  diagnosticos: DiagnosticoItem[];
  responsaveis: ResponsavelItem[];
}

@Component({
  selector: 'app-adicionar-aluno',
  imports: [FormsModule, LucideArrowLeft, LucideTrash2, ModalCrop, ModalConfirmacao],
  templateUrl: './adicionar-aluno.html',
  styleUrl: './adicionar-aluno.scss',
})
export class AdicionarAluno implements OnInit {
  currentStep = 1;

  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'outro', label: 'Outro' },
  ];

  turmas: Turma[] = [];

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
    id_turma: '',
    diagnosticos: [],
    // Inicia com 1 responsável vazio obrigatório
    responsaveis: [{ nome: '', parentesco: '', email: '', telefone: '' }], 
  };

  previewUrl: string | null = null;
  isCropModalOpen = false;
  tempImageSrc: string | null = null;
  isConfirmacaoModalOpen = false;
  novoAlunoId: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private alunoService: AlunoService,
    private turmaService: TurmaService
  ) {}

  ngOnInit() {
    this.turmaService.listarTurmas().subscribe({
      next: (data) => {
        this.turmas = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao buscar turmas', err)
    });
  }

  get isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      return !!(
        this.form.nomeCompleto?.trim() &&
        this.form.dataNascimento &&
        this.form.genero &&
        this.form.id_turma
      );
    }
    if (this.currentStep === 2) {
      // Valida se todos os responsáveis preencheram os campos mínimos
      return this.form.responsaveis.every(r => 
        r.nome?.trim() && r.parentesco && r.telefone?.trim()
      );
    }
    if (this.currentStep === 3) {
      return this.form.diagnosticos.length > 0;
    }
    return false;
  }

  get isFormValid(): boolean {
    return !!(
      this.form.nomeCompleto?.trim() &&
      this.form.dataNascimento &&
      this.form.genero &&
      this.form.id_turma &&
      this.form.responsaveis.every(r => r.nome?.trim() && r.parentesco && r.telefone?.trim()) &&
      this.form.diagnosticos.length > 0
    );
  }

  // --- MÉTODOS DE RESPONSÁVEIS ---
  adicionarResponsavel() {
   if (this.form.responsaveis.length < 2) {
      this.form.responsaveis.push({ nome: '', parentesco: '', email: '', telefone: '' });
    }
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
    this.form.responsaveis[index].telefone = formato; // Atualiza no índice correto
  }
  // ------------------------------

  get availableDiagnosticos() {
    const usedValues = this.form.diagnosticos.map(d => d.diagnostico);
    return this.diagnosticos.filter(d => !usedValues.includes(d.value));
  }

  nextStep() {
    if (this.isCurrentStepValid && this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
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
      id_turma: this.form.id_turma,
      diagnostico: diagnosticosFormatados,
      descricao_diagnostico: JSON.stringify(diagnosticosFormatados),
      foto: this.form.fotoUrl || undefined,
      responsaveis: this.form.responsaveis // Enviando o array para o backend processar
    };

    this.alunoService.cadastrarAluno(payloadBanco).subscribe({
      next: (resposta: any) => {
        this.novoAlunoId = resposta?.id || null;
        this.isConfirmacaoModalOpen = true;
        this.cdr.detectChanges();
      },
      error: (erro: any) => {
        console.error('Erro ao salvar no banco:', erro);
        alert('Falha ao cadastrar aluno. Tente novamente.');
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

  private getGeneroLabel(value: string): string {
    return this.generos.find((g) => g.value === value)?.label || '';
  }

  getDiagnosticoLabel(value: string): string {
    return this.diagnosticos.find((d) => d.value === value)?.label || '';
  }

  onConfirmacaoConfirmed() {
    this.isConfirmacaoModalOpen = false;
    if (this.novoAlunoId) {
      this.router.navigate(['/alunos', this.novoAlunoId]);
    } else {
      this.router.navigate(['/alunos']);
    }
  }

  onConfirmacaoDismissed() {
    this.isConfirmacaoModalOpen = false;
    this.router.navigate(['/alunos']);
  }
}