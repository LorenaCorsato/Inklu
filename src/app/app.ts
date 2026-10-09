import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './navbar/navbar';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
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

  constructor(_theme: ThemeService, router: Router) {
    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.isEditorRoute.set(router.url.startsWith('/documentos/editor') || /^\/alunos\/[^/]+\/planos\//.test(router.url));
    });
  }
}
