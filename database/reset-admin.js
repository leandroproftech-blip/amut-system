// Redefine a senha do administrador.
// Execute com: npm run reset-admin
//
// Opcional: npm run reset-admin -- MinhaNovaSenha
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@amut.org.br';
const NOVA_SENHA = process.argv[2] || 'Amut@2026';

async function resetAdmin() {
  try {
    if (!NOVA_SENHA || NOVA_SENHA.length < 6) {
      console.error('❌ A senha deve ter ao menos 6 caracteres.');
      process.exit(1);
    }

    const [usuarios] = await pool.query(
      'SELECT id, nome, email, ativo FROM usuarios WHERE email = ?',
      [ADMIN_EMAIL]
    );

    if (usuarios.length === 0) {
      console.error(`❌ Nenhum usuário encontrado com o e-mail ${ADMIN_EMAIL}.`);
      console.error('   Rode npm run seed para criar o administrador.');
      process.exit(1);
    }

    const usuario = usuarios[0];
    const senhaHash = await bcrypt.hash(NOVA_SENHA, 10);

    await pool.query(
      'UPDATE usuarios SET senha_hash = ?, ativo = 1, cargo = ? WHERE id = ?',
      [senhaHash, 'admin', usuario.id]
    );

    console.log('✅ Senha do administrador redefinida com sucesso!');
    console.log('   Nome:  ' + usuario.nome);
    console.log('   E-mail: ' + ADMIN_EMAIL);
    console.log('   Senha:  ' + NOVA_SENHA);
    console.log('   ⚠️  Troque essa senha após o login em Meu Perfil.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao redefinir senha:', err.message);
    process.exit(1);
  }
}

resetAdmin();
