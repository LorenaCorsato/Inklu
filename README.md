# INKLU
Desenvolvida como um projeto acadêmico para a disciplina de Engenharia de Software da Fatec Itu, esta é uma plataforma web voltada a otimizar a rotina de professores de apoio na educação inclusiva. O sistema visa reduzir a sobrecarga administrativa desses profissionais, permitindo que dediquem mais tempo e energia ao que realmente importa: o acompanhamento direto, o desenvolvimento social e emocional, e o planejamento pedagógico dos estudantes com necessidades educacionais específicas.

## :busts_in_silhouette:Integrantes
- Carlos Henrique Mattei de Oliveira - Frontend
- Diego Stocco Oliveira - Documentação e testes
- Lavínia Keiller - Backend
- Lorena Gonçalves Ribeiro Corsato - Backend
- Lyncon de Oliveira Santos - Backend

## 📎 Links importantes 

- [📚 Documentação do Projeto](https://drive.google.com/drive/folders/1jK5MWw4MHqhwms5YI6WmAED73FlfaHfP?hl=pt-b).
- [🎨 Figma](https://www.figma.com/design/JZQhmmTiSCEQVZTVarJMqR/INKLU?node-id=0-1&t=UGmP3gTKUIAGXEtO-1)
- [🗒️ Notion](https://app.notion.com/p/Inklu-Projeto-de-Engenharia-de-Software-37942ea14da9808fac65d7c83b7a6b68?source=copy_link)
- [🗒️ Trello](https://trello.com/b/g6w9zYot/inklu)



## ✔️ Conceito de pronto

No Trello, o nosso "Conceito de Pronto" baseia-se em duas checklists obrigatórias presentes em cada cartão: Progresso e Critérios de Aceite.

- A checklist de Progresso é utilizada pelo desenvolvedor para acompanhar as etapas técnicas já implementadas.

- A checklist de Critérios de Aceite é destinada ao responsável pela validação, que testará a funcionalidade.

Um cartão só é considerado concluído e movido para a coluna "Finalizado" quando todos os itens de ambas as listas estiverem totalmente marcados.
## ⚙️ Guia de Execução - Inklu

Este guia é para que todos os integrantes da equipe consigam rodar o projeto localmente em suas máquinas. Nossa stack utiliza Angular (Frontend) e Node.js + Express (Backend).

### 1. Pré-requisitos
Antes de começar, certifique-se de que sua máquina possui:
* **Node.js**: Baixe obrigatoriamente a versão **LTS** (Long Term Support) no [site oficial](https://nodejs.org/).
* **Git**: Para versionamento de código.
* **VS Code**: Nosso editor padrão.

### 2. Clonar o repositório
Abra o seu terminal, escolha a pasta onde deseja salvar o projeto e rode:
```bash
git clone https://github.com/LorenaCorsato/Inklu.git
cd Inklu

```

### 3. Configurar as Chaves Secretas (.env)

Nós não subimos senhas e chaves de API para o GitHub. Você precisará configurar seus arquivos ocultos de ambiente.

1. Acesse a página do nosso projeto no **Notion**. Lá estão centralizadas as chaves de desenvolvimento do Supabase, Cloudflare R2 e OpenRouter.
2. Na pasta `backend/`, faça uma cópia do arquivo `.env.example` e renomeie para `.env`. Cole as chaves do backend dentro dele.
3. Na pasta `frontend/`, faça o mesmo: copie o `.env.example`, renomeie para `.env` e cole as chaves públicas (se houver).

### 4. Como rodar o Backend (API Node.js)

Abra um terminal no VS Code e acesse a pasta do backend para instalar as dependências e ligar o servidor:

```bash
cd backend
npm install
npm run dev

```

> ✅ **Sucesso:** Se tudo der certo, o terminal avisará que o servidor está rodando em `http://localhost:3000`. Deixe este terminal aberto.

### 5. Como rodar o Frontend (Angular)

Abra um **segundo terminal** no VS Code (clicando no ícone de `+`). Na raiz do projeto, basta instalar as dependências e rodar:
```bash
npm install
ng s -o
```
> ✅ **Sucesso:** O Angular vai compilar o projeto. Assim que terminar, acesse no seu navegador: `http://localhost:4200`

