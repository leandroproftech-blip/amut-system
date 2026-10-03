// Módulo de impressão: Comprovante de Cadastro/Inclusão e Ficha Completa do paciente

let _logoDataUrlCache = null;
async function obterLogoDataUrl() {
  if (_logoDataUrlCache) return _logoDataUrlCache;
  try {
    const resposta = await fetch('../assets/img/logo.png');
    const blob = await resposta.blob();
    _logoDataUrlCache = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    _logoDataUrlCache = null;
  }
  return _logoDataUrlCache;
}

function formatarDataBR(data) {
  if (!data) return '_____/_____/________';
  const d = new Date(data.length <= 10 ? data + 'T00:00:00' : data);
  if (isNaN(d)) return '_____/_____/________';
  return d.toLocaleDateString('pt-BR');
}

function formatarSimNao(valor) {
  if (valor === 1 || valor === '1' || valor === true) return 'Sim';
  if (valor === 0 || valor === '0' || valor === false) return 'Não';
  return '-';
}

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') return '-';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarValorCampo(valor, tipo) {
  if (tipo === 'data') return valor ? formatarDataBR(valor) : '-';
  if (tipo === 'simnao') return formatarSimNao(valor);
  if (tipo === 'moeda') return formatarMoeda(valor);
  if (valor === null || valor === undefined || valor === '') return '-';
  return valor;
}

