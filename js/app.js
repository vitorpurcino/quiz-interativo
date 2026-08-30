/* ============================================================
   QUIZ INTERATIVO — CFSBM 2026
   app.js — Lógica principal com melhorias de UX e Filtros Dinâmicos
   ============================================================ */

const STORAGE_KEY = 'quiz_interativo_progress_v1';
const THEME_KEY   = 'quiz_interativo_theme';

const STATIC_SUBJECTS = (window.STATIC_SUBJECTS && Array.isArray(window.STATIC_SUBJECTS) && window.STATIC_SUBJECTS.length)
  ? window.STATIC_SUBJECTS
  : [
      'combateaincendio.json',
      'comandoelideranca.json',
      'correspondencias.json',
      'direitopenalmilitar.json',
      'fundamentojuridicos.json',
      'licitacoes.json',
      'segurancaincedio.json'
    ];

const API_BASE = (window.API_BASE || '').replace(/\/+$/, '');

function apiUrl(path) {
  if (!API_BASE) return path;
  return API_BASE + (path.startsWith('/') ? path : '/' + path);
}

/* ============================================================
   ESTADO DA APLICAÇÃO
   ============================================================ */
const state = {
  subjects:            [],
  selectedSubjectId:   '',
  selectedSubjectData: null,
  activeQuestions:     [],       // Questões ativas resultantes dos filtros dinâmicos
  currentIndex:        0,        // Índice atual dentro de activeQuestions
  draftSelection:      null,
  darkMode:            localStorage.getItem(THEME_KEY) === 'dark',
  streak:              0,
  modoRevisao:         false,
  filtroRevisao:       'todas',
  questoesFiltradas:   [],       // Índices originais usados pelo modo revisão
  indiceFiltro:        0,        // Posição no array do modo revisão
  filtros: {
    busca: '',
    tema: '',
    dificuldade: ''
  }
};

/* ============================================================
   REFERÊNCIAS AO DOM
   ============================================================ */
const refs = {
  titulo:             document.getElementById('titulo'),
  subtitulo:          document.getElementById('subtitulo'),
  btnTema:            document.getElementById('btnTema'),
  btnLogout:          document.getElementById('btnLogout'),
  avisoErro:          document.getElementById('avisoErro'),
  mensagemErro:       document.getElementById('mensagemErro'),
  telaCarregando:     document.getElementById('telaCarregando'),
  telaQuiz:           document.getElementById('telaQuiz'),
  painelFiltros:      document.getElementById('painelFiltros'),
  filtroBusca:        document.getElementById('filtroBusca'),
  filtroTema:         document.getElementById('filtroTema'),
  filtroDificuldade:  document.getElementById('filtroDificuldade'),
  filtroContador:     document.getElementById('filtroContador'),
  btnLimparFiltros:   document.getElementById('btnLimparFiltros'),
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
  encerrarRevisaoBtn: document.getElementById('encerrarRevisaoBtn')
};

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function mostrarToast(mensagem, tipo = 'info', duracao = 3500) {
  const icones = { sucesso: 'check', erro: 'x', info: 'listChecks' };
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.setAttribute('role', 'status');

  const iconeEl = document.createElement('span');
  iconeEl.className = 'toast-icone';
  iconeEl.innerHTML = window.Icon(icones[tipo] || icones.info);

  const textoEl = document.createElement('span');
  textoEl.textContent = String(mensagem);

  toast.appendChild(iconeEl);
  toast.appendChild(textoEl);

  refs.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('saindo');
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}

/* ============================================================
   MODAL DE CONFIRMAÇÃO CUSTOMIZADO
   ============================================================ */
