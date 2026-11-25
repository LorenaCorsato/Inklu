import { Component, computed, input, output } from '@angular/core';
import type { EventoCalendario } from '../calendario';

export type ModoCartao = 'mes' | 'semana';

/** Card de tarefa do calendário (visões Mês e Semana) — visual bloco sólido / faixa superior. */
@Component({
  selector: 'app-cartao-tarefa',
  host: { style: 'display: contents' },
  templateUrl: './cartao-tarefa.html',
  styleUrl: './cartao-tarefa.scss',
})
export class CartaoTarefa {
  readonly evento = input.required<EventoCalendario>();
  readonly modo = input<ModoCartao>('mes');
  readonly arrastando = input(false);

  readonly abrir = output<string>();
  readonly iniciarArrasto = output<{ event: DragEvent; id: string }>();
  readonly terminarArrasto = output<void>();

  protected readonly classes = computed(() => {
    const e = this.evento();
    const base = this.modo() === 'mes' ? 'ct ct--mes' : 'ct ct--semana';
    return `${base} ct--${e.tipo}${this.arrastando() ? ' ct--arrastando' : ''}`;
  });

  protected readonly rotuloHora = computed(() => {
    const e = this.evento();
    return this.modo() === 'mes' ? e.horaInicio : `${e.horaInicio} – ${e.horaFim}`;
  });

  protected aoClicar(): void {
    this.abrir.emit(this.evento().id);
  }

  protected aoIniciarArrasto(event: DragEvent): void {
    this.iniciarArrasto.emit({ event, id: this.evento().id });
  }

  protected aoTerminarArrasto(): void {
    this.terminarArrasto.emit();
  }
}
