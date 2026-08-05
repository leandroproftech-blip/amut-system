// Funções auxiliares de autenticação usadas em todas as páginas do painel

function getUsuarioLogado() {
  const dados = localStorage.getItem('amut_usuario');
  return dados ? JSON.parse(dados) : null;
}

function exigirLogin() {
  const token = localStorage.getItem('amut_token');
  if (!token) {
    window.location.href = `${FRONTEND_URL}/login.html`;
    return null;
  }
  return getUsuarioLogado();
}

function exigirCargo(...cargosPermitidos) {
  const usuario = exigirLogin();
  if (usuario && !cargosPermitidos.includes(usuario.cargo)) {
    alert('Você não tem permissão para acessar esta página.');
    window.location.href = `${FRONTEND_URL}/admin/dashboard.html`;
  }
  return usuario;
}

function logout() {
  localStorage.removeItem('amut_token');
  localStorage.removeItem('amut_usuario');
  window.location.href = `${FRONTEND_URL}/login.html`;
}

// Preenche o nome/cargo do usuário logado no cabeçalho do painel, se os elementos existirem
function preencherUsuarioNoHeader() {
  const usuario = getUsuarioLogado();
  if (!usuario) return;
  const nomeEl = document.getElementById('usuario-nome');
  const cargoEl = document.getElementById('usuario-cargo');
  const iniciaisEl = document.getElementById('usuario-iniciais');
  if (nomeEl) nomeEl.textContent = usuario.nome;
  if (cargoEl) cargoEl.textContent = formatarCargo(usuario.cargo);
  if (iniciaisEl) iniciaisEl.textContent = usuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // Esconde itens de menu restritos a admin
  if (usuario.cargo !== 'admin') {
    document.querySelectorAll('[data-somente-admin]').forEach(el => el.remove());
  }
}

function formatarCargo(cargo) {
  const nomes = { admin: 'Administrador(a)', presidente: 'Presidente', colaborador: 'Colaborador(a)' };
  return nomes[cargo] || cargo;
}
