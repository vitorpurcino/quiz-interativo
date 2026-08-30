/* ============================================================
   DASHBOARD DE DESEMPENHO — CFSBM 2026
   Lógica extraída de pages/dashboard.html para arquivo externo
   ============================================================ */
'use strict';

const STORAGE_KEY = 'quiz_interativo_progress_v1';
const THEME_KEY = 'quiz_interativo_theme';
const STREAK_KEY = 'quiz_interativo_streak_best';
const AUTH_KEY = 'quizAuthUser';
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
const CORES = ['#1e4fba', '#7c3aed', '#0891b2', '#059669', '#d97706', '#db2777', '#4f46e5'];

const API_BASE = (window.API_BASE || '').replace(/\/+$/, '');

function apiUrl(path) {
  if (!API_BASE) return path;
  return API_BASE + (path.startsWith('/') ? path : '/' + path);
}

const refs = {
  loader: document.getElementById('dashLoader'),
  conteudo: document.getElementById('dashConteudo'),
  hero: document.getElementById('dashHero'),
  resumo: document.getElementById('dashResumo'),
  nivel: document.getElementById('corpoNivel'),
  desempenho: document.getElementById('corpoDesempenho'),
  historico: document.getElementById('corpoHistorico'),
  dificuldade: document.getElementById('corpoDificuldade'),
  fortes: document.getElementById('corpoFortes'),
  fracos: document.getElementById('corpoFracos'),
  destaques: document.getElementById('corpoDestaques'),
  naoVistas: document.getElementById('corpoNaoVistas'),
  tabela: document.getElementById('corpoTabela'),
  situacaoTopo: document.getElementById('situacaoTopo'),
  btnTema: document.getElementById('btnTema'),
  btnLogout: document.getElementById('btnLogout'),
  streakCount: document.getElementById('streakCount'),
  streakBadge: document.getElementById('streakBadge')
};

/* ============================================================
   UTILITÁRIOS
   ============================================================ */
function slugify(text) {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}
function cleanObjectKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanObjectKeys);
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) cleaned[key.trim()] = (typeof val === 'string' ? val.trim() : cleanObjectKeys(val));
  return cleaned;
}
function esc(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function normalizeQuestion(raw) {
  const q = cleanObjectKeys(raw) || {};
  return {
    id: q.id,
    topic: String(q.tema || 'Tema não informado').trim(),
    difficulty: String(q.dificuldade || '').trim()
  };
}
function normalizeSubject(rawPayload, fileName) {
  const payload = cleanObjectKeys(rawPayload) || {};
  const info = payload.informacoes || payload.config || {};
  const rawQuestions = Array.isArray(payload.questoes) ? payload.questoes : [];
  const title = String(info.titulo || info.materia || payload.titulo || fileName.replace(/\.json$/i, '')).trim();
  return {
    id: slugify(fileName.replace(/\.json$/i, '')),
    title,
    nome: String(info.nome || info.nomeMateria || '').trim(),
    materia: String(info.materia || '').trim(),
    questions: rawQuestions.map((q, idx) => ({ _idx: idx + 1, ...normalizeQuestion(q) }))
  };
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { currentSubject: '', subjects: {} };
    const parsed = JSON.parse(raw);
    return {
      currentSubject: parsed.currentSubject || '',
      subjects: parsed.subjects && typeof parsed.subjects === 'object' ? parsed.subjects : {}
    };
  } catch (error) {
    console.warn('Erro ao carregar progresso:', error);
    return { currentSubject: '', subjects: {} };
  }
}
function getAuthenticatedUser() {
  try {
    const item = localStorage.getItem(AUTH_KEY);
    return item ? JSON.parse(item) : null;
  } catch (e) { return null; }
}

/* ============================================================
   TEMA / SESSÃO
   ============================================================ */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch (e) { }
  if (refs.btnTema) refs.btnTema.innerHTML = isDark ? window.Icon('sun') : window.Icon('moon');
  renderCardIcons();
}
if (refs.btnTema) {
  refs.btnTema.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });
}
function renderCardIcons() {
  const map = {
    titNivel: 'target',
    titDesempenho: 'chart',
    titHistorico: 'history',
    titDificuldade: 'trendingUp',
    titFortes: 'muscle',
    titFracos: 'alert',
    titDestaques: 'star',
    titNaoVistas: 'construction',
    titTabela: 'layers'
  };
  Object.entries(map).forEach(([id, icon]) => {
    const heading = document.getElementById(id);
    if (!heading) return;
    const slot = heading.querySelector('.icone');
    if (slot && !slot.innerHTML.trim()) slot.innerHTML = window.Icon(icon);
  });
}
renderCardIcons();
applyTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

