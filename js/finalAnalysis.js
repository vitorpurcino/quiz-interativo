/* ============================================================
   ANÁLISE FINAL - CFSBM 2026
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

let state = {
  darkMode: localStorage.getItem(THEME_KEY) === 'dark',
  selectedSubjectData: null,
  progress: null
};

const refs = {
  btnTema:            document.getElementById('btnTema'),
  resultadoIcone:     document.getElementById('resultadoIcone'),
  resultadoTitulo:    document.getElementById('resultadoTitulo'),
  resultadoSubtitulo: document.getElementById('resultadoSubtitulo'),
  statTotal:          document.getElementById('statTotal'),
  statRespondidas:    document.getElementById('statRespondidas'),
  statAcertos:        document.getElementById('statAcertos'),
  statErros:          document.getElementById('statErros'),
  statPorcentagem:    document.getElementById('statPorcentagem'),
  btnFiltroTodas:     document.getElementById('btnFiltroTodas'),
  btnFiltroErros:     document.getElementById('btnFiltroErros'),
  listaRevisao:       document.getElementById('listaRevisao'),
  btnVoltarMenu:      document.getElementById('btnVoltarMenu'),
  btnReiniciarResultado:  document.getElementById('btnReiniciarResultado')
};

// ==========================================
// TEMA
// ==========================================
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  state.darkMode = isDark;
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  if (refs.btnTema) refs.btnTema.textContent = isDark ? '☀️' : '🌓';
}

if (refs.btnTema) {
  refs.btnTema.addEventListener('click', () => {
    applyTheme(state.darkMode ? 'light' : 'dark');
  });
}
applyTheme(state.darkMode ? 'dark' : 'light');

// ==========================================
// UTILITÁRIOS E DADOS
// ==========================================
function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

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
    console.warn('Erro ao carregar progresso:', error);
    return { currentSubject: '', subjects: {} };
  }
}

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

// ==========================================
// LÓGICA PRINCIPAL DA TELA
// ==========================================
async function init() {
  const progressData = loadProgress();
  const subjectId = progressData.currentSubject;
  
  if (!subjectId) {
    alert("Nenhuma matéria selecionada!");
    window.location.href = '../index.html';
    return;
  }

  const subjectProgress = progressData.subjects[subjectId] || { answers: {} };
  state.progress = subjectProgress;
  
  // Achar o nome do arquivo JSON
  const fileName = STATIC_SUBJECTS.find(f => slugify(f.replace(/\.json$/i, '')) === subjectId);
  if (!fileName) {
    alert("Matéria não encontrada!");
    window.location.href = '../index.html';
    return;
  }

  try {
    const url = `../json/${encodeURIComponent(fileName)}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error("Erro ao carregar o JSON.");
    
    const payload = await response.json();
    state.selectedSubjectData = normalizeSubject(payload, fileName);
    
    calcularEstatisticas();
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar dados da matéria para análise.");
  }
}

function calcularEstatisticas() {
  const total = state.selectedSubjectData.questions.length;
  const answers = state.progress.answers || {};
  
  let acertos = 0;
  let erros = 0;
  let respondidas = 0;

  for (const [key, ans] of Object.entries(answers)) {
    respondidas++;
    if (ans.isCorrect) acertos++;
    else erros++;
  }
  
  const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;

  let icone = '🎯';
  let titulo = 'Matéria Concluída!';
  let subtitulo = 'Você respondeu todas as questões.';

  if (percentual === 100) {
    icone = '🏆';
    titulo = 'Perfeito!';
    subtitulo = 'Você gabaritou todas as questões desta matéria. Excelente trabalho!';
  } else if (percentual >= 70) {
    icone = '🎉';
    titulo = 'Muito Bem!';
    subtitulo = `Você acertou ${percentual}% das questões. Continue assim!`;
  } else {
    icone = '💪';
    titulo = 'Não Desista!';
    subtitulo = `Você acertou ${percentual}% das questões. Revise e tente novamente!`;
  }

  refs.resultadoIcone.textContent = icone;
  refs.resultadoTitulo.textContent = titulo;
  refs.resultadoSubtitulo.textContent = subtitulo;
  refs.statTotal.textContent = String(total);
  refs.statRespondidas.textContent = String(respondidas);
  refs.statAcertos.textContent = String(acertos);
  refs.statErros.textContent = String(erros);
  refs.statPorcentagem.textContent = `${percentual}%`;
}



// ==========================================
// EVENTOS
// ==========================================
refs.btnFiltroTodas.addEventListener('click', () => {
  localStorage.setItem('quiz_review_target', 'todas');
  window.location.href = '../index.html';
});

refs.btnFiltroErros.addEventListener('click', () => {
  localStorage.setItem('quiz_review_target', 'erros');
  window.location.href = '../index.html';
});

refs.btnVoltarMenu.addEventListener('click', () => {
  window.location.href = '../index.html';
});

refs.btnReiniciarResultado.addEventListener('click', () => {
  if(confirm("Tem certeza que deseja reiniciar o progresso desta matéria?")) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.subjects && parsed.subjects[parsed.currentSubject]) {
        parsed.subjects[parsed.currentSubject] = { answers: {}, currentIndex: 0 };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    window.location.href = '../index.html';
  }
});

// Start
init();
