# 📋 Quiz Interativo — CFSBM 2026

Um Quiz Interativo de alta performance e experiência imersiva, desenvolvido para auxiliar nos estudos preparatórios do **Curso de Formação de Sargentos Bombeiros Militares (CFSBM 2026) — Fase EAD, Módulo II**. 

A aplicação consome bancos de dados locais em formato `.json` e disponibiliza uma interface gamificada, moderna, acessível e responsiva para a fixação eficiente do conteúdo.

---

## 🛠️ Tecnologias Utilizadas

Construído com foco em leveza, performance, fidelidade visual e ausência de dependências pesadas de terceiros:

- **Frontend:**
  - **HTML5 Semântico:** Estruturação limpa e acessível.
  - **CSS3 Vanilla & Design System:** Sistema completo de design com suporte nativo a temas Claro/Escuro, variáveis CSS (tokens), microanimações, glassmorphism e tipografia moderna (Google Fonts *Inter* e *Outfit*).
  - **JavaScript Vanilla (ES6+):** Gerenciamento de estado local, persistência em `localStorage`, navegação fluida e controle assíncrono de matérias.
- **Backend:**
  - **Node.js (Built-in):** Servidor HTTP leve construído com módulos nativos (`http`, `fs`, `path`, `url`), sem a necessidade de frameworks externos (como Express).
- **Dados:**
  - Arquivos estáticos `.json` carregados dinamicamente por matéria.

---

## ✨ Funcionalidades Principais (v6.0)

- **Seleção Dinâmica de Matérias:** Carregamento automático e listagem de disciplinas disponíveis na pasta `json/`.
- **Modo Foco 🎯 (Desktop & Mobile First):**
  - *Mobile:* Eliminação de rolagem dupla (*dual scroll*), fluxo vertical linear com scroll único suave e navegação adaptada para toque.
  - *Desktop:* Distribuição vertical harmônica preenchendo a tela de forma equilibrada, tipografia fluida com `clamp()` e entrelinhas ampla para leitura confortável de enunciados longos, sem gerar barras horizontais indesejadas.
- **Análise Final & Resumo Avaliativo 🏆 (`pages/finalAnalysisQuiz.html`):**
  - Painel estatístico detalhado de desempenho ao concluir uma matéria (total, respondidas, acertos, erros e percentual de aproveitamento).
  - Listagem comparativa de questões com visualização da alternativa assinalada vs. gabarito oficial e filtros dinâmicos de revisão.
- **Modo de Revisão 🔄:**
  - Permite revisitar e estudar especificamente as questões erradas ou filtradas, com indicador visual de status e botão dedicado de saída da revisão.
- **Sistema de Feedback e Justificativa:**
  - Explicação imediata pós-confirmação, com justificativa detalhada e indicação de fundamentação teórica/normativa (`📖`).
  - Formatação e hierarquia visual padronizada para respostas corretas e incorretas.
- **Ofensiva de Acertos (Streak) 🔥:**
  - Gamificação com contagem de acertos consecutivos e notificações *Toast* motivacionais.
- **Navegação Ergonômica:**
  - Botões de ação com cores e funções padronizadas (Anterior e Próxima em verde gradiente, Confirmar em azul e Sair da Revisão/Foco em vermelho).
- **Tema Claro / Escuro (Dark Mode) 🌓:**
  - Alternância de tema com persistência automática de preferência.

---

## 📂 Estrutura de Diretórios

```text
.
├── css/
│   └── styles.css              # Design System e estilos completos da aplicação
├── js/
│   ├── app.js                  # Lógica do Quiz, navegação, validação e Modo Foco
│   ├── finalAnalysis.js        # Lógica da tela de Análise Final e Resumo de Questões
│   └── server.js               # Servidor local nativo em Node.js (API e arquivos estáticos)
├── json/                       # Banco de questões por matéria (ex: segurancaincedio.json)
├── pages/
│   └── finalAnalysisQuiz.html  # Página dedicada ao Resumo Avaliativo e Análise de Desempenho
├── index.html                  # Ponto de entrada principal da aplicação
├── Metas.md                    # Roadmap de metas e funcionalidades futuras
├── package.json                # Configurações e scripts do projeto
└── README.md                   # Documentação do projeto
```

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Pré-requisitos
- Ter o [Node.js](https://nodejs.org/pt-br/) instalado no computador (versão 16 ou superior recomendada).

### 2. Instalação e Execução
1. Clone ou baixe o repositório em seu computador.
2. Abra o terminal na pasta raiz do projeto:
   ```bash
   cd "g:/Meu Drive/CFSBM 2026/Fase EAD/Módulo II/Quiz Interativo"
   ```
3. Inicie o servidor local através do script configurado:
   ```bash
   npm start
   # ou
   npm run dev
   # ou diretamente
   node js/server.js
   ```

A mensagem `Servidor do quiz está rodando em http://localhost:8000` será exibida.

### 3. Acessando a Aplicação
Abra seu navegador e acesse:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🤝 Contribuições e Roadmap

Consulte o arquivo [Metas.md](file:///g:/Meu%20Drive/CFSBM%202026/Fase%20EAD/M%C3%B3dulo%20II/Quiz%20Interativo/Metas.md) para acompanhar os próximos passos do projeto (Modos Prova, Simulado Cronometrado, Dashboard de Estatísticas, novos tipos avaliativos e filtros por temas/níveis).

Para contribuir:
1. Crie uma branch para sua funcionalidade (`git checkout -b feature/minha-feature`).
2. Faça commit das alterações (`git commit -m 'feat: Adiciona funcionalidade X'`).
3. Envie a branch para o repositório remoto (`git push origin feature/minha-feature`).
4. Abra um *Pull Request*.

---

## 📄 Licença

Projeto desenvolvido para fins educacionais e preparatórios do CFSBM 2026. Todos os direitos reservados aos desenvolvedores e colaboradores do projeto.