if (refs.btnLogout) {
  refs.btnLogout.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = './login.html';
  });
}

/* ============================================================
   CARREGAMENTO DAS MATÉRIAS (API com fallback estático)
   ============================================================ */
function resolveFileName(id) {
  return STATIC_SUBJECTS.find((f) => slugify(f.replace(/\.json$/i, '')) === id) || null;
}
async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}
async function fetchSubjectData(subjectId) {
  const staticFile = resolveFileName(subjectId);
  try {
    const api = await fetchJson(apiUrl('/api/materias/' + encodeURIComponent(subjectId)));
    return normalizeSubject(api, staticFile || subjectId + '.json');
  } catch (e) {
    if (!staticFile) throw new Error('Arquivo da matéria não encontrado: ' + subjectId);
    const payload = await fetchJson('../json/' + encodeURIComponent(staticFile));
    return normalizeSubject(payload, staticFile);
  }
}
async function fetchSubjectList() {
  try {
    const payload = await fetchJson(apiUrl('/api/materias'));
    if (Array.isArray(payload) && payload.length) {
      return payload.map((s) => {
        const f = resolveFileName(s.id);
        return { id: s.id, title: s.title || (f ? f.replace(/\.json$/i, '') : s.id) };
      });
    }
  } catch (e) { /* usa fallback estático */ }
  return STATIC_SUBJECTS.map((f) => ({ id: slugify(f.replace(/\.json$/i, '')), title: f.replace(/\.json$/i, '') }));
}

/* ============================================================
   CÁLCULO DAS ESTATÍSTICAS
   ============================================================ */
function difGroup(texto) {
  const d = String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (d.includes('facil') || d.includes('easy') || d.includes('baixo')) return 'facil';
  if (d.includes('medio') || d.includes('media') || d.includes('medium')) return 'medio';
  if (d.includes('dificil') || d.includes('hard') || d.includes('alto')) return 'dificil';
  return 'outro';
}

