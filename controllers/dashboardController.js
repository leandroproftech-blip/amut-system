const { pool } = require('../config/db');

async function resumo(req, res) {
  try {
    const [[{ total_pacientes }]] = await pool.query('SELECT COUNT(*) AS total_pacientes FROM pacientes');
    const [[{ total_ativos }]] = await pool.query("SELECT COUNT(*) AS total_ativos FROM pacientes WHERE status = 'ativo'");
    const [[{ total_responsaveis }]] = await pool.query('SELECT COUNT(*) AS total_responsaveis FROM responsaveis');
    const [[{ total_usuarios }]] = await pool.query('SELECT COUNT(*) AS total_usuarios FROM usuarios WHERE ativo = 1');

    const [porSexo] = await pool.query(
      "SELECT COALESCE(sexo, 'Não informado') AS sexo, COUNT(*) AS total FROM pacientes GROUP BY sexo"
    );
    const [porNivelSuporte] = await pool.query(
      "SELECT COALESCE(nivel_suporte, 0) AS nivel_suporte, COUNT(*) AS total FROM pacientes GROUP BY nivel_suporte"
    );
    const [porStatus] = await pool.query(
      'SELECT status, COUNT(*) AS total FROM pacientes GROUP BY status'
    );
    const [recentes] = await pool.query(
      'SELECT id, nome, status, criado_em FROM pacientes ORDER BY criado_em DESC LIMIT 5'
    );

    const [[proximoEvento]] = await pool.query(
      `SELECT id, titulo, data_evento, local FROM eventos WHERE status = 'agendado' AND data_evento >= CURDATE() ORDER BY data_evento ASC LIMIT 1`
    );

    const mesAtual = new Date().toISOString().slice(0, 7);
    const [[{ total_contribuicoes_mes }]] = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) AS total_contribuicoes_mes FROM contribuicoes WHERE mes_referencia = ?',
      [mesAtual]
    );

    const [[{ total_desligados_faltas }]] = await pool.query(
      "SELECT COUNT(*) AS total_desligados_faltas FROM pacientes WHERE motivo_desligamento LIKE '%faltas consecutivas%'"
    );

    res.json({
      total_pacientes,
      total_ativos,
      total_responsaveis,
      total_usuarios,
      por_sexo: porSexo,
      por_nivel_suporte: porNivelSuporte,
      por_status: porStatus,
      cadastros_recentes: recentes,
      proximo_evento: proximoEvento || null,
      total_contribuicoes_mes,
      total_desligados_faltas
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao carregar dados do painel.' });
  }
}

module.exports = { resumo };