function mostrarModal(titulo, texto, icone = 'warning') {
  return new Promise((resolve) => {
    refs.modalIcone.innerHTML = window.Icon(icone) || '';
    refs.modalTitulo.textContent = titulo;
    refs.modalTexto.textContent = texto;
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
   INJEÇÃO DE ÍCONES SVG (substituição de emojis)
   ============================================================ */
function injetarIcones() {
  const map = {
    btnDashboard: 'chart',
    btnLogout: 'power',
    btnTema: 'moon',
    btnModoFoco: 'target',
    btnSairFoco: 'x',
    reiniciarBtn: 'refresh',
    encerrarRevisaoBtn: 'x',
    btnLimparFiltros: 'x',
    iconeBusca: 'search',
    filtrosTitulo: 'zap',
    streakBadgeIcon: 'flame'
  };

  document.querySelectorAll('[data-icone]').forEach((el) => {
    const nome = el.getAttribute('data-icone');
    if (nome && window.Icon(nome)) el.innerHTML = window.Icon(nome);
  });

  const setIcon = (id, name) => {
    const el = document.getElementById(id);
    if (!el || !window.Icon(name)) return;
    const slot = el.querySelector('.btn-icone') || el;
    slot.innerHTML = window.Icon(name);
  };

  setIcon('btnDashboard', 'chart');
  setIcon('btnLogout', 'power');
  setIcon('btnModoFoco', 'target');
  setIcon('reiniciarBtn', 'refresh');
  setIcon('encerrarRevisaoBtn', 'x');
  setIcon('btnLimparFiltros', 'x');
  setIcon('iconeBusca', 'search');

  const filtrosTitulo = document.querySelector('.filtros-titulo');
  if (filtrosTitulo) {
    const icone = document.createElement('span');
    icone.className = 'btn-icone';
    icone.setAttribute('aria-hidden', 'true');
    icone.innerHTML = window.Icon('zap');
    filtrosTitulo.prepend(icone);
  }

  const streakBadge = document.getElementById('streakBadge');
  if (streakBadge) {
    const icone = document.createElement('span');
    icone.className = 'streak-icone';
    icone.setAttribute('aria-hidden', 'true');
    icone.innerHTML = window.Icon('flame');
    streakBadge.prepend(icone);
  }

  const applyThemeBtn = (isDark) => {
    const el = document.getElementById('btnTema');
    if (el) el.innerHTML = isDark ? window.Icon('sun') : window.Icon('moon');
  };
  applyThemeBtn(document.documentElement.classList.contains('dark'));

  // Sobrescreve o handler de tema
  const btnTema = document.getElementById('btnTema');
  if (btnTema) {
    btnTema.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyThemeBtn(isDark);
    });
  }
}
injetarIcones();

/* ============================================================
   UTILITÁRIOS DE LIMPEZA E NORMALIZAÇÃO DE DADOS
   ============================================================ */
function cleanObjectKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanObjectKeys);
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    const cleanKey = key.trim();
    cleaned[cleanKey] = typeof val === 'string' ? val.trim() : cleanObjectKeys(val);
  }
  return cleaned;
}

function normalizeQuestion(rawQuestion, index) {
  const question = cleanObjectKeys(rawQuestion) || {};
  const alternatives = Array.isArray(question.alternativas) ? question.alternativas : [];
  const normalizedAlternatives = alternatives
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      letter: String(item.letra || '').trim().toUpperCase(),
      text:   String(item.texto || item.text || '').trim()
    }))
    .filter((item) => item.letter && item.text);

  const statement = String(question.pergunta || question.enunciado || 'Pergunta sem enunciado').trim();
  const chapterTitle = String(question.titulo || '').trim();

  return {
    id:           question.id ?? index + 1,
    chapterTitle,
    title:        statement,
    statement,
    topic:        String(question.tema || 'Tema não informado').trim(),
    difficulty:   String(question.dificuldade || 'Sem nível').trim(),
    correct:      String(question.correta || question.respostaCorreta || '').trim().toUpperCase(),
    explanation:  String(question.explicacao || question.comentario || '').trim(),
    fundamento:   String(question.fundamento || '').trim(),
    alternatives: normalizedAlternatives
  };
}

