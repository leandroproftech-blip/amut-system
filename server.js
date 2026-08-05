require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { testConnection } = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const responsaveisRoutes = require('./routes/responsaveis.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const eventosRoutes = require('./routes/eventos.routes');
const contribuicoesRoutes = require('./routes/contribuicoes.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

// Limite aumentado para acomodar foto em base64
app.use(express.json({ limit: '8mb' }));

app.use(express.urlencoded({
  extended: true,
  limit: '8mb'
}));

// Rota de verificação da API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mensagem: 'API do Sistema AMUT funcionando.'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/responsaveis', responsaveisRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/contribuicoes', contribuicoesRoutes);

// Disponibiliza os arquivos do frontend
app.use(express.static(
  path.join(__dirname, 'public')
));

// Tratamento exclusivo para rotas da API inexistentes
app.use('/api', (req, res) => {
  res.status(404).json({
    erro: 'Rota da API não encontrada.',
    metodo: req.method,
    rota: req.originalUrl
  });
});

// Tratamento para páginas ou arquivos inexistentes
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >
        <title>Página não encontrada</title>
      </head>

      <body style="
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 50px;
      ">
        <h1>Página não encontrada</h1>
        <p>O endereço informado não existe.</p>
        <a href="/">Voltar ao início</a>
      </body>
    </html>
  `);
});

// Tratamento genérico de erros
app.use((err, req, res, next) => {
  console.error('Erro interno:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    erro: 'Erro interno do servidor.'
  });
});

app.listen(PORT, async () => {
  console.log(
    `🚀 Sistema AMUT rodando em http://localhost:${PORT}`
  );

  await testConnection();
});