const jwt = require('jsonwebtoken');

// Verifica se o token JWT enviado no header Authorization é válido
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
    }
    req.usuario = usuario; // { id, nome, email, cargo }
    next();
  });
}

// Restringe a rota a determinados cargos. Uso: permitir('admin', 'presidente')
function permitir(...cargosPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }
    if (!cargosPermitidos.includes(req.usuario.cargo)) {
      return res.status(403).json({ erro: 'Você não tem permissão para realizar esta ação.' });
    }
    next();
  };
}

module.exports = { autenticar, permitir };
