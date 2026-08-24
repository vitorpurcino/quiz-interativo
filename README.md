# 📋 Quiz Interativo — CFSBM 2026

Aplicação simples e leve para treinar questões do Curso de Formação de Sargentos Bombeiros Militares (CFSBM 2026) — Fase EAD, Módulo II.

O projeto carrega questões a partir de arquivos JSON locais e fornece uma interface web com gamificação básica (streaks, progressos e revisão de erros) para auxiliar na fixação do conteúdo.

---

## 🛠️ Tecnologias

- Frontend: HTML5, CSS3 (Vanilla) e JavaScript (Vanilla)
- Backend local: Node.js usando apenas módulos nativos (http, fs, path)
- Dados: arquivos JSON em /json/

O objetivo é manter o projeto simples, sem dependências externas, facilitando execução local e distribuição para estudos.

---

## 🚀 Rodando localmente

Requisitos
- Node.js (versão LTS recomendada)

Passos
1. Clone o repositório:

   git clone <repo-url>
   cd "C:/Projetos Dev/quiz-interativo"

2. Instalar dependências: não há dependências externas obrigatórias; caso haja scripts em package.json, execute:

   npm install

3. Iniciar o servidor:

   node js/server.js

   (se existir, também é possível usar `npm start` se o script estiver definido)

4. Abra o navegador em: http://localhost:8000

Observação: o servidor serve os arquivos estáticos e os JSON em /json/ — verifique se a pasta contém arquivos válidos de questões.

---

## 📂 Estrutura do projeto

- [index.html](C:/Projetos Dev/quiz-interativo/index.html) — página principal do frontend
- [js/server.js](C:/Projetos Dev/quiz-interativo/js/server.js) — servidor Node.js que entrega arquivos estáticos e JSON
- [js/app.js](C:/Projetos Dev/quiz-interativo/js/app.js) — lógica do frontend (navegação, pontuação, feedback)
- [css/styles.css](C:/Projetos Dev/quiz-interativo/css/styles.css) — estilos da aplicação
- [json/](C:/Projetos Dev/quiz-interativo/json/) — pasta com arquivos de questões (cada arquivo representa uma disciplina)
- [Metas.md](C:/Projetos Dev/quiz-interativo/Metas.md) — roadmap e ideias futuras

---

## ✍️ Formato dos arquivos de questões (JSON)

Cada arquivo JSON dentro de /json/ deve conter um array de objetos no formato básico abaixo:

{
  "title": "Nome da disciplina",
  "questions": [
    {
      "id": 1,
      "question": "Pergunta de exemplo?",
      "options": ["A", "B", "C", "D"],
      "answer": 0,            // índice da opção correta (0-based)
      "explanation": "Explicação da resposta correta (opcional)"
    }
  ]
}

Ao adicionar novos arquivos, o frontend os detecta automaticamente (desde que o servidor os liste/entregue).

---

## ✨ Funcionalidades principais

- Seleção dinâmica de disciplinas com base nos arquivos JSON
- Feedback imediato com explicação da resposta
- Modo foco (interface limpa)
- Streaks de acertos e barra de progresso
- Revisão das questões erradas ao fim da bateria
- Tema claro/escuro

---

## 🤝 Como contribuir

1. Abra uma issue descrevendo o que deseja mudar ou melhorar.
2. Crie uma branch com um nome claro: `feature/descricao-curta` ou `fix/descricao-curta`.
3. Faça commits atômicos e descritivos.
4. Envie um pull request explicando as alterações e como testá-las.

Dicas:
- Para adicionar questões, coloque um novo arquivo JSON em /json/ seguindo o formato acima.
- Teste localmente executando `node js/server.js` e acessando `http://localhost:8000`.

---

## 🧪 Testes e validação

Não há suíte de testes automática configurada neste projeto. Para validar alterações, execute o servidor local e verifique o comportamento no navegador.

---

## 📄 Licença

Uso livre para estudos e preparação pessoal. Caso queira publicar este projeto publicamente, defina uma licença no repositório (por exemplo, MIT) e atualize este README.

---

## Contato

Para dúvidas ou sugestões, abra uma issue no repositório ou entre em contato com os mantenedores do projeto.
