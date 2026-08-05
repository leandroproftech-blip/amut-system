const { pool } = require('../config/db');

// Campos do formulário completo da ficha de cadastro (mapeados 1:1 com o schema)
const CAMPOS_PACIENTE = [
  'numero_inscricao', 'ano_inscricao', 'data_inclusao',
  'nome', 'sexo', 'data_nascimento', 'cpf', 'idade', 'endereco', 'numero_endereco',
  'bairro', 'cidade', 'cep', 'ponto_referencia', 'foto',
  'possui_diagnostico', 'idade_diagnostico', 'descricao_diagnostico', 'nivel_suporte',
  'verbal', 'possui_comorbidade', 'qual_comorbidade', 'em_tratamento_comorbidade',
  'descricao_tratamento', 'faz_uso_medicamento', 'qual_medicamento', 'participa_terapia',
  'qual_terapia', 'onde_terapia', 'terapia_particular_ou_sus', 'participa_outros_projetos',
  'qual_outro_projeto',
  'escola_tipo', 'escola_nome', 'periodo_escolar', 'possui_pedido_medico_segundo_professor',
  'necessidade_segundo_professor_atendida', 'informacoes_escolares_adicionais',
  'imovel_tipo', 'mora_com_pai', 'mora_com_mae', 'quantidade_irmaos', 'outros_moradores',
  'quantidade_pessoas_autistas_familia', 'recebe_bolsa_familia', 'valor_bolsa_familia',
  'recebe_bpc', 'valor_bpc', 'recebe_outro_auxilio',
  'autoriza_fotos', 'contato_emergencia', 'compromete_participar_reunioes', 'informacoes_adicionais',
  'termo_aceite_nome', 'termo_aceite_cpf', 'termo_aceite_data',
  'status', 'motivo_desligamento', 'observacoes_internas'
];

function filtrarCampos(body) {
  const dados = {};
  CAMPOS_PACIENTE.forEach((campo) => {
    if (body[campo] !== undefined) {
      dados[campo] = body[campo] === '' ? null : body[campo];
    }
  });
  return dados;
}

// GET /api/pacientes?busca=&status=&pagina=&limite=
async function listar(req, res) {
  try {
    const { busca = '', status = '', pagina = 1, limite = 20 } = req.query;
    const offset = (Math.max(1, parseInt(pagina)) - 1) * parseInt(limite);

    let where = 'WHERE 1=1';
    const params = [];

    if (busca) {
      where += ' AND (p.nome LIKE ? OR p.cpf LIKE ? OR p.numero_inscricao LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }
    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT p.id, p.numero_inscricao, p.nome, p.sexo, p.data_nascimento, p.idade,
              p.cidade, p.status, p.nivel_suporte, p.criado_em,
              (SELECT nome FROM responsaveis r WHERE r.paciente_id = p.id AND r.principal = 1 LIMIT 1) AS responsavel_principal
       FROM pacientes p
       ${where}
       ORDER BY p.nome ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limite), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM pacientes p ${where}`,
      params
    );

    res.json({ dados: rows, total, pagina: parseInt(pagina), limite: parseInt(limite) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar pacientes.' });
  }
}

// GET /api/pacientes/:id
async function buscarPorId(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM pacientes WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Paciente não encontrado.' });

    const [responsaveis] = await pool.query(
      'SELECT * FROM responsaveis WHERE paciente_id = ? ORDER BY principal DESC, id ASC',
      [req.params.id]
    );

    res.json({ ...rows[0], responsaveis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar paciente.' });
  }
}

// POST /api/pacientes
async function criar(req, res) {
  const conn = await pool.getConnection();
  try {
    if (!req.body.nome) {
      return res.status(400).json({ erro: 'O nome do paciente é obrigatório.' });
    }

    const dados = filtrarCampos(req.body);
    dados.cadastrado_por = req.usuario.id;

    await conn.beginTransaction();

    const colunas = Object.keys(dados);
    const placeholders = colunas.map(() => '?').join(', ');
    const valores = colunas.map((c) => dados[c]);

    const [resultado] = await conn.query(
      `INSERT INTO pacientes (${colunas.join(', ')}) VALUES (${placeholders})`,
      valores
    );

    const pacienteId = resultado.insertId;

    if (Array.isArray(req.body.responsaveis)) {
      for (const r of req.body.responsaveis) {
        if (!r.nome) continue;
        await conn.query(
          `INSERT INTO responsaveis (paciente_id, parentesco, nome, cpf, rg, profissao, empresa, salario, telefone, email, endereco, principal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [pacienteId, r.parentesco || 'Responsável Legal', r.nome, r.cpf || null, r.rg || null,
           r.profissao || null, r.empresa || null, r.salario || null, r.telefone || null,
           r.email || null, r.endereco || null, r.principal ? 1 : 0]
        );
      }
    }

    await conn.query(
      `INSERT INTO log_atividades (usuario_id, acao, entidade, entidade_id, detalhes) VALUES (?, 'criar', 'paciente', ?, ?)`,
      [req.usuario.id, pacienteId, `Cadastro de ${dados.nome}`]
    );

    await conn.commit();
    res.status(201).json({ id: pacienteId, mensagem: 'Paciente cadastrado com sucesso.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar paciente.' });
  } finally {
    conn.release();
  }
}