function abrirJanelaImpressao(titulo, conteudoHtml) {
  const janela = window.open('', '_blank', 'width=950,height=750');
  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 0; }
        .folha { max-width: 780px; margin: 0 auto; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body>
      <div class="folha">${conteudoHtml}</div>
      <script>
        window.onload = function () {
          setTimeout(function () { window.print(); }, 300);
        };
      </script>
    </body>
    </html>
  `);
  janela.document.close();
}

// =====================================================================
// COMPROVANTE DE CADASTRO / INCLUSÃO NA AMUT (modelo oficial)
// =====================================================================
async function imprimirComprovante(pacienteId) {
  try {
    const p = await api.get(`/pacientes/${pacienteId}`);
    const logo = await obterLogoDataUrl();

    const numeroInscricao = p.numero_inscricao ? p.numero_inscricao : '____';
    const ano = p.ano_inscricao ? p.ano_inscricao : '202__';

    const html = `
      <div style="border:2px solid #000; margin-top: 20px;">
        <!-- Cabeçalho -->
        <div style="background:#bfbfbf; border-bottom:2px solid #000; text-align:center; padding:8px 10px;">
          <strong style="font-size:16px; letter-spacing:.5px;">COMPROVANTE DE CADASTRO/INCLUSÃO NA AMUTEA</strong>
        </div>

        <!-- Corpo principal -->
        <div style="position:relative; padding:22px 24px 10px 24px; min-height:210px;">
          ${logo ? `<img src="${logo}" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:230px; opacity:.16; pointer-events:none;">` : ''}

          <div style="position:relative; font-size:14px; margin-bottom:26px;">
            <strong>Nome da pessoa com TEA:</strong>
            <span style="display:inline-block; border-bottom:1px solid #000; min-width:520px; padding-bottom:2px; margin-left:6px;">
              ${p.nome || ''}
            </span>
          </div>

          <div style="position:relative; font-size:14px; display:flex; justify-content:space-between; margin-bottom:60px;">
            <span><strong>Nº de Inscrição:</strong> ${numeroInscricao}/${ano}</span>
            <span><strong>Data da Inclusão:</strong> ${formatarDataBR(p.data_inclusao)}</span>
          </div>

          <div style="position:relative; text-align:center; font-size:13px;">
            <div style="border-bottom:1px solid #000; width:320px; margin:0 auto 4px auto; height:26px;"></div>
            Ass. Colaborador(a) da AMUT
          </div>
        </div>

        <!-- Declaração -->
        <div style="border-top:2px solid #000; padding:16px 24px 26px 24px; font-size:13px; line-height:1.6; text-align:justify;">
          Declaro que estou ciente de que, ao ser convocado(a) para reuniões ou eventos da
          <strong>Associação Mães Unidas pelo TEA</strong>, a ocorrência de <strong>três faltas consecutivas</strong>,
          minhas ou do(a) meu(minha) filho(a), <strong>sem justificativa</strong>, resultará
          <strong>automaticamente no desligamento do(a) meu(minha) filho(a) do projeto</strong>.

          <div style="text-align:center; margin-top:46px;">
            <div style="border-bottom:1px solid #000; width:360px; margin:0 auto 4px auto;"></div>
            Ass. do responsável da pessoa com TEA
          </div>
        </div>
      </div>
      <p style="text-align:center; font-size:11px; color:#666; margin-top:14px;">
        Emitido pelo sistema de gestão da AMUT em ${new Date().toLocaleDateString('pt-BR')}
      </p>
    `;

    abrirJanelaImpressao(`Comprovante - ${p.nome}`, html);
  } catch (err) {
    alert('Erro ao gerar comprovante: ' + err.message);
  }
}


// =====================================================================
// FICHA COMPLETA DE CADASTRO (segue o modelo oficial da AMUT)
// =====================================================================

function cx(condicao) {
  return condicao ? '☒' : '☐';
}
function simMarcado(valor) { return valor === 1 || valor === '1' || valor === true; }
function naoMarcado(valor) { return valor === 0 || valor === '0' || valor === false; }

function campoLinha(label, valor, minWidth) {
  return `<span style="white-space:nowrap;"><strong>${label}:</strong>
    <span style="display:inline-block; border-bottom:1px solid #000; min-width:${minWidth || 140}px; padding:0 4px;">${valor || '&nbsp;'}</span></span>`;
}

function acharResponsavelPorParentesco(responsaveis, parentesco) {
  return (responsaveis || []).find((r) => r.parentesco === parentesco) || {};
}

function tituloSecao(texto) {
  return `<div style="background:#d9d9d9; border:1px solid #000; border-bottom:none; padding:4px 8px; font-weight:bold; font-size:12.5px;">${texto}</div>`;
}

function gerarFichaHTML(p, logo) {
  const responsaveis = p.responsaveis || [];
  const pai = acharResponsavelPorParentesco(responsaveis, 'Pai');
  const mae = acharResponsavelPorParentesco(responsaveis, 'Mãe');
  const principal = responsaveis.find((r) => r.principal) || responsaveis[0] || {};
  const nomeTermo = p.termo_aceite_nome || principal.nome || '';
  const cpfTermo = p.termo_aceite_cpf || principal.cpf || '';

  const logoImg = logo ? `<img src="${logo}" style="height:56px; display:block; margin:0 auto 4px auto;">` : '';

  const fotoPacienteHtml = p.foto
    ? `<img src="${p.foto}" style="width:60px; height:70px; object-fit:cover; border:1px solid #999; flex-shrink:0;">`
    : `<div style="width:60px; height:70px; border:1px solid #999; display:flex; align-items:center; justify-content:center; font-size:10px; color:#888; text-align:center; flex-shrink:0;">3x4</div>`;

  const cabecalho = (mostrarTitulo) => `
    <div style="display:flex; align-items:flex-start; gap:14px; margin-bottom:10px;">
      ${fotoPacienteHtml}
      <div style="flex:1; text-align:center;">
        ${logoImg}
        <div style="font-weight:bold; font-size:15px;">ASSOCIAÇÃO MÃES UNIDAS PELO TEA</div>
        <div style="font-size:12px;">Lábrea - Amazonas</div>
        ${mostrarTitulo ? '<div style="font-weight:bold; font-size:13px; margin-top:8px;">FICHA DE CADASTRO – ATENDIMENTO no AMUT</div>' : ''}
      </div>
      <div style="width:60px;"></div>
    </div>`;

  const linhaBox = (conteudo) => `<div style="border:1px solid #000; border-top:none; padding:5px 8px; font-size:12px; line-height:1.5;">${conteudo}</div>`;

  // ---------------- PÁGINA 1 ----------------
  let pagina1 = cabecalho(true);
  pagina1 += `
    <div style="font-size:12.5px; display:flex; justify-content:space-between; margin:10px 0 14px 0;">
      <span>${campoLinha('Nº de Inscrição', (p.numero_inscricao || '') + (p.ano_inscricao ? '/' + p.ano_inscricao : '/202__'), 100)}</span>
      <span>${campoLinha('Data da Inclusão', formatarDataBR(p.data_inclusao), 110)}</span>
    </div>`;

  pagina1 += tituloSecao('1 Informações Pessoais (da Pessoa com TEA)');
  pagina1 += linhaBox(`
    <div style="display:flex; justify-content:space-between; gap:10px;">
      ${campoLinha('Nome', p.nome, 420)}
      <span><strong>Sexo:</strong> F (${cx(p.sexo === 'F')}) &nbsp; M (${cx(p.sexo === 'M')})</span>
    </div>`);
  pagina1 += linhaBox(`
    <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
      ${campoLinha('Data de Nascimento', formatarDataBR(p.data_nascimento), 110)}
      ${campoLinha('CPF', p.cpf, 170)}
      ${campoLinha('Idade', p.idade, 60)}
    </div>`);
  pagina1 += linhaBox(`
    <div style="display:flex; justify-content:space-between; gap:10px;">
      ${campoLinha('Endereço', p.endereco, 380)}
      ${campoLinha('Nº', p.numero_endereco, 60)}
    </div>`);
  pagina1 += linhaBox(`
    <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
      ${campoLinha('Bairro', p.bairro, 220)}
      ${campoLinha('Cidade', p.cidade || 'Lábrea-AM', 120)}
      ${campoLinha('CEP', p.cep || '69830-000', 90)}
    </div>`);
  pagina1 += linhaBox(campoLinha('Ponto de Referência', p.ponto_referencia, 500));

  pagina1 += tituloSecao('2 Informações quanto a pessoa com TEA');
  pagina1 += linhaBox(`<strong>Já possui diagnóstico:</strong> (${cx(simMarcado(p.possui_diagnostico))}) Sim &nbsp; (${cx(naoMarcado(p.possui_diagnostico))}) Não`);
  pagina1 += linhaBox(campoLinha('Com que idade descobriu o TEA', p.idade_diagnostico, 300));
  pagina1 += linhaBox(`<strong>Qual a descrição do diagnóstico:</strong><br><span style="display:inline-block; min-height:34px; border-bottom:1px solid #000; width:100%; padding-top:4px;">${p.descricao_diagnostico || ''}</span>`);
  pagina1 += linhaBox(`<strong>Nível de suporte:</strong> (${cx(String(p.nivel_suporte) === '1')}) 1 &nbsp; (${cx(String(p.nivel_suporte) === '2')}) 2 &nbsp; (${cx(String(p.nivel_suporte) === '3')}) 3`);
  pagina1 += linhaBox(`<strong>É verbal:</strong> (${cx(simMarcado(p.verbal))}) Sim &nbsp; (${cx(naoMarcado(p.verbal))}) Não`);
  pagina1 += linhaBox(`<strong>Possui comorbidade?</strong> (${cx(naoMarcado(p.possui_comorbidade))}) Não &nbsp; (${cx(simMarcado(p.possui_comorbidade))}) Sim. Qual? ${campoLinha('', p.qual_comorbidade, 260)}`);
  pagina1 += linhaBox(`<strong>Está em tratamento da comorbidade:</strong> (${cx(simMarcado(p.em_tratamento_comorbidade))}) Sim &nbsp; (${cx(naoMarcado(p.em_tratamento_comorbidade))}) Não<br><strong>Descreva o tratamento:</strong> ${p.descricao_tratamento || ''}`);
  pagina1 += linhaBox(`<strong>Faz uso de medicamento?</strong> (${cx(naoMarcado(p.faz_uso_medicamento))}) Não &nbsp; (${cx(simMarcado(p.faz_uso_medicamento))}) Sim. Qual? ${campoLinha('', p.qual_medicamento, 260)}`);
  pagina1 += linhaBox(`
    <strong>Participa de alguma terapia:</strong> (${cx(simMarcado(p.participa_terapia))}) Sim &nbsp; (${cx(naoMarcado(p.participa_terapia))}) Não<br>
    <strong>Qual?</strong> ${p.qual_terapia || ''}<br>
    <strong>Onde?</strong> ${p.onde_terapia || ''}<br>
    <strong>É particular ou via SUS?</strong> ${p.terapia_particular_ou_sus || ''}`);
  pagina1 += linhaBox(`<strong>Participa de outros projetos sociais:</strong> (${cx(naoMarcado(p.participa_outros_projetos))}) Não &nbsp; (${cx(simMarcado(p.participa_outros_projetos))}) Sim. Qual? ${p.qual_outro_projeto || ''}`);

  // ---------------- PÁGINA 2 ----------------
  let pagina2 = cabecalho(false);

  pagina2 += tituloSecao('3 Informações escolares');
  pagina2 += linhaBox(`<strong>Estuda em escola:</strong> (${cx(p.escola_tipo === 'Privada')}) Privada &nbsp; (${cx(p.escola_tipo === 'Estadual')}) Estadual &nbsp; (${cx(p.escola_tipo === 'Municipal')}) Municipal &nbsp; (${cx(p.escola_tipo === 'Não estuda')}) Não estuda`);
  pagina2 += linhaBox(campoLinha('Qual', p.escola_nome, 400));
  pagina2 += linhaBox(`<strong>Período:</strong> (${cx(p.periodo_escolar === 'Matutino')}) Matutino &nbsp; (${cx(p.periodo_escolar === 'Vespertino')}) Vespertino &nbsp; (${cx(p.periodo_escolar === 'Integral')}) Integral`);
  pagina2 += linhaBox(`<strong>Tem pedido médico comprovando a necessidade de segundo professor?</strong> (${cx(simMarcado(p.possui_pedido_medico_segundo_professor))}) Sim &nbsp; (${cx(naoMarcado(p.possui_pedido_medico_segundo_professor))}) Não`);
  pagina2 += linhaBox(`<strong>Caso sim, a necessidade foi atendida?</strong> (${cx(simMarcado(p.necessidade_segundo_professor_atendida))}) Sim &nbsp; (${cx(naoMarcado(p.necessidade_segundo_professor_atendida))}) Não`);
  pagina2 += linhaBox(campoLinha('Informações adicionais', p.informacoes_escolares_adicionais, 400));

  pagina2 += tituloSecao('4 Informações Habitacional');
  pagina2 += linhaBox(`<strong>O imóvel é:</strong> (${cx(p.imovel_tipo === 'Próprio')}) Próprio &nbsp; (${cx(p.imovel_tipo === 'Alugado')}) Alugado &nbsp; (${cx(p.imovel_tipo === 'Cedido')}) Cedido &nbsp; (${cx(p.imovel_tipo === 'Próprio Financiado')}) Próprio Financiado`);
  pagina2 += linhaBox(`<strong>Quantas pessoas moram na residência?</strong> (${cx(simMarcado(p.mora_com_pai))}) Pai &nbsp; (${cx(simMarcado(p.mora_com_mae))}) Mãe &nbsp; Irmãos. Quantos? ${campoLinha('', p.quantidade_irmaos, 60)}`);
  pagina2 += linhaBox(campoLinha('Outros', p.outros_moradores, 400));

  pagina2 += tituloSecao('5 Informações socioeconômicas');
  pagina2 += linhaBox(campoLinha('Nome do Pai', pai.nome, 450));
  pagina2 += linhaBox(`${campoLinha('Profissão', pai.profissao, 220)} &nbsp;&nbsp; ${campoLinha('Empresa', pai.empresa, 200)}`);
  pagina2 += linhaBox(`${campoLinha('Salário R$', pai.salario ? formatarMoeda(pai.salario) : '', 150)} &nbsp;&nbsp; ${campoLinha('Telefone', pai.telefone, 170)}`);
  pagina2 += linhaBox(campoLinha('Nome da Mãe', mae.nome, 450));
  pagina2 += linhaBox(`${campoLinha('Profissão', mae.profissao, 220)} &nbsp;&nbsp; ${campoLinha('Empresa', mae.empresa, 200)}`);
  pagina2 += linhaBox(`${campoLinha('Salário R$', mae.salario ? formatarMoeda(mae.salario) : '', 150)} &nbsp;&nbsp; ${campoLinha('Telefone', mae.telefone, 170)}`);
  pagina2 += linhaBox(campoLinha('Quantas pessoas autistas tem na família', p.quantidade_pessoas_autistas_familia, 100));
  pagina2 += linhaBox(`<strong>Recebe Bolsa família?</strong> (${cx(simMarcado(p.recebe_bolsa_familia))}) Sim &nbsp; (${cx(naoMarcado(p.recebe_bolsa_familia))}) Não &nbsp;&nbsp; ${campoLinha('Valor R$', p.valor_bolsa_familia ? formatarMoeda(p.valor_bolsa_familia) : '', 130)}`);
  pagina2 += linhaBox(`<strong>A pessoa autista recebe BPC:</strong> (${cx(simMarcado(p.recebe_bpc))}) Sim &nbsp; (${cx(naoMarcado(p.recebe_bpc))}) Não &nbsp;&nbsp; ${campoLinha('Valor R$', p.valor_bpc ? formatarMoeda(p.valor_bpc) : '', 130)}`);
  pagina2 += linhaBox(campoLinha('Recebe algum tipo de auxílio', p.recebe_outro_auxilio, 400));

  pagina2 += tituloSecao('Informações Adicionais');
  pagina2 += linhaBox(`<strong>Você autoriza publicar fotos de seu filho(a) participante do projeto:</strong> (${cx(simMarcado(p.autoriza_fotos))}) Sim &nbsp; (${cx(naoMarcado(p.autoriza_fotos))}) Não`);
  pagina2 += linhaBox(campoLinha('Em caso de emergência a quem avisar', p.contato_emergencia, 400));
  pagina2 += linhaBox(`<strong>Compromete-se a participar das reuniões quando convocado(a):</strong> (${cx(simMarcado(p.compromete_participar_reunioes))}) Sim &nbsp; (${cx(naoMarcado(p.compromete_participar_reunioes))}) Não`);
  pagina2 += linhaBox(`<strong>Há mais alguma informação relevante que você gostaria de compartilhar:</strong><br><span style="display:inline-block; min-height:34px; width:100%; padding-top:4px;">${p.informacoes_adicionais || ''}</span>`);

  pagina2 += tituloSecao('Termo de aceite das informações:');
  pagina2 += linhaBox(`
    Eu ${campoLinha('', nomeTermo, 380)}, ${campoLinha('CPF', cpfTermo, 160)}
    afirmo que recebi todas as informações desta ficha de inscrição, sob as penas da Lei (Art. 299 do
    Código Penal), que as declarações aqui contidas correspondem à verdade e comprometo-me a aceitá-las e cumpri-las.`);

  // ---------------- PÁGINA 3 ----------------
  let pagina3 = cabecalho(false);
  pagina3 += `
    <div style="border:1px solid #000; padding:12px; font-size:12px; line-height:1.6; text-align:justify; margin-top:6px;">
      Declaro que estou ciente de que, ao ser convocado(a) para reuniões ou eventos da
      <strong>Associação Mães Unidas pelo TEA</strong>, a ocorrência de <strong>três faltas consecutivas</strong>,
      minhas ou do(a) meu(minha) filho(a), <strong>sem justificativa</strong>, resultará
      <strong>automaticamente no desligamento do(a) meu(minha) filho(a) do projeto</strong>.
    </div>
    <div style="text-align:center; font-size:12.5px; margin:26px 0 40px 0;">
      Lábrea-AM, _______/_____/__________
    </div>
    <div style="font-size:12.5px; margin-bottom:46px;">Assinatura dos pais ou responsáveis:</div>
    <div style="text-align:center; font-size:12px; margin-bottom:46px;">
      <div style="border-bottom:1px solid #000; width:360px; margin:0 auto 4px auto;"></div>
      Ass. do Responsável
    </div>
    <div style="display:flex; justify-content:space-around; font-size:12px; text-align:center;">
      <div><div style="border-bottom:1px solid #000; width:250px; margin-bottom:4px;"></div>Ass. Presidente da AMUT</div>
      <div><div style="border-bottom:1px solid #000; width:250px; margin-bottom:4px;"></div>Ass. Colaborador(a) da AMUT</div>
    </div>
    <p style="text-align:center; font-size:10.5px; color:#888; margin-top:30px;">
      Ficha emitida pelo sistema de gestão da AMUT em ${new Date().toLocaleDateString('pt-BR')}
    </p>`;

  return `
    <div>${pagina1}</div>
    <div style="page-break-before:always; padding-top:16px;">${pagina2}</div>
    <div style="page-break-before:always; padding-top:16px;">${pagina3}</div>
  `;
}

async function imprimirFicha(pacienteId) {
  try {
    const p = await api.get(`/pacientes/${pacienteId}`);
    const logo = await obterLogoDataUrl();
    const html = gerarFichaHTML(p, logo);
    abrirJanelaImpressao(`Ficha - ${p.nome}`, html);
  } catch (err) {
    alert('Erro ao gerar ficha completa: ' + err.message);
  }
}

// =====================================================================
// RELATÓRIO MENSAL DE CONTRIBUIÇÕES
// =====================================================================

function formatarMesReferenciaRelatorio(mes) {
  if (!mes) return '';
  const [ano, m] = mes.split('-');
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
    'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${nomes[parseInt(m, 10) - 1]} de ${ano}`;
}

