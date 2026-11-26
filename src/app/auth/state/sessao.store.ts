import { computed, Injectable, signal } from '@angular/core';
import type { Funcao, RespostaMe, SessaoSnapshot, Usuario, Vinculo } from '../auth.models';
import { CACHE_SESSAO_MS } from '../auth.config';

/**
 * Estado de sessão em memória. Não guarda token algum: a sessão real é um
 * cookie HttpOnly gerenciado pelo backend (seção 11).
 */
@Injectable({ providedIn: 'root' })
export class SessaoStore {
  readonly usuario = signal<Usuario | null>(null);
  readonly vinculos = signal<Vinculo[]>([]);
  readonly contexto = signal<Vinculo | null>(null);
  readonly carregada = signal(false);
  readonly mfaPendente = signal(false);
  readonly emailPendente = signal('');

  private readonly carregadaEm = signal(0);

  readonly autenticado = computed(() => this.usuario() !== null);
  readonly funcao = computed<Funcao | null>(
    () => this.contexto()?.funcao ?? this.usuario()?.funcao ?? null,
  );
  readonly temVinculo = computed(() => this.vinculos().length > 0);
  readonly snapshot = computed<SessaoSnapshot>(() => ({
    usuario: this.usuario(),
    vinculos: this.vinculos(),
    contexto: this.contexto(),
  }));

  cacheValido(): boolean {
    return this.carregada() && Date.now() - this.carregadaEm() < CACHE_SESSAO_MS;
  }

  /**
   * Sessão vinda do Firebase Authentication (fonte da verdade atual).
   * Usuários Firebase ainda não têm vínculos de escola no backend, então a
   * lista começa vazia — a home (`/`) não exige vínculo.
   */
  definirSessaoFirebase(
    dados: { uid: string; email: string | null; nome: string | null; emailVerificado: boolean } | null,
  ): void {
    if (!dados) {
      this.limpar();
      return;
    }
    const email = dados.email ?? '';
    this.usuario.set({
      id: dados.uid,
      nome: dados.nome?.trim() || email.split('@')[0] || 'Usuário',
      email,
      emailVerificado: dados.emailVerificado,
      funcao: null,
    });
    this.vinculos.set([]);
    this.contexto.set(null);
    this.mfaPendente.set(false);
    this.carregada.set(true);
    this.carregadaEm.set(Date.now());
  }

  definirSessao(resposta: RespostaMe): void {
    const lista = resposta.vinculos ?? [];
    const anterior = this.contexto();

    let contexto: Vinculo | null = null;
    if (lista.length === 1) {
      contexto = lista[0];
    } else if (anterior) {
      contexto = lista.find((vinculo) => vinculo.id === anterior.id) ?? null;
    }

    this.usuario.set(resposta.usuario ?? null);
    this.vinculos.set(lista);
    this.contexto.set(contexto);
    this.carregada.set(true);
    this.carregadaEm.set(Date.now());

    if (resposta.usuario) {
      this.mfaPendente.set(false);
    }
  }

  definirContexto(vinculoId: string): Vinculo | null {
    const escolhido = this.vinculos().find((vinculo) => vinculo.id === vinculoId) ?? null;
    this.contexto.set(escolhido);
    this.carregadaEm.set(Date.now());
    return escolhido;
  }

  marcarSessaoPendenteMfa(email: string): void {
    this.emailPendente.set(email);
    this.mfaPendente.set(true);
  }

  invalidarCache(): void {
    this.carregadaEm.set(0);
  }

  limpar(): void {
    this.usuario.set(null);
    this.vinculos.set([]);
    this.contexto.set(null);
    this.mfaPendente.set(false);
    this.emailPendente.set('');
    this.carregada.set(true);
    this.carregadaEm.set(0);
  }
}
