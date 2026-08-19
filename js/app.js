/* ============================================================
   QUIZ INTERATIVO — CFSBM 2026
   app.js — Lógica principal com melhorias de UX
   ============================================================ */

const STORAGE_KEY = 'quiz_interativo_progress_v1';
const THEME_KEY   = 'quiz_interativo_theme';

const STATIC_SUBJECTS = [
  'comandoelideranca.json',
  'correspondencias.json',
  'direitopenalmilitar.json',
  'fundamentojuridicos.json',
  'licitacoes.json',
  'segurancaincedio.json'
];

/* ============================================================
   ESTADO DA APLICAÇÃO
   ============================================================ */
const state = {
  subjects:            [],
  selectedSubjectId:   '',
  selectedSubjectData: null,
  currentIndex:        0,
  draftSelection:      null,
  darkMode:            localStorage.getItem(THEME_KEY) === 'dark',
  streak:              0,
  modoRevisao:         false,
  filtroRevisao:       'todas',
  questoesFiltradas:   [],
  indiceFiltro:        0
};

/* ============================================================
   REFERÊNCIAS AO DOM
   ============================================================ */
const refs = {
  titulo:             document.getElementById('titulo'),
  subtitulo:          document.getElementById('subtitulo'),
  btnTema:            document.getElementById('btnTema'),
  avisoErro:          document.getElementById('avisoErro'),
  mensagemErro:       document.getElementById('mensagemErro'),
  telaCarregando:     document.getElementById('telaCarregando'),
  telaQuiz:           document.getElementById('telaQuiz'),
  telaResultado:      document.getElementById('telaResultado'),
  subjectSelect:      document.getElementById('subjectSelect'),
  questionSelect:     document.getElementById('questionSelect'),
  reiniciarBtn:       document.getElementById('reiniciarBtn'),
  contadorQuestao:    document.getElementById('contadorQuestao'),
  pontuacao:          document.getElementById('pontuacao'),
  progressBar:        document.getElementById('progressBar'),
  progressText:       document.getElementById('progressText'),
  questionTopic:      document.getElementById('questionTopic'),
  questionDifficulty: document.getElementById('questionDifficulty'),
  questionText:       document.getElementById('questionText'),
  questionCard:       document.getElementById('questionCard'),
  alternativas:       document.getElementById('alternativas'),
  feedbackBox:        document.getElementById('feedbackBox'),
  btnVoltar:          document.getElementById('btnVoltar'),
  focoZoomContainer:  document.getElementById('focoZoomContainer'),
  btnModoFoco:        document.getElementById('btnModoFoco'),
  btnSairFoco:        document.getElementById('btnSairFoco'),
  btnConfirmar:       document.getElementById('btnConfirmar'),
  btnProxima:         document.getElementById('btnProxima'),
  toastContainer:     document.getElementById('toastContainer'),
  modalOverlay:       document.getElementById('modalOverlay'),
  modalIcone:         document.getElementById('modalIcone'),
  modalTitulo:        document.getElementById('modalTitulo'),
  modalTexto:         document.getElementById('modalTexto'),
  modalCancelar:      document.getElementById('modalCancelar'),
  modalConfirmar:     document.getElementById('modalConfirmar'),
  streakBadge:        document.getElementById('streakBadge'),
  streakCount:        document.getElementById('streakCount'),
  resultadoIcone:     document.getElementById('resultadoIcone'),
  resultadoTitulo:    document.getElementById('resultadoTitulo'),
  resultadoSubtitulo: document.getElementById('resultadoSubtitulo'),
  statTotal:          document.getElementById('statTotal'),
  statAcertos:        document.getElementById('statAcertos'),
  statErros:          document.getElementById('statErros'),
  btnRevisarTodas:    document.getElementById('btnRevisarTodas'),
  btnRevisarErros:    document.getElementById('btnRevisarErros'),
  encerrarRevisaoBtn: document.getElementById('encerrarRevisaoBtn'),
  btnReiniciarResultado:  document.getElementById('btnReiniciarResultado')
};

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function mostrarToast(mensagem, tipo = 'info', duracao = 3500) {
  const icones = { sucesso: '✅', erro: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-icone">${icones[tipo] || icones.info}</span>
    <span>${mensagem}</span>
  `;

  refs.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('saindo');
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}

/* ============================================================
   MODAL DE CONFIRMAÇÃO CUSTOMIZADO
   ============================================================ */
function mostrarModal(titulo, texto, icone = '⚠️') {
  return new Promise((resolve) => {
    refs.modalIcone.textContent  = icone;
    refs.modalTitulo.textContent = titulo;
    refs.modalTexto.textContent  = texto;
    refs.modalOverlay.classList.remove('hidden');
    refs.modalConfirmar.focus();

    function confirmar() {
      fecharModal();
      resolve(true);
    }

    function cancelar() {
      fecharModal();
      resolve(false);
    }

    function fecharModal() {
      refs.modalOverlay.classList.add('hidden');
      refs.modalConfirmar.removeEventListener('click', confirmar);
      refs.modalCancelar.removeEventListener('click', cancelar);
    }

    refs.modalConfirmar.addEventListener('click', confirmar);
    refs.modalCancelar.addEventListener('click', cancelar);
  });
}

/* ============================================================
   NORMALIZAÇÃO DE DADOS
   ============================================================ */
function normalizeQuestion(question, index) {
  const alternatives = Array.isArray(question.alternativas) ? question.alternativas : [];
  const normalizedAlternatives = alternatives
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      letter: String(item.letra || '').trim().toUpperCase(),
      text:   String(item.texto || item.text || '').trim()
    }))
    .filter((item) => item.letter && item.text);

  return {
    id:          question.id ?? index + 1,
    title:       String(question.pergunta || question.enunciado || 'Pergunta sem enunciado').trim(),
    topic:       String(question.tema || 'Tema não informado').trim(),
    difficulty:  String(question.dificuldade || 'Sem nível').trim(),
    correct:     String(question.correta || question.respostaCorreta || '').trim().toUpperCase(),
    explanation: String(question.explicacao || question.comentario || '').trim(),
    fundamento:  String(question.fundamento || '').trim(),
    alternatives: normalizedAlternatives
  };
}

function normalizeSubject(payload, fileName) {
  const config    = payload?.config || {};
  const questions = Array.isArray(payload?.questoes)
    ? payload.questoes.map((question, index) => normalizeQuestion(question, index))
    : [];

  return {
    id:       slugify(fileName.replace(/\.json$/i, '')),
    title:    String(config.titulo || payload?.titulo || fileName.replace(/\.json$/i, '')).trim(),
    subtitle: String(config.subtitulo || payload?.subtitulo || 'Questões de estudo').trim(),
    questions
  };
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/* ============================================================
   PERSISTÊNCIA (localStorage)
   ============================================================ */
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { currentSubject: '', subjects: {} };

    const parsed = JSON.parse(raw);
    return {
      currentSubject: parsed.currentSubject || '',
      subjects:       parsed.subjects && typeof parsed.subjects === 'object' ? parsed.subjects : {}
    };
  } catch (error) {
    console.warn('Erro ao carregar progresso salvo:', error);
    return { currentSubject: '', subjects: {} };
  }
}

function saveProgress() {
  const progress = loadProgress();
  progress.currentSubject = state.selectedSubjectId;
  const current = progress.subjects[state.selectedSubjectId] || { answers: {}, currentIndex: 0 };
  current.currentIndex = state.currentIndex;
  progress.subjects[state.selectedSubjectId] = current;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getCurrentSubjectProgress() {
  const progress = loadProgress();
  if (!state.selectedSubjectId) return { answers: {}, currentIndex: 0 };

  const subjectProgress = progress.subjects[state.selectedSubjectId] || { answers: {}, currentIndex: 0 };
  return {
    answers:      subjectProgress.answers || {},
    currentIndex: typeof subjectProgress.currentIndex === 'number' ? subjectProgress.currentIndex : 0
  };
}

/* ============================================================
   HELPERS DE QUESTÃO
   ============================================================ */
function currentQuestion() {
  if (!state.selectedSubjectData || !state.selectedSubjectData.questions.length) return null;
  return state.selectedSubjectData.questions[state.currentIndex] || null;
}

function questionKey(question) {
  return String(question.id ?? state.currentIndex + 1);
}

function getAnswerRecord(question) {
  if (!question) return null;
  const progress = getCurrentSubjectProgress();
  return progress.answers[questionKey(question)] || null;
}

function setDraftFromCurrent() {
  const question = currentQuestion();
  if (!question) { state.draftSelection = null; return; }

  const answer = getAnswerRecord(question);
  state.draftSelection = answer ? answer.selected : null;
}

/* ============================================================
   STREAK
   ============================================================ */
function updateStreak(isCorrect) {
  if (isCorrect) {
    state.streak += 1;
  } else {
    state.streak = 0;
  }
  renderStreak();
}

function renderStreak() {
  refs.streakBadge.dataset.streak = state.streak;
  refs.streakCount.textContent    = state.streak;

  if (state.streak >= 3) {
    refs.streakBadge.title = `🔥 ${state.streak} acertos consecutivos!`;
  }
}

/* ============================================================
   DIFICULDADE — CLASSE CSS
   ============================================================ */
function getDifficultyClass(difficulty) {
  const d = String(difficulty).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (d === 'facil' || d === 'easy' || d === 'baixo') return 'dificil-facil';
  if (d === 'medio' || d === 'medium' || d === 'medio')  return 'dificil-medio';
  if (d === 'dificil' || d === 'hard' || d === 'alto')   return 'dificil-dificil';
  return 'dificil-default';
}

/* ============================================================
   RENDERIZAÇÃO
   ============================================================ */
function updateHeader() {
  const subject = state.selectedSubjectData;
  refs.titulo.textContent    = subject?.title    || 'Quiz Interativo';
  refs.subtitulo.textContent = subject?.subtitle || 'Questões de estudo';
}

function renderSubjectOptions() {
  refs.subjectSelect.innerHTML = state.subjects
    .map((subject) => `<option value="${subject.id}">${subject.title}</option>`)
    .join('');

  if (state.selectedSubjectId) {
    refs.subjectSelect.value = state.selectedSubjectId;
  }
}

function renderQuestionOptions() {
  if (!state.selectedSubjectData) return;

  const progress = getCurrentSubjectProgress();

  refs.questionSelect.innerHTML = state.selectedSubjectData.questions
    .map((question, index) => {
      const key      = questionKey(question);
      const answered = Boolean(progress.answers[key]);
      const label    = `${index + 1}${answered ? ' • respondida' : ''}`;
      return `<option value="${index}">${label}</option>`;
    })
    .join('');

  refs.questionSelect.value = String(state.currentIndex);
}

function renderProgress() {
  if (!state.selectedSubjectData) return;

  const total    = state.selectedSubjectData.questions.length;
  const progress = getCurrentSubjectProgress();
  const answers  = progress.answers || {};

  let acertos = 0;
  let erros   = 0;

  for (const question of state.selectedSubjectData.questions) {
    const record = answers[questionKey(question)];
    if (!record) continue;
    if (record.isCorrect) acertos += 1;
    else                  erros   += 1;
  }

  const respondedCount = Object.keys(answers).length;
  const percentage     = total ? Math.round((respondedCount / total) * 100) : 0;

  refs.progressBar.style.width = `${percentage}%`;
  refs.progressBar.parentElement.setAttribute('aria-valuenow', String(percentage));
  refs.progressText.textContent       = `${percentage}% concluído • ${respondedCount}/${total} respondidas`;
  refs.contadorQuestao.textContent    = `Questão ${state.currentIndex + 1} de ${total}`;
  refs.pontuacao.textContent          = `✅ ${acertos}  ❌ ${erros}`;
}

function renderAlternatives() {
  const question = currentQuestion();
  if (!question) { refs.alternativas.innerHTML = ''; return; }

  const answer         = getAnswerRecord(question);
  const selectedLetter = state.draftSelection || (answer ? answer.selected : null);
  const isAnswered     = Boolean(answer);

  refs.alternativas.innerHTML = question.alternatives
    .map((option) => {
      const isSelected = selectedLetter === option.letter;
      const isCorrect  = question.correct === option.letter;
      const classes    = ['alternativa'];

      if (isSelected)                                classes.push('selected');
      if (isAnswered && isCorrect)                   classes.push('correct');
      if (isAnswered && isSelected && !isCorrect)    classes.push('wrong');

      const disabled = isAnswered ? 'disabled' : '';

      return `
        <button
          type="button"
          class="${classes.join(' ')}"
          data-letter="${option.letter}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
          ${disabled}
        >
          <span class="alternativa-letra">${option.letter}</span>
          <span class="alternativa-texto">${option.text}</span>
        </button>
      `;
    })
    .join('');
}

function renderFeedback() {
  const question = currentQuestion();
  if (!question) {
    refs.feedbackBox.hidden = true;
    refs.feedbackBox.innerHTML = '';
    return;
  }

  const answer = getAnswerRecord(question);
  if (!answer) {
    refs.feedbackBox.hidden = true;
    refs.feedbackBox.innerHTML = '';
    return;
  }

  const isCorrect   = answer.isCorrect;
  const explanation = question.explanation || 'Nenhuma explicação foi adicionada no JSON desta matéria.';
  const fundamento  = question.fundamento  || '';

  const corretaLabel = question.correct
    ? `Resposta correta: Alternativa <strong>${question.correct}</strong>`
    : 'Resposta correta: não informada';

  refs.feedbackBox.classList.remove('acerto', 'erro');
  refs.feedbackBox.classList.add(isCorrect ? 'acerto' : 'erro');
  refs.feedbackBox.hidden = false;

  refs.feedbackBox.innerHTML = `
    <div class="feedback-titulo">
      <span class="feedback-icone">${isCorrect ? '✅' : '❌'}</span>
      <span>${isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}</span>
    </div>
    <div class="feedback-corpo">
      ${!isCorrect ? `<p class="feedback-resposta-correta">${corretaLabel}</p>` : ''}
      <p class="feedback-explicacao">${explanation}</p>
      ${fundamento ? `<div class="feedback-fundamento">📖 ${fundamento}</div>` : ''}
    </div>
  `;
}

function renderQuestion() {
  const question = currentQuestion();
  if (!question) {
    refs.questionText.textContent = 'Nenhuma questão disponível.';
    refs.alternativas.innerHTML   = '';
    refs.feedbackBox.hidden       = true;
    return;
  }

  updateHeader();
  refs.questionText.textContent = question.title;

  // Tema
  refs.questionTopic.textContent = question.topic || 'Tema não informado';

  // Dificuldade com classe de cor
  refs.questionDifficulty.textContent = question.difficulty || 'Sem nível';
  refs.questionDifficulty.className   = getDifficultyClass(question.difficulty);

  renderQuestionOptions();
  renderAlternatives();
  renderProgress();
  renderFeedback();
  updateNavButtons();
}

function updateNavButtons() {
  if (state.modoRevisao) {
    refs.btnVoltar.disabled  = state.indiceFiltro <= 0;
    refs.btnProxima.disabled = state.indiceFiltro >= state.questoesFiltradas.length - 1;
    refs.btnConfirmar.disabled = true;

    refs.questionSelect.disabled = true;
    refs.encerrarRevisaoBtn.hidden = false;
  } else {
    const total = state.selectedSubjectData?.questions.length || 0;
    refs.btnVoltar.disabled  = state.currentIndex <= 0;
    refs.btnProxima.disabled = state.currentIndex >= total - 1;

    // Esconder botão de confirmar se já respondeu
    const question = currentQuestion();
    const answered = question ? Boolean(getAnswerRecord(question)) : false;
    refs.btnConfirmar.disabled = answered || !state.draftSelection;

    refs.questionSelect.disabled = false;
    refs.encerrarRevisaoBtn.hidden = true;
  }
}

/* ============================================================
   TROCA DE QUESTÃO COM ANIMAÇÃO
   ============================================================ */
async function changeQuestion(index) {
  const total = state.selectedSubjectData?.questions.length || 0;
  if (!total) return;

  const newIndex = Math.max(0, Math.min(index, total - 1));
  if (newIndex === state.currentIndex) return;

  // Animação de saída
  refs.questionCard.classList.add('saindo');
  await new Promise((r) => setTimeout(r, 200));
  refs.questionCard.classList.remove('saindo');

  state.currentIndex = newIndex;
  setDraftFromCurrent();
  saveProgress();
  renderQuestion();

  // Animação de entrada
  refs.questionCard.classList.add('entrando');
  setTimeout(() => refs.questionCard.classList.remove('entrando'), 300);

  // Verificar conclusão ao chegar na última questão
  verificarConclusao();
}

/* ============================================================
   CONFIRMAR RESPOSTA
   ============================================================ */
function saveAnsweredQuestion() {
  const question = currentQuestion();
  if (!question) return;

  if (!state.draftSelection) {
    mostrarToast('Selecione uma alternativa antes de confirmar.', 'info');
    return;
  }

  // Se já respondeu, não fazer nada
  if (getAnswerRecord(question)) return;

  const progress       = loadProgress();
  const subjectProgress = progress.subjects[state.selectedSubjectId] || { answers: {}, currentIndex: 0 };
  subjectProgress.answers = subjectProgress.answers || {};
  subjectProgress.currentIndex = state.currentIndex;

  const isCorrect = state.draftSelection === question.correct;
  subjectProgress.answers[questionKey(question)] = {
    selected:   state.draftSelection,
    isCorrect,
    answeredAt: Date.now()
  };

  progress.subjects[state.selectedSubjectId] = subjectProgress;
  progress.currentSubject = state.selectedSubjectId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

  // Streak
  updateStreak(isCorrect);

  // Toast de feedback rápido
  if (isCorrect) {
    if (state.streak >= 5) mostrarToast(`🔥 ${state.streak} acertos seguidos! Incrível!`, 'sucesso');
    else if (state.streak >= 3) mostrarToast(`🔥 Sequência de ${state.streak}! Continue assim!`, 'sucesso');
  }

  renderQuestion();

  // Verificar conclusão após última questão respondida
  verificarConclusao();
}

/* ============================================================
   VERIFICAR CONCLUSÃO DA MATÉRIA
   ============================================================ */
function verificarConclusao() {
  if (!state.selectedSubjectData) return;
  if (state.modoRevisao) return;

  const total    = state.selectedSubjectData.questions.length;
  const progress = getCurrentSubjectProgress();
  const respondidas = Object.keys(progress.answers || {}).length;

  if (respondidas < total) return;

  // Calcular estatísticas
  let acertos = 0;
  let erros   = 0;
  for (const question of state.selectedSubjectData.questions) {
    const record = (progress.answers || {})[questionKey(question)];
    if (!record) continue;
    if (record.isCorrect) acertos++;
    else erros++;
  }

  mostrarResultado(total, acertos, erros);
}

function mostrarResultado(total, acertos, erros) {
  const percentual = Math.round((acertos / total) * 100);

  let icone   = '📊';
  let titulo  = 'Matéria Concluída!';
  let subtitulo = '';

  if (percentual >= 90) {
    icone    = '🏆';
    titulo   = 'Excelente! Parabéns!';
    subtitulo = `Você acertou ${percentual}% das questões. Performance excepcional!`;
  } else if (percentual >= 70) {
    icone    = '🎯';
    titulo   = 'Muito Bom!';
    subtitulo = `Você acertou ${percentual}% das questões. Continue estudando!`;
  } else if (percentual >= 50) {
    icone    = '📖';
    titulo   = 'Continue Estudando!';
    subtitulo = `Você acertou ${percentual}% das questões. Revise os conteúdos.`;
  } else {
    icone    = '💪';
    titulo   = 'Não Desista!';
    subtitulo = `Você acertou ${percentual}% das questões. Revise e tente novamente!`;
  }

  refs.resultadoIcone.textContent    = icone;
  refs.resultadoTitulo.textContent   = titulo;
  refs.resultadoSubtitulo.textContent = subtitulo;
  refs.statTotal.textContent         = String(total);
  refs.statAcertos.textContent       = String(acertos);
  refs.statErros.textContent         = String(erros);

  refs.telaQuiz.hidden      = true;
  refs.telaResultado.hidden = false;
}

/* ============================================================
   REINICIAR PROGRESSO
   ============================================================ */
async function resetSubjectProgress() {
  const confirmed = await mostrarModal(
    'Reiniciar Matéria?',
    'Isso apagará todas as respostas salvas para esta matéria. A ação não pode ser desfeita.',
    '🗑️'
  );

  if (!confirmed) return;

  const progress = loadProgress();
  progress.subjects[state.selectedSubjectId] = { answers: {}, currentIndex: 0 };
  progress.currentSubject = state.selectedSubjectId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

  state.currentIndex    = 0;
  state.draftSelection  = null;
  state.streak          = 0;
  state.modoRevisao     = false;
  renderStreak();

  refs.telaResultado.hidden = true;
  refs.telaQuiz.hidden      = false;

  renderQuestion();
  mostrarToast('Progresso reiniciado com sucesso.', 'info');
}

/* ============================================================
   CARREGAMENTO DE MATÉRIAS
   ============================================================ */
function listStaticSubjects() {
  return STATIC_SUBJECTS.map((fileName) => ({
    id:       slugify(fileName.replace(/\.json$/i, '')),
    fileName,
    title:    fileName.replace(/\.json$/i, '').replace(/-/g, ' '),
    subtitle: 'Questões de estudo'
  }));
}

function buildStaticSubjectUrl(fileName) {
  return new URL(`./json/${encodeURIComponent(fileName)}`, window.location.href).toString();
}

async function fetchJsonWithFallback(url, fallbackUrl) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Resposta inválida: ${response.status}`);
    return { response, payload: await response.json() };
  } catch (error) {
    if (!fallbackUrl) throw error;

    const fallbackResponse = await fetch(fallbackUrl, { cache: 'no-store' });
    if (!fallbackResponse.ok) throw error;

    return { response: fallbackResponse, payload: await fallbackResponse.json() };
  }
}

