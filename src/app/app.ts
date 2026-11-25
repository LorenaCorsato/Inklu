import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './navbar/navbar';
import { VerificacaoEmailModal } from './auth/verificacao-email-modal/verificacao-email-modal';
import { ThemeService } from './services/theme.service';
import { Toast } from './shared/toast/toast';
import { ToastService } from './shared/toast/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Toast, VerificacaoEmailModal],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('inklu');

  /**
   * O editor roda em tela cheia (sem navbar e sem a moldura de conteúdo),
   * então a shell precisa saber quando essa rota está ativa.
   */
  protected readonly isEditorRoute = signal(false);

  /**
   * Telas de autenticação ocupam a janela inteira, sem navbar.
   * O painel continua dentro da shell porque é o destino do app logado.
   */
  protected readonly isAuthRoute = signal(false);

  /** Notificações globais de erro/sucesso, no rodapé centralizado. */
  readonly toast = inject(ToastService);

  constructor(_theme: ThemeService, router: Router) {
    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const url = router.url.split('?')[0];
      this.isEditorRoute.set(url.startsWith('/documentos/editor') || /^\/alunos\/[^/]+\/planos\//.test(url));
      this.isAuthRoute.set(
        /^\/(entrar|cadastro|verificar-email|recuperar-senha|redefinir-senha|contexto|sem-acesso|convite|escola\/cadastro|entrar-firebase)(\/|$)/.test(
          url,
        ),
      );

      // Após navegação, o foco vai para o título da nova tela (WCAG 2.4.3).
      setTimeout(() => {
        document.querySelector<HTMLElement>('h1[tabindex="-1"]')?.focus();
      }, 0);
    });
  }
}
