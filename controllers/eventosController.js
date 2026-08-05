const { pool } = require('../config/db');

const MOTIVO_DESLIGAMENTO_AUTOMATICO = 'Desligamento automático: 3 faltas consecutivas em eventos';

// GET /api/eventos?busca=&status=&pagina=&limite=
async function listar(req, res) {
  try {
    const { busca = '', status = '', pagina = 1, limite = 20 } = req.query;
    const offset = (Math.max(1, parseInt(pagina)) - 1) * parseInt(limite);

    let where = 'WHERE 1=1';
    const params = [];

    if (busca) {
      where += ' AND (e.titulo LIKE ? OR e.local LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }
    if (status) {
      where += ' AND e.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM evento_presencas ep WHERE ep.evento_id = e.id AND ep.presente = 1) AS total_presentes,
              (SELECT COUNT(*) FROM evento_presencas ep WHERE ep.evento_id = e.id AND ep.presente = 0) AS total_ausentes
       FROM eventos e
       ${where}
       ORDER BY e.data_evento DESC, e.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limite), offset]
    );

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM eventos e ${where}`, params);

    res.json({ dados: rows, total, pagina: parseInt(pagina), limite: parseInt(limite) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar eventos.' });
  }
}

// GET /api/eventos/:id  -> dados do evento + lista de pacientes ativos com presença marcada (se houver)
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const [eventos] = await pool.query('SELECT * FROM eventos WHERE id = ?', [id]);
    if (!eventos[0]) return res.status(404).json({ erro: 'Evento não encontrado.' });

    // Pacientes ativos + já desligados que já tenham alguma presença registrada neste evento (edge case)
    const [pacientes] = await pool.query(
      `SELECT p.id, p.nome, p.status,
              ep.presente, ep.justificativa
       FROM pacientes p
       LEFT JOIN evento_presencas ep ON ep.paciente_id = p.id AND ep.evento_id = ?
       WHERE p.status = 'ativo' OR ep.id IS NOT NULL
       ORDER BY p.nome ASC`,
      [id]
    );

    res.json({ ...eventos[0], pacientes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar evento.' });
  }
}

// POST /api/eventos
async function criar(req, res) {
  try {
    const { titulo, descricao, data_evento, hora_evento, local, status } = req.body;
    if (!titulo || !data_evento) {
      return res.status(400).json({ erro: 'Título e data do evento são obrigatórios.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO eventos (titulo, descricao, data_evento, hora_evento, local, status, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descricao || null, data_evento, hora_evento || null, local || null, status || 'agendado', req.usuario.id]
    );

    res.status(201).json({ id: resultado.insertId, mensagem: 'Evento criado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar evento.' });
  }
}

// PUT /api/eventos/:id
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, data_evento, hora_evento, local, status } = req.body;

    const campos = [];
    const valores = [];
    if (titulo !== undefined) { campos.push('titulo = ?'); valores.push(titulo); }
    if (descricao !== undefined) { campos.push('descricao = ?'); valores.push(descricao || null); }
    if (data_evento !== undefined) { campos.push('data_evento = ?'); valores.push(data_evento); }
    if (hora_evento !== undefined) { campos.push('hora_evento = ?'); valores.push(hora_evento || null); }
    if (local !== undefined) { campos.push('local = ?'); valores.push(local || null); }
    if (status !== undefined) { campos.push('status = ?'); valores.push(status); }

    if (campos.length === 0) return res.status(400).json({ erro: 'Nenhum dado enviado para atualização.' });

    const [resultado] = await pool.query(`UPDATE eventos SET ${campos.join(', ')} WHERE id = ?`, [...valores, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Evento não encontrado.' });

    res.json({ mensagem: 'Evento atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar evento.' });
  }
}

// DELETE /api/eventos/:id
async function remover(req, res) {
  try {
    const [resultado] = await pool.query('DELETE FROM eventos WHERE id = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Evento não encontrado.' });
    res.json({ mensagem: 'Evento removido com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover evento.' });
  }
}

// Verifica se o paciente atingiu 3 faltas consecutivas (considerando apenas eventos "realizado")
// e, em caso positivo, marca o cadastro como inativo automaticamente.
async function verificarDesligamentoPorFaltas(conn, pacienteId) {
  const [presencas] = await conn.query(
    `SELECT ep.presente
     FROM evento_presencas ep
     JOIN eventos e ON e.id = ep.evento_id
     WHERE ep.paciente_id = ? AND e.status = 'realizado'
     ORDER BY e.data_evento DESC, e.id DESC
     LIMIT 3`,
    [pacienteId]
  );

  if (presencas.length === 3 && presencas.every((p) => p.presente === 0)) {
    await conn.query(
      `UPDATE pacientes SET status = 'inativo', motivo_desligamento = ? WHERE id = ? AND status = 'ativo'`,
      [MOTIVO_DESLIGAMENTO_AUTOMATICO, pacienteId]
    );
    return true;
  }
  return false;
}

// POST /api/eventos/:id/presencas
// Body: { presencas: [{ paciente_id, presente, justificativa }, ...] }
async function registrarPresencas(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { presencas } = req.body;

    if (!Array.isArray(presencas) || presencas.length === 0) {
      return res.status(400).json({ erro: 'Envie a lista de presenças a registrar.' });
    }

    const [eventoRows] = await conn.query('SELECT * FROM eventos WHERE id = ?', [id]);
    if (!eventoRows[0]) return res.status(404).json({ erro: 'Evento não encontrado.' });

    await conn.beginTransaction();

    const pacientesDesligados = [];

    for (const item of presencas) {
      if (!item.paciente_id) continue;
      const presente = item.presente ? 1 : 0;

      await conn.query(
        `INSERT INTO evento_presencas (evento_id, paciente_id, presente, justificativa, registrado_por)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE presente = VALUES(presente), justificativa = VALUES(justificativa), registrado_por = VALUES(registrado_por)`,
        [id, item.paciente_id, presente, item.justificativa || null, req.usuario.id]
      );
    }

    // Marca o evento como realizado (a presença só é levada em conta para o cálculo de faltas em eventos realizados)
    await conn.query(`UPDATE eventos SET status = 'realizado' WHERE id = ?`, [id]);

    // Verifica desligamento automático apenas para quem foi marcado ausente nesta rodada
    for (const item of presencas) {
      if (!item.paciente_id || item.presente) continue;
      const desligado = await verificarDesligamentoPorFaltas(conn, item.paciente_id);
      if (desligado) {
        const [[paciente]] = await conn.query('SELECT nome FROM pacientes WHERE id = ?', [item.paciente_id]);
        pacientesDesligados.push({ id: item.paciente_id, nome: paciente ? paciente.nome : '' });
      }
    }

    await conn.commit();
    res.json({
      mensagem: 'Presenças registradas com sucesso.',
      pacientes_desligados: pacientesDesligados
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar presenças.' });
  } finally {
    conn.release();
  }
}

// GET /api/eventos/paciente/:pacienteId -> histórico de presenças de um paciente
async function historicoPorPaciente(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT e.id AS evento_id, e.titulo, e.data_evento, e.status AS status_evento, ep.presente, ep.justificativa
       FROM evento_presencas ep
       JOIN eventos e ON e.id = ep.evento_id
       WHERE ep.paciente_id = ?
       ORDER BY e.data_evento DESC`,
      [req.params.pacienteId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar histórico de presenças.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover, registrarPresencas, historicoPorPaciente };