async function loadSubject(subjectId) {
  const subject = state.subjects.find((item) => item.id === subjectId);
  if (!subject) return;

  state.selectedSubjectId = subjectId;
  state.modoRevisao       = false;

  // Ocultar qualquer aviso de erro anterior imediatamente
  refs.avisoErro.hidden       = true;
  refs.mensagemErro.textContent = '';
  refs.telaCarregando.hidden  = false;
  refs.telaQuiz.hidden        = true;
  refs.telaResultado.hidden   = true;

  try {
    const subjectUrl = `/api/materias/${encodeURIComponent(subject.id)}`;
    const staticUrl  = buildStaticSubjectUrl(subject.fileName);
    const { payload } = await fetchJsonWithFallback(subjectUrl, staticUrl);

    state.selectedSubjectData = normalizeSubject(payload, subject.fileName);

    const progress = getCurrentSubjectProgress();
    state.currentIndex = Number.isInteger(progress.currentIndex) ? progress.currentIndex : 0;

    if (state.currentIndex >= state.selectedSubjectData.questions.length) {
      state.currentIndex = 0;
    }

    setDraftFromCurrent();
    // Garantir que qualquer banner de erro seja ocultado ao carregar com sucesso
    refs.avisoErro.hidden       = true;
    refs.mensagemErro.textContent = '';
    refs.telaCarregando.hidden  = true;
    refs.telaQuiz.hidden        = false;
    renderQuestion();
    saveProgress();
  } catch (error) {
    console.error(error);
    refs.avisoErro.hidden      = false;
    refs.mensagemErro.textContent = error.message;
    refs.telaCarregando.hidden = true;
    refs.telaQuiz.hidden       = true;
  }
}

