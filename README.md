# 📋 Quiz Interativo — CFSBM 2026

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue?style=for-the-badge)
![Tecnologias](https://img.shields.io/badge/Tecnologias-HTML5_|_CSS3_|_JS_|_Node.js-orange?style=for-the-badge)
![Licença](https://img.shields.io/badge/Licença-Uso_Livre_para_Estudos-green?style=for-the-badge)

Aplicação web moderna, interativa e responsiva projetada para o treinamento, fixação e autoavaliação de conteúdos preparatórios do **Curso de Formação de Sargentos Bombeiros Militares (CFSBM 2026) — Módulo II**.

O sistema conta com arquitetura de **zero dependências externas no backend**, armazenamento local resiliente, gamificação integrada, filtros dinâmicos em tempo real e controle de acesso com moderação.

---

## 🎯 Sumário

- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Estrutura de Diretórios](#-estrutura-de-diretórios)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Ambiente e Configuração de API](#-ambiente-e-configuração-de-api)
- [API REST do Servidor](#-api-rest-do-servidor)
- [Controle de Usuários e Moderação](#-controle-de-usuários-e-moderação)
- [Padrão dos Arquivos JSON de Questões](#-padrão-dos-arquivos-json-de-questões)
- [Roadmap de Desenvolvimento](#-roadmap-de-desenvolvimento)

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - **HTML5 & CSS3**: Design System moderno com suporte nativo a Dark/Light Mode, Split-View no Desktop e layout responsivo.
  - **JavaScript (Vanilla ES6+)**: Lógica reativa sem frameworks pesados, manipulação eficiente do DOM e persistência no `LocalStorage`.
- **Backend**:
  - **Node.js Nativo**: Servidor HTTP construído exclusivamente com módulos nativos (`http`, `fs`, `path`, `url`) — *sem necessidade de `npm install` de pacotes externos*.
- **Armazenamento de Dados**:
  - `LocalStorage`: Progresso individual do estudante, histórico de acertos/erros, sequências de streaks e preferências de tema.
  - Arquivos `JSON`: Banco de dados de questões (`/json`) e controle de credenciais (`/data/users.json`).

---

## ✨ Funcionalidades Principais

- 🔐 **Autenticação & Moderação**:
  - Telas de login e cadastro integradas.
  - Moderação administrativa (novas contas passam por aprovação prévia antes do primeiro acesso).
- 🔍 **Filtros Dinâmicos em Tempo Real**:
  - **Busca Global**: Pesquisa por palavras-chave em enunciados, opções, explicações e fundamentos.
  - **Categorias/Temas**: Filtro extraído dinamicamente com base nas questões da matéria ativa.
  - **Dificuldade**: Filtragem por níveis *Fácil*, *Médio* ou *Difícil*.
  - **Contador Dinâmico**: Indicador em tempo real do total de questões filtradas.
- 🖥️ **Interface Otimizada (Split-View)**:
  - Distribuição horizontal inteligente em telas desktop (pergunta e feedback à esquerda, alternativas e navegação à direita), eliminando barras de rolagem excessivas.
- 🎯 **Modo Foco**:
  - Oculta instantaneamente cabeçalhos, barras de ferramentas e filtros para estudo concentrado em tela cheia.
- 📚 **Modos de Estudo & Revisão**:
  - **Modo Padrão**: Navegação livre entre questões com feedback instantâneo e fundamentação bibliográfica.
  - **Modo Revisão Rápida**: Permite navegar pelas questões da matéria ou focar exclusivamente naquelas respondidas incorretamente.
  - **Tela de Análise Final (`pages/finalAnalysisQuiz.html`)**: Relatório completo com taxa de aproveitamento (%), gráfico de acertos/erros e revisão das respostas.
- 🔥 **Gamificação**:
  - Contador de acertos consecutivos (*Streak*) para incentivar a consistência do estudo.
- 🌓 **Tema Claro e Escuro**:
  - Paleta com contraste ajustado e persistência automática no navegador.

---

## 📂 Estrutura de Diretórios

```text
quiz-interativo/
├── api-config.js            # Configuração do endpoint base da API (Local / Nuvem)
├── index.html               # Interface principal do Quiz (Dashboard e Resolução)
├── package.json             # Scripts de execução do projeto
├── README.md                # Documentação oficial do projeto
│
├── css/
│   ├── auth.css             # Estilos dedicados às telas de login e cadastro
│   └── styles.css           # Design system completo, variáveis, layout grid e dark mode
│
├── data/
│   └── users.json           # Base local de usuários cadastrados
│
├── js/
│   ├── app.js               # Lógica central do quiz, filtros, estado e renderização
│   ├── auth.js              # Gerenciador de login, registro e sessão
│   ├── finalAnalysis.js     # Lógica e métricas da página de encerramento da matéria
│   └── server.js            # Servidor HTTP Node.js com endpoints REST e arquivos estáticos
│
├── json/
│   └── combateaincendio.json# Base de questões em formato JSON
│
└── pages/
    ├── cadastro.html        # Página de criação de conta
    ├── finalAnalysisQuiz.html# Página de relatório e revisão de desempenho final
    └── login.html           # Página de autenticação de usuários
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado (versão 16.x ou superior recomendada).

### Passo a Passo
1. Clone este repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
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

3. Acesse no navegador:
   👉 **`http://localhost:8000`**

> **💡 Usuário de Teste Padrão:**
> - **Usuário:** `admin`
> - **Senha:** `123456`

---

## ⚙️ Ambiente e Configuração de API

O arquivo `api-config.js` gerencia o apontamento das requisições:

```javascript
// Para desenvolvimento local:
window.API_BASE = 'http://localhost:8000';

// Para produção (ex: hospedagem no Railway):
window.API_BASE = 'https://cfsbm2026.up.railway.app';
```

---

## 📡 API REST do Servidor

O servidor nativo `js/server.js` disponibiliza os seguintes endpoints:

### 1. Autenticação
* **`POST /api/auth/cadastro`**
  - **Body**: `{ "nome": "...", "email": "...", "usuario": "...", "senha": "..." }`
  - **Comportamento**: Cria o usuário com `ativo: false` aguardando moderação.
* **`POST /api/auth/login`**
  - **Body**: `{ "usuario": "...", "senha": "..." }`
  - **Retorno**: Dados da sessão caso o usuário esteja ativo (`ativo: true`).

### 2. Matérias e Questões
* **`GET /api/materias`**
  - **Retorno**: Lista de arquivos disponíveis na pasta `/json` com metadados (título, descrição, total de questões e slug).
* **`GET /api/materias/:id`**
  - **Retorno**: Estrutura completa do arquivo JSON da matéria solicitada.

---

## 👮 Controle de Usuários e Moderação

Por motivos de segurança e controle de acesso:
1. Quando um novo usuário se cadastra via `pages/cadastro.html`, sua conta é registrada em `data/users.json` com `"ativo": false`.
2. Ao tentar fazer login, o sistema exibe a mensagem: *"Seu cadastro está sob análise do administrador do sistema. Aguarde para ter o acesso."*
3. **Para liberar o acesso**, o administrador deve alterar o campo `"ativo": true` correspondente no arquivo `data/users.json`.

---

## ✍️ Padrão dos Arquivos JSON de Questões

Novas matérias podem ser adicionadas criando arquivos `.json` na pasta `/json/`. O parser do sistema possui tratamento de espaços em branco e aceita a seguinte estrutura:

```json
{
  "informacoes": {
    "titulo": "Combate a Incêndio Estrutural",
    "materia": "Táticas de Combate a Incêndio",
    "descricao": "Questões de fixação para o Módulo II do CFSBM 2026.",
    "embaralharQuestoes": false,
    "mostrarFundamento": true
  },
  "questoes": [
    {
      "id": 1,
      "titulo": "Capítulo 1 - Fundamentos",
      "tema": "Conceitos Básicos",
      "dificuldade": "medio",
      "pergunta": "Qual método de extinção baseia-se na retirada do calor do material combustível?",
      "alternativas": [
        { "letra": "A", "texto": "Resfriamento." },
        { "letra": "B", "texto": "Abafamento." },
        { "letra": "C", "texto": "Isolamento." },
        { "letra": "D", "texto": "Quebra da reação em cadeia." }
      ],
      "correta": "A",
      "explicacao": "O resfriamento reduz a temperatura do combustível abaixo do seu ponto de ignição.",
      "fundamento": "Manual de Fundamentos de Bombeiros, Item 3.2"
    }
  ]
}
```

---

## 📌 Roadmap de Desenvolvimento

Conforme planejado em `Metas.md`:

- [ ] **Modo Simulado / Prova por Temas**: Seleção personalizada de temas e quantidade de questões.
- [ ] **Modo Prova por Nível**: Geração de baterias de testes calibradas por dificuldade (Fácil, Médio, Difícil).
- [ ] **Novos Formatos de Questões**: Suporte a *Verdadeiro/Falso*, *Complete as Lacunas* e *Asserções Múltiplas (I, II, III)*.
- [ ] **Dashboard Analítico na Tela Inicial**: Painel de pontos fortes e fracos por matéria e tópicos ainda não estudados.

---

## 📄 Licença

Projeto desenvolvido para fins didáticos e preparação militar. Livre para adaptação e estudos individuais.