function normalizeSubject(rawPayload, fileName) {
  const payload = cleanObjectKeys(rawPayload) || {};
  const info    = payload.informacoes || payload.config || {};
  const rawQuestions = Array.isArray(payload.questoes) ? payload.questoes : [];
  const questions = rawQuestions.map((question, index) => normalizeQuestion(question, index));

  const title = String(info.titulo || info.materia || payload.titulo || fileName.replace(/\.json$/i, '')).trim();
  const subtitle = String(info.descricao || info.subtitulo || payload.subtitulo || 'Questões de estudo').trim();

  return {
    id:       slugify(fileName.replace(/\.json$/i, '')),
    title,
    subtitle,
    materia:  String(info.materia || '').trim(),
    fonte:    String(info.fonte || '').trim(),
    curso:    String(info.curso || '').trim(),
    turma:    String(info.turma || '').trim(),
    ano:      info.ano || null,
    descricao: String(info.descricao || '').trim(),
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

function normalizeSearchText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  
  // Salvar índice original da questão se possível
  const q = currentQuestion();
  if (q && state.selectedSubjectData) {
    const origIndex = state.selectedSubjectData.questions.findIndex(item => item.id === q.id);
    current.currentIndex = origIndex >= 0 ? origIndex : 0;
  }
  
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
   HELPERS DE QUESTÃO E FILTROS DINÂMICOS
   ============================================================ */
function currentQuestion() {
  if (!state.selectedSubjectData || !state.selectedSubjectData.questions.length) return null;
  if (state.modoRevisao) {
    const origIndex = state.questoesFiltradas[state.indiceFiltro];
    return state.selectedSubjectData.questions[origIndex] || null;
  }
  if (!state.activeQuestions || !state.activeQuestions.length) return null;
  return state.activeQuestions[state.currentIndex] || null;
}

function questionKey(question) {
  if (!question) return '';
  return String(question.id ?? 1);
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

function populateThemeFilter() {
  if (!refs.filtroTema) return;
  const currentVal = state.filtros.tema;
  const questions = state.selectedSubjectData?.questions || [];
  const themesSet = new Set();

  questions.forEach((q) => {
    if (q.topic && q.topic !== 'Tema não informado') {
      themesSet.add(q.topic);
    }
  });

  const sortedThemes = Array.from(themesSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  refs.filtroTema.innerHTML = '<option value="">Todos os Temas</option>' +
    sortedThemes.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');

  if (themesSet.has(currentVal)) {
    refs.filtroTema.value = currentVal;
  } else {
    state.filtros.tema = '';
    refs.filtroTema.value = '';
  }
}

function applyFilters(preserveCurrent = true) {
  if (!state.selectedSubjectData) {
    state.activeQuestions = [];
    return;
  }

  const allQuestions = state.selectedSubjectData.questions;
  const buscaTerm = normalizeSearchText(state.filtros.busca);
  const temaTerm = state.filtros.tema;
  const difTerm = normalizeSearchText(state.filtros.dificuldade);

  const prevQuestionId = state.activeQuestions[state.currentIndex]?.id;

  state.activeQuestions = allQuestions.filter((q) => {
    // 1. Filtro por Busca (Título / Capítulo / Enunciado / Tema / Fundamento)
    if (buscaTerm) {
      const matchTitle = normalizeSearchText(q.chapterTitle).includes(buscaTerm);
      const matchStatement = normalizeSearchText(q.statement).includes(buscaTerm);
      const matchTopic = normalizeSearchText(q.topic).includes(buscaTerm);
      const matchFundamento = normalizeSearchText(q.fundamento).includes(buscaTerm);
      const matchExplanation = normalizeSearchText(q.explanation).includes(buscaTerm);
      if (!matchTitle && !matchStatement && !matchTopic && !matchFundamento && !matchExplanation) {
        return false;
      }
    }

    // 2. Filtro por Tema
    if (temaTerm && q.topic !== temaTerm) {
      return false;
    }

    // 3. Filtro por Dificuldade
    if (difTerm) {
      const qDif = normalizeSearchText(q.difficulty);
      if (difTerm === 'facil' && !qDif.includes('facil') && !qDif.includes('easy') && !qDif.includes('baixo')) return false;
      if (difTerm === 'medio' && !qDif.includes('medio') && !qDif.includes('media') && !qDif.includes('medium')) return false;
      if (difTerm === 'dificil' && !qDif.includes('dificil') && !qDif.includes('hard') && !qDif.includes('alto')) return false;
    }

    return true;
  });

  // Atualizar contador e botão limpar
  const isFiltering = Boolean(buscaTerm || temaTerm || difTerm);
  if (refs.btnLimparFiltros) {
    refs.btnLimparFiltros.hidden = !isFiltering;
  }

  if (refs.filtroContador) {
    if (isFiltering) {
      refs.filtroContador.textContent = `Exibindo ${state.activeQuestions.length} de ${allQuestions.length} questões`;
      refs.filtroContador.style.background = 'rgba(var(--primario-rgb), 0.15)';
      refs.filtroContador.style.borderColor = 'var(--primario)';
    } else {
      refs.filtroContador.textContent = `Total: ${allQuestions.length} questões`;
      refs.filtroContador.style.background = 'rgba(var(--primario-rgb), 0.1)';
      refs.filtroContador.style.borderColor = 'rgba(var(--primario-rgb), 0.2)';
    }
  }

  // Ajustar currentIndex
  if (preserveCurrent && prevQuestionId !== undefined) {
    const newIdx = state.activeQuestions.findIndex((q) => q.id === prevQuestionId);
    state.currentIndex = newIdx >= 0 ? newIdx : 0;
  } else {
    state.currentIndex = 0;
  }

  setDraftFromCurrent();
}

window.limparTodosFiltros = function() {
  state.filtros = { busca: '', tema: '', dificuldade: '' };
  if (refs.filtroBusca) refs.filtroBusca.value = '';
  if (refs.filtroTema) refs.filtroTema.value = '';
  if (refs.filtroDificuldade) refs.filtroDificuldade.value = '';
  applyFilters(false);
  renderQuestion();
  mostrarToast('Filtros limpos.', 'info', 2000);
};

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
    refs.streakBadge.title = `${state.streak} acertos consecutivos!`;
  }
}

/* ============================================================
   DIFICULDADE — CLASSE CSS
   ============================================================ */
function getDifficultyClass(difficulty) {
  const d = String(difficulty).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (d.includes('facil') || d.includes('easy') || d.includes('baixo')) return 'dificil-facil';
  if (d.includes('medio') || d.includes('media') || d.includes('medium'))  return 'dificil-medio';
  if (d.includes('dificil') || d.includes('hard') || d.includes('alto'))   return 'dificil-dificil';
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

  if (state.modoRevisao) {
    refs.questionSelect.innerHTML = state.questoesFiltradas
      .map((qIdx, idx) => {
        const question = state.selectedSubjectData.questions[qIdx];
        const key = questionKey(question);
        const answered = Boolean(progress.answers[key]);
        const chapterPrefix = question.chapterTitle ? `[${question.chapterTitle}] ` : '';
        const label = `Revisão ${idx + 1}: Q${question.id} ${chapterPrefix}• ${answered ? 'respondida' : ''}`;
        return `<option value="${idx}">${label}</option>`;
      })
      .join('');
    refs.questionSelect.value = String(state.indiceFiltro);
    return;
  }

  const questionsToRender = state.activeQuestions || [];
  if (!questionsToRender.length) {
    refs.questionSelect.innerHTML = '<option value="-1">Nenhuma questão encontrada</option>';
    refs.questionSelect.value = '-1';
    return;
  }

  refs.questionSelect.innerHTML = questionsToRender
    .map((question, index) => {
      const key      = questionKey(question);
      const answered = Boolean(progress.answers[key]);
      const chapterPrefix = question.chapterTitle ? `[${question.chapterTitle}] ` : '';
      const label    = `Questão ${question.id} ${chapterPrefix}${answered ? ' • respondida' : ''}`;
      return `<option value="${index}">${label}</option>`;
    })
    .join('');

  refs.questionSelect.value = String(state.currentIndex);
}

function renderProgress() {
  if (!state.selectedSubjectData) return;

  const totalAll   = state.selectedSubjectData.questions.length;
  const progress   = getCurrentSubjectProgress();
  const answers    = progress.answers || {};

  let acertos = 0;
  let erros   = 0;

  for (const question of state.selectedSubjectData.questions) {
    const record = answers[questionKey(question)];
    if (!record) continue;
    if (record.isCorrect) acertos += 1;
    else                  erros   += 1;
  }

  const respondedCount = Object.keys(answers).length;
  const percentage     = totalAll ? Math.round((respondedCount / totalAll) * 100) : 0;

  refs.progressBar.style.width = `${percentage}%`;
  refs.progressBar.parentElement.setAttribute('aria-valuenow', String(percentage));
  refs.progressText.textContent       = `${percentage}% concluído • ${respondedCount}/${totalAll} respondidas`;

  if (state.modoRevisao) {
    refs.contadorQuestao.textContent = `Revisão ${state.indiceFiltro + 1} de ${state.questoesFiltradas.length}`;
  } else if (state.activeQuestions.length !== totalAll) {
    refs.contadorQuestao.textContent = state.activeQuestions.length > 0
      ? `Questão ${state.currentIndex + 1} de ${state.activeQuestions.length} (filtradas de ${totalAll})`
      : `0 questões encontradas (de ${totalAll})`;
  } else {
    refs.contadorQuestao.textContent = `Questão ${state.currentIndex + 1} de ${totalAll}`;
  }

  refs.pontuacao.textContent          = `✅ ${acertos}  ❌ ${erros}`;
}

function renderAlternatives() {
  const question = currentQuestion();
  if (!question) { refs.alternativas.innerHTML = ''; return; }

  const answer         = getAnswerRecord(question);
  const selectedLetter = state.draftSelection || (answer ? answer.selected : null);
  const isAnswered     = Boolean(answer);

  while (refs.alternativas.firstChild) refs.alternativas.removeChild(refs.alternativas.firstChild);

  for (const option of question.alternatives) {
    const isSelected = selectedLetter === option.letter;
    const isCorrect  = question.correct === option.letter;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'alternativa';
    btn.dataset.letter = option.letter;
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    if (isSelected) btn.classList.add('selected');
    if (isAnswered && isCorrect) btn.classList.add('correct');
    if (isAnswered && isSelected && !isCorrect) btn.classList.add('wrong');
    if (isAnswered) btn.disabled = true;

    const letraEl = document.createElement('span');
    letraEl.className = 'alternativa-letra';
    letraEl.textContent = option.letter;
    btn.appendChild(letraEl);

    const textoEl = document.createElement('span');
    textoEl.className = 'alternativa-texto';
    textoEl.textContent = option.text;
    btn.appendChild(textoEl);

    refs.alternativas.appendChild(btn);
  }
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
    refs.feedbackBox.classList.remove('acerto', 'erro');
    refs.feedbackBox.hidden = true;
    refs.feedbackBox.innerHTML = '';
    return;
  }

  const isCorrect   = answer.isCorrect;
  const explanation = question.explanation || 'Nenhuma explicação foi adicionada no JSON desta matéria.';
  const fundamento  = question.fundamento  || '';

  refs.feedbackBox.classList.remove('acerto', 'erro');
  refs.feedbackBox.classList.add(isCorrect ? 'acerto' : 'erro');
  refs.feedbackBox.hidden = false;

  while (refs.feedbackBox.firstChild) refs.feedbackBox.removeChild(refs.feedbackBox.firstChild);

  const tituloEl = document.createElement('div');
  tituloEl.className = 'feedback-titulo';
  const iconeEl = document.createElement('span');
  iconeEl.className = 'feedback-icone';
  iconeEl.innerHTML = isCorrect ? window.Icon('check') : window.Icon('x');
  const tituloTexto = document.createElement('span');
  tituloTexto.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta';
  tituloEl.appendChild(iconeEl);
  tituloEl.appendChild(tituloTexto);

  const corpoEl = document.createElement('div');
  corpoEl.className = 'feedback-corpo';
  const explicacaoEl = document.createElement('div');
  explicacaoEl.className = 'feedback-explicacao';
  explicacaoEl.textContent = explanation;
  corpoEl.appendChild(explicacaoEl);

  if (fundamento) {
    const fundEl = document.createElement('div');
    fundEl.className = 'feedback-fundamento';
    const bookIcon = document.createElement('span');
    bookIcon.className = 'feedback-fundamento-icone';
    bookIcon.innerHTML = window.Icon('book');
    const fundText = document.createElement('span');
    fundText.textContent = ' ' + fundamento;
    fundEl.appendChild(bookIcon);
    fundEl.appendChild(fundText);
    corpoEl.appendChild(fundEl);
  }

  refs.feedbackBox.appendChild(tituloEl);
  refs.feedbackBox.appendChild(corpoEl);
}

function renderQuestion() {
  const question = currentQuestion();
  if (!question) {
    const hasFilter = Boolean(state.filtros.busca || state.filtros.tema || state.filtros.dificuldade);
    refs.questionText.textContent = hasFilter
      ? 'Nenhuma questão encontrada para os filtros selecionados.'
      : 'Nenhuma questão disponível.';
    refs.questionTopic.textContent = 'Filtro ativo';
    refs.questionDifficulty.textContent = '-';
    refs.questionDifficulty.className = 'dificil-default';
    refs.alternativas.innerHTML   = '';
    if (hasFilter) {
      const vazio = document.createElement('div');
      vazio.className = 'alternativas-vazio';
      const p = document.createElement('p');
      p.textContent = 'Tente alterar os termos de busca ou limpar os filtros para visualizar as questões.';
      vazio.appendChild(p);
      const btnLimpar = document.createElement('button');
      btnLimpar.type = 'button';
      btnLimpar.className = 'btn-primario btn-com-icone';
      btnLimpar.addEventListener('click', () => window.limparTodosFiltros());
      const btnIcone = document.createElement('span');
      btnIcone.className = 'btn-icone';
      btnIcone.innerHTML = window.Icon('refresh');
      btnLimpar.appendChild(btnIcone);
      btnLimpar.appendChild(document.createTextNode('Limpar Filtros'));
      vazio.appendChild(btnLimpar);
      refs.alternativas.appendChild(vazio);
    }
    refs.feedbackBox.hidden       = true;
    renderQuestionOptions();
    renderProgress();
    updateNavButtons();
    return;
  }

  updateHeader();
  refs.questionText.textContent = question.statement || question.title;

  // Tema
  const topicLabel = question.chapterTitle
    ? `${question.chapterTitle} • ${question.topic}`
    : (question.topic || 'Tema não informado');
  refs.questionTopic.textContent = topicLabel;

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
    if (refs.encerrarRevisaoBtn) refs.encerrarRevisaoBtn.hidden = false;
    if (refs.painelFiltros) {
      refs.painelFiltros.style.opacity = '0.5';
      refs.painelFiltros.style.pointerEvents = 'none';
    }
  } else {
    if (refs.painelFiltros) {
      refs.painelFiltros.style.opacity = '1';
      refs.painelFiltros.style.pointerEvents = 'auto';
    }

    const total = state.activeQuestions.length;
    refs.btnVoltar.disabled  = state.currentIndex <= 0;
    refs.btnProxima.disabled = total === 0 || state.currentIndex >= total - 1;

    const question = currentQuestion();
    const answered = question ? Boolean(getAnswerRecord(question)) : false;
    refs.btnConfirmar.disabled = !question || answered || !state.draftSelection;

    refs.questionSelect.disabled = total === 0;
    if (refs.encerrarRevisaoBtn) refs.encerrarRevisaoBtn.hidden = true;
  }
}