async function loadSubjects() {
  // Ocultar aviso de erro ao iniciar
  refs.avisoErro.hidden = true;
  refs.mensagemErro.textContent = '';

  try {
    const subjectUrl     = '/api/materias';
    const staticSubjects = listStaticSubjects();

    let subjects;
    try {
      // Tentar API do servidor, silenciosamente fallback para JSON estático
      const { payload } = await fetchJsonWithFallback(subjectUrl, './json/materias.json');
      subjects = Array.isArray(payload) && payload.length ? payload : staticSubjects;
    } catch {
      // Se ambas as tentativas falharam, usar lista estática embutida
      subjects = listStaticSubjects();
    }

    if (!Array.isArray(subjects) || !subjects.length) {
      throw new Error('Nenhuma matéria foi encontrada.');
    }

    state.subjects = subjects;
    const progress  = loadProgress();
    const fallbackId = subjects[0].id;
    state.selectedSubjectId = progress.currentSubject && subjects.some((s) => s.id === progress.currentSubject)
      ? progress.currentSubject
      : fallbackId;

    renderSubjectOptions();
    await loadSubject(state.selectedSubjectId);
  } catch (error) {
    console.error('Erro crítico ao carregar matérias:', error);
    refs.avisoErro.hidden       = false;
    refs.mensagemErro.textContent = error.message;
    refs.telaCarregando.hidden  = true;
    refs.telaQuiz.hidden        = true;
  }
}

