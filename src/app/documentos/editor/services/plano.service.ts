import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EditablePlano, PlanoSummary, SavePlano, TipoPlano } from '../models/plano.model';

@Injectable({ providedIn: 'root' })
export class PlanoService {
  private readonly http = inject(HttpClient);
  private url(alunoId: string) { return `http://localhost:3000/api/alunos/${encodeURIComponent(alunoId)}/planos`; }

  list(alunoId: string) { return firstValueFrom(this.http.get<PlanoSummary[]>(this.url(alunoId))); }
  template(alunoId: string, type: TipoPlano, bimestre: string, anoLetivo: number) {
    return firstValueFrom(this.http.get<EditablePlano>(`${this.url(alunoId)}/${type}/modelo`, { params: { bimestre, anoLetivo } }));
  }
  get(alunoId: string, type: TipoPlano, id: string) {
    return firstValueFrom(this.http.get<EditablePlano>(`${this.url(alunoId)}/${type}/${id}`));
  }
  save(alunoId: string, type: TipoPlano, body: SavePlano) {
    return firstValueFrom(this.http.post<EditablePlano>(`${this.url(alunoId)}/${type}`, body));
  }
  export(alunoId: string, type: TipoPlano, id: string, format: 'docx' | 'pdf') {
    return firstValueFrom(this.http.post(`${this.url(alunoId)}/${type}/${id}/exportar`, { format }, { responseType: 'blob' }));
  }
  async download(alunoId: string, type: TipoPlano, id: string, format: 'docx' | 'pdf', name: string): Promise<void> {
    const blob = await this.export(alunoId, type, id, format);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${name.replace(/\.(docx|pdf)$/i, '')}.${format}`;
    document.body.append(anchor);
    try { anchor.click(); }
    finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
}
