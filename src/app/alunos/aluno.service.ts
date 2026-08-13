import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface com base nas colunas do banco
export interface Aluno {
  nome_completo: string;
  serie?: string;
  data_de_nascimento?: string;
  genero?: string;
  diagnostico?: string;
  fotoUrl?: string;
  preferencias?: string;
  interesses?: string;
  estrategias_de_ensino?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlunoService {
  // URL do backend Node.js
  private apiUrl = 'https://fantastic-potato-r4g6xpqx54qj2wqv6-3000.app.github.dev/api/alunos';

  constructor(private http: HttpClient) { }

  cadastrarAluno(aluno: Aluno): Observable<any> {
    return this.http.post(this.apiUrl, aluno);
  }
}
