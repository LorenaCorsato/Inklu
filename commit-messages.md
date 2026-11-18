# Descrição de commits — alterações não commitadas

> Padrão seguido: [iuricode/padroes-de-commits](https://github.com/iuricode/padroes-de-commits)
> Formato: `:emoji: tipo(escopo opcional): descrição`

## Sugestão de parcelamento (recomendado)

As alterações misturam `feat`, `fix`, `style`, `build`, `remove` e `docs`.
Recomenda-se **não fazer um único commit** — use os 6 commits abaixo, nesta ordem.

---

### 1. Novo recurso — dropdown de contas na navbar

```bash
git add src/app/navbar/navbar.html src/app/navbar/navbar.ts src/app/navbar/navbar.scss
git commit -m "✨ feat(navbar): adicionar dropdown de contas com selo Conectado"
```

**Corpo sugerido:**

```text
✨ feat(navbar): adicionar dropdown de contas com selo Conectado

- Botão da conta abre menu com vínculos da SessaoStore
- Conta ativa exibe selo "Conectado"; clique troca via definirContexto()
- Ações "Adicionar nova conta" (/contexto) e "Fazer upgrade para escola" (/escola/cadastro)
- Fecha com Escape e clique fora; suporte ao modo colapsado
```

---

### 2. Correção — menu colapsado

```bash
git add src/app/navbar/navbar.scss
git commit -m "🐛 fix(navbar): corrigir dropdown cortado no menu colapsado"
```

**Corpo sugerido:**

```text
🐛 fix(navbar): corrigir dropdown cortado no menu colapsado

- .sidebar de overflow:hidden para visible para não clipar o menu flutuante
- Escopo do display:none para .conta > .conta__texto, preservando texto dentro do dropdown
```

> Se já incluído no commit 1, fundir os corpos.

---

### 3. Novo recurso — home reformulada

```bash
git add src/app/home/home.html src/app/home/home.ts src/app/home/home.scss src/app/home/home-calendar/ src/app/home/home-tasks.ts src/app/home/task-stack/
git commit -m "✨ feat(home): reformular página inicial com tarefas e documentos"
```

**Corpo sugerido:**

```text
✨ feat(home): reformular página inicial com tarefas e documentos

- Saudação e chip de data dinâmicos por horário
- Pilha de tarefas e calendário a partir de seedHomeTasks()
- Documentos recentes (5 últimos) via DocumentosService
- Cards de documentos com navegação para o editor
```

---

### 4. Estilo/acessibilidade — toast

```bash
git add src/app/shared/toast/toast.html src/app/shared/toast/toast.scss src/app/shared/toast/toast.ts
git commit -m "💄 feat(toast): centralizar toast e melhorar acessibilidade"
```

**Corpo sugerido:**

```text
💄 feat(toast): centralizar toast e melhorar acessibilidade

- Toast centralizado na base com safe-area e largura responsiva
- Roles alert/status com aria-live e botão com aria-label
- Animação vertical e respeito a prefers-reduced-motion
- Limpeza do timeout no ngOnDestroy
```

---

### 5. Estilo/configuração — fonte Rethink Sans e tokens

```bash
git add src/index.html src/styles/abstract/_variables-bootstrap.scss src/styles/abstract/tokens.scss src/styles/styles.scss src/styles/base/_fonts.scss public/fonts/
git commit -m "💄 style(tema): adotar fonte Rethink Sans e tokens de marca"
```

**Corpo sugerido:**

```text
💄 style(tema): adotar fonte Rethink Sans e tokens de marca

- Troca Open Sans/Inter por Rethink Sans com preload self-hosted
- Novo token --ds-brand e import de components/auth
- Preconnect para placehold.net
```

---

### 6. Build/configuração e documentação

```bash
git add package.json package-lock.json backend/package-lock.json src/app/app.config.ts src/app/app.html src/app/app.routes.ts src/app/app.scss src/app/app.ts src/app/configuracoes/ documentation/index.html
git commit -m "➕ build(deps): atualizar dependências e ajustes de app"
```

```bash
git rm editor_implementation_plan.md
git add -A
git commit -m "🗑️ remove(docs): excluir plano de implementação obsoleto"
```

---

## Alternativa: commit único (não recomendado)

Se precisar commitar tudo de uma vez:

```bash
git add -A
git commit -m "✨ feat(app): reformular navbar, home e identidade visual"
```

**Corpo sugerido:**

```text
✨ feat(app): reformular navbar, home e identidade visual

- Navbar: rebuild com grupos, busca com atalho /, dropdown de contas e correção do modo colapsado
- Home: nova página com tarefas, calendário e documentos recentes
- Toast: centralizado, acessível e com reduced-motion
- Tema: fonte Rethink Sans, token --ds-brand, ajustes de rotas e configurações
- Docs: atualização da documentação e remoção de plano obsoleto
```
