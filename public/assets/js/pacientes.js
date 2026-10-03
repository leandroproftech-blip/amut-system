// Lógica da página de gestão de pacientes

exigirLogin();
preencherUsuarioNoHeader();

let paginaAtual = 1;
let totalPaginas = 1;
let contadorResponsaveis = 0;
let fotoBase64Atual = null;
let fotoAlterada = false;

// ---------- Listagem ----------
async function carregarPacientes() {
  const tbody = document.getElementById('tabela-pacientes');
  tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-slate-400">Carregando...</td></tr>';

  const busca = document.getElementById('filtro-busca').value.trim();
  const status = document.getElementById('filtro-status').value;

  try {
    const params = new URLSearchParams({ busca, status, pagina: paginaAtual, limite: 15 });
    const resultado = await api.get(`/pacientes?${params.toString()}`);

    totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.limite));
    document.getElementById('info-paginacao').textContent =
      `${resultado.total} paciente(s) · página ${resultado.pagina} de ${totalPaginas}`;

    if (resultado.dados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-slate-400">Nenhum paciente encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    resultado.dados.forEach((p) => {
      const tr = document.createElement('tr');
      tr.className = 'border-t hover:bg-slate-50';
      tr.innerHTML = `
        <td class="py-3 px-4 text-slate-500">${p.numero_inscricao || '-'}</td>
        <td class="py-3 px-4 font-medium text-slate-700">${p.nome}</td>
        <td class="py-3 px-4">${p.sexo || '-'}</td>
        <td class="py-3 px-4">${p.idade ?? '-'}</td>
        <td class="py-3 px-4">${p.responsavel_principal || '<span class="text-slate-400">Não informado</span>'}</td>
        <td class="py-3 px-4">${p.nivel_suporte || '-'}</td>
        <td class="py-3 px-4"><span class="px-2 py-1 rounded-full text-xs font-semibold ${corStatus(p.status)}">${p.status}</span></td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="inline-flex items-center gap-1">
            ${botaoAcaoIcone('pencil', 'Editar', 'text-amut-blue hover:bg-sky-50', `abrirModalEditarPaciente(${p.id})`)}
            ${botaoAcaoIcone('file-check', 'Comprovante', 'text-amut-purple hover:bg-purple-50', `imprimirComprovante(${p.id})`)}
            ${botaoAcaoIcone('file-text', 'Ficha', 'text-amut-green hover:bg-green-50', `imprimirFicha(${p.id})`)}
            ${botaoAcaoIcone('id-card', 'Carteirinha', 'text-amut-navy hover:bg-slate-100', `imprimirCarteirinha(${p.id})`)}
            ${botaoAcaoIcone('trash-2', 'Excluir', 'text-amut-red hover:bg-red-50', `excluirPaciente(${p.id}, '${p.nome.replace(/'/g, "\\'")}')`)}
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-red-500">${err.message}</td></tr>`;
  }
}

function botaoAcaoIcone(icone, rotulo, classes, onclick) {
  return `
    <button type="button" onclick="${onclick}" aria-label="${rotulo}" class="relative group p-1.5 rounded-lg transition ${classes}">
      <i data-lucide="${icone}" class="w-4 h-4"></i>
      <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-slate-800 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-20">${rotulo}</span>
    </button>`;
}

function corStatus(status) {
  if (status === 'ativo') return 'bg-green-100 text-green-700';
  if (status === 'inativo') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function mudarPagina(delta) {
  const nova = paginaAtual + delta;
  if (nova < 1 || nova > totalPaginas) return;
  paginaAtual = nova;
  carregarPacientes();
}

document.getElementById('filtro-busca').addEventListener('input', debounce(() => { paginaAtual = 1; carregarPacientes(); }, 400));
document.getElementById('filtro-status').addEventListener('change', () => { paginaAtual = 1; carregarPacientes(); });

// Permite pré-filtrar por status via URL, ex: pacientes.html?status=inativo
(function aplicarFiltroDaUrl() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  if (status) document.getElementById('filtro-status').value = status;
})();

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ---------- Foto do paciente ----------
document.getElementById('foto-input').addEventListener('change', handleFotoSelecionada);

