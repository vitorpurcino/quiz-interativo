const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 8000;
const ROOT_DIR = path.join(__dirname, '..');
const ALTERNATE_DATA_DIR = path.join(ROOT_DIR, 'json');
const DATA_DIR = fs.existsSync(ALTERNATE_DATA_DIR) ? ALTERNATE_DATA_DIR : ROOT_DIR;
const PUBLIC_DIR = ROOT_DIR;
const USERS_DATA_DIR = path.join(ROOT_DIR, 'data');
const USERS_FILE = path.join(USERS_DATA_DIR, 'users.json');
const SCRYPT_N = 16384;
const SCRYPT_KEYLEN = 64;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes('*')) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function applyCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (!origin) return;

  if (isOriginAllowed(origin)) {
    response.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes('*') ? '*' : origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Max-Age', '600');
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const STATIC_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

const API_SECURITY_HEADERS = {
  ...STATIC_SECURITY_HEADERS,
  'Cache-Control': 'no-store'
};

function hashPassword(plain) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(plain, salt, SCRYPT_KEYLEN, { N: SCRYPT_N }, (err, derived) => {
      if (err) return reject(err);
      resolve(`scrypt$${salt}$${derived.toString('hex')}`);
    });
  });
}

function verifyPassword(plain, stored) {
  return new Promise((resolve, reject) => {
    if (!stored || typeof stored !== 'string') return resolve(false);
    const parts = stored.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return resolve(false);
    const [, salt, hashHex] = parts;
    const expected = Buffer.from(hashHex, 'hex');
    crypto.scrypt(plain, salt, expected.length, { N: SCRYPT_N }, (err, derived) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(expected, derived));
    });
  });
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function getSubjectFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    return [];
  }

  return fs
    .readdirSync(DATA_DIR)
    .filter((name) => name !== 'pagina_web')
    .filter((name) => fs.statSync(path.join(DATA_DIR, name)).isFile())
    .filter((name) => name.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function normalizeKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  const normalized = {};
  for (const [k, v] of Object.entries(obj)) {
    normalized[k.trim()] = (typeof v === 'string') ? v.trim() : normalizeKeys(v);
  }
  return normalized;
}

function getSubjects() {
  return getSubjectFiles()
    .map((fileName) => {
      const absolutePath = path.join(DATA_DIR, fileName);
      try {
        const raw = fs.readFileSync(absolutePath, 'utf8');
        const rawParsed = JSON.parse(raw);
        const parsed = normalizeKeys(rawParsed);
        const info = parsed?.informacoes || parsed?.config || {};
        const title = info.nome || info.titulo || info.materia || parsed?.titulo || fileName.replace(/\.json$/i, '');
        const subtitle = info.descricao || info.subtitulo || parsed?.subtitulo || 'Questões de estudo';
        const questions = Array.isArray(parsed?.questoes) ? parsed.questoes : [];
        const count = questions.length;
        return {
          id: slugify(fileName.replace(/\.json$/i, '')),
          fileName,
          title,
          subtitle,
          count
        };
      } catch (error) {
        console.warn(`Ignorando arquivo inválido: ${fileName}`, error.message);
        return null;
      }
    })
    .filter(Boolean);
}

function getSubjectById(subjectId) {
  const subjects = getSubjects();
  return subjects.find((subject) => subject.id === String(subjectId));
}

function readSubjectData(subject) {
  const filePath = path.join(DATA_DIR, subject.fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function sendJson(request, response, payload, statusCode = 200) {
  applyCorsHeaders(request, response);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...API_SECURITY_HEADERS,
    'Access-Control-Allow-Origin': response.getHeader('Access-Control-Allow-Origin') || '',
    'Access-Control-Allow-Methods': response.getHeader('Access-Control-Allow-Methods') || '',
    'Access-Control-Allow-Headers': response.getHeader('Access-Control-Allow-Headers') || '',
    Vary: response.getHeader('Vary') || ''
  });
  response.end(JSON.stringify(payload));
}

function ensureUsersFile() {
  if (!fs.existsSync(USERS_DATA_DIR)) {
    fs.mkdirSync(USERS_DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readUsersFile() {
  ensureUsersFile();

  const raw = fs.readFileSync(USERS_FILE, 'utf8');
  if (!raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Arquivo de usuários inválido. Reiniciando lista vazia.', error.message);
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
}

function writeUsersFile(users) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;
const PASSWORD_MIN = 6;

function validateRegistrationInput({ nome, email, usuario, senha }) {
  if (!nome || nome.length < 2 || nome.length > 80) {
    return 'Informe um nome entre 2 e 80 caracteres.';
  }
  if (!email || email.length > 120 || !EMAIL_RE.test(email)) {
    return 'Informe um e-mail válido.';
  }
  if (!usuario || !USERNAME_RE.test(usuario)) {
    return 'Usuário deve ter 3-32 caracteres (letras, números, ., _ ou -).';
  }
  if (!senha || senha.length < PASSWORD_MIN || senha.length > 128) {
    return `Senha deve ter entre ${PASSWORD_MIN} e 128 caracteres.`;
  }
  return null;
}

function clientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return request.socket.remoteAddress || 'unknown';
}

const rateLimitBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function consumeRateLimit(ip) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  rateLimitBuckets.set(ip, bucket);
  return bucket.count <= RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateLimitBuckets) {
    if (now > bucket.resetAt) rateLimitBuckets.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = '';

    request.on('data', (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1_000_000) {
        reject(new Error('Payload excedeu o limite permitido.'));
      }
    });

    request.on('end', () => {
      if (!rawBody.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(new Error('Corpo JSON inválido.'));
      }
    });

    request.on('error', (error) => reject(error));
  });
}

