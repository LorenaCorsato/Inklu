import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideArrowLeft, LucideTrash2 } from '@lucide/angular';
import { ModalCrop } from '../modal-crop/modal-crop';
import { AlunoService } from '../aluno.service';

export interface DiagnosticoItem {
  diagnostico: string;
  descricao: string;
}

export interface AlunoForm {
  nomeCompleto: string;
  fotoUrl: string | null;
  dataNascimento: string;
  genero: string;
  nomeResponsavel: string;
  telefoneResponsavel: string;
  serieAno: string;
  turmaSala: string;
  diagnosticos: DiagnosticoItem[];
}

@Component({
  selector: 'app-adicionar-aluno',
  imports: [FormsModule, LucideArrowLeft, LucideTrash2, ModalCrop],
  templateUrl: './adicionar-aluno.html',
  styleUrl: './adicionar-aluno.scss',
})
export class AdicionarAluno {
  currentStep = 1;

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
    nomeResponsavel: '',
    telefoneResponsavel: '',
    serieAno: '',
    turmaSala: '',
    diagnosticos: [],
  };

  previewUrl: string | null = null;
  isCropModalOpen = false;
  tempImageSrc: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private alunoService: AlunoService
  ) {}

  get isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      return !!(
        this.form.nomeCompleto?.trim() &&
        this.form.dataNascimento &&
        this.form.genero &&
        this.form.serieAno &&
        this.form.turmaSala
      );
    }
    if (this.currentStep === 2) {
      return !!(
        this.form.nomeResponsavel?.trim() &&
        this.form.telefoneResponsavel?.trim()
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
      this.form.nomeResponsavel?.trim() &&
      this.form.telefoneResponsavel?.trim() &&
      this.form.serieAno &&
      this.form.turmaSala &&
      this.form.diagnosticos.length > 0
    );
  }

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
      serie: this.getSerieLabel(this.form.serieAno),
      diagnostico: diagnosticosFormatados,
      foto: this.form.fotoUrl || undefined,
    };

    this.alunoService.cadastrarAluno(payloadBanco).subscribe({
      next: () => {
        alert('Cadastro realizado com sucesso!');
        this.router.navigate(['/alunos']);
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

  aplicaMascaraTelefone(event: any) {
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
    this.form.telefoneResponsavel = formato;
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
