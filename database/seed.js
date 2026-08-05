// Cria o primeiro usuário administrador do sistema.
// Execute com: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const ADMIN_NOME = 'Administrador AMUT';
const ADMIN_EMAIL = 'admin@amut.org.br';
const ADMIN_SENHA = 'Amut@2026'; // ALTERE a senha no primeiro acesso!

async function seed() {
  try {
    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [ADMIN_EMAIL]);

    if (existentes.length > 0) {
      console.log('ℹ️  Usuário administrador já existe. Nada a fazer.');
      process.exit(0);
    }

    const senhaHash = await bcrypt.hash(ADMIN_SENHA, 10);

    await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, cargo, ativo) VALUES (?, ?, ?, 'admin', 1)`,
      [ADMIN_NOME, ADMIN_EMAIL, senhaHash]
    );

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('   E-mail: ' + ADMIN_EMAIL);
    console.log('   Senha:  ' + ADMIN_SENHA);
    console.log('   ⚠️  Troque essa senha assim que fizer o primeiro login.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao criar usuário administrador:', err.message);
    process.exit(1);
  }
}

seed();
