import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Materia {
  id_materia: string;
  nome: string;
  descricao?: string;
  status: string;
  area_conhecimento?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MateriaService {
  private apiUrl = 'http://localhost:3000/api/materias';

  constructor(private http: HttpClient) {}

  listarMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(this.apiUrl);
  }

  adicionarMateria(materia: Partial<Materia>): Observable<any> {
    return this.http.post(this.apiUrl, materia);
  }

  atualizarMateria(id: string, materia: Partial<Materia>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, materia);
  }

  excluirMateria(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