/* ============================================================
   TROCA DE QUESTÃO COM ANIMAÇÃO
   ============================================================ */
async function changeQuestion(index) {
  const total = state.activeQuestions.length;
  if (!total) return;

  const newIndex = Math.max(0, Math.min(index, total - 1));
  if (newIndex === state.currentIndex && refs.questionText.textContent !== 'Carregando…') return;

  // Animação de saída
  refs.questionCard.classList.add('saindo');
  await new Promise((r) => setTimeout(r, 150));
  refs.questionCard.classList.remove('saindo');

  state.currentIndex = newIndex;
  setDraftFromCurrent();
  saveProgress();
  renderQuestion();

  // Animação de entrada
  refs.questionCard.classList.add('entrando');
  setTimeout(() => refs.questionCard.classList.remove('entrando'), 250);

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
    if (state.streak >= 5) mostrarToast(`${state.streak} acertos seguidos! Incrível!`, 'sucesso');
    else if (state.streak >= 3) mostrarToast(`Sequência de ${state.streak}! Continue assim!`, 'sucesso');
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
  saveProgress();
  window.location.href = './pages/finalAnalysisQuiz.html';
}

window.voltarParaQuestao = function(index) {
  changeQuestion(index);
  refs.telaQuiz.hidden = false;
};

