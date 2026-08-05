// Wrapper simples em torno do fetch para chamar a API com o token JWT
async function apiRequest(caminho, { method = 'GET', body = null, autenticado = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (autenticado) {
    const token = localStorage.getItem('amut_token');
    if (!token) {
      window.location.href = `${FRONTEND_URL}/login.html`;
      return;
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  // Sessão expirada ou inválida
  if (resposta.status === 401 || resposta.status === 403) {
    const dados = await resposta.json().catch(() => ({}));
    if (dados.erro && dados.erro.includes('Token')) {
      localStorage.removeItem('amut_token');
      localStorage.removeItem('amut_usuario');
      window.location.href = `${FRONTEND_URL}/login.html`;
      return;
    }
    throw new Error(dados.erro || 'Acesso negado.');
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Ocorreu um erro ao comunicar com o servidor.');
  }

  return dados;
}

const api = {
  get: (caminho) => apiRequest(caminho, { method: 'GET' }),
  post: (caminho, body) => apiRequest(caminho, { method: 'POST', body }),
  put: (caminho, body) => apiRequest(caminho, { method: 'PUT', body }),
  delete: (caminho) => apiRequest(caminho, { method: 'DELETE' })
};