function handleFotoSelecionada(e) {
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  if (!arquivo.type.startsWith('image/')) {
    alert('Selecione um arquivo de imagem (JPG, PNG, etc).');
    e.target.value = '';
    return;
  }

  const leitor = new FileReader();
  leitor.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      // Redimensiona no navegador para manter o cadastro leve (máx. 500px no maior lado)
      const LADO_MAXIMO = 500;
      let largura = img.width;
      let altura = img.height;

      if (largura > altura && largura > LADO_MAXIMO) {
        altura = Math.round(altura * (LADO_MAXIMO / largura));
        largura = LADO_MAXIMO;
      } else if (altura >= largura && altura > LADO_MAXIMO) {
        largura = Math.round(largura * (LADO_MAXIMO / altura));
        altura = LADO_MAXIMO;
      }

      const canvas = document.createElement('canvas');
      canvas.width = largura;
      canvas.height = altura;
      canvas.getContext('2d').drawImage(img, 0, 0, largura, altura);

      fotoBase64Atual = canvas.toDataURL('image/jpeg', 0.82);
      fotoAlterada = true;
      atualizarPreviewFoto(fotoBase64Atual);
    };
    img.src = ev.target.result;
  };
  leitor.readAsDataURL(arquivo);
}

function atualizarPreviewFoto(srcBase64) {
  const preview = document.getElementById('foto-preview');
  const placeholder = document.getElementById('foto-placeholder');
  if (srcBase64) {
    preview.src = srcBase64;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');
  } else {
    preview.src = '';
    preview.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }
}

function removerFoto() {
  fotoBase64Atual = null;
  fotoAlterada = true;
  document.getElementById('foto-input').value = '';
  atualizarPreviewFoto(null);
}

// ---------- Abas do modal ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('ativo'));
    document.querySelectorAll('.aba').forEach((a) => a.classList.remove('ativa'));
    btn.classList.add('ativo');
    document.querySelector(`[data-aba-conteudo="${btn.dataset.aba}"]`).classList.add('ativa');
  });
});

function irParaPrimeiraAba() {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('ativo', i === 0));
  document.querySelectorAll('.aba').forEach((a, i) => a.classList.toggle('ativa', i === 0));
}

// ---------- Responsáveis dinâmicos no formulário ----------
function adicionarResponsavelForm(dados = {}) {
  contadorResponsaveis++;
  const id = contadorResponsaveis;
  const div = document.createElement('div');
  div.className = 'border border-slate-200 rounded-xl p-4 relative';
  div.dataset.respId = id;
  div.innerHTML = `
    <button type="button" onclick="this.closest('[data-resp-id]').remove()" class="absolute top-3 right-3 text-slate-400 hover:text-amut-red text-lg">&times;</button>
    <div class="grid md:grid-cols-2 gap-3">
      <div>
        <label class="lbl">Parentesco</label>
        <select class="inp resp-parentesco">
          <option ${dados.parentesco === 'Pai' ? 'selected' : ''}>Pai</option>
          <option ${dados.parentesco === 'Mãe' ? 'selected' : ''}>Mãe</option>
          <option ${!dados.parentesco || dados.parentesco === 'Responsável Legal' ? 'selected' : ''}>Responsável Legal</option>
          <option ${dados.parentesco === 'Outro' ? 'selected' : ''}>Outro</option>
        </select>
      </div>
      <div><label class="lbl">Nome *</label><input type="text" class="inp resp-nome" value="${dados.nome || ''}"></div>
      <div><label class="lbl">CPF</label><input type="text" class="inp resp-cpf" value="${dados.cpf || ''}"></div>
      <div><label class="lbl">Telefone</label><input type="text" class="inp resp-telefone" value="${dados.telefone || ''}"></div>
      <div><label class="lbl">Profissão</label><input type="text" class="inp resp-profissao" value="${dados.profissao || ''}"></div>
      <div><label class="lbl">Empresa</label><input type="text" class="inp resp-empresa" value="${dados.empresa || ''}"></div>
      <div><label class="lbl">Salário (R$)</label><input type="number" step="0.01" class="inp resp-salario" value="${dados.salario ?? ''}"></div>
      <div><label class="lbl">E-mail</label><input type="email" class="inp resp-email" value="${dados.email || ''}"></div>
      <div class="md:col-span-2"><label class="lbl">Endereço</label><input type="text" class="inp resp-endereco" value="${dados.endereco || ''}"></div>
      <div class="md:col-span-2 flex items-center gap-2">
        <input type="checkbox" class="resp-principal" ${dados.principal ? 'checked' : ''} id="principal-${id}">
        <label for="principal-${id}" class="text-sm text-slate-600">Responsável principal para contato</label>
      </div>
    </div>`;
  document.getElementById('lista-responsaveis-form').appendChild(div);
}