/* ============================================================
   REINICIAR PROGRESSO
   ============================================================ */
async function resetSubjectProgress() {
  const confirmed = await mostrarModal(
    'Reiniciar Matéria?',
    'Isso apagará todas as respostas salvas para esta matéria. A ação não pode ser desfeita.',
    'trash'
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

  refs.telaQuiz.hidden  = false;

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

  // Resetar filtros ao mudar de matéria
  state.filtros = { busca: '', tema: '', dificuldade: '' };
  if (refs.filtroBusca) refs.filtroBusca.value = '';
  if (refs.filtroDificuldade) refs.filtroDificuldade.value = '';

  // Ocultar qualquer aviso de erro anterior imediatamente
  refs.avisoErro.hidden       = true;
  refs.mensagemErro.textContent = '';
  refs.telaCarregando.hidden  = false;
  refs.telaQuiz.hidden        = true;

  try {
    const subjectUrl = `/api/materias/${encodeURIComponent(subject.id)}`;
    const staticUrl  = buildStaticSubjectUrl(subject.fileName);
    const { payload } = await fetchJsonWithFallback(apiUrl(subjectUrl), staticUrl);

    state.selectedSubjectData = normalizeSubject(payload, subject.fileName);
    populateThemeFilter();
    applyFilters(false);

    const progress = getCurrentSubjectProgress();
    const savedIndex = Number.isInteger(progress.currentIndex) ? progress.currentIndex : 0;

    // Se o índice salvo existir na lista ativa de questões, selecionar ele
    state.currentIndex = (savedIndex >= 0 && savedIndex < state.activeQuestions.length) ? savedIndex : 0;

    setDraftFromCurrent();
    refs.avisoErro.hidden       = true;
    refs.mensagemErro.textContent = '';
    refs.telaCarregando.hidden  = true;
    refs.telaQuiz.hidden        = false;
    renderQuestion();
    saveProgress();

    const reviewTarget = localStorage.getItem('quiz_review_target');
    if (reviewTarget) {
      localStorage.removeItem('quiz_review_target');
      iniciarRevisao(reviewTarget, true);
    }
  } catch (error) {
    console.error(error);
    refs.avisoErro.hidden      = false;
    refs.mensagemErro.textContent = error.message;
    refs.telaCarregando.hidden = true;
  }
}

async function loadSubjects() {
  refs.avisoErro.hidden = true;
  refs.mensagemErro.textContent = '';

  try {
    const subjectUrl     = apiUrl('/api/materias');
    const staticSubjects = listStaticSubjects();

    let subjects;
    try {
      const { payload } = await fetchJsonWithFallback(subjectUrl, buildStaticSubjectUrl('materias.json'));
      subjects = Array.isArray(payload) && payload.length ? payload : staticSubjects;
    } catch {
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
  if (refs.btnTema) refs.btnTema.innerHTML = isDark ? window.Icon('sun') : window.Icon('moon');
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

// Tema
refs.btnTema.addEventListener('click', () => {
  applyTheme(state.darkMode ? 'light' : 'dark');
});

// Sair da conta
if (refs.btnLogout) {
  refs.btnLogout.addEventListener('click', () => {
    if (typeof window.logoutUser === 'function') {
      window.logoutUser();
    } else {
      localStorage.removeItem('quizAuthUser');
      window.location.href = './pages/login.html';
    }
  });
}

// Filtro Busca
if (refs.filtroBusca) {
  let debounceTimeout = null;
  refs.filtroBusca.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      state.filtros.busca = e.target.value;
      applyFilters(false);
      renderQuestion();
    }, 150);
  });
}

