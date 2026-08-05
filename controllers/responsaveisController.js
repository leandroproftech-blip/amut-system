const { pool } = require('../config/db');

// GET /api/responsaveis?busca=
// Lista todos os responsáveis cadastrados, já com o nome do paciente vinculado
async function listar(req, res) {
  try {
    const { busca = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (busca) {
      where += ' AND (r.nome LIKE ? OR r.cpf LIKE ? OR p.nome LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    const [rows] = await pool.query(
      `SELECT r.*, p.nome AS paciente_nome, p.id AS paciente_id
       FROM responsaveis r
       JOIN pacientes p ON p.id = r.paciente_id
       ${where}
       ORDER BY r.nome ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar responsáveis.' });
  }
}

// GET /api/responsaveis/:id
async function buscarPorId(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, p.nome AS paciente_nome FROM responsaveis r JOIN pacientes p ON p.id = r.paciente_id WHERE r.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Responsável não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar responsável.' });
  }
}

// PUT /api/responsaveis/:id  (edição avulsa de um responsável específico)
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const campos = ['parentesco', 'nome', 'cpf', 'rg', 'profissao', 'empresa', 'salario', 'telefone', 'email', 'endereco', 'principal'];
    const dados = {};
    campos.forEach((c) => {
      if (req.body[c] !== undefined) dados[c] = req.body[c] === '' ? null : req.body[c];
    });

    if (Object.keys(dados).length === 0) {
      return res.status(400).json({ erro: 'Nenhum dado enviado para atualização.' });
    }

    const setClause = Object.keys(dados).map((c) => `${c} = ?`).join(', ');
    const valores = Object.values(dados);

    const [resultado] = await pool.query(`UPDATE responsaveis SET ${setClause} WHERE id = ?`, [...valores, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Responsável não encontrado.' });

    res.json({ mensagem: 'Responsável atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar responsável.' });
  }
}

// DELETE /api/responsaveis/:id
async function remover(req, res) {
  try {
    const [resultado] = await pool.query('DELETE FROM responsaveis WHERE id = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Responsável não encontrado.' });
    res.json({ mensagem: 'Responsável removido com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover responsável.' });
  }
}

module.exports = { listar, buscarPorId, atualizar, remover };
