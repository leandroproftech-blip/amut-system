const { pool } = require('../config/db');

// GET /api/contribuicoes?busca=&mes=&pagina=&limite=
async function listar(req, res) {
  try {
    const { busca = '', mes = '', pagina = 1, limite = 20 } = req.query;
    const offset = (Math.max(1, parseInt(pagina)) - 1) * parseInt(limite);

    let where = 'WHERE 1=1';
    const params = [];

    if (busca) {
      where += ' AND (c.nome_contribuinte LIKE ? OR p.nome LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }
    if (mes) {
      where += ' AND c.mes_referencia = ?';
      params.push(mes);
    }

    const [rows] = await pool.query(
      `SELECT c.*, p.nome AS paciente_nome, r.nome AS responsavel_nome
       FROM contribuicoes c
       LEFT JOIN pacientes p ON p.id = c.paciente_id
       LEFT JOIN responsaveis r ON r.id = c.responsavel_id
       ${where}
       ORDER BY c.data_contribuicao DESC, c.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limite), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM contribuicoes c LEFT JOIN pacientes p ON p.id = c.paciente_id ${where}`,
      params
    );

    const [[{ total_valor }]] = await pool.query(
      `SELECT COALESCE(SUM(c.valor), 0) AS total_valor FROM contribuicoes c LEFT JOIN pacientes p ON p.id = c.paciente_id ${where}`,
      params
    );

    res.json({ dados: rows, total, total_valor, pagina: parseInt(pagina), limite: parseInt(limite) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar contribuições.' });
  }
}

// GET /api/contribuicoes/resumo -> totais para cards do dashboard/página
async function resumo(req, res) {
  try {
    const mesAtual = new Date().toISOString().slice(0, 7); // AAAA-MM

    const [[{ total_geral }]] = await pool.query('SELECT COALESCE(SUM(valor), 0) AS total_geral FROM contribuicoes');
    const [[{ total_mes_atual }]] = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) AS total_mes_atual FROM contribuicoes WHERE mes_referencia = ?',
      [mesAtual]
    );
    const [[{ contribuintes_mes_atual }]] = await pool.query(
      'SELECT COUNT(DISTINCT COALESCE(responsavel_id, nome_contribuinte)) AS contribuintes_mes_atual FROM contribuicoes WHERE mes_referencia = ?',
      [mesAtual]
    );

    res.json({ mes_atual: mesAtual, total_geral, total_mes_atual, contribuintes_mes_atual });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao carregar resumo de contribuições.' });
  }
}

// GET /api/contribuicoes/:id
async function buscarPorId(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, p.nome AS paciente_nome, r.nome AS responsavel_nome
       FROM contribuicoes c
       LEFT JOIN pacientes p ON p.id = c.paciente_id
       LEFT JOIN responsaveis r ON r.id = c.responsavel_id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Contribuição não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar contribuição.' });
  }
}

// POST /api/contribuicoes
async function criar(req, res) {
  try {
    const {
      responsavel_id, paciente_id, nome_contribuinte, telefone_contribuinte,
      valor, data_contribuicao, mes_referencia, forma_pagamento, observacoes
    } = req.body;

    if (!nome_contribuinte || !valor || !data_contribuicao) {
      return res.status(400).json({ erro: 'Nome do contribuinte, valor e data são obrigatórios.' });
    }

    const mesRef = mes_referencia || String(data_contribuicao).slice(0, 7);

    const [resultado] = await pool.query(
      `INSERT INTO contribuicoes
        (responsavel_id, paciente_id, nome_contribuinte, telefone_contribuinte, valor, data_contribuicao, mes_referencia, forma_pagamento, observacoes, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        responsavel_id || null, paciente_id || null, nome_contribuinte, telefone_contribuinte || null,
        valor, data_contribuicao, mesRef, forma_pagamento || 'PIX', observacoes || null, req.usuario.id
      ]
    );

    res.status(201).json({ id: resultado.insertId, mensagem: 'Contribuição registrada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar contribuição.' });
  }
}

// PUT /api/contribuicoes/:id
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const campos = ['responsavel_id', 'paciente_id', 'nome_contribuinte', 'telefone_contribuinte',
      'valor', 'data_contribuicao', 'mes_referencia', 'forma_pagamento', 'observacoes'];

    const dados = {};
    campos.forEach((c) => {
      if (req.body[c] !== undefined) dados[c] = req.body[c] === '' ? null : req.body[c];
    });

    if (Object.keys(dados).length === 0) {
      return res.status(400).json({ erro: 'Nenhum dado enviado para atualização.' });
    }

    const setClause = Object.keys(dados).map((c) => `${c} = ?`).join(', ');
    const valores = Object.values(dados);

    const [resultado] = await pool.query(`UPDATE contribuicoes SET ${setClause} WHERE id = ?`, [...valores, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Contribuição não encontrada.' });

    res.json({ mensagem: 'Contribuição atualizada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar contribuição.' });
  }
}

// DELETE /api/contribuicoes/:id
async function remover(req, res) {
  try {
    const [resultado] = await pool.query('DELETE FROM contribuicoes WHERE id = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Contribuição não encontrada.' });
    res.json({ mensagem: 'Contribuição removida com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover contribuição.' });
  }
}

module.exports = { listar, resumo, buscarPorId, criar, atualizar, remover };