// Filtro Tema
if (refs.filtroTema) {
  refs.filtroTema.addEventListener('change', (e) => {
    state.filtros.tema = e.target.value;
    applyFilters(false);
    renderQuestion();
  });
}

// Filtro Dificuldade
if (refs.filtroDificuldade) {
  refs.filtroDificuldade.addEventListener('change', (e) => {
    state.filtros.dificuldade = e.target.value;
    applyFilters(false);
    renderQuestion();
  });
}

// Botão Limpar Filtros
if (refs.btnLimparFiltros) {
  refs.btnLimparFiltros.addEventListener('click', window.limparTodosFiltros);
}

// Seleção de matéria
refs.subjectSelect.addEventListener('change', (event) => {
  loadSubject(event.target.value);
});

// Seleção de questão
refs.questionSelect.addEventListener('change', (event) => {
  const val = Number(event.target.value);
  if (val >= 0) {
    if (state.modoRevisao) {
      state.indiceFiltro = val;
      state.currentIndex = state.questoesFiltradas[val];
      setDraftFromCurrent();
      renderQuestion();
    } else {
      changeQuestion(val);
    }
  }
});

// Reiniciar (toolbar)
refs.reiniciarBtn.addEventListener('click', resetSubjectProgress);

// Modo Foco
function updateFocoZoom() {
  if (refs.focoZoomContainer) {
    refs.focoZoomContainer.style.transform = 'none';
  }
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
      state.currentIndex = state.questoesFiltradas[state.indiceFiltro];
      setDraftFromCurrent();
      renderQuestion();
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
      state.currentIndex = state.questoesFiltradas[state.indiceFiltro];
      setDraftFromCurrent();
      renderQuestion();
    }
  } else {
    const total = state.activeQuestions.length;
    if (state.currentIndex < total - 1) changeQuestion(state.currentIndex + 1);
  }
});