function coletarResponsaveisForm() {
  const responsaveis = [];
  document.querySelectorAll('#lista-responsaveis-form [data-resp-id]').forEach((div) => {
    const nome = div.querySelector('.resp-nome').value.trim();
    if (!nome) return;
    responsaveis.push({
      parentesco: div.querySelector('.resp-parentesco').value,
      nome,
      cpf: div.querySelector('.resp-cpf').value || null,
      telefone: div.querySelector('.resp-telefone').value || null,
      profissao: div.querySelector('.resp-profissao').value || null,
      empresa: div.querySelector('.resp-empresa').value || null,
      salario: div.querySelector('.resp-salario').value || null,
      email: div.querySelector('.resp-email').value || null,
      endereco: div.querySelector('.resp-endereco').value || null,
      principal: div.querySelector('.resp-principal').checked
    });
  });
  return responsaveis;
}

// ---------- Modal: abrir / fechar ----------
const CAMPOS_FORM = [
  'numero_inscricao', 'ano_inscricao', 'data_inclusao', 'nome', 'sexo', 'data_nascimento', 'cpf', 'idade',
  'endereco', 'numero_endereco', 'bairro', 'cidade', 'cep', 'ponto_referencia',
  'possui_diagnostico', 'idade_diagnostico', 'descricao_diagnostico', 'nivel_suporte', 'verbal',
  'possui_comorbidade', 'qual_comorbidade', 'em_tratamento_comorbidade', 'descricao_tratamento',
  'faz_uso_medicamento', 'qual_medicamento', 'participa_terapia', 'qual_terapia', 'onde_terapia',
  'terapia_particular_ou_sus', 'participa_outros_projetos', 'qual_outro_projeto',
  'escola_tipo', 'escola_nome', 'periodo_escolar', 'possui_pedido_medico_segundo_professor',
  'necessidade_segundo_professor_atendida', 'informacoes_escolares_adicionais',
  'imovel_tipo', 'mora_com_pai', 'mora_com_mae', 'quantidade_irmaos', 'outros_moradores',
  'quantidade_pessoas_autistas_familia', 'recebe_bolsa_familia', 'valor_bolsa_familia',
  'recebe_bpc', 'valor_bpc', 'recebe_outro_auxilio',
  'autoriza_fotos', 'contato_emergencia', 'compromete_participar_reunioes', 'informacoes_adicionais',
  'status', 'motivo_desligamento', 'observacoes_internas'
];

function limparFormulario() {
  document.getElementById('paciente-id').value = '';
  CAMPOS_FORM.forEach((campo) => {
    const el = document.getElementById(campo);
    if (el) el.value = '';
  });
  document.getElementById('cidade').value = 'Lábrea-AM';
  document.getElementById('cep').value = '69830-000';
  document.getElementById('status').value = 'ativo';
  document.getElementById('lista-responsaveis-form').innerHTML = '';
  document.getElementById('erro-form-paciente').classList.add('hidden');
  contadorResponsaveis = 0;
  fotoBase64Atual = null;
  fotoAlterada = false;
  document.getElementById('foto-input').value = '';
  atualizarPreviewFoto(null);
  irParaPrimeiraAba();
}

function abrirModalNovoPaciente() {
  limparFormulario();
  document.getElementById('modal-titulo').textContent = 'Novo Paciente';
  adicionarResponsavelForm();
  document.getElementById('modal-paciente').classList.remove('hidden');
}

