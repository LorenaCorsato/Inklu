import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Aluno {
  id?: number;
  nome_completo?: string;
  serie?: string;
  data_de_nascimento?: string;
  genero?: string;
  diagnostico?: string;
  foto?: string;
  fotoUrl?: string;
  preferencias?: string;
  interesses?: string;
  estrategias_de_ensino?: string;
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
}
