import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ROTAS } from '../auth.config';
import { mensagem } from '../auth.messages';
import type { CriarEscolaPayload } from '../auth.models';
import { mapearErro } from '../api/mapear-erro';
import { EscolaService } from '../services/escola.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import {
  mascararCep,
  mascararCnpj,
  somenteDigitos,
  validarCnpj,
} from '../validators/validarCnpj';
import { validarEmail } from '../validators/validarEmail';
import { validarNome } from '../validators/validarNome';
import { validarConfirmacao } from '../validators/validarConfirmacao';
import { forcaSenha, validarSenha, type ForcaSenha } from '../validators/validarSenha';

interface EscolaForm {
  cnpj: string;
  nomeEscola: string;
  emailInstitucional: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
}

interface ResponsavelForm {
  nome: string;
  email: string;
  senha: string;
  confirmacao: string;
}

@Component({
  selector: 'app-cadastro-escola',
  imports: [FormsModule, RouterLink],
  templateUrl: './cadastro-escola.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastroEscola {
  private readonly auth = inject(AuthService);
  private readonly escolaService = inject(EscolaService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly rotas = ROTAS;
  readonly etapas = [
    { numero: 1, rotulo: 'Dados da escola' },
    { numero: 2, rotulo: 'Responsável' },
    { numero: 3, rotulo: 'Revisão' },
  ] as const;

  readonly etapaAtual = signal(1);
  readonly enviando = signal(false);
  readonly declaro = signal(false);
  readonly erroRede = signal<string | null>(null);
  readonly erroCnpjServidor = signal<string | null>(null);
  readonly errosEtapa1 = signal<Record<string, string>>({});
  readonly errosEtapa2 = signal<Record<string, string>>({});

  readonly senhaVisivel = signal(false);
  readonly confirmacaoVisivel = signal(false);
  readonly buscandoCep = signal(false);

  readonly forca = signal<ForcaSenha>(forcaSenha(''));

  readonly escola: EscolaForm = {
    cnpj: '',
    nomeEscola: '',
    emailInstitucional: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
    },
  };

  readonly responsavel: ResponsavelForm = {
    nome: '',
    email: '',
    senha: '',
    confirmacao: '',
  };

  erro1(campo: string): string | null {
    if (campo === 'cnpj' && this.erroCnpjServidor()) return this.erroCnpjServidor();
    return this.errosEtapa1()[campo] ?? null;
  }

  erro2(campo: string): string | null {
    return this.errosEtapa2()[campo] ?? null;
  }

  aoDigitarCnpj(valor: string): void {
    this.escola.cnpj = mascararCnpj(valor);
    this.erroCnpjServidor.set(null);
  }

  aoDigitarSenhaResponsavel(valor: string): void {
    this.responsavel.senha = valor;
    this.forca.set(forcaSenha(valor));
  }

  aoDigitarCep(valor: string): void {
    this.escola.endereco.cep = mascararCep(valor);
  }

  aoSairDoCep(): void {
    const cep = somenteDigitos(this.escola.endereco.cep);
    if (cep.length !== 8 || this.buscandoCep()) return;

    this.buscandoCep.set(true);
    this.escolaService.buscarCep(cep).subscribe({
      next: (endereco) => {
        this.buscandoCep.set(false);
        if (endereco.erro) return;
        if (endereco.logradouro) this.escola.endereco.logradouro = endereco.logradouro;
        if (endereco.bairro) this.escola.endereco.bairro = endereco.bairro;
        if (endereco.localidade) this.escola.endereco.cidade = endereco.localidade;
        if (endereco.uf) this.escola.endereco.uf = endereco.uf;
      },
      error: () => this.buscandoCep.set(false),
    });
  }

  proximo(): void {
    if (this.etapaAtual() === 1) {
      if (!this.validarEtapa1()) return;
      this.irPara(2);
      return;
    }

    if (this.etapaAtual() === 2) {
      if (!this.validarEtapa2()) return;
      this.irPara(3);
    }
  }

  voltar(): void {
    if (this.etapaAtual() > 1) this.irPara(this.etapaAtual() - 1);
  }

  editar(etapa: number): void {
    this.irPara(etapa);
  }

  criarEscola(): void {
    if (this.enviando() || !this.declaro()) return;

    this.erroRede.set(null);
    this.erroCnpjServidor.set(null);

    if (!this.validarEtapa1()) {
      this.irPara(1);
      return;
    }
    if (!this.validarEtapa2()) {
      this.irPara(2);
      return;
    }

    const payload: CriarEscolaPayload = {
      cnpj: somenteDigitos(this.escola.cnpj),
      nomeEscola: this.escola.nomeEscola.trim(),
      emailInstitucional: this.escola.emailInstitucional.trim(),
      endereco: {
        cep: somenteDigitos(this.escola.endereco.cep),
        logradouro: this.escola.endereco.logradouro.trim(),
        numero: this.escola.endereco.numero.trim(),
        complemento: this.escola.endereco.complemento.trim() || undefined,
        bairro: this.escola.endereco.bairro.trim() || undefined,
        cidade: this.escola.endereco.cidade.trim(),
        uf: this.escola.endereco.uf.trim().toUpperCase(),
      },
      responsavel: {
        nome: this.responsavel.nome.trim(),
        email: this.responsavel.email.trim(),
        senha: this.responsavel.senha,
      },
    };

    this.enviando.set(true);
    this.auth.criarEscola(payload).subscribe({
      next: () => {
        this.enviando.set(false);
        this.responsavel.senha = '';
        this.responsavel.confirmacao = '';
        void this.router.navigate([ROTAS.verificarEmail], {
          state: {
            email: payload.responsavel.email,
            modo: 'cadastro_escola',
          },
        });
      },
      error: (erro: unknown) => {
        this.enviando.set(false);
        const mapeado = mapearErro(erro, undefined, { contexto: 'escola' });

        if (mapeado.tipo === 'campo' && mapeado.campo === 'cnpj') {
          this.erroCnpjServidor.set(mapeado.mensagem);
          this.irPara(1);
          return;
        }

        if (mapeado.tipo === 'campos') {
          this.errosEtapa1.update((atuais) => ({ ...atuais, ...mapeado.campos }));
          this.irPara(1);
          return;
        }

        this.erroRede.set(mapeado.mensagem);
        this.toast.erro(mapeado.mensagem);
        this.focar('escola-alerta');
      },
    });
  }

  private validarEtapa1(): boolean {
    const erros: Record<string, string> = {};

    const cnpj = validarCnpj(this.escola.cnpj);
    if (!cnpj.valido) erros['cnpj'] = cnpj.erro;

    if (!this.escola.nomeEscola.trim()) erros['nomeEscola'] = 'Informe o nome da escola';

    const email = validarEmail(this.escola.emailInstitucional);
    if (!email.valido) erros['emailInstitucional'] = email.erro;

    if (somenteDigitos(this.escola.endereco.cep).length !== 8) {
      erros['cep'] = mensagem('campo.cep.invalido');
    }
    if (!this.escola.endereco.logradouro.trim()) {
      erros['logradouro'] = mensagem('campo.obrigatorio');
    }
    if (!this.escola.endereco.numero.trim()) {
      erros['numero'] = mensagem('campo.obrigatorio');
    }
    if (!this.escola.endereco.cidade.trim()) {
      erros['cidade'] = mensagem('campo.obrigatorio');
    }
    if (!this.escola.endereco.uf.trim()) {
      erros['uf'] = mensagem('campo.obrigatorio');
    }

    this.errosEtapa1.set(erros);
    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      this.focar(`escola-${primeiro}`);
      return false;
    }
    return true;
  }

  private validarEtapa2(): boolean {
    const erros: Record<string, string> = {};

    const nome = validarNome(this.responsavel.nome);
    if (!nome.valido) erros['nome'] = nome.erro;

    const email = validarEmail(this.responsavel.email);
    if (!email.valido) erros['email'] = email.erro;

    const senha = validarSenha(this.responsavel.senha, {
      email: this.responsavel.email,
    });
    if (!senha.valido) erros['senha'] = senha.erro;

    const confirmacao = validarConfirmacao(
      this.responsavel.senha,
      this.responsavel.confirmacao,
    );
    if (!confirmacao.valido) erros['confirmacao'] = confirmacao.erro;

    this.errosEtapa2.set(erros);
    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      this.focar(`responsavel-${primeiro}`);
      return false;
    }
    return true;
  }

  private irPara(etapa: number): void {
    this.etapaAtual.set(etapa);
    setTimeout(() => document.getElementById('etapa-titulo')?.focus(), 0);
  }

  private focar(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  }
}
