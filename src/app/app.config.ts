import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { getApps, initializeApp } from 'firebase/app';

import { routes } from './app.routes';
import { authApiInterceptor } from './auth/api/auth-api.interceptor';
import { environment } from '../environments/environment';

// Inicializa o Firebase uma vez (o SDK ignora chamadas repetidas via getApps()).
if (!getApps().length) {
  initializeApp(environment.firebaseConfig);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authApiInterceptor])),
    // ── Variante com @angular/fire (requer `npm i @angular/fire`) ──
    // Troque o bloco `if (!getApps()...)` acima por:
    //   provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    //   provideAuth(() => getAuth()),
    // imports de '@angular/fire/app' e '@angular/fire/auth'.
  ],
};