function gerarLinhasRelatorioContribuicoes(lista) {
  if (!lista || lista.length === 0) {
    return '<tr><td colspan="5" style="text-align:center; padding:16px; color:#888; border:1px solid #ccc;">Nenhuma contribuição registrada neste mês.</td></tr>';
  }
  return lista.map((c) => {
    const vinculo = c.responsavel_nome
      ? `${c.responsavel_nome}${c.paciente_nome ? ' (resp. de ' + c.paciente_nome + ')' : ''}`
      : 'Avulso';
    return `
      <tr>
        <td style="border:1px solid #ccc; padding:6px 8px; font-size:11.5px;">${formatarDataBR(c.data_contribuicao)}</td>
        <td style="border:1px solid #ccc; padding:6px 8px; font-size:11.5px;">${c.nome_contribuinte}</td>
        <td style="border:1px solid #ccc; padding:6px 8px; font-size:11.5px;">${vinculo}</td>
        <td style="border:1px solid #ccc; padding:6px 8px; font-size:11.5px;">${c.forma_pagamento}</td>
        <td style="border:1px solid #ccc; padding:6px 8px; font-size:11.5px; text-align:right;">${formatarMoeda(c.valor)}</td>
      </tr>`;
  }).join('');
}

async function imprimirRelatorioMensalContribuicoes(mes) {
  try {
    const params = new URLSearchParams({ mes, limite: 9999 });
    const resultado = await api.get(`/contribuicoes?${params.toString()}`);
    const lista = resultado.dados || [];
    const logo = await obterLogoDataUrl();

    const totalValor = lista.reduce((soma, c) => soma + Number(c.valor), 0);
    const contribuintesUnicos = new Set(
      lista.map((c) => c.responsavel_id || c.nome_contribuinte.trim().toLowerCase())
    ).size;
    const ticketMedio = lista.length > 0 ? totalValor / lista.length : 0;

    const html = `
      <div style="display:flex; align-items:center; gap:14px; border-bottom:3px solid #13266A; padding-bottom:12px; margin-bottom:18px;">
        ${logo ? `<img src="${logo}" style="height:60px;">` : ''}
        <div>
          <div style="font-size:16px; font-weight:bold; color:#13266A;">Associação Mães Unidas pelo TEA (AMUT)</div>
          <div style="font-size:12px; color:#555;">Lábrea - Amazonas · Relatório Mensal de Contribuições</div>
        </div>
      </div>

      <h2 style="text-align:center; font-size:15px; color:#13266A; margin:0 0 18px 0;">
        Referente a ${formatarMesReferenciaRelatorio(mes)}
      </h2>

      <div style="display:flex; gap:12px; margin-bottom:18px;">
        <div style="flex:1; border:1px solid #ccc; border-radius:6px; padding:10px 12px; text-align:center;">
          <div style="font-size:10.5px; color:#666;">Total arrecadado</div>
          <div style="font-size:16px; font-weight:bold; color:#2CC73D;">${formatarMoeda(totalValor)}</div>
        </div>
        <div style="flex:1; border:1px solid #ccc; border-radius:6px; padding:10px 12px; text-align:center;">
          <div style="font-size:10.5px; color:#666;">Nº de contribuições</div>
          <div style="font-size:16px; font-weight:bold; color:#13266A;">${lista.length}</div>
        </div>
        <div style="flex:1; border:1px solid #ccc; border-radius:6px; padding:10px 12px; text-align:center;">
          <div style="font-size:10.5px; color:#666;">Contribuintes únicos</div>
          <div style="font-size:16px; font-weight:bold; color:#9E2FF8;">${contribuintesUnicos}</div>
        </div>
        <div style="flex:1; border:1px solid #ccc; border-radius:6px; padding:10px 12px; text-align:center;">
          <div style="font-size:10.5px; color:#666;">Ticket médio</div>
          <div style="font-size:16px; font-weight:bold; color:#00B8FE;">${formatarMoeda(ticketMedio)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr style="background:#13266A;">
            <th style="border:1px solid #13266A; padding:6px 8px; font-size:11.5px; color:#fff; text-align:left;">Data</th>
            <th style="border:1px solid #13266A; padding:6px 8px; font-size:11.5px; color:#fff; text-align:left;">Contribuinte</th>
            <th style="border:1px solid #13266A; padding:6px 8px; font-size:11.5px; color:#fff; text-align:left;">Vinculado a</th>
            <th style="border:1px solid #13266A; padding:6px 8px; font-size:11.5px; color:#fff; text-align:left;">Forma de pagamento</th>
            <th style="border:1px solid #13266A; padding:6px 8px; font-size:11.5px; color:#fff; text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${gerarLinhasRelatorioContribuicoes(lista)}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="border:1px solid #ccc; padding:8px; font-size:12px; font-weight:bold; text-align:right;">TOTAL DO MÊS</td>
            <td style="border:1px solid #ccc; padding:8px; font-size:12px; font-weight:bold; text-align:right; color:#2CC73D;">${formatarMoeda(totalValor)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="display:flex; justify-content:space-around; margin-top:60px; font-size:12px; text-align:center;">
        <div>
          <div style="border-bottom:1px solid #000; width:240px; margin-bottom:4px;"></div>
          Tesoureiro(a) da AMUT
        </div>
        <div>
          <div style="border-bottom:1px solid #000; width:240px; margin-bottom:4px;"></div>
          Ass. Presidente da AMUT
        </div>
      </div>

      <p style="text-align:center; font-size:10.5px; color:#888; margin-top:24px;">
        Relatório emitido pelo sistema de gestão da AMUT em ${new Date().toLocaleDateString('pt-BR')}
      </p>
    `;

    abrirJanelaImpressao(`Relatório de Contribuições - ${formatarMesReferenciaRelatorio(mes)}`, html);
  } catch (err) {
    alert('Erro ao gerar relatório mensal: ' + err.message);
  }
}

