# 📋 Quiz Interativo — CFSBM 2026

Aplicação interativa e responsiva projetada para treinamento e fixação de conteúdo para o Curso de Formação de Sargentos Bombeiros Militares (CFSBM 2026) — Módulo II.

O projeto carrega questões a partir de arquivos JSON locais e fornece uma interface web moderna com gamificação básica (streaks, progressos e revisão de erros), controle de acesso (login/cadastro) e filtros dinâmicos de questões em tempo real.

---

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3 (Vanilla com suporte a Dark/Light Mode e responsividade) e JavaScript (Vanilla ES6+)
- **Backend local**: Node.js usando módulos nativos (http, fs, path, url) - *sem dependências externas*
- **Persistência**: LocalStorage no navegador para progresso do usuário e arquivos JSON para o banco de dados de usuários e matérias.

---

## ✨ Funcionalidades Principais

- 🔐 **Controle de Acesso**: Tela de login e cadastro de novos usuários com validação de status de ativação pelo administrador.
- 🔍 **Filtros Dinâmicos em Tempo Real**:
  - **Busca por Título/Texto**: Busca textual por palavra-chave em títulos, enunciados, justificativas e fundamentos.
  - **Filtro por Tema**: Filtragem por categorias/tópicos específicos carregados dinamicamente com base na matéria selecionada.
  - **Filtro por Dificuldade**: Filtragem por nível de complexidade (Fácil, Média, Difícil).
- 📚 **Modo Revisão**: Permite revisar todas as questões da matéria ou focar exclusivamente nas questões respondidas incorretamente.
- 🎯 **Modo Foco**: Interface limpa e minimalista para reduzir distrações durante o estudo.
- 🔥 **Gamificação**: Contador de acertos consecutivos (Streak) com feedback visual dinâmico.
- 🌗 **Tema Claro/Escuro**: Alternância de cores com persistência de preferência.

---

## 🚀 Rodando Localmente

### Requisitos
- [Node.js](https://nodejs.org/) (Versão LTS recomendada)

### Passos para Execução
1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd quiz-interativo
   ```

2. Inicie o servidor:
   ```bash
   npm start
   # ou
   npm run dev
   # ou
   node js/server.js
   ```

3. Abra no seu navegador:
   [http://localhost:8000](http://localhost:8000)

> **💡 Credenciais de Teste Padrão**:
> - **Usuário**: `admin`
> - **Senha**: `123456`

---

## 📂 Estrutura do Projeto

- `index.html` — Página principal e interface do quiz.
- `css/styles.css` — Estilos visuais e definições do Design System (Light/Dark mode).
- `js/server.js` — Servidor Node.js nativo (serviço de API de matérias e arquivos estáticos).
- `js/app.js` — Lógica principal do quiz, controle de estado, navegação e filtros dinâmicos.
- `js/auth.js` — Lógica de cadastro, login e autenticação de usuários.
- `js/finalAnalysis.js` — Lógica da tela de análise final do progresso por matéria.
- `json/` — Diretório contendo os arquivos de banco de dados das matérias em formato JSON.
- `data/users.json` — Banco de dados de usuários cadastrados no sistema.

---

## ✍️ Formato das Matérias e Questões (JSON)

O parser da aplicação é resiliente e aceita chaves com espaços em branco (característica de exportações de ferramentas externas) e suporta tanto a estrutura clássica de configuração quanto a nova estrutura de metadados:

### Exemplo de Estrutura JSON Suportada

```json
{
  "informacoes": {
    "titulo": "Quiz de Exemplo - Táticas de Combate a Incêndio",
    "materia": "Táticas de Combate a Incêndio Estrutural",
    "embaralharQuestoes": true,
    "mostrarFundamento": true,
    "descricao": "Descrição curta ou ementa da matéria do quiz."
  },
  "questoes": [
    {
      "id": 1,
      "titulo": "Capítulo 1",
      "tema": "1.2 Conceitos Fundamentais",
      "dificuldade": "média",
      "pergunta": "Qual é a definição correta de Tática?",
      "alternativas": [
        { "letra": "A", "texto": "Emprego organizado dos recursos disponíveis." },
        { "letra": "B", "texto": "Conjunto de conhecimentos puramente teóricos." }
      ],
      "correta": "A",
      "explicacao": "A tática lida com o emprego e a coordenação das forças no combate real.",
      "fundamento": "Capítulo 1, Seção 1.2.3 da Apostila"
    }
  ]
}
```

---

## 🤝 Como Contribuir

1. Coloque um novo arquivo JSON em `/json/` seguindo a estrutura de dados descrita acima.
2. Certifique-se de que o nome do arquivo seja listado corretamente pelo servidor.
3. Crie uma branch com o nome apropriado (`feature/nova-materia` ou `fix/nome-do-bug`).
4. Envie o seu Pull Request explicando as melhorias realizadas.

---

## 📄 Licença

Uso livre para estudos e preparação pessoal. Caso queira publicar este projeto publicamente, defina uma licença no repositório (por exemplo, MIT) e atualize este README.

