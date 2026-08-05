// Ajuste esta URL para onde o backend (API) estiver rodando.
// Em desenvolvimento local, o padrão do backend é http://localhost:3000
// const API_URL = 'http://localhost:3000/api';

// Endereço da API Node.js
const API_URL = "/api";

// Descobre automaticamente a pasta principal do frontend
function obterBaseFrontend() {
  const caminho = window.location.pathname;

  // Se estiver em uma página dentro de /admin/
  const posicaoAdmin = caminho.indexOf("/admin/");

  if (posicaoAdmin !== -1) {
    return caminho.substring(0, posicaoAdmin);
  }

  // Se estiver em login.html, index.html ou outra página da raiz do frontend
  if (caminho.endsWith("/")) {
    return caminho.replace(/\/$/, "");
  }

  return caminho.substring(0, caminho.lastIndexOf("/"));
}

const FRONTEND_URL = obterBaseFrontend();
