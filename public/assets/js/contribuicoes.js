// Lógica da página de gestão de contribuições/doações

exigirLogin();
preencherUsuarioNoHeader();

let paginaAtualContrib = 1;
let totalPaginasContrib = 1;
let listaResponsaveisCache = [];
let buscaResponsavel = null;

function formatarMoedaBR(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatarDataBRContrib(data) {
  if (!data) return '-';
  const d = new Date(data.length <= 10 ? data + 'T00:00:00' : data);
  return d.toLocaleDateString('pt-BR');
}
function formatarMesReferencia(mes) {
  if (!mes) return '-';
  const [ano, m] = mes.split('-');
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${nomes[parseInt(m) - 1]}/${ano}`;
}

function garantirBuscaResponsavel() {
  if (buscaResponsavel) return buscaResponsavel;

  buscaResponsavel = criarBuscaSelect({
    container: '#c-responsavel-busca',
    placeholder: 'Buscar responsável por nome ou CPF...',
    emptyLabel: '— Contribuinte avulso (não vinculado) —',
    allowEmpty: true,
    getLabel: (r) => r.nome,
    getSubLabel: (r) => {
      const partes = [];
      if (r.cpf) partes.push(`CPF: ${formatarCpfBusca(r.cpf)}`);
      if (r.paciente_nome) partes.push(`resp. de ${r.paciente_nome}`);
      return partes.join(' · ');
    },
    getSearchText: (r) => `${r.nome || ''} ${r.cpf || ''} ${r.paciente_nome || ''}`,
    onChange: (responsavel) => {
      if (responsavel) {
        document.getElementById('c-nome').value = responsavel.nome;
        document.getElementById('c-telefone').value = responsavel.telefone || '';
      }
    }
  });

  return buscaResponsavel;
}

// ---------- Resumo (cards) ----------
async function carregarResumoContribuicoes() {
  try {
    const resumo = await api.get('/contribuicoes/resumo');
    document.getElementById('card-total-mes').textContent = formatarMoedaBR(resumo.total_mes_atual);
    document.getElementById('card-contribuintes-mes').textContent = resumo.contribuintes_mes_atual;
    document.getElementById('card-total-geral').textContent = formatarMoedaBR(resumo.total_geral);
  } catch (err) {
    console.error(err);
  }
}

// ---------- Listagem ----------
async function carregarContribuicoes() {
  const tbody = document.getElementById('tabela-contribuicoes');
  tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">Carregando...</td></tr>';

  const busca = document.getElementById('filtro-busca').value.trim();
  const mes = document.getElementById('filtro-mes').value;

  try {
    const params = new URLSearchParams({ busca, mes, pagina: paginaAtualContrib, limite: 15 });
    const resultado = await api.get(`/contribuicoes?${params.toString()}`);

    totalPaginasContrib = Math.max(1, Math.ceil(resultado.total / resultado.limite));
    document.getElementById('info-paginacao').textContent =
      `${resultado.total} contribuição(ões) · total no filtro: ${formatarMoedaBR(resultado.total_valor)} · página ${resultado.pagina} de ${totalPaginasContrib}`;

    if (resultado.dados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">Nenhuma contribuição encontrada.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    resultado.dados.forEach((c) => {
      const vinculo = c.responsavel_nome
        ? `${c.responsavel_nome}${c.paciente_nome ? ' (resp. de ' + c.paciente_nome + ')' : ''}`
        : '<span class="text-slate-400">Avulso</span>';

      const tr = document.createElement('tr');
      tr.className = 'border-t hover:bg-slate-50';
      tr.innerHTML = `
        <td class="py-3 px-4 text-slate-600">${formatarDataBRContrib(c.data_contribuicao)}</td>
        <td class="py-3 px-4 font-medium text-slate-700">${c.nome_contribuinte}</td>
        <td class="py-3 px-4 text-xs">${vinculo}</td>
        <td class="py-3 px-4 text-xs">${formatarMesReferencia(c.mes_referencia)}</td>
        <td class="py-3 px-4 text-xs">${c.forma_pagamento}</td>
        <td class="py-3 px-4 font-semibold text-amut-green">${formatarMoedaBR(c.valor)}</td>
        <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
          <button onclick="abrirModalEditarContribuicao(${c.id})" class="text-amut-blue hover:underline text-xs font-semibold">Editar</button>
          <button onclick="excluirContribuicao(${c.id})" class="text-amut-red hover:underline text-xs font-semibold">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-red-500">${err.message}</td></tr>`;
  }
}

function mudarPagina(delta) {
  const nova = paginaAtualContrib + delta;
  if (nova < 1 || nova > totalPaginasContrib) return;
  paginaAtualContrib = nova;
  carregarContribuicoes();
}