/* ============================================================
   MODO REVISÃO
   ============================================================ */
async function iniciarRevisao(filtro, skipModal = false) {
  const progress = getCurrentSubjectProgress();
  const answers = progress.answers || {};
  let questoesFiltradas = [];

  state.selectedSubjectData.questions.forEach((question, index) => {
    const key = questionKey(question);
    const ans = answers[key] || answers[index];
    
    if (filtro === 'todas') {
      questoesFiltradas.push(index);
    } else if (filtro === 'erros') {
      if (ans && !ans.isCorrect) {
        questoesFiltradas.push(index);
      }
    }
  });

  if (questoesFiltradas.length === 0) {
    if (filtro === 'erros') {
      mostrarToast('Parabéns! Você não tem erros para revisar.', 'sucesso');
    } else {
      mostrarToast('Nenhuma questão para revisar.', 'info');
    }
    return;
  }

  if (!skipModal) {
    const confirmed = await mostrarModal(
      'Revisão',
      `Você vai revisar ${questoesFiltradas.length} questões. Deseja continuar?`,
      'book'
    );
    if (!confirmed) return;
  }

  state.modoRevisao = true;
  state.filtroRevisao = filtro;
  state.questoesFiltradas = questoesFiltradas;
  state.indiceFiltro = 0;
  state.currentIndex = state.questoesFiltradas[0];
  setDraftFromCurrent();
  
  if (refs.telaResultado) refs.telaResultado.hidden = true;
  refs.telaQuiz.hidden      = false;
  renderQuestion();
}

