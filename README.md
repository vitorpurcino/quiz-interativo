# 📋 Quiz Interativo — CFSBM 2026

Um Quiz Interativo desenvolvido para auxiliar nos estudos do Curso de Formação de Sargentos Bombeiros Militares (CFSBM 2026) — Fase EAD, Módulo II. A aplicação consome arquivos `.json` locais de questões e fornece uma interface de testes amigável e gamificada, auxiliando na fixação do conteúdo.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias modernas e leves, sem depender de frameworks complexos, garantindo alta performance e facilidade de manutenção.

- **Frontend:**
  - **HTML5:** Estruturação semântica.
  - **CSS3 Vanilla:** Estilização com suporte a temas (Claro/Escuro) e design responsivo (Mobile First).
  - **JavaScript (Vanilla):** Lógica de interface, navegação de questões e manipulação do DOM.
- **Backend:**
  - **Node.js:** Servidor HTTP construído apenas com módulos nativos (`http`, `fs`, `path`, `url`), sem a necessidade de bibliotecas externas (como Express).
- **Banco de Dados:**
  - Arquivos estáticos `.json` carregados dinamicamente pelo servidor.

## ✨ Funcionalidades Principais

- **Seleção Dinâmica de Matérias:** Carregamento automático das disciplinas com base nos arquivos JSON disponíveis.
- **Sistema de Feedback e Gabarito:** Explicação da resposta correta e feedback imediato ao usuário.
- **Modo Foco 🎯:** Oculta distrações da interface para concentrar o usuário na leitura e resolução da questão.
- **Ofensiva de Acertos (Streak) 🔥:** Gamificação que acompanha a sequência de acertos consecutivos do usuário.
- **Acompanhamento de Progresso:** Barra de progresso visual e resumo estatístico de acertos, erros e aproveitamento ao concluir uma disciplina.
- **Módulo de Revisão 🔄:** Ao final da bateria, permite que o usuário revise exclusivamente as questões que errou.
- **Tema Claro / Escuro 🌓:** Alternância de esquema de cores conforme a preferência do usuário, proporcionando conforto visual.

## 📂 Estrutura de Diretórios

A estrutura do projeto está organizada da seguinte maneira:

```text
.
├── css/
│   └── styles.css          # Estilos principais da aplicação
├── js/
│   ├── app.js              # Lógica do frontend (quiz, navegação, pontuação)
│   └── server.js           # Servidor local Node.js (API e arquivos estáticos)
├── json/                   # Banco de dados de questões (ex: licitacoes.json)
├── index.html              # Ponto de entrada do frontend
├── Metas.md                # Roadmap de futuras melhorias e ajustes
├── package.json            # Configuração e scripts Node.js
└── README.md               # Esta documentação
```

## 🚀 Como Rodar o Projeto Localmente

Siga as instruções abaixo para configurar o ambiente e rodar o projeto na sua máquina local:

### 1. Pré-requisitos
- Ter o [Node.js](https://nodejs.org/pt-br/) (versão LTS recomendada) instalado no seu computador.

### 2. Instalação e Configuração
1. Faça o clone ou o download do projeto para sua máquina.
2. Abra um terminal e navegue até o diretório raiz do projeto:
   ```bash
   cd caminho/para/a/pasta/do/projeto
   ```

### 3. Execução
Para iniciar o servidor, execute o seguinte comando no terminal:
```bash
node js/server.js
```
*Dica: Você também pode verificar se há um script no `package.json` para facilitar, como `npm start`.*

A mensagem `Servidor do quiz está rodando em http://localhost:8000` aparecerá.

### 4. Acessando a Aplicação
Abra o seu navegador web favorito e acesse:
[http://localhost:8000](http://localhost:8000)

## 🤝 Como Contribuir

Contribuições são bem-vindas! Se você deseja colaborar (corrigindo bugs, adicionando novas questões, ou implementando novas features do `Metas.md`), siga o fluxo padrão:

1. Faça um *fork* deste repositório.
2. Crie uma *branch* para a sua funcionalidade (`git checkout -b feature/nova-feature`).
3. Commit suas modificações (`git commit -m 'Feat: Adiciona nova funcionalidade X'`).
4. Envie o código para o seu *fork* (`git push origin feature/nova-feature`).
5. Abra um *Pull Request* descrevendo as suas modificações.

## 📄 Licença

Este projeto é destinado ao estudo e formação. Fica reservado aos desenvolvedores a definição formal da licença caso o código seja publicado abertamente. Sinta-se à vontade para utilizá-lo para estudos pessoais e preparatórios.