let timerBuscaContrib;
document.getElementById('filtro-busca').addEventListener('input', () => {
  clearTimeout(timerBuscaContrib);
  timerBuscaContrib = setTimeout(() => { paginaAtualContrib = 1; carregarContribuicoes(); }, 400);
});
document.getElementById('filtro-mes').addEventListener('change', () => { paginaAtualContrib = 1; carregarContribuicoes(); });

// ---------- Carrega lista de responsáveis para a busca do modal ----------
async function carregarResponsaveisSelect() {
  const bs = garantirBuscaResponsavel();
  try {
    listaResponsaveisCache = await api.get('/responsaveis');
    bs.setItems(listaResponsaveisCache);
  } catch (err) {
    console.error(err);
    bs.setItems([]);
  }
}

// ---------- Modal: Nova/Editar ----------
function hojeISO() {
  return new Date().toISOString().substring(0, 10);
}

async function abrirModalNovaContribuicao() {
  await carregarResponsaveisSelect();
  document.getElementById('modal-contribuicao-titulo').textContent = 'Nova Contribuição';
  document.getElementById('c-id').value = '';
  buscaResponsavel.clear();
  document.getElementById('c-nome').value = '';
  document.getElementById('c-telefone').value = '';
  document.getElementById('c-forma').value = 'PIX';
  document.getElementById('c-valor').value = '';
  document.getElementById('c-data').value = hojeISO();
  document.getElementById('c-mes').value = hojeISO().substring(0, 7);
  document.getElementById('c-observacoes').value = '';
  document.getElementById('erro-form-contribuicao').classList.add('hidden');
  document.getElementById('modal-contribuicao').classList.remove('hidden');
}

async function abrirModalEditarContribuicao(id) {
  await carregarResponsaveisSelect();
  try {
    const c = await api.get(`/contribuicoes/${id}`);
    document.getElementById('modal-contribuicao-titulo').textContent = 'Editar Contribuição';
    document.getElementById('c-id').value = c.id;
    buscaResponsavel.setValue(c.responsavel_id || '');
    document.getElementById('c-nome').value = c.nome_contribuinte;
    document.getElementById('c-telefone').value = c.telefone_contribuinte || '';
    document.getElementById('c-forma').value = c.forma_pagamento;
    document.getElementById('c-valor').value = c.valor;
    document.getElementById('c-data').value = String(c.data_contribuicao).substring(0, 10);
    document.getElementById('c-mes').value = c.mes_referencia || '';
    document.getElementById('c-observacoes').value = c.observacoes || '';
    document.getElementById('erro-form-contribuicao').classList.add('hidden');
    document.getElementById('modal-contribuicao').classList.remove('hidden');
  } catch (err) {
    alert('Erro ao carregar contribuição: ' + err.message);
  }
}

function fecharModalContribuicao() {
  document.getElementById('modal-contribuicao').classList.add('hidden');
}

async function salvarContribuicao() {
  const erroBox = document.getElementById('erro-form-contribuicao');
  erroBox.classList.add('hidden');

  const nome = document.getElementById('c-nome').value.trim();
  const valor = document.getElementById('c-valor').value;
  const data = document.getElementById('c-data').value;

  if (!nome || !valor || !data) {
    erroBox.textContent = 'Nome do contribuinte, valor e data são obrigatórios.';
    erroBox.classList.remove('hidden');
    return;
  }

  const responsavel = buscaResponsavel ? buscaResponsavel.getSelected() : null;

  const dados = {
    responsavel_id: responsavel ? responsavel.id : null,
    paciente_id: responsavel ? responsavel.paciente_id : null,
    nome_contribuinte: nome,
    telefone_contribuinte: document.getElementById('c-telefone').value || null,
    valor: parseFloat(valor),
    data_contribuicao: data,
    mes_referencia: document.getElementById('c-mes').value || data.substring(0, 7),
    forma_pagamento: document.getElementById('c-forma').value,
    observacoes: document.getElementById('c-observacoes').value || null
  };

  const id = document.getElementById('c-id').value;

  try {
    if (id) {
      await api.put(`/contribuicoes/${id}`, dados);
    } else {
      await api.post('/contribuicoes', dados);
    }
    fecharModalContribuicao();
    carregarContribuicoes();
    carregarResumoContribuicoes();
  } catch (err) {
    erroBox.textContent = err.message;
    erroBox.classList.remove('hidden');
  }
}

async function excluirContribuicao(id) {
  if (!confirm('Tem certeza que deseja excluir esta contribuição?')) return;
  try {
    await api.delete(`/contribuicoes/${id}`);
    carregarContribuicoes();
    carregarResumoContribuicoes();
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}

// ---------- Relatório mensal (PDF via impressão) ----------
function imprimirRelatorioMensal() {
  const mesSelecionado = document.getElementById('filtro-mes').value || hojeISO().substring(0, 7);
  imprimirRelatorioMensalContribuicoes(mesSelecionado);
}

carregarResumoContribuicoes();
carregarContribuicoes();
