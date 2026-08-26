import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

export interface DadosAdicionais {
  preferencias: string[];
  informacoes: string;
}

@Component({
  selector: 'app-modal-dados-adicionais',
  imports: [CommonModule, FormsModule, LucideX],
  templateUrl: './modal-dados-adicionais.html',
  styleUrl: './modal-dados-adicionais.scss',
})
export class ModalDadosAdicionais {
  @Input() isOpen = false;
  @Input() dadosIniciais: DadosAdicionais | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<DadosAdicionais>();

  preferenciaInput = '';
  informacaoTexto = '';

  preferencias: string[] = [];

  ngOnInit() {
    if (this.dadosIniciais) {
      this.preferencias = [...this.dadosIniciais.preferencias];
      this.informacaoTexto = this.dadosIniciais.informacoes;
    }
  }

  close() {
    this.closed.emit();
  }

  addPreferencia() {
    const value = this.preferenciaInput.trim();
    if (value && !this.preferencias.includes(value)) {
      this.preferencias.push(value);
      this.preferenciaInput = '';
    }
  }

  removePreferencia(index: number) {
    this.preferencias.splice(index, 1);
  }

  save() {
    this.saved.emit({
      preferencias: [...this.preferencias],
      informacoes: this.informacaoTexto,
    });
    this.close();
  }
}
