import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Aluno {
  id?: any; // <--- Alterado para any
  nome_completo?: string;
  serie?: string;
  data_de_nascimento?: string;
  genero?: string;
  diagnostico?: string | { diagnostico: string; descricao: string }[];
  foto?: string;
  fotoUrl?: string;
  preferencias?: string;
  interesses?: string;
  estrategias_de_ensino?: string;
  status?: number; // 1 = ativo, 0 = inativo
}

@Injectable({
  providedIn: 'root',
})
export class AlunoService {
  private apiUrl = 'http://localhost:3000/api/alunos';

  constructor(private http: HttpClient) {}

  listarAlunos(): Observable<Aluno[]> {
    return this.http.get<Aluno[]>(this.apiUrl);
  }

  cadastrarAluno(aluno: Aluno): Observable<any> {
    return this.http.post(this.apiUrl, aluno);
  }

  atualizarAluno(id: any, aluno: any): Observable<any> { // <--- Alterado para any
    return this.http.put(`${this.apiUrl}/${id}`, aluno);
  }

  excluirAluno(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarAlunoPorId(id: string) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);  }

  listarArquivosPorAluno(alunoId: string | number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/arquivos/alunos/${alunoId}`);
  }
}