// PUT /api/pacientes/:id
async function atualizar(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const [existe] = await conn.query('SELECT id FROM pacientes WHERE id = ?', [id]);
    if (!existe[0]) return res.status(404).json({ erro: 'Paciente não encontrado.' });

    const dados = filtrarCampos(req.body);
    const colunas = Object.keys(dados);

    await conn.beginTransaction();

    if (colunas.length > 0) {
      const setClause = colunas.map((c) => `${c} = ?`).join(', ');
      const valores = colunas.map((c) => dados[c]);
      await conn.query(`UPDATE pacientes SET ${setClause} WHERE id = ?`, [...valores, id]);
    }

    // Atualiza responsáveis: apaga e recria (abordagem simples e segura)
    if (Array.isArray(req.body.responsaveis)) {
      await conn.query('DELETE FROM responsaveis WHERE paciente_id = ?', [id]);
      for (const r of req.body.responsaveis) {
        if (!r.nome) continue;
        await conn.query(
          `INSERT INTO responsaveis (paciente_id, parentesco, nome, cpf, rg, profissao, empresa, salario, telefone, email, endereco, principal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, r.parentesco || 'Responsável Legal', r.nome, r.cpf || null, r.rg || null,
           r.profissao || null, r.empresa || null, r.salario || null, r.telefone || null,
           r.email || null, r.endereco || null, r.principal ? 1 : 0]
        );
      }
    }

    await conn.query(
      `INSERT INTO log_atividades (usuario_id, acao, entidade, entidade_id, detalhes) VALUES (?, 'atualizar', 'paciente', ?, ?)`,
      [req.usuario.id, id, 'Atualização de cadastro']
    );

    await conn.commit();
    res.json({ mensagem: 'Paciente atualizado com sucesso.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar paciente.' });
  } finally {
    conn.release();
  }
}

// DELETE /api/pacientes/:id
async function remover(req, res) {
  try {
    const { id } = req.params;
    const [existe] = await pool.query('SELECT nome FROM pacientes WHERE id = ?', [id]);
    if (!existe[0]) return res.status(404).json({ erro: 'Paciente não encontrado.' });

    await pool.query('DELETE FROM pacientes WHERE id = ?', [id]);
    await pool.query(
      `INSERT INTO log_atividades (usuario_id, acao, entidade, entidade_id, detalhes) VALUES (?, 'excluir', 'paciente', ?, ?)`,
      [req.usuario.id, id, `Exclusão de ${existe[0].nome}`]
    );

    res.json({ mensagem: 'Paciente removido com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover paciente.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