if (refs.encerrarRevisaoBtn) {
  refs.encerrarRevisaoBtn.addEventListener('click', () => {
    state.modoRevisao = false;
    refs.encerrarRevisaoBtn.hidden = true;
    refs.questionSelect.disabled = false;
    applyFilters(false);
    renderQuestion();

    const progress = getCurrentSubjectProgress();
    const respondidas = Object.keys(progress.answers || {}).length;
    const total = state.selectedSubjectData.questions.length;
    
    if (respondidas >= total) {
       mostrarResultado(total, 0, 0); 
    }
  });
}

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
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

  if (!refs.modalOverlay.classList.contains('hidden')) return;

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      if (state.modoRevisao) {
        if (state.indiceFiltro > 0) {
          state.indiceFiltro--;
          state.currentIndex = state.questoesFiltradas[state.indiceFiltro];
          setDraftFromCurrent();
          renderQuestion();
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
          state.currentIndex = state.questoesFiltradas[state.indiceFiltro];
          setDraftFromCurrent();
          renderQuestion();
        }
      } else {
        const total = state.activeQuestions.length;
        if (state.currentIndex < total - 1) changeQuestion(state.currentIndex + 1);
      }
      break;

    case 'Enter':
      if (!refs.telaQuiz.hidden && !refs.btnConfirmar.disabled) {
        event.preventDefault();
        saveAnsweredQuestion();
      }
      break;

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
