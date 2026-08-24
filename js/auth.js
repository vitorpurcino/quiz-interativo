const AUTH_KEY = 'quizAuthUser';

// API base para apontar o frontend ao backend hospedado (ex: https://meu-backend.example.com)
// Caso não seja definido, o código usará paths relativos (mesma origem).
const API_BASE = (window.API_BASE || '').replace(/\/+$/, '');

function apiUrl(path) {
  if (!API_BASE) return path;
  return API_BASE + (path.startsWith('/') ? path : '/' + path);
}

const getAuthenticatedUser = () => {
  try {
    const item = localStorage.getItem(AUTH_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.warn('Não foi possível ler a sessão do usuário:', error);
    return null;
  }
};

const redirectIfUnauthenticated = () => {
  const currentPath = window.location.pathname;
  const isRootPage = currentPath === '/' || (currentPath.endsWith('/') && !currentPath.endsWith('/index.html'));
  const isQuizPage = currentPath.endsWith('/index.html');
  const isAuthPage = currentPath.endsWith('/pages/login.html') || currentPath.endsWith('/pages/cadastro.html');
  const user = getAuthenticatedUser();

  if (isRootPage && !user) {
    window.location.replace('./pages/login.html');
    return true;
  }

  if (isQuizPage && !user) {
    window.location.replace('./pages/login.html');
    return true;
  }

  if (isAuthPage && user) {
    return false;
  }

  return false;
};

const showAlreadyLoggedInMessage = () => {
  const user = getAuthenticatedUser();
  const messageEl = document.querySelector('.auth-message');

  if (!user || !messageEl) {
    return false;
  }

  const displayName = user.nome ? user.nome.split(' ')[0] : (user.usuario || 'usuário');
  setMessage(messageEl, `Você já está logado como ${displayName}. Redirecionando...`, 'success');

  setTimeout(() => {
    window.location.replace('../index.html');
  }, 1200);

  return true;
};

const logoutUser = () => {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = './pages/login.html';
};

window.logoutUser = logoutUser;

const setMessage = (messageEl, text, type = 'success') => {
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.classList.remove('success', 'error', 'visible');
  messageEl.classList.add(type, 'visible');
};

const clearMessage = (messageEl) => {
  if (!messageEl) return;
  messageEl.textContent = '';
  messageEl.classList.remove('success', 'error', 'visible');
};

const handleAuthSubmit = async (event, endpoint, successMessage, redirectUrl) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const messageEl = form.querySelector('.auth-message');

  if (!button) return;

  clearMessage(messageEl);
  button.disabled = true;
  button.textContent = 'Enviando...';

  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Não foi possível concluir a operação.');
    }

    setMessage(messageEl, result.message || successMessage, 'success');

    if (result.user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(result.user));
    }

    setTimeout(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }, 700);
  } catch (error) {
    setMessage(messageEl, error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = button.dataset.defaultText || button.textContent;
  }
};

const initPasswordToggle = () => {
  document.querySelectorAll('.password-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.textContent = isPassword ? '🙈' : '👁️';
      button.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    });
  });
};

const initAuthForms = () => {
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath.endsWith('/pages/login.html') || currentPath.endsWith('/pages/cadastro.html');

  if (isAuthPage && getAuthenticatedUser()) {
    if (showAlreadyLoggedInMessage()) {
      return;
    }
  }

  if (redirectIfUnauthenticated()) {
    return;
  }

  initPasswordToggle();

  const loginForm = document.querySelector('#loginForm');
  const registerForm = document.querySelector('#cadastroForm');

  if (loginForm) {
    const loginButton = loginForm.querySelector('button[type="submit"]');
    if (loginButton) {
      loginButton.dataset.defaultText = loginButton.textContent;
    }

    loginForm.addEventListener('submit', async (event) => {
      await handleAuthSubmit(event, apiUrl('/api/auth/login'), 'Login realizado com sucesso.', '../index.html');
    });
  }

  if (registerForm) {
    const registerButton = registerForm.querySelector('button[type="submit"]');
    if (registerButton) {
      registerButton.dataset.defaultText = registerButton.textContent;
    }

    registerForm.addEventListener('submit', async (event) => {
      await handleAuthSubmit(event, apiUrl('/api/auth/cadastro'), 'Cadastro realizado com sucesso.', './login.html');
    });
  }
};

window.addEventListener('DOMContentLoaded', initAuthForms);
