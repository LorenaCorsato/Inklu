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

  excluirTurma(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  atualizarTurma(id: string, payload: Partial<Turma> & { nome?: string; serie?: string; periodo?: string; ano?: number; qtd_alunos?: number | string }): Observable<Turma> {
    return this.http.put<Turma>(`${this.apiUrl}/${id}`, payload);
  }
}
