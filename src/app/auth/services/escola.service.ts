import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AUTH_API_BASE } from '../auth.config';
import type { MateriaResumo, TurmaResumo } from '../auth.models';
import { somenteDigitos } from '../validators/validarCnpj';

export interface EnderecoCep {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

/**
 * Listas institucionais filtradas pela escola e consulta de CEP.
 *
 * Os dois primeiros endpoints não constam na seção 1.1: são suposições para o
 * formulário de convite (seção 14, item 1). Falhas são tratadas como listas
 * vazias pela tela, sem bloquear o convite.
 */
@Injectable({ providedIn: 'root' })
export class EscolaService {
  private readonly http = inject(HttpClient);

  listarTurmas(): Observable<TurmaResumo[]> {
    return this.http.get<TurmaResumo[]>(`${AUTH_API_BASE}/escolas/atual/turmas`);
  }

  listarMaterias(): Observable<MateriaResumo[]> {
    return this.http.get<MateriaResumo[]>(`${AUTH_API_BASE}/escolas/atual/materias`);
  }

  buscarCep(cep: string): Observable<EnderecoCep> {
    return this.http.get<EnderecoCep>(`https://viacep.com.br/ws/${somenteDigitos(cep)}/json/`);
  }
}
