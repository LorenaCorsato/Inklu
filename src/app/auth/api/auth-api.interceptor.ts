import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AUTH_API_BASE } from '../auth.config';
import { paraApiError } from './api-error';
import { SessaoStore } from '../state/sessao.store';

/**
 * - Envia o cookie HttpOnly (`withCredentials`) em chamadas da API.
 * - Normaliza falhas em `ApiError`.
 * - Em 401 de chamada protegida, limpa a sessão local e leva ao login com
 *   banner e `redirect` (BDD-069/TDD-143).
 */
export const authApiInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const store = inject(SessaoStore);
  const router = inject(Router);

  const ehApi = requisicao.url.startsWith(AUTH_API_BASE);
  const requisicaoFinal = ehApi
    ? requisicao.clone({ withCredentials: true })
    : requisicao;

  return proximo(requisicaoFinal).pipe(
    catchError((erro: unknown) => {
      const apiError = paraApiError(erro);
      if (!ehApi) {
        return throwError(() => erro);
      }

      const ehRotaPublica =
        /\/auth\/(login|register|verify-email|resend-verification|me|senha\/)/.test(
          requisicao.url,
        ) || /\/convites\/[^/]+$/.test(requisicao.url);

      if (apiError.status === 401 && !ehRotaPublica) {
        store.limpar();
        void router.navigate(['/entrar'], {
          queryParams: {
            motivo: 'sessao_expirada',
            redirect: router.url,
          },
        });
      }

      return throwError(() => apiError);
    }),
  );
};
