import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Turma {
  id_turma: string;
  nome: string;
  quantidadeAlunos?: number;
  qtd_alunos?: number;
  turno?: string;
  serie?: string;
  periodo?: string;
  ano?: number;
  status?: number;
}

export interface TurmaDependencias {
  temDependencias: boolean;
  quantidadeAlunos: number;
  alunos: { id: string | number; nome_completo?: string | null; status?: string | number | null }[];
}

@Injectable({
  providedIn: 'root',
})
export class TurmaService {
  private apiUrl = 'http://localhost:3000/api/turmas';

  constructor(private http: HttpClient) {}

  listarTurmas(): Observable<Turma[]> {
    return this.http.get<Turma[]>(this.apiUrl);
  }

  criarTurma(payload: Partial<Turma> & { nome: string; serie: string; periodo: string; ano: number; qtd_alunos?: number | string; status?: number }): Observable<Turma> {
    return this.http.post<Turma>(this.apiUrl, payload);
  }

  verificarDependencias(id: string): Observable<TurmaDependencias> {
    return this.http.get<TurmaDependencias>(`${this.apiUrl}/${id}/verificar-dependencias`);
  }

  excluirTurma(id: string, confirmar = false): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      params: { confirmar: String(confirmar) },
    });
  }

  atualizarTurma(id: string, payload: Partial<Turma> & { nome?: string; serie?: string; periodo?: string; ano?: number; qtd_alunos?: number | string }): Observable<Turma> {
    return this.http.put<Turma>(`${this.apiUrl}/${id}`, payload);
  }
}