async function handleUserRegistration(request, response) {
  try {
    const body = await parseJsonBody(request);
    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim();
    const usuario = String(body.usuario || '').trim();
    const senha = String(body.senha || '');

    const validationError = validateRegistrationInput({ nome, email, usuario, senha });
    if (validationError) {
      sendJson(request, response, { error: validationError }, 400);
      return;
    }

    const users = readUsersFile();
    const emailJaExiste = users.some((user) => user.email?.toLowerCase() === email.toLowerCase());
    const usuarioJaExiste = users.some((user) => user.usuario?.toLowerCase() === usuario.toLowerCase());

    if (emailJaExiste || usuarioJaExiste) {
      sendJson(request, response, { error: 'E-mail ou usuário já cadastrado.' }, 409);
      return;
    }

    const novoUsuario = {
      id: `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      nome,
      email,
      usuario,
      senhaHash: await hashPassword(senha),
      criadoEm: new Date().toISOString(),
      ativo: false
    };

    users.push(novoUsuario);
    writeUsersFile(users);

    sendJson(request, response, {
      success: true,
      message: 'Cadastro realizado com sucesso. Seu cadastro está sob análise do administrador do sistema. Aguarde para ter o acesso.'
    }, 201);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error.message);
    sendJson(request, response, { error: 'Não foi possível cadastrar o usuário.' }, 400);
  }
}

async function handleUserLogin(request, response) {
  try {
    const body = await parseJsonBody(request);
    const usuario = String(body.usuario || '').trim();
    const senha = String(body.senha || '');

    if (!usuario || !senha) {
      sendJson(request, response, { error: 'Informe usuário e senha.' }, 400);
      return;
    }

    const users = readUsersFile();
    const usuarioEncontrado = users.find((user) => user.usuario?.toLowerCase() === usuario.toLowerCase());

    let senhaOk = false;
    if (usuarioEncontrado?.senhaHash) {
      senhaOk = await verifyPassword(senha, usuarioEncontrado.senhaHash);
    }

    if (!usuarioEncontrado || !senhaOk) {
      sendJson(request, response, { error: 'Credenciais inválidas.' }, 401);
      return;
    }

    if (usuarioEncontrado.ativo === false) {
      sendJson(request, response, { error: 'Seu cadastro está sob análise do administrador do sistema. Aguarde para ter o acesso' }, 403);
      return;
    }

    sendJson(request, response, {
      success: true,
      message: 'Login realizado com sucesso.',
      user: {
        id: usuarioEncontrado.id,
        nome: usuarioEncontrado.nome,
        email: usuarioEncontrado.email,
        usuario: usuarioEncontrado.usuario
      }
    });
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error.message);
    sendJson(request, response, { error: 'Não foi possível autenticar o usuário.' }, 400);
  }
}

const PRIVATE_DIRS = ['data', 'json', '.git', '.github', '.opencode', '.codegraph', 'graphify-out', 'node_modules'];

function isPrivatePath(relativePath) {
  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  return segments.some((seg) => PRIVATE_DIRS.includes(seg));
}

function serveStaticFile(response, requestPath) {
  let safePath = requestPath === '/' ? '/pages/login.html' : requestPath;
  const normalizedPath = path.normalize(safePath).replace(/^\/+/, '');
  const finalPath = path.join(PUBLIC_DIR, normalizedPath);

  if (!finalPath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Acesso negado.');
    return;
  }

  if (isPrivatePath(normalizedPath)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Arquivo não encontrado.');
    return;
  }

  fs.readFile(finalPath, (error, content) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Arquivo não encontrado.');
      return;
    }

    const ext = path.extname(finalPath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ...STATIC_SECURITY_HEADERS
    });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const method = request.method || 'GET';

  if (pathname.startsWith('/api/')) {
    if (method === 'OPTIONS') {
      applyCorsHeaders(request, response);
      response.writeHead(204, API_SECURITY_HEADERS);
      response.end();
      return;
    }
  }

  if (pathname.startsWith('/api/auth/')) {
    if (method !== 'POST') {
      sendJson(request, response, { error: 'Método não permitido.' }, 405);
      return;
    }
    if (!consumeRateLimit(clientIp(request))) {
      sendJson(request, response, { error: 'Muitas tentativas. Tente novamente em alguns minutos.' }, 429);
      return;
    }
    if (pathname === '/api/auth/cadastro') {
      await handleUserRegistration(request, response);
      return;
    }
    if (pathname === '/api/auth/login') {
      await handleUserLogin(request, response);
      return;
    }
    sendJson(request, response, { error: 'Rota não encontrada.' }, 404);
    return;
  }

  if (pathname === '/api/materias') {
    sendJson(request, response, getSubjects());
    return;
  }

  const subjectMatch = pathname.match(/^\/api\/materias\/([^/]+)$/i);
  if (subjectMatch) {
    const subjectId = decodeURIComponent(subjectMatch[1]);
    const subject = getSubjectById(subjectId);

    if (!subject) {
      sendJson(request, response, { error: 'Matéria não encontrada.' }, 404);
      return;
    }

    try {
      const data = readSubjectData(subject);
      sendJson(request, response, data);
    } catch (error) {
      console.error(`Erro ao ler ${subject.fileName}:`, error.message);
      sendJson(request, response, { error: 'Não foi possível carregar a matéria.' }, 500);
    }
    return;
  }

  serveStaticFile(response, pathname);
});

ensureUsersFile();

server.listen(PORT, () => {
  console.log(`Servidor do quiz está rodando em http://localhost:${PORT}`);
  console.log(`Pastas de dados: ${DATA_DIR}`);
  console.log(`Arquivo de usuários: ${USERS_FILE}`);
});