function computeStats(subjects, progress) {
  const stats = {
    total: 0, answered: 0, acertos: 0, erros: 0, bestStreak: 0, currentStreak: 0,
    perSubject: [], history: [],
    porDificuldade: { facil: { a: 0, e: 0 }, medio: { a: 0, e: 0 }, dificil: { a: 0, e: 0 }, outro: { a: 0, e: 0 } }
  };
  const allAnswers = [];

  subjects.forEach((subject, idx) => {
    const answers = (progress.subjects[subject.id] || {}).answers || {};
    stats.total += subject.questions.length;

    let a = 0, e = 0;
    const entries = Object.values(answers);
    entries.forEach((ans) => {
      if (!ans) return;
      if (ans.isCorrect) a++; else e++;
      if (ans.answeredAt) allAnswers.push({ ok: !!ans.isCorrect, ts: Number(ans.answeredAt) });
    });
    const answered = entries.length;
    stats.answered += answered; stats.acertos += a; stats.erros += e;

    subject.questions.forEach((q) => {
      const key = String(q.id ?? q._idx);
      const ans = answers[key];
      if (!ans) return;
      const g = difGroup(q.difficulty);
      const alvo = stats.porDificuldade[g] || (stats.porDificuldade[g] = { a: 0, e: 0 });
      if (ans.isCorrect) alvo.a++; else alvo.e++;
    });

    stats.perSubject.push({
      id: subject.id,
      title: subject.title || subject.id,
      nome: subject.nome || subject.title || subject.id,
      materia: subject.materia || subject.title || subject.id,
      total: subject.questions.length, answered, acertos: a, erros: e,
      acc: answered ? Math.round((a / answered) * 100) : 0, cor: CORES[idx % CORES.length]
    });
  });

  allAnswers.sort((x, y) => x.ts - y.ts || (x.ok ? -1 : 1));
  let run = 0;
  allAnswers.forEach((ans) => { run = ans.ok ? run + 1 : 0; if (run > stats.bestStreak) stats.bestStreak = run; });
  for (let i = allAnswers.length - 1; i >= 0 && allAnswers[i].ok; i--) stats.currentStreak++;

  const porDia = {};
  allAnswers.forEach((ans) => {
    const d = new Date(ans.ts);
    const label = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (!porDia[label]) porDia[label] = { a: 0, e: 0 };
    porDia[label][ans.ok ? 'a' : 'e']++;
  });
  stats.history = Object.keys(porDia).sort().slice(-12).map((label) => {
    const p = label.split('-').map(Number);
    return { label, a: porDia[label].a, e: porDia[label].e, dia: String(p[2]).padStart(2, '0') + '/' + String(p[1]).padStart(2, '0') };
  });

  const comResp = stats.perSubject.filter((s) => s.answered >= 3);
  stats.fortes = comResp.filter((s) => s.acc >= 50).sort((x, y) => y.acc - x.acc || y.answered - x.answered).slice(0, 4);
  stats.fracos = comResp.filter((s) => s.acc < 50).sort((x, y) => x.acc - y.acc).slice(0, 4);
  stats.destaques = comResp.filter((s) => s.acc >= 70).sort((x, y) => y.acc - x.acc);
  stats.naoVistas = stats.perSubject.filter((s) => s.answered === 0).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  stats.poucas = stats.perSubject.filter((s) => s.answered > 0 && s.answered < 3).sort((a, b) => a.answered - b.answered);
  stats.accGeral = stats.answered ? Math.round((stats.acertos / stats.answered) * 100) : 0;

  try { localStorage.setItem(STREAK_KEY, JSON.stringify({ best: stats.bestStreak, updatedAt: Date.now() })); } catch (e) { }
  return stats;
}

/* ============================================================
   RENDERIZAÇÃO
   ============================================================ */
function vazio(msg) { return '<div class="dash-vazio-campo">' + esc(msg) + '</div>'; }

function renderResumo(s) {
  const box = (cls, numero, label, titulo) =>
    '<div class="stat-box ' + cls + '" title="' + esc(titulo || '') + '"><div class="stat-numero">' + numero + '</div><div class="stat-label">' + esc(label) + '</div></div>';
  const streakIcon = window.Icon('flame');
  refs.resumo.innerHTML =
    box('total', s.total, 'Questões no total', 'Total de questões cadastradas em todas as matérias') +
    box('respondidas', s.answered, 'Respondidas', 'Questões com resposta registrada') +
    box('acertos', s.acertos, 'Acertos', 'Total de respostas corretas') +
    box('erros', s.erros, 'Erros', 'Total de respostas incorretas') +
    box('porcentagem', s.accGeral + '%', 'Aproveitamento', 'Percentual de acertos sobre as respondidas') +
    '<div class="stat-box melhorSequencia" title="Maior sequência de acertos consecutivos"><div class="stat-numero">' + streakIcon + ' ' + s.bestStreak + '</div><div class="stat-label">Melhor sequência</div></div>';
}

function renderHero(stats) {
  if (!refs.hero) return;
  const vazio = !stats.answered;
  const actions = vazio
    ? '<button class="btn-primario" type="button" onclick="window.location.href=\'../index.html\'">▶ Começar a Estudar</button>' +
      '<button class="btn-secundario" type="button" onclick="window.location.href=\'../index.html\'">Ver Matérias</button>'
    : '<button class="btn-primario" type="button" onclick="window.location.href=\'../index.html\'">▶ Continuar Estudando</button>';

  const html = vazio
    ? '<div class="dash-hero-icone" aria-hidden="true">' + window.Icon('book') + '</div>' +
      '<div class="dash-hero-texto"><h2>Bem-vindo ao seu painel de estudos</h2>' +
      '<p>Responda às primeiras questões para desbloquear gráficos de acertos, erros, pontos fortes e fracos, e acompanhe sua evolução no CFSBM 2026.</p>' +
      '<p class="dash-hero-sub">Comece agora — cada resposta conta para sua preparação.</p></div>' +
      '<div class="dash-hero-acoes">' + actions + '</div>'
    : '<div class="dash-hero-icone" aria-hidden="true">' + window.Icon('rocket') + '</div>' +
      '<div class="dash-hero-texto"><h2>Continue sua preparação</h2>' +
      '<p>Você está rendendo bem. Mantenha o ritmo e revise as matérias que aparecem como pontos fracos.</p>' +
      '<p class="dash-hero-sub">' + stats.answered + ' questões respondidas até agora.</p></div>' +
      '<div class="dash-hero-acoes">' + actions + '</div>';

  refs.hero.className = 'dash-hero' + (vazio ? ' apresentacao' : '');
  refs.hero.innerHTML = html;
}