async function abrirModalEditarPaciente(id) {
  limparFormulario();
  document.getElementById('modal-titulo').textContent = 'Editar Paciente';
  document.getElementById('modal-paciente').classList.remove('hidden');

  try {
    const paciente = await api.get(`/pacientes/${id}`);
    document.getElementById('paciente-id').value = paciente.id;

    CAMPOS_FORM.forEach((campo) => {
      const el = document.getElementById(campo);
      if (!el) return;
      let valor = paciente[campo];
      if (valor === null || valor === undefined) valor = '';
      if (['possui_diagnostico', 'verbal', 'possui_comorbidade', 'em_tratamento_comorbidade',
           'faz_uso_medicamento', 'participa_terapia', 'participa_outros_projetos',
           'possui_pedido_medico_segundo_professor', 'necessidade_segundo_professor_atendida',
           'mora_com_pai', 'mora_com_mae', 'recebe_bolsa_familia', 'recebe_bpc',
           'autoriza_fotos', 'compromete_participar_reunioes'].includes(campo) && valor !== '') {
        valor = String(Number(valor));
      }
      if (el.type === 'date' && valor) {
        valor = String(valor).substring(0, 10);
      }
      el.value = valor;
    });

    if (paciente.responsaveis && paciente.responsaveis.length > 0) {
      paciente.responsaveis.forEach((r) => adicionarResponsavelForm(r));
    } else {
      adicionarResponsavelForm();
    }

    // Carrega a foto já cadastrada (se houver) sem marcar como "alterada"
    fotoBase64Atual = paciente.foto || null;
    fotoAlterada = false;
    atualizarPreviewFoto(fotoBase64Atual);
  } catch (err) {
    alert('Erro ao carregar paciente: ' + err.message);
    fecharModalPaciente();
  }
}

function fecharModalPaciente() {
  document.getElementById('modal-paciente').classList.add('hidden');
}

// ---------- Salvar (criar/atualizar) ----------
async function salvarPaciente() {
  const erroBox = document.getElementById('erro-form-paciente');
  erroBox.classList.add('hidden');

  const nome = document.getElementById('nome').value.trim();
  if (!nome) {
    erroBox.textContent = 'O nome do paciente é obrigatório.';
    erroBox.classList.remove('hidden');
    document.querySelector('[data-aba="1"]').click();
    return;
  }

  const dados = {};
  CAMPOS_FORM.forEach((campo) => {
    const el = document.getElementById(campo);
    if (el) dados[campo] = el.value === '' ? null : el.value;
  });
  dados.responsaveis = coletarResponsaveisForm();

  // Só envia o campo foto se ela foi trocada ou removida nesta edição —
  // assim, ao editar outros dados sem mexer na foto, a foto já salva não é apagada.
  if (fotoAlterada) {
    dados.foto = fotoBase64Atual;
  }

  const id = document.getElementById('paciente-id').value;
  const btn = document.getElementById('btn-salvar-paciente');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    let idSalvo = id;
    if (id) {
      await api.put(`/pacientes/${id}`, dados);
    } else {
      const resultado = await api.post('/pacientes', dados);
      idSalvo = resultado.id;
    }
    fecharModalPaciente();
    carregarPacientes();
    abrirModalPosSalvar(idSalvo, nome);
  } catch (err) {
    erroBox.textContent = err.message;
    erroBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Cadastro';
  }
}

// ---------- Modal pós-salvar (opções de impressão) ----------
function abrirModalPosSalvar(idPaciente, nomePaciente) {
  window.__idPosSalvar = idPaciente;
  document.getElementById('pos-salvar-nome').textContent = nomePaciente;
  document.getElementById('modal-pos-salvar').classList.remove('hidden');
}

function fecharModalPosSalvar() {
  document.getElementById('modal-pos-salvar').classList.add('hidden');
}

// ---------- Excluir ----------
async function excluirPaciente(id, nome) {
  if (!confirm(`Tem certeza que deseja excluir o cadastro de "${nome}"? Esta ação não pode ser desfeita.`)) return;
  try {
    await api.delete(`/pacientes/${id}`);
    carregarPacientes();
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}

carregarPacientes();
