import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Turma {
  id_turma: string;
  nome: string;
  serie: string;
  turno?: string;
  ano?: number;
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
}