// =====================================================================
// CARTEIRA DE IDENTIFICAÇÃO TEA (frente e verso)
// Desenhada em SVG com viewBox 490 x 385, a mesma proporção do modelo oficial.
// =====================================================================

const CARTEIRA_LARGURA_MM = 85.6;
const CARTEIRA_ALTURA_MM = +(CARTEIRA_LARGURA_MM * 385 / 490).toFixed(2);

const COR = {
  navy: '#13266A',
  azul: '#1D4FB3',
  azulClaro: '#2BA3E0',
  vermelho: '#E3262D',
  verde: '#2CA84A',
  amarelo: '#F7C21A',
  roxo: '#7B3FB5',
  verdeAssinatura: '#3BAA47'
};

const FONTE_TITULO = "'Baloo 2', 'Arial Black', Arial, sans-serif";
const FONTE_TEXTO = 'Arial, Helvetica, sans-serif';

function escHtmlCarteira(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarCpfCarteira(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  if (d.length !== 11) return cpf || '';
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarDataCarteira(data) {
  if (!data) return '';
  const d = new Date(String(data).length <= 10 ? data + 'T00:00:00' : data);
  return isNaN(d) ? '' : d.toLocaleDateString('pt-BR');
}

// Pai e mãe primeiro; se não houver, usa os demais responsáveis cadastrados
function obterFiliacaoCarteira(responsaveis) {
  const lista = Array.isArray(responsaveis) ? responsaveis : [];
  const pai = lista.find((r) => r.parentesco === 'Pai');
  const mae = lista.find((r) => r.parentesco === 'Mãe');
  const filiacao = [pai, mae].filter(Boolean);
  lista.forEach((r) => {
    if (filiacao.length < 2 && !filiacao.includes(r)) filiacao.push(r);
  });
  return filiacao.map((r) => r.nome || '');
}

// Faixa de peças de quebra-cabeça presa na borda superior (y = 0).
// tabsLaterais[i]: encaixe entre a peça i e i+1 (+1 = a peça i avança para a direita).
// tabsBase[i]: encaixe na borda livre da peça (+1 = saliência, -1 = recorte).
function faixaPecas({ larguras, cores, profundidade, tabsLaterais, tabsBase }) {
  const topo = -20;
  const rLat = Math.min(8, profundidade / 2 - 1);
  const nLat = rLat * 0.7;
  const rBase = 8.5;
  const nBase = 6;
  const cyLat = profundidade / 2;
  let x = 0;

  return larguras.map((largura, i) => {
    const x0 = x;
    const x1 = x + largura;
    x = x1;
    const cx = (x0 + x1) / 2;
    const ultimo = i === larguras.length - 1;
    const primeiro = i === 0;

    let d = `M${x0},${topo} L${x1},${topo} `;
    if (!ultimo) {
      const s = tabsLaterais[i] > 0 ? 1 : 0;
      d += `L${x1},${cyLat - nLat} A${rLat},${rLat} 0 1 ${s} ${x1},${cyLat + nLat} `;
    }
    d += `L${x1},${profundidade} `;
    if (tabsBase[i]) {
      const s = tabsBase[i] > 0 ? 1 : 0;
      d += `L${cx + nBase},${profundidade} A${rBase},${rBase} 0 1 ${s} ${cx - nBase},${profundidade} `;
    }
    d += `L${x0},${profundidade} `;
    if (!primeiro) {
      const s = tabsLaterais[i - 1] > 0 ? 0 : 1;
      d += `L${x0},${cyLat + nLat} A${rLat},${rLat} 0 1 ${s} ${x0},${cyLat - nLat} `;
    }
    d += 'Z';
    return `<path d="${d}" fill="${cores[i]}" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>`;
  }).join('');
}

function faixaPecasTopoFrente() {
  return faixaPecas({
    larguras: [150, 120, 75, 145],
    cores: [COR.azul, COR.vermelho, COR.verde, COR.amarelo],
    profundidade: 26,
    tabsLaterais: [1, -1, 1],
    tabsBase: [-1, -1, 1, -1]
  });
}

function faixaPecasBase(cores) {
  const pecas = faixaPecas({
    larguras: [90, 95, 100, 75, 60, 70],
    cores,
    profundidade: 22,
    tabsLaterais: [1, -1, 1, -1, 1],
    tabsBase: [1, -1, 1, -1, 1, -1]
  });
  return `<g transform="translate(0,385) scale(1,-1)">${pecas}</g>`;
}

function coracaoQuebraCabeca(cx, cy, largura) {
  const escala = largura / 100;
  const contorno = 'M50 88 C20 66 2 50 2 28 C2 12 14 2 28 2 C38 2 46 8 50 16 C54 8 62 2 72 2 C86 2 98 12 98 28 C98 50 80 66 50 88Z';
  const id = 'cor' + Math.random().toString(36).slice(2, 8);
  return `
    <g transform="translate(${cx - largura / 2},${cy - largura * 0.45}) scale(${escala})">
      <defs><clipPath id="${id}"><path d="${contorno}"/></clipPath></defs>
      <g clip-path="url(#${id})">
        <rect x="0" y="0" width="50" height="45" fill="${COR.azul}"/>
        <rect x="50" y="0" width="50" height="45" fill="${COR.vermelho}"/>
        <rect x="0" y="45" width="50" height="45" fill="${COR.roxo}"/>
        <rect x="50" y="45" width="50" height="45" fill="${COR.amarelo}"/>
        <path d="M50 0 V90 M0 45 H100" stroke="#fff" stroke-width="3"/>
        <circle cx="45" cy="25" r="6.5" fill="${COR.vermelho}" stroke="#fff" stroke-width="3"/>
        <circle cx="25" cy="50" r="6.5" fill="${COR.azul}" stroke="#fff" stroke-width="3"/>
        <circle cx="75" cy="40" r="6.5" fill="${COR.amarelo}" stroke="#fff" stroke-width="3"/>
        <circle cx="55" cy="66" r="6.5" fill="${COR.roxo}" stroke="#fff" stroke-width="3"/>
      </g>
      <path d="${contorno}" fill="none" stroke="#fff" stroke-width="4"/>
    </g>`;
}

// Texto que nunca ultrapassa a largura disponível
function textoSvg(x, y, texto, { tamanho, maxLargura, peso = 'bold', cor = '#111', ancora = 'start', fonte = FONTE_TEXTO, espacamento = 0, larguraFixa = null }) {
  const valor = escHtmlCarteira(texto);
  const estimada = String(texto || '').length * tamanho * 0.62 + espacamento * String(texto || '').length;
  let ajuste = '';
  if (larguraFixa) ajuste = ` textLength="${larguraFixa}" lengthAdjust="spacingAndGlyphs"`;
  else if (maxLargura && estimada > maxLargura) ajuste = ` textLength="${maxLargura}" lengthAdjust="spacingAndGlyphs"`;
  return `<text x="${x}" y="${y}" font-family="${fonte}" font-size="${tamanho}" font-weight="${peso}" fill="${cor}" text-anchor="${ancora}" letter-spacing="${espacamento}"${ajuste}>${valor}</text>`;
}

const ICONES_VERSO = {
  nome: `<circle cx="12" cy="8" r="4.2" fill="#fff"/><path d="M3.5 21.5c0-4.8 3.8-7.5 8.5-7.5s8.5 2.7 8.5 7.5z" fill="#fff"/>`,
  nascimento: `<rect x="3.5" y="5.5" width="17" height="15" rx="2" fill="#fff"/>
    <path d="M8 3v4M16 3v4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
    <g fill="${COR.navy}"><rect x="6.3" y="11" width="2.6" height="2.3"/><rect x="10.7" y="11" width="2.6" height="2.3"/><rect x="15.1" y="11" width="2.6" height="2.3"/><rect x="6.3" y="15.3" width="2.6" height="2.3"/><rect x="10.7" y="15.3" width="2.6" height="2.3"/></g>`,
  cpf: `<rect x="2.5" y="5.5" width="19" height="13" rx="2" fill="#fff"/>
    <circle cx="8" cy="10.6" r="2" fill="${COR.navy}"/><path d="M4.8 16c.5-1.8 1.7-2.7 3.2-2.7s2.7.9 3.2 2.7z" fill="${COR.navy}"/>
    <path d="M13.5 10h5M13.5 13h5M13.5 16h3.5" stroke="${COR.navy}" stroke-width="1.5" stroke-linecap="round"/>`,
  matricula: `<path d="M9.3 4.2a2.7 2.7 0 0 1 5.4 0v1.6h4.1v4.1h-1.6a2.7 2.7 0 0 0 0 5.4h1.6v4.1h-4.1v-1.6a2.7 2.7 0 0 0-5.4 0v1.6H5.2v-4.1h1.6a2.7 2.7 0 0 0 0-5.4H5.2V5.8h4.1z" fill="#fff"/>`,
  filiacao: `<circle cx="7.5" cy="6" r="2.8" fill="#fff"/><circle cx="16.5" cy="6" r="2.8" fill="#fff"/>
    <path d="M3 20v-5.6a4.5 4.5 0 0 1 9 0V20z" fill="#fff"/><path d="M12 20v-5.6a4.5 4.5 0 0 1 9 0V20z" fill="#fff"/>
    <circle cx="12" cy="13.2" r="1.9" fill="#fff" stroke="${COR.navy}" stroke-width="1"/><path d="M9.6 20.5v-2.6a2.4 2.4 0 0 1 4.8 0v2.6z" fill="#fff" stroke="${COR.navy}" stroke-width="1"/>`
};

function iconeVerso(nome, cx, cy) {
  return `
    <circle cx="${cx}" cy="${cy}" r="13" fill="${COR.navy}"/>
    <g transform="translate(${cx - 9},${cy - 9}) scale(0.75)">${ICONES_VERSO[nome]}</g>`;
}

function linhaVerso({ icone, cy, rotulo, valor, xValor, xFimLinha, xInicioLinha }) {
  const yLinha = cy + 7;
  return `
    ${icone ? iconeVerso(icone, 50, cy) : ''}
    ${rotulo ? textoSvg(76, cy + 5, rotulo, { tamanho: 10, cor: COR.navy }) : ''}
    <line x1="${xInicioLinha ?? xValor - 4}" y1="${yLinha}" x2="${xFimLinha}" y2="${yLinha}" stroke="${COR.navy}" stroke-width="1"/>
    ${textoSvg(xValor, cy + 4, valor, { tamanho: 12.5, maxLargura: xFimLinha - xValor - 4 })}`;
}

function svgCarteira(conteudo) {
  const clipId = 'card' + Math.random().toString(36).slice(2, 8);
  return `
    <svg class="carteira" viewBox="0 0 490 385" width="${CARTEIRA_LARGURA_MM}mm" height="${CARTEIRA_ALTURA_MM}mm" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${clipId}"><rect x="0" y="0" width="490" height="385" rx="20"/></clipPath></defs>
      <g clip-path="url(#${clipId})">
        <rect x="0" y="0" width="490" height="385" fill="#fff"/>
        ${conteudo}
      </g>
      <rect x="0.75" y="0.75" width="488.5" height="383.5" rx="20" fill="none" stroke="#c7ccd6" stroke-width="1.5"/>
    </svg>`;
}

function gerarFrenteCarteira(p, logo) {
  const clipFoto = 'foto' + Math.random().toString(36).slice(2, 8);
  const foto = p.foto
    ? `<image href="${p.foto}" x="300" y="73" width="153" height="167" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipFoto})"/>`
    : `<g clip-path="url(#${clipFoto})">
         <rect x="300" y="73" width="153" height="167" fill="#e4e5e7"/>
         <circle cx="376.5" cy="133" r="30" fill="#c9cacd"/>
         <path d="M316 240 C316 192 343 172 376.5 172 C410 172 437 192 437 240 Z" fill="#c9cacd"/>
         <rect x="300" y="210" width="153" height="30" fill="#d3d4d7"/>
         ${textoSvg(376.5, 231, 'FOTO 3X4', { tamanho: 16, cor: '#5b5d61', ancora: 'middle', fonte: FONTE_TITULO, peso: '800' })}
       </g>`;

  return svgCarteira(`
    ${faixaPecasTopoFrente()}

    ${logo ? `<image href="${logo}" x="89" y="32" width="158" height="148" preserveAspectRatio="xMidYMid meet"/>` : ''}

    ${textoSvg(167, 214, 'CARTEIRA DE', { tamanho: 26, cor: COR.navy, ancora: 'middle', fonte: FONTE_TITULO, peso: '800', larguraFixa: 172 })}
    ${textoSvg(167, 239, 'IDENTIFICAÇÃO', { tamanho: 26, cor: COR.navy, ancora: 'middle', fonte: FONTE_TITULO, peso: '800', larguraFixa: 217 })}
    <text x="167" y="276" font-family="${FONTE_TITULO}" font-size="52" font-weight="800" text-anchor="middle" textLength="150" lengthAdjust="spacingAndGlyphs">
      <tspan fill="${COR.azul}">T</tspan><tspan fill="${COR.verde}">E</tspan><tspan fill="${COR.vermelho}">A</tspan>
    </text>

    <defs><clipPath id="${clipFoto}"><rect x="300" y="73" width="153" height="167" rx="10"/></clipPath></defs>
    ${foto}
    <rect x="300" y="73" width="153" height="167" rx="10" fill="none" stroke="${COR.navy}" stroke-width="2.5"/>

    <path d="M0,278 C80,284 150,300 245,301 C330,302 410,274 490,262 L490,385 L0,385 Z" fill="${COR.navy}"/>
    ${coracaoQuebraCabeca(245, 306, 50)}
    ${textoSvg(249, 343, 'RESPEITO • INCLUSÃO • EMPATIA • DIREITOS', { tamanho: 11, cor: '#fff', ancora: 'middle', larguraFixa: 302 })}

    ${faixaPecasBase([COR.azul, COR.roxo, COR.amarelo, COR.verde, COR.azulClaro, COR.vermelho])}
  `);
}

function gerarVersoCarteira(p) {
  const filiacao = obterFiliacaoCarteira(p.responsaveis);
  const matricula = p.numero_inscricao
    ? `${p.numero_inscricao}${p.ano_inscricao ? '/' + p.ano_inscricao : ''}`
    : '';

  return svgCarteira(`
    <rect x="21" y="18" width="427" height="210" rx="10" fill="#fff" stroke="${COR.navy}" stroke-width="2"/>
    <path d="M21,42 L21,28 A10,10 0 0 1 31,18 L438,18 A10,10 0 0 1 448,28 L448,42 Z" fill="${COR.navy}"/>
    ${textoSvg(234.5, 35, 'INFORMAÇÕES DO CADASTRO', { tamanho: 13, cor: '#fff', ancora: 'middle', espacamento: 0.4 })}

    <rect x="272" y="78" width="160" height="56" rx="3" fill="#eef0f3"/>

    ${linhaVerso({ icone: 'nome', cy: 63, rotulo: 'NOME:', valor: (p.nome || '').toUpperCase(), xValor: 122, xFimLinha: 432 })}
    ${linhaVerso({ icone: 'nascimento', cy: 95, rotulo: 'D.N.:', valor: formatarDataCarteira(p.data_nascimento), xValor: 118, xFimLinha: 264 })}
    ${linhaVerso({ icone: 'cpf', cy: 126, rotulo: 'CPF:', valor: formatarCpfCarteira(p.cpf), xValor: 114, xFimLinha: 264 })}
    ${linhaVerso({ icone: 'matricula', cy: 157, rotulo: 'MATRÍCULA TEA:', valor: matricula, xValor: 168, xFimLinha: 432 })}
    ${linhaVerso({ icone: 'filiacao', cy: 186, rotulo: 'FILIAÇÃO:', valor: (filiacao[0] || '').toUpperCase(), xValor: 140, xFimLinha: 432 })}
    ${linhaVerso({ icone: null, cy: 208, rotulo: '', valor: (filiacao[1] || '').toUpperCase(), xValor: 140, xFimLinha: 432, xInicioLinha: 76 })}

    <rect x="211" y="238" width="237" height="43" rx="6" fill="#fff" stroke="${COR.verdeAssinatura}" stroke-width="2"/>
    <path d="M211,252 L211,244 A6,6 0 0 1 217,238 L442,238 A6,6 0 0 1 448,244 L448,252 Z" fill="${COR.verdeAssinatura}"/>
    ${textoSvg(329.5, 248.5, 'ASSINATURA DO RESPONSÁVEL:', { tamanho: 9, cor: '#fff', ancora: 'middle' })}

    <path d="M0,262 C120,262 200,300 300,302 C380,304 440,292 490,286 L490,385 L0,385 Z" fill="${COR.navy}"/>

    <g transform="translate(40,302)">
      <path d="M20 2 L36 8 V20 C36 30 29 37 20 41 C11 37 4 30 4 20 V8 Z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>
      <rect x="13" y="19" width="14" height="11" rx="2" fill="#fff"/>
      <path d="M15.5 19 V15.5 a4.5 4.5 0 0 1 9 0 V19" fill="none" stroke="#fff" stroke-width="2.4"/>
      <circle cx="20" cy="24.5" r="1.6" fill="${COR.navy}"/>
    </g>
    ${textoSvg(90, 315, 'VÁLIDA SOMENTE NO', { tamanho: 10.5, cor: '#fff' })}
    ${textoSvg(90, 328, 'TERRITÓRIO DO MUNICÍPIO DE', { tamanho: 10.5, cor: '#fff' })}
    ${textoSvg(90, 351, 'LÁBREA – AM', { tamanho: 22, cor: '#fff', fonte: FONTE_TITULO, peso: '800', espacamento: 0.5 })}
    ${coracaoQuebraCabeca(370, 324, 66)}

    ${faixaPecasBase([COR.azul, COR.roxo, COR.verde, COR.amarelo, COR.verde, COR.vermelho])}
  `);
}

const CARTEIRAS_POR_FOLHA = 4;

async function buscarPacientesEmLotes(ids, tamanhoLote = 4) {
  const pacientes = [];
  for (let i = 0; i < ids.length; i += tamanhoLote) {
    const lote = ids.slice(i, i + tamanhoLote);
    pacientes.push(...await Promise.all(lote.map((id) => api.get(`/pacientes/${id}`))));
  }
  return pacientes;
}

function gerarFolhasCarteiras(pacientes, logo) {
  const folhas = [];
  for (let i = 0; i < pacientes.length; i += CARTEIRAS_POR_FOLHA) {
    const linhas = pacientes.slice(i, i + CARTEIRAS_POR_FOLHA).map((p) => `
      <div class="linha">
        ${gerarFrenteCarteira(p, logo)}
        ${gerarVersoCarteira(p)}
      </div>`).join('');
    folhas.push(`<section class="folha">${linhas}</section>`);
  }
  return folhas.join('');
}

function imprimirCarteirinha(pacienteId) {
  return imprimirCarteirinhasLote([pacienteId]);
}

async function imprimirCarteirinhasLote(ids) {
  if (!ids || ids.length === 0) return;

  // Abre a janela já no clique para o navegador não bloquear o pop-up enquanto os dados carregam
  const janela = window.open('', '_blank', 'width=1000,height=750');
  if (!janela) {
    alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente de novo.');
    return;
  }
  janela.document.write(`<p style="font-family:Arial;padding:24px;color:#475569;">Gerando ${ids.length} carteirinha(s)...</p>`);
  janela.document.close();

  try {
    const [pacientes, logo] = await Promise.all([buscarPacientesEmLotes(ids), obterLogoDataUrl()]);
    const totalFolhas = Math.ceil(pacientes.length / CARTEIRAS_POR_FOLHA);
    const titulo = pacientes.length === 1
      ? `Carteirinha - ${escHtmlCarteira(pacientes[0].nome)}`
      : `Carteirinhas (${pacientes.length})`;

    janela.document.open();
    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${titulo}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&display=block" rel="stylesheet">
        <style>
          @page { size: A4; margin: 6mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111; background: #e2e8f0; }
          .aviso { text-align: center; font-size: 9pt; color: #475569; margin: 6mm 0 4mm; }
          .folha {
            width: 210mm; min-height: 297mm; margin: 0 auto 8mm; padding: 6mm; background: #fff;
            display: flex; flex-direction: column; align-items: center; gap: 4mm;
            box-shadow: 0 2px 10px rgba(0,0,0,.15);
          }
          .linha { display: flex; gap: 4mm; }
          .carteira { display: block; flex-shrink: 0; }
          @media print {
            body { background: #fff; }
            .aviso { display: none; }
            .folha { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; break-after: page; page-break-after: always; }
            .folha:last-of-type { break-after: auto; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <p class="aviso">
          ${pacientes.length} carteirinha(s) em ${totalFolhas} folha(s) A4.
          Na impressão, deixe a escala em 100% e ative "Gráficos de plano de fundo".
        </p>
        ${gerarFolhasCarteiras(pacientes, logo)}
        <script>
          window.onload = function () {
            var imprimir = function () { setTimeout(function () { window.print(); }, 400); };
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(imprimir); else imprimir();
          };
        </script>
      </body>
      </html>
    `);
    janela.document.close();
  } catch (err) {
    janela.close();
    alert('Erro ao gerar carteirinhas: ' + err.message);
  }
}

