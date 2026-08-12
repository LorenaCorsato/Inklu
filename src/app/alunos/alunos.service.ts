import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// É uma boa prática definir a interface com base nas colunas do banco
export interface Aluno {
  nome_completo: string;
  serie?: string;
  data_de_nascimento?: string;
  genero?: string;
  diagnostico?: string;
  preferencias?: string;
  interesses?: string;
  estrategias_de_ensino?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlunoService {
  // A URL do seu backend Node.js
  private apiUrl = 'http://localhost:3000/api/alunos';

  constructor(private http: HttpClient) { }

  cadastrarAluno(aluno: Aluno): Observable<any> {
    return this.http.post(this.apiUrl, aluno);
  }
}