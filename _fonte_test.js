// Harness: valida que os cards usam os campos "nome" e "materia" do JSON
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname);

const RAW = fs.readFileSync(path.join(ROOT, 'json', 'combateaincendio.json'), 'utf8');
const parsed = JSON.parse(RAW);
console.log('CAMPO nome (informacoes) =', JSON.stringify(parsed.informacoes && parsed.informacoes['nome']));
console.log('CAMPO materia (informacoes) =', JSON.stringify(parsed.informacoes && parsed.informacoes['materia']));

function makeStub(id) {
  return {
    id, innerHTML: '', textContent: '', hidden: false,
    dataset: {}, style: { display: '' }, className: '',
    setAttribute() {}, addEventListener() {}, remove() {},
    classList: { toggle() {}, contains() { return false; }, add() {}, remove() {} }
  };
}
function buildContext() {
  const _elements = {};
  const ctx = {
    console, setTimeout,
    Math, Date, JSON, String, Number, Object, Array, Set, URL,
    localStorage: {
      getItem: (k) => (ctx.__store[k] ?? null),
      setItem: (k, v) => { ctx.__store[k] = String(v); },
      removeItem: (k) => { delete ctx.__store[k]; }
    },
    document: {
      getElementById: (id) => (_elements[id] || (_elements[id] = makeStub(id))),
      documentElement: { classList: { toggle() {}, contains() { return false; } } },
      createElement: () => makeStub('x')
    },
    location: { replace() {}, href: 'http://localhost:8000/pages/dashboard.html' }
  };
  ctx.window = ctx;
  ctx.__store = {};
  ctx.__elements = _elements;
  ctx.fetch = async (url) => {
    url = String(url);
    if (url === '/api/materias' || url === 'http://localhost:8000/api/materias') {
      return { ok: true, status: 200, json: async () => [{ id: 'combateaincendio', title: 'Táticas' }] };
    }
    if (/combateaincendio/.test(url)) {
      return { ok: true, status: 200, json: async () => JSON.parse(RAW) };
    }
    return { ok: true, status: 200, json: async () => ({ informacoes: { titulo: 'Sintetico', nome: 'Nome Sintetico', materia: 'Materia Sintetica' }, questoes: [1, 2].map((i) => ({ id: i, dificuldade: 'média' })) }) };
  };
  return ctx;
}

function loadScript() {
  const html = fs.readFileSync(path.join(ROOT, 'pages/dashboard.html'), 'utf8');
  const lines = html.split(/\r?\n/);
  const s = lines.findIndex((l) => l.includes("'use strict'"));
  const e = lines.findIndex((l, i) => i > s && l.includes('</script>'));
  return lines.slice(s, e).join('\n');
}
const script = loadScript();

function run(answers) {
  const ctx = buildContext();
  ctx.__store['quizAuthUser'] = JSON.stringify({ nome: 'Teste', usuario: 't' });
  ctx.__store['quiz_interativo_progress_v1'] = JSON.stringify({ currentSubject: 'combateaincendio', subjects: { 'combateaincendio': { answers } } });
  vm.runInNewContext(script, ctx, { filename: 'dash.js' });
  return new Promise((r) => setTimeout(() => r(ctx), 400));
}

(async () => {
  const answers = { '1': { isCorrect: true, answeredAt: Date.now() - 5000 }, '2': { isCorrect: false, answeredAt: Date.now() - 5000 }, '3': { isCorrect: true, answeredAt: Date.now() - 4000 } };
  const ctx = await run(answers);
  const E = ctx.__elements;
  let fail = 0;
  const check = (c, m) => { console.log((c ? 'OK: ' : 'FALHA: ') + m); if (!c) fail++; };

  const desempenho = E['corpoDesempenho'].innerHTML;
  const nomeEsperado = (parsed.informacoes['nome'] || '').trim();
  check(nomeEsperado !== '', 'há campo "nome" no JSON');
  check(desempenho.indexOf(nomeEsperado) > -1, 'Desempenho por Matéria usa campo "nome": "' + nomeEsperado + '"');

  const fortes = E['corpoFortes'].innerHTML;
  const materiaEsperada = (parsed.informacoes['materia'] || '').trim();
  check(materiaEsperada !== '', 'há campo "matéria" no JSON');
  check(fortes.indexOf(materiaEsperada) > -1, 'Pontos Fortes usa campo "matéria": "' + materiaEsperada + '"');

  console.log(fail === 0 ? '\n>>> TODOS OS TESTES DE FONTE DE DADOS PASSARAM <<<' : '\n>>> ' + fail + ' FALHA(S) <<<');
  process.exit(fail === 0 ? 0 : 1);
})();