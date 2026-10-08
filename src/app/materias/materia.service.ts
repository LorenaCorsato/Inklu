import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Materia {
  id_materia: string;
  nome: string;
  quantidadeAlunos?: number;
  cargaHoraria?: string;
  professor?: string;
  status?: number;
  descricao?: string;
  area_conhecimento?: string;
}

export interface MateriaDependenciaAluno {
  id?: string | number;
  nome_completo?: string | null;
}

export interface MateriaDependenciaUsuario {
  id_usuario?: string | number;
  nome?: string | null;
}

export interface MateriaMaterialVinculado {
  id_material: string | number;
  nome_do_arquivo?: string | null;
  tipo_de_material?: string | null;
  aluno?: MateriaDependenciaAluno | MateriaDependenciaAluno[] | null;
}

export interface MateriaProfessorVinculado {
  id_professor_apoio: string | number;
  status?: string | number | null;
  usuario?: MateriaDependenciaUsuario | MateriaDependenciaUsuario[] | null;
}

export interface MateriaDependencias {
  temDependencias: boolean;
  quantidadeMateriais: number;
  quantidadeProfessores: number;
  materiais: MateriaMaterialVinculado[];
  professores: MateriaProfessorVinculado[];
}

@Injectable({
  providedIn: 'root',
})
export class MateriaService {
  private apiUrl = 'http://localhost:3000/api/materias';

  constructor(private http: HttpClient) {}

  listarMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(this.apiUrl);
  }

  criarMateria(payload: { nome: string; area_conhecimento?: string; status?: string | number }): Observable<Materia> {
    return this.http.post<Materia>(this.apiUrl, payload);
  }

  excluirMateria(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  verificarDependencias(id: string): Observable<MateriaDependencias> {
    return this.http.get<MateriaDependencias>(`${this.apiUrl}/${id}/verificar-dependencias`);
  }

  atualizarMateria(id: string, payload: { nome?: string; area_conhecimento?: string; status?: string | number }): Observable<Materia> {
    return this.http.put<Materia>(`${this.apiUrl}/${id}`, payload);
  }
}
