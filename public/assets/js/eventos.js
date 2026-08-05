// Lógica da página de gestão de eventos e presenças

exigirLogin();
preencherUsuarioNoHeader();

let paginaAtualEventos = 1;
let totalPaginasEventos = 1;
let eventoPresencaAtualId = null;

// ---------- Listagem ----------
async function carregarEventos() {
  const tbody = document.getElementById('tabela-eventos');
  tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">Carregando...</td></tr>';

  const busca = document.getElementById('filtro-busca').value.trim();
  const status = document.getElementById('filtro-status').value;

  try {
    const params = new URLSearchParams({ busca, status, pagina: paginaAtualEventos, limite: 15 });
    const resultado = await api.get(`/eventos?${params.toString()}`);

    totalPaginasEventos = Math.max(1, Math.ceil(resultado.total / resultado.limite));
    document.getElementById('info-paginacao').textContent =
      `${resultado.total} evento(s) · página ${resultado.pagina} de ${totalPaginasEventos}`;

    if (resultado.dados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">Nenhum evento cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    resultado.dados.forEach((e) => {
      const tr = document.createElement('tr');
      tr.className = 'border-t hover:bg-slate-50';
      tr.innerHTML = `
        <td class="py-3 px-4 text-slate-600">${formatarDataBR(e.data_evento)}${e.hora_evento ? ' · ' + e.hora_evento.substring(0, 5) : ''}</td>
        <td class="py-3 px-4 font-medium text-slate-700">${e.titulo}</td>
        <td class="py-3 px-4">${e.local || '-'}</td>
        <td class="py-3 px-4"><span class="px-2 py-1 rounded-full text-xs font-semibold ${corStatusEvento(e.status)}">${rotuloStatusEvento(e.status)}</span></td>
        <td class="py-3 px-4 text-xs">
          <span class="text-amut-green font-semibold">${e.total_presentes} presentes</span> ·
          <span class="text-amut-red font-semibold">${e.total_ausentes} ausentes</span>
        </td>
        <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
          <button onclick="abrirModalPresenca(${e.id})" class="text-amut-blue hover:underline text-xs font-semibold">Presença</button>
          <button onclick="abrirModalEditarEvento(${e.id})" class="text-amut-purple hover:underline text-xs font-semibold">Editar</button>
          <button onclick="excluirEvento(${e.id}, '${e.titulo.replace(/'/g, "\\'")}')" class="text-amut-red hover:underline text-xs font-semibold">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-500">${err.message}</td></tr>`;
  }
}

function corStatusEvento(status) {
  if (status === 'realizado') return 'bg-green-100 text-green-700';
  if (status === 'cancelado') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
}
function rotuloStatusEvento(status) {
  return { agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado' }[status] || status;
}
function formatarDataBR(data) {
  if (!data) return '-';
  const d = new Date(data.length <= 10 ? data + 'T00:00:00' : data);
  return d.toLocaleDateString('pt-BR');
}

function mudarPagina(delta) {
  const nova = paginaAtualEventos + delta;
  if (nova < 1 || nova > totalPaginasEventos) return;
  paginaAtualEventos = nova;
  carregarEventos();
}

let timerBuscaEventos;
document.getElementById('filtro-busca').addEventListener('input', () => {
  clearTimeout(timerBuscaEventos);
  timerBuscaEventos = setTimeout(() => { paginaAtualEventos = 1; carregarEventos(); }, 400);
});
document.getElementById('filtro-status').addEventListener('change', () => { paginaAtualEventos = 1; carregarEventos(); });

// ---------- Modal Novo/Editar Evento ----------
function abrirModalNovoEvento() {
  document.getElementById('modal-evento-titulo').textContent = 'Novo Evento';
  document.getElementById('ev-id').value = '';
  document.getElementById('ev-titulo').value = '';
  document.getElementById('ev-data').value = '';
  document.getElementById('ev-hora').value = '';
  document.getElementById('ev-local').value = '';
  document.getElementById('ev-status').value = 'agendado';
  document.getElementById('ev-descricao').value = '';
  document.getElementById('erro-form-evento').classList.add('hidden');
  document.getElementById('modal-evento').classList.remove('hidden');
}

async function abrirModalEditarEvento(id) {
  try {
    const e = await api.get(`/eventos/${id}`);
    document.getElementById('modal-evento-titulo').textContent = 'Editar Evento';
    document.getElementById('ev-id').value = e.id;
    document.getElementById('ev-titulo').value = e.titulo;
    document.getElementById('ev-data').value = String(e.data_evento).substring(0, 10);
    document.getElementById('ev-hora').value = e.hora_evento ? e.hora_evento.substring(0, 5) : '';
    document.getElementById('ev-local').value = e.local || '';
    document.getElementById('ev-status').value = e.status;
    document.getElementById('ev-descricao').value = e.descricao || '';
    document.getElementById('erro-form-evento').classList.add('hidden');
    document.getElementById('modal-evento').classList.remove('hidden');
  } catch (err) {
    alert('Erro ao carregar evento: ' + err.message);
  }
}

function fecharModalEvento() {
  document.getElementById('modal-evento').classList.add('hidden');
}

async function salvarEvento() {
  const erroBox = document.getElementById('erro-form-evento');
  erroBox.classList.add('hidden');

  const titulo = document.getElementById('ev-titulo').value.trim();
  const data = document.getElementById('ev-data').value;
  if (!titulo || !data) {
    erroBox.textContent = 'Informe ao menos o título e a data do evento.';
    erroBox.classList.remove('hidden');
    return;
  }

  const dados = {
    titulo,
    data_evento: data,
    hora_evento: document.getElementById('ev-hora').value || null,
    local: document.getElementById('ev-local').value || null,
    status: document.getElementById('ev-status').value,
    descricao: document.getElementById('ev-descricao').value || null
  };

  const id = document.getElementById('ev-id').value;

  try {
    if (id) {
      await api.put(`/eventos/${id}`, dados);
    } else {
      await api.post('/eventos', dados);
    }
    fecharModalEvento();
    carregarEventos();
  } catch (err) {
    erroBox.textContent = err.message;
    erroBox.classList.remove('hidden');
  }
}

async function excluirEvento(id, titulo) {
  if (!confirm(`Tem certeza que deseja excluir o evento "${titulo}"? Os registros de presença também serão apagados.`)) return;
  try {
    await api.delete(`/eventos/${id}`);
    carregarEventos();
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}

// ---------- Modal de Presença ----------
async function abrirModalPresenca(eventoId) {
  eventoPresencaAtualId = eventoId;
  document.getElementById('lista-presencas').innerHTML = '<p class="text-slate-400 text-sm">Carregando pacientes...</p>';
  document.getElementById('erro-form-presenca').classList.add('hidden');
  document.getElementById('modal-presenca').classList.remove('hidden');

  try {
    const evento = await api.get(`/eventos/${eventoId}`);
    document.getElementById('presenca-titulo-evento').textContent = evento.titulo;
    document.getElementById('presenca-data-evento').textContent =
      `${formatarDataBR(evento.data_evento)}${evento.local ? ' · ' + evento.local : ''}`;

    const container = document.getElementById('lista-presencas');
    if (evento.pacientes.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm">Nenhum paciente ativo cadastrado.</p>';
      return;
    }

    container.innerHTML = '';
    evento.pacientes.forEach((p) => {
      const presenteInicial = p.presente === null || p.presente === undefined ? 1 : p.presente;
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-4 py-2.5';
      div.dataset.pacienteId = p.id;
      div.innerHTML = `
        <div class="flex-1">
          <p class="text-sm font-medium text-slate-700">${p.nome}</p>
          <input type="text" placeholder="Justificativa (opcional)" value="${p.justificativa || ''}"
            class="justificativa-input text-xs mt-1 w-full border-b border-slate-200 focus:outline-none focus:border-amut-blue ${presenteInicial ? 'hidden' : ''}">
        </div>
        <div class="flex gap-1 shrink-0">
          <button type="button" onclick="marcarPresenca(${p.id}, 1)" class="btn-presente px-3 py-1.5 rounded-lg text-xs font-semibold border ${presenteInicial ? 'bg-amut-green text-white border-amut-green' : 'border-slate-300 text-slate-500'}">Presente</button>
          <button type="button" onclick="marcarPresenca(${p.id}, 0)" class="btn-ausente px-3 py-1.5 rounded-lg text-xs font-semibold border ${!presenteInicial ? 'bg-amut-red text-white border-amut-red' : 'border-slate-300 text-slate-500'}">Ausente</button>
        </div>`;
      div.dataset.presente = presenteInicial ? '1' : '0';
      container.appendChild(div);
    });
  } catch (err) {
    document.getElementById('lista-presencas').innerHTML = `<p class="text-red-500 text-sm">${err.message}</p>`;
  }
}

function marcarPresenca(pacienteId, presente) {
  const div = document.querySelector(`#lista-presencas [data-paciente-id="${pacienteId}"]`);
  if (!div) return;
  div.dataset.presente = presente ? '1' : '0';

  const btnPresente = div.querySelector('.btn-presente');
  const btnAusente = div.querySelector('.btn-ausente');
  const inputJustificativa = div.querySelector('.justificativa-input');

  if (presente) {
    btnPresente.className = 'btn-presente px-3 py-1.5 rounded-lg text-xs font-semibold border bg-amut-green text-white border-amut-green';
    btnAusente.className = 'btn-ausente px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-500';
    inputJustificativa.classList.add('hidden');
  } else {
    btnAusente.className = 'btn-ausente px-3 py-1.5 rounded-lg text-xs font-semibold border bg-amut-red text-white border-amut-red';
    btnPresente.className = 'btn-presente px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-500';
    inputJustificativa.classList.remove('hidden');
  }
}

function marcarTodosPresentes() {
  document.querySelectorAll('#lista-presencas [data-paciente-id]').forEach((div) => {
    marcarPresenca(parseInt(div.dataset.pacienteId), 1);
  });
}
function marcarTodosAusentes() {
  document.querySelectorAll('#lista-presencas [data-paciente-id]').forEach((div) => {
    marcarPresenca(parseInt(div.dataset.pacienteId), 0);
  });
}

function fecharModalPresenca() {
  document.getElementById('modal-presenca').classList.add('hidden');
  eventoPresencaAtualId = null;
}

async function salvarPresencas() {
  const erroBox = document.getElementById('erro-form-presenca');
  erroBox.classList.add('hidden');

  const presencas = [];
  document.querySelectorAll('#lista-presencas [data-paciente-id]').forEach((div) => {
    presencas.push({
      paciente_id: parseInt(div.dataset.pacienteId),
      presente: div.dataset.presente === '1',
      justificativa: div.querySelector('.justificativa-input').value || null
    });
  });

  const btn = document.getElementById('btn-salvar-presencas');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const resultado = await api.post(`/eventos/${eventoPresencaAtualId}/presencas`, { presencas });
    fecharModalPresenca();
    carregarEventos();

    if (resultado.pacientes_desligados && resultado.pacientes_desligados.length > 0) {
      const nomes = resultado.pacientes_desligados.map((p) => p.nome).join(', ');
      alert(
        `Atenção: o(s) seguinte(s) paciente(s) atingiram 3 faltas consecutivas e foram desligados automaticamente (status alterado para "inativo"):\n\n${nomes}\n\nVocê pode revisar em Pacientes.`
      );
    }
  } catch (err) {
    erroBox.textContent = err.message;
    erroBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Presenças';
  }
}

carregarEventos();