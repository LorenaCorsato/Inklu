import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';

import { ROTAS } from '../auth.config';
import { AuthService } from '../services/auth.service';
import { SessaoStore } from '../state/sessao.store';

/**
 * Guards apenas melhoram a experiência. Toda rota protegida ainda trata
 * 401/403 vindos da API (seção 5).
 */
function urlLogin(router: Router, state: RouterStateSnapshot): UrlTree {
  return router.createUrlTree([ROTAS.login], {
    queryParams: { redirect: state.url },
  });
}

function carregarSessaoSegura(auth: AuthService): Observable<unknown> {
  return auth.garantirSessao().pipe(catchError(() => of(null)));
}

/** S04: autenticado, e-mail verificado e sem função definida. */
export const funcaoGuard: CanActivateFn = (_rota, state) => {
  const auth = inject(AuthService);
  const store = inject(SessaoStore);
  const router = inject(Router);

  return carregarSessaoSegura(auth).pipe(
    map(() => {
      const usuario = store.usuario();
      if (!usuario) return urlLogin(router, state);
      if (store.funcao()) {
        return router.createUrlTree([ROTAS.painel], {
          queryParams: { aviso: 'funcao_ja_definida' },
        });
      }
      if (usuario.emailVerificado === false) {
        return router.createUrlTree([ROTAS.verificarEmail], {
          queryParams: { modo: 'reenvio' },
        });
      }
      return true;
    }),
  );
};

/** S07: exige a sessão parcial criada por `mfa_requerido`. */
export const mfaGuard: CanActivateFn = (_rota, state) => {
  const store = inject(SessaoStore);
  const router = inject(Router);
  return store.mfaPendente() ? true : urlLogin(router, state);
};

/** S08: autenticado com mais de um vínculo. */
export const contextoGuard: CanActivateFn = (_rota, state) => {
  const auth = inject(AuthService);
  const store = inject(SessaoStore);
  const router = inject(Router);

  return carregarSessaoSegura(auth).pipe(
    map(() => {
      if (!store.usuario()) return urlLogin(router, state);
      const total = store.vinculos().length;
      if (total === 1) return router.createUrlTree([ROTAS.painel]);
      if (total === 0) return router.createUrlTree([ROTAS.semAcesso]);
      return true;
    }),
  );
};

/** S09: autenticado sem vínculo ativo. */
export const semAcessoGuard: CanActivateFn = (_rota, state) => {
  const auth = inject(AuthService);
  const store = inject(SessaoStore);
  const router = inject(Router);

  return carregarSessaoSegura(auth).pipe(
    map(() => {
      if (!store.usuario()) return urlLogin(router, state);
      return store.temVinculo() ? router.createUrlTree([ROTAS.painel]) : true;
    }),
  );
};

/** S14: autenticado com contexto definido. */
export const painelGuard: CanActivateFn = (_rota, state) => {
  const auth = inject(AuthService);
  const store = inject(SessaoStore);
  const router = inject(Router);

  return carregarSessaoSegura(auth).pipe(
    map(() => {
      if (!store.usuario()) return urlLogin(router, state);
      if (store.vinculos().length === 0) {
        return router.createUrlTree([ROTAS.semAcesso]);
      }
      if (store.vinculos().length > 1 && !store.contexto()) {
        return router.createUrlTree([ROTAS.contexto]);
      }
      return true;
    }),
  );
};

/** S13: Coordenação no contexto ativo. */
export const coordenacaoGuard: CanActivateFn = (_rota, state) => {
  const auth = inject(AuthService);
  const store = inject(SessaoStore);
  const router = inject(Router);

  return carregarSessaoSegura(auth).pipe(
    map(() => {
      if (!store.usuario()) return urlLogin(router, state);
      if (store.funcao() === 'coordenacao') return true;
      return router.createUrlTree([ROTAS.painel], {
        queryParams: { aviso: 'sem_permissao' },
      });
    }),
  );
};