/* ============================================================
   TEMA (Modo Claro/Escuro)
   ============================================================ */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  state.darkMode = isDark;
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  refs.btnTema.textContent = isDark ? '☀️' : '🌓';
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

// Tema
refs.btnTema.addEventListener('click', () => {
  applyTheme(state.darkMode ? 'light' : 'dark');
});

// Seleção de matéria
refs.subjectSelect.addEventListener('change', (event) => {
  loadSubject(event.target.value);
});

// Seleção de questão
refs.questionSelect.addEventListener('change', (event) => {
  changeQuestion(Number(event.target.value));
});

// Reiniciar (toolbar)
refs.reiniciarBtn.addEventListener('click', resetSubjectProgress);

// Modo Foco
function updateFocoZoom() {
  if (!document.body.classList.contains('modo-foco-ativo')) {
    if (refs.focoZoomContainer) refs.focoZoomContainer.style.transform = 'none';
    return;
  }
  
  if (!refs.focoZoomContainer) return;
  
  const isMobile = window.innerWidth <= 900;
  const baseWidth = isMobile ? 400 : 1200;
  const baseHeight = 800;
  
  const paddingX = isMobile ? 20 : 40;
  const paddingY = isMobile ? 20 : 40;
  
  const scaleX = (window.innerWidth - paddingX) / baseWidth;
  const scaleY = (window.innerHeight - paddingY) / baseHeight;
  
  const scale = Math.min(scaleX, scaleY, 1.2);
  
  refs.focoZoomContainer.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', updateFocoZoom);

refs.btnModoFoco.addEventListener('click', () => {
  document.body.classList.add('modo-foco-ativo');
  updateFocoZoom();
});

refs.btnSairFoco.addEventListener('click', () => {
  document.body.classList.remove('modo-foco-ativo');
  updateFocoZoom();
});

// Clicar em alternativa
refs.alternativas.addEventListener('click', (event) => {
  const button = event.target.closest('.alternativa');
  if (!button || button.disabled) return;

  state.draftSelection = button.dataset.letter || null;
  renderAlternatives();
  updateNavButtons();
});

// Confirmar resposta
refs.btnConfirmar.addEventListener('click', saveAnsweredQuestion);

// Voltar
refs.btnVoltar.addEventListener('click', () => {
  if (state.modoRevisao) {
    if (state.indiceFiltro > 0) {
      state.indiceFiltro--;
      changeQuestion(state.questoesFiltradas[state.indiceFiltro]);
    }
  } else {
    if (state.currentIndex > 0) changeQuestion(state.currentIndex - 1);
  }
});

// Próxima
refs.btnProxima.addEventListener('click', () => {
  if (state.modoRevisao) {
    if (state.indiceFiltro < state.questoesFiltradas.length - 1) {
      state.indiceFiltro++;
      changeQuestion(state.questoesFiltradas[state.indiceFiltro]);
    }
  } else {
    const total = state.selectedSubjectData?.questions.length || 1;
    if (state.currentIndex < total - 1) changeQuestion(state.currentIndex + 1);
  }
});

// Iniciar Revisão
function iniciarRevisao(filtro) {
  state.modoRevisao = true;
  state.filtroRevisao = filtro;
  state.questoesFiltradas = [];

  const progress = getCurrentSubjectProgress();
  const answers = progress.answers || {};

  state.selectedSubjectData.questions.forEach((question, index) => {
    const key = questionKey(question);
    const answer = answers[key];
    if (!answer) return;

    if (filtro === 'todas') {
      state.questoesFiltradas.push(index);
    } else if (filtro === 'erros') {
      if (!answer.isCorrect) {
        state.questoesFiltradas.push(index);
      }
    }
  });

  if (state.questoesFiltradas.length === 0) {
    mostrarToast('Nenhuma questão encontrada para este filtro.', 'info');
    return;
  }

  state.indiceFiltro = 0;
  state.currentIndex = state.questoesFiltradas[0];
  setDraftFromCurrent();
  
  refs.telaResultado.hidden = true;
  refs.telaQuiz.hidden      = false;
  renderQuestion();
}

refs.btnRevisarTodas.addEventListener('click', () => iniciarRevisao('todas'));

refs.btnRevisarErros.addEventListener('click', () => {
  const progress = getCurrentSubjectProgress();
  const answers = progress.answers || {};
  const temErros = Object.values(answers).some(a => !a.isCorrect);
  
  if (!temErros) {
    mostrarToast('Você não cometeu nenhum erro nesta matéria!', 'sucesso');
    return;
  }
  iniciarRevisao('erros');
});

refs.encerrarRevisaoBtn.addEventListener('click', () => {
  state.modoRevisao = false;
  refs.encerrarRevisaoBtn.hidden = true;
  refs.questionSelect.disabled = false;
  verificarConclusao(); // Retorna à tela de conclusão se todas foram respondidas
});

refs.btnReiniciarResultado.addEventListener('click', resetSubjectProgress);

// Fechar modal ao clicar no overlay
refs.modalOverlay.addEventListener('click', (event) => {
  if (event.target === refs.modalOverlay) {
    refs.modalOverlay.classList.add('hidden');
  }
});

/* ============================================================
   NAVEGAÇÃO POR TECLADO
   ============================================================ */
document.addEventListener('keydown', (event) => {
  // Ignorar se o foco estiver em um input/select/textarea
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

  // Ignorar se o modal estiver aberto
  if (!refs.modalOverlay.classList.contains('hidden')) return;

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      if (state.modoRevisao) {
        if (state.indiceFiltro > 0) {
          state.indiceFiltro--;
          changeQuestion(state.questoesFiltradas[state.indiceFiltro]);
        }
      } else {
        if (state.currentIndex > 0) changeQuestion(state.currentIndex - 1);
      }
      break;

    case 'ArrowRight':
      event.preventDefault();
      if (state.modoRevisao) {
        if (state.indiceFiltro < state.questoesFiltradas.length - 1) {
          state.indiceFiltro++;
          changeQuestion(state.questoesFiltradas[state.indiceFiltro]);
        }
      } else {
        const total = state.selectedSubjectData?.questions.length || 1;
        if (state.currentIndex < total - 1) changeQuestion(state.currentIndex + 1);
      }
      break;

    case 'Enter':
      if (!refs.telaQuiz.hidden && !refs.btnConfirmar.disabled) {
        event.preventDefault();
        saveAnsweredQuestion();
      }
      break;

    // Teclas A-E para selecionar alternativas
    case 'a': case 'A': selecionarAlternativaPorTecla('A'); break;
    case 'b': case 'B': selecionarAlternativaPorTecla('B'); break;
    case 'c': case 'C': selecionarAlternativaPorTecla('C'); break;
    case 'd': case 'D': selecionarAlternativaPorTecla('D'); break;
    case 'e': case 'E': selecionarAlternativaPorTecla('E'); break;
  }
});

function selecionarAlternativaPorTecla(letra) {
  if (refs.telaQuiz.hidden) return;

  const question = currentQuestion();
  if (!question || getAnswerRecord(question)) return;

  const alternativa = question.alternatives.find((a) => a.letter === letra);
  if (!alternativa) return;

  state.draftSelection = letra;
  renderAlternatives();
  updateNavButtons();
}

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
applyTheme(state.darkMode ? 'dark' : 'light');
loadSubjects();
