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
