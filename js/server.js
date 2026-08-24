const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 8000;
const ROOT_DIR = path.join(__dirname, '..');
const ALTERNATE_DATA_DIR = path.join(ROOT_DIR, 'json');
const DATA_DIR = fs.existsSync(ALTERNATE_DATA_DIR) ? ALTERNATE_DATA_DIR : ROOT_DIR;
const PUBLIC_DIR = ROOT_DIR;
const USERS_DATA_DIR = path.join(ROOT_DIR, 'data');
const USERS_FILE = path.join(USERS_DATA_DIR, 'users.json');

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

function getSubjects() {
  return getSubjectFiles()
    .map((fileName) => {
      const absolutePath = path.join(DATA_DIR, fileName);
      try {
        const raw = fs.readFileSync(absolutePath, 'utf8');
        const parsed = JSON.parse(raw);
        const title = parsed?.config?.titulo || parsed?.titulo || fileName.replace(/\.json$/i, '');
        const subtitle = parsed?.config?.subtitulo || parsed?.subtitulo || 'Questões de estudo';
        const count = Array.isArray(parsed?.questoes) ? parsed.questoes.length : 0;
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

function sendJson(response, payload, statusCode = 200) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
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
    const senha = String(body.senha || '').trim();

    if (!nome || !email || !usuario || !senha) {
      sendJson(response, { error: 'Preencha nome, e-mail, usuário e senha.' }, 400);
      return;
    }

    const users = readUsersFile();
    const emailJaExiste = users.some((user) => user.email?.toLowerCase() === email.toLowerCase());
    const usuarioJaExiste = users.some((user) => user.usuario?.toLowerCase() === usuario.toLowerCase());

    if (emailJaExiste || usuarioJaExiste) {
      sendJson(response, { error: 'E-mail ou usuário já cadastrado.' }, 409);
      return;
    }

    const novoUsuario = {
      id: `user_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      nome,
      email,
      usuario,
      senha,
      criadoEm: new Date().toISOString()
    };

    users.push(novoUsuario);
    writeUsersFile(users);

    sendJson(response, {
      success: true,
      message: 'Cadastro realizado com sucesso.',
      user: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        usuario: novoUsuario.usuario
      }
    }, 201);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error.message);
    sendJson(response, { error: error.message || 'Não foi possível cadastrar o usuário.' }, 400);
  }
}

async function handleUserLogin(request, response) {
  try {
    const body = await parseJsonBody(request);
    const usuario = String(body.usuario || '').trim();
    const senha = String(body.senha || '').trim();

    if (!usuario || !senha) {
      sendJson(response, { error: 'Informe usuário e senha.' }, 400);
      return;
    }

    const users = readUsersFile();
    const usuarioEncontrado = users.find((user) => user.usuario?.toLowerCase() === usuario.toLowerCase());

    if (!usuarioEncontrado || usuarioEncontrado.senha !== senha) {
      sendJson(response, { error: 'Credenciais inválidas.' }, 401);
      return;
    }

    sendJson(response, {
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
    sendJson(response, { error: error.message || 'Não foi possível autenticar o usuário.' }, 400);
  }
}

function serveStaticFile(response, requestPath) {
  const safePath = requestPath === '/' ? '/pages/login.html' : requestPath;
  const normalizedPath = path.normalize(safePath).replace(/^\/+/, '');
  const finalPath = path.join(PUBLIC_DIR, normalizedPath);

  if (!finalPath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Acesso negado.');
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
      'Cache-Control': 'no-cache'
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === '/api/auth/cadastro' && request.method === 'POST') {
    handleUserRegistration(request, response);
    return;
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    handleUserLogin(request, response);
    return;
  }

  if (pathname === '/api/materias') {
    sendJson(response, getSubjects());
    return;
  }

  const subjectMatch = pathname.match(/^\/api\/materias\/([^/]+)$/i);
  if (subjectMatch) {
    const subjectId = decodeURIComponent(subjectMatch[1]);
    const subject = getSubjectById(subjectId);

    if (!subject) {
      sendJson(response, { error: 'Matéria não encontrada.' }, 404);
      return;
    }

    try {
      const data = readSubjectData(subject);
      sendJson(response, data);
    } catch (error) {
      console.error(`Erro ao ler ${subject.fileName}:`, error.message);
      sendJson(response, { error: `Não foi possível carregar a matéria ${subject.fileName}.` }, 500);
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
