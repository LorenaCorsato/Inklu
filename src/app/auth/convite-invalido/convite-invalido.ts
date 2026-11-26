import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type CodigoConvite = 'expirado' | 'usado' | 'invalido';

const MENSAGENS_CONVITE: Record<CodigoConvite, string> = {
  expirado: 'Este convite expirou. Peça à coordenação da escola para enviar um novo.',
  usado: 'Este convite já foi usado. Se você já aceitou, entre na sua conta.',
  invalido: 'Este link não é válido. Confira se copiou o endereço completo.',
};

@Component({
  selector: 'app-convite-invalido',
  imports: [RouterLink],
  templateUrl: './convite-invalido.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConviteInvalido {
  readonly codigo = signal<CodigoConvite>(this.lerCodigo());
  readonly texto = computed(() => MENSAGENS_CONVITE[this.codigo()]);

  private lerCodigo(): CodigoConvite {
    const estado = (window.history.state ?? {}) as Record<string, unknown>;
    const doEstado = estado['codigo'];
    const daUrl = new URLSearchParams(window.location.search).get('codigo');
    const codigo = typeof doEstado === 'string' ? doEstado : daUrl;

    if (codigo === 'expirado' || codigo === 'usado' || codigo === 'invalido') {
      return codigo;
    }
    return 'invalido';
  }
}