function renderDoughnut(s) {
  if (!s.answered) { refs.nivel.innerHTML = vazio('Comece a responder as questões para ver seu nível de acertos e erros.'); return; }
  const R = 15.915;
  const pAcerto = (s.acertos / s.total) * 100;
  const pErro = (s.erros / s.total) * 100;
  const offsetErro = 25 + pAcerto;
  const arcoAcerto = pAcerto > 0
    ? '<circle cx="21" cy="21" r="' + R + '" fill="none" stroke="#22c55e" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="' + pAcerto + ' ' + (100 - pAcerto) + '" stroke-dashoffset="25" transform="rotate(-90 21 21)" />' : '';
  const arcoErro = pErro > 0
    ? '<circle cx="21" cy="21" r="' + R + '" fill="none" stroke="#ef4444" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="' + pErro + ' ' + (100 - pErro) + '" stroke-dashoffset="' + offsetErro + '" transform="rotate(-90 21 21)" />' : '';
  const svg =
    '<svg viewBox="0 0 42 42" width="172" height="172" role="img" aria-label="Nível de acertos e erros">' +
      '<circle cx="21" cy="21" r="' + R + '" fill="none" stroke="var(--progresso-bg)" stroke-width="4.2" />' +
      arcoAcerto + arcoErro +
    '</svg>';
  refs.nivel.innerHTML =
    '<div class="doughnut-wrap">' +
      '<div class="doughnut">' + svg +
        '<div class="centro"><div class="alvo">' + s.accGeral + '%</div><div class="rotulo">acertos</div></div>' +
      '</div>' +
      '<div class="doughnut-legenda">' +
        '<div class="dg-item"><span class="bolinha" style="background:#22c55e"></span> Acertos <b>' + s.acertos + '</b></div>' +
        '<div class="dg-item"><span class="bolinha" style="background:#ef4444"></span> Erros <b>' + s.erros + '</b></div>' +
        '<div class="dg-item"><span class="bolinha" style="background:var(--progresso-bg)"></span> Não respondidas <b>' + (s.total - s.answered) + '</b></div>' +
        '<div class="dg-item"><span class="bolinha" style="background:var(--primario)"></span> Aproveitamento <b>' + s.accGeral + '%</b></div>' +
      '</div>' +
    '</div>';
}

function renderDesempenho(s) {
  if (!s.answered) { refs.desempenho.innerHTML = vazio('Sem respostas registradas ainda.'); return; }
  refs.desempenho.innerHTML = s.perSubject.map((sub) => {
    const tot = sub.answered || 1;
    const pA = (sub.acertos / tot) * 100;
    const pE = (sub.erros / tot) * 100;
    return '<div class="bar-row"><div class="bar-linha">' +
      '<span class="bar-nome" title="' + esc(sub.nome) + '">' + esc(sub.nome) + '</span>' +
      '<span class="bar-pista"><span class="bar-fill-acerto" style="width:' + pA + '%"></span><span class="bar-fill-erro" style="width:' + pE + '%"></span></span>' +
      '<span class="bar-meta"><b>' + sub.acc + '%</b> • ' + sub.acertos + '✅ ' + sub.erros + '❌</span>' +
    '</div></div>';
  }).join('');
}

