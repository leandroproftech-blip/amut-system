const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// GET /api/usuarios
async function listar(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, cargo, telefone, ativo, ultimo_login, criado_em FROM usuarios ORDER BY nome ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar usuários.' });
  }
}

// GET /api/usuarios/:id
async function buscarPorId(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, cargo, telefone, ativo, ultimo_login, criado_em FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
}

// POST /api/usuarios
async function criar(req, res) {
  try {
    const { nome, email, senha, cargo, telefone } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter ao menos 6 caracteres.' });
    }

    const [existente] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente[0]) {
      return res.status(409).json({ erro: 'Já existe um usuário com este e-mail.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const cargoFinal = ['admin', 'presidente', 'colaborador'].includes(cargo) ? cargo : 'colaborador';

    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo, telefone, ativo) VALUES (?, ?, ?, ?, ?, 1)',
      [nome, email, senhaHash, cargoFinal, telefone || null]
    );

    res.status(201).json({ id: resultado.insertId, mensagem: 'Usuário criado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar usuário.' });
  }
}

// PUT /api/usuarios/:id
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { nome, email, cargo, telefone, ativo, senha } = req.body;

    const campos = [];
    const valores = [];

    if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome); }
    if (email !== undefined) { campos.push('email = ?'); valores.push(email); }
    if (cargo !== undefined) { campos.push('cargo = ?'); valores.push(cargo); }
    if (telefone !== undefined) { campos.push('telefone = ?'); valores.push(telefone || null); }
    if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo ? 1 : 0); }

    if (senha) {
      if (senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter ao menos 6 caracteres.' });
      const senhaHash = await bcrypt.hash(senha, 10);
      campos.push('senha_hash = ?');
      valores.push(senhaHash);
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum dado enviado para atualização.' });
    }

    const [resultado] = await pool.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, [...valores, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    res.json({ mensagem: 'Usuário atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
  }
}

// DELETE /api/usuarios/:id
async function remover(req, res) {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({ erro: 'Você não pode excluir seu próprio usuário.' });
    }

    const [resultado] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    res.json({ mensagem: 'Usuário removido com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover usuário.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