function renderHistorico(s) {
  if (!s.history.length) { refs.historico.innerHTML = vazio('Sem histórico de estudo para exibir.'); return; }
  const max = Math.max(1, ...s.history.map((d) => d.a + d.e));
  refs.historico.innerHTML = '<div class="hist-chart">' + s.history.map((d) =>
    '<div class="hist-col">' +
      '<div class="colunas">' +
        '<span class="seg seg-a" style="' + (d.a ? 'height:' + ((d.a / max) * 100) + '%;' : '') + '" title="Acertos: ' + d.a + '"></span>' +
        '<span class="seg seg-e" style="' + (d.e ? 'height:' + ((d.e / max) * 100) + '%;' : '') + '" title="Erros: ' + d.e + '"></span>' +
      '</div>' +
      '<span class="qtd">' + (d.a + d.e) + '</span>' +
      '<span class="dia">' + d.dia + '</span>' +
    '</div>').join('') + '</div>';
}

function renderDificuldade(s) {
  if (!s.answered) { refs.dificuldade.innerHTML = vazio('Sem dados para exibir.'); return; }
  const nomes = { facil: 'Fácil', medio: 'Média', dificil: 'Difícil', outro: 'Outros' };
  refs.dificuldade.innerHTML = Object.keys(s.porDificuldade).map((g) => {
    const d = s.porDificuldade[g];
    const tot = d.a + d.e;
    if (!tot) return '';
    const pA = (d.a / tot) * 100;
    const pE = (d.e / tot) * 100;
    return '<div class="bar-row"><div class="bar-linha">' +
      '<span class="bar-nome">' + nomes[g] + '</span>' +
      '<span class="bar-pista"><span class="bar-fill-acerto" style="width:' + pA + '%"></span><span class="bar-fill-erro" style="width:' + pE + '%"></span></span>' +
      '<span class="bar-meta"><b>' + Math.round(pA) + '%</b> • ' + d.a + '✅ ' + d.e + '❌</span>' +
    '</div></div>';
  }).join('') || vazio('Sem questões respondidas.');
}

function renderLista(el, itens, tipo) {
  const msg = tipo === 'fraco' ? 'Nenhum ponto fraco identificado. Ótimo!'
    : tipo === 'forte' ? 'Nenhum ponto forte com dados suficientes ainda.' : 'Nenhum destaque até o momento.';
  if (!itens.length) { el.innerHTML = vazio(msg); return; }
  const icone = window.Icon(tipo === 'fraco' ? 'trendingUp' : tipo === 'destacado' ? 'star' : 'muscle');
  el.innerHTML = '<ul class="badge-list">' + itens.map((s) =>
    '<li class="badge-item' + (tipo === 'fraco' ? ' fraco' : '') + '">' +
      '<span class="ic">' + icone + '</span>' +
      '<span class="nome" title="' + esc(s.materia) + '">' + esc(s.materia) + '</span>' +
      '<span class="pct">' + s.acc + '%</span>' +
      '<span class="sub">' + s.acertos + ' acertos • ' + s.erros + ' erros • ' + s.answered + ' resp.</span>' +
    '</li>').join('') + '</ul>';
}

function renderNaoVistas(s) {
  if (!s.naoVistas.length && !s.poucas.length) {
    refs.naoVistas.innerHTML = vazio('Todas as matérias já foram exploradas!');
    return;
  }
  const icNao = window.Icon('construction');
  const icPoucas = window.Icon('search');
  const chipNao = s.naoVistas.map((m) =>
    '<li class="badge-item"><span class="ic">' + icNao + '</span><span class="nome">' + esc(m.title) + '</span>' +
    '<span class="pct" style="color:var(--texto-terciario)">' + m.total + ' questões</span>' +
    '<span class="sub">não iniciada</span></li>').join('');
  const chipPoucas = s.poucas.map((m) =>
    '<li class="badge-item"><span class="ic">' + icPoucas + '</span><span class="nome">' + esc(m.title) + '</span>' +
    '<span class="pct">' + m.answered + '/' + m.total + '</span>' +
    '<span class="sub">' + m.answered + ' resp.</span></li>').join('');
  refs.naoVistas.innerHTML =
    (s.naoVistas.length ? '<ul class="badge-list">' + chipNao + '</ul>' : '') +
    (s.poucas.length ? '<h3 style="font-size:13px;color:var(--texto-secundario);margin-top:4px;">Pouco pontuadas (&lt; 3 respondidas)</h3><ul class="badge-list">' + chipPoucas + '</ul>' : '');
}

function renderTabela(s) {
  const linhas = s.perSubject.map((sub) => {
    const cls = sub.answered === 0 ? 'neutra' : (sub.acc >= 70 ? 'forte' : 'atencao');
    const rotulo = sub.answered === 0 ? 'Não iniciada' : (sub.acc >= 70 ? 'Destaque' : 'Revisar');
    const pista = '<span class="mini-pista">' +
      '<span class="mini-acerto" style="width:' + (sub.answered ? (sub.acertos / sub.answered) * 100 : 0) + '%"></span>' +
      '<span class="mini-erro" style="width:' + (sub.answered ? (sub.erros / sub.answered) * 100 : 0) + '%"></span></span>';
    return '<tr>' +
      '<td style="font-weight:600">' + esc(sub.title) + '</td>' +
      '<td>' + sub.answered + ' / ' + sub.total + '</td>' +
      '<td>' + sub.acertos + '</td>' +
      '<td>' + sub.erros + '</td>' +
      '<td>' + sub.acc + '%</td>' +
      '<td class="progress-thin">' + pista + '</td>' +
      '<td><span class="etiqueta ' + cls + '">' + rotulo + '</span></td>' +
    '</tr>';
  }).join('');
  refs.tabela.innerHTML =
    '<table class="dash-tabela"><thead><tr>' +
      '<th>Matéria</th><th>Respondidas</th><th>Acertos</th><th>Erros</th><th>Aproveitamento</th><th>Acertos/Erros</th><th>Status</th>' +
    '</tr></thead><tbody>' + linhas + '</tbody></table>';
}

/* ============================================================
   INICIALIZAÇÃO + GUARDA DE AUTENTICAÇÃO
   ============================================================ */
(function init() {
  const user = getAuthenticatedUser();
  if (!user) { window.location.replace('./login.html'); return; }

  const nome = (user.nome || user.usuario || '').toString().trim().split(/\s+/)[0];
  if (nome) {
    const el = document.getElementById('situacaoTopo');
    if (el) el.textContent = 'Olá, ' + nome + '! Acompanhe abaixo o resumo do seu desempenho';
  }

  (async () => {
    let guardTimer;
    try {
      const lista = await fetchSubjectList();
      const subjects = [];
      guardTimer = setTimeout(() => {
        refs.loader.innerHTML = '<p>O carregamento demorou mais que o esperado.</p>' +
          '<p style="margin-top:10px"><button class="btn-cinza" type="button" onclick="window.location.reload()">↺ Tentar novamente</button></p>';
      }, 15000);
      for (const meta of lista) {
        try { subjects.push(await fetchSubjectData(meta.id)); }
        catch (e) { console.warn('Matéria ignorada:', meta.id, e.message); }
      }
      if (!subjects.length) throw new Error('Nenhuma matéria pôde ser carregada.');
      const progress = loadProgress();
      const s = computeStats(subjects, progress);

      refs.streakCount.textContent = '';
      const streakIcon = window.Icon('flame');
      refs.streakBadge.insertAdjacentHTML('afterbegin', streakIcon + ' ');
      if (refs.streakBadge) refs.streakBadge.setAttribute('data-streak', String(s.bestStreak));

      renderResumo(s);
      renderDoughnut(s);
      renderDesempenho(s);
      renderHistorico(s);
      renderDificuldade(s);
      renderLista(refs.fortes, s.fortes, 'forte');
      renderLista(refs.fracos, s.fracos, 'fraco');
      renderLista(refs.destaques, s.destaques, 'destacado');
      renderNaoVistas(s);
      renderTabela(s);
      renderHero(s);

      try { clearTimeout(guardTimer); } catch (e) { }
      refs.loader.hidden = true;
      refs.conteudo.style.display = 'block';
    } catch (error) {
      console.error(error);
      try { clearTimeout(guardTimer); } catch (e) { }
      refs.loader.innerHTML = '<p>Não foi possível carregar o dashboard: ' + esc(error.message || 'erro desconhecido') + '</p>' +
        '<p style="margin-top:10px"><button class="btn-cinza" type="button" onclick="window.location.href=\'../index.html\'">Voltar ao Quiz</button></p>';
    }
  })();
})();
