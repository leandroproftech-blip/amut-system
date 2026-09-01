/**
 * Combobox reutilizável: busca por nome e CPF.
 *
 * Uso:
 *   const bs = criarBuscaSelect({
 *     container: '#meu-container',
 *     placeholder: 'Buscar por nome ou CPF...',
 *     emptyLabel: '— Nenhum vínculo —',
 *     getLabel: (item) => item.nome,
 *     getSubLabel: (item) => item.cpf ? `CPF: ${item.cpf}` : '',
 *     getSearchText: (item) => `${item.nome} ${item.cpf || ''}`,
 *     onChange: (item) => { ... }
 *   });
 *   bs.setItems(lista);
 *   bs.setValue(id);
 *   bs.getValue(); // id ou ''
 *   bs.getSelected(); // item ou null
 *   bs.clear();
 */
function criarBuscaSelect(opcoes) {
  const {
    container,
    placeholder = 'Buscar por nome ou CPF...',
    emptyLabel = '— Sem vínculo —',
    allowEmpty = true,
    getLabel = (item) => item.nome || '',
    getSubLabel = (item) => (item.cpf ? `CPF: ${formatarCpfBusca(item.cpf)}` : ''),
    getSearchText = (item) => `${item.nome || ''} ${item.cpf || ''} ${item.paciente_nome || ''}`,
    onChange = null,
    maxVisible = 50
  } = opcoes;

  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) throw new Error('criarBuscaSelect: container não encontrado');

  let items = [];
  let selectedId = '';
  let aberto = false;

  el.innerHTML = `
    <div class="busca-select relative" data-busca-select>
      <input type="hidden" class="bs-value" value="">
      <div class="relative">
        <input type="text" class="bs-input inp pr-9" autocomplete="off" placeholder="${escaparHtml(placeholder)}">
        <button type="button" class="bs-limpar absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none hidden" title="Limpar">&times;</button>
      </div>
      <p class="bs-hint text-xs text-slate-400 mt-1">Digite o nome ou CPF para filtrar</p>
      <div class="bs-lista hidden absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg"></div>
    </div>
  `;

  const root = el.querySelector('[data-busca-select]');
  const input = root.querySelector('.bs-input');
  const hidden = root.querySelector('.bs-value');
  const lista = root.querySelector('.bs-lista');
  const btnLimpar = root.querySelector('.bs-limpar');

  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.\-\/]/g, '');
  }

  function textoBuscaItem(item) {
    const bruto = getSearchText(item);
    const soDigitos = String(item.cpf || '').replace(/\D/g, '');
    return `${normalizar(bruto)} ${soDigitos}`;
  }

  function filtrar(termo) {
    const t = normalizar(termo).trim();
    const tDigitos = String(termo || '').replace(/\D/g, '');
    if (!t) return items.slice(0, maxVisible);

    return items.filter((item) => {
      const hay = textoBuscaItem(item);
      if (hay.includes(t)) return true;
      if (tDigitos.length >= 3 && hay.includes(tDigitos)) return true;
      return false;
    }).slice(0, maxVisible);
  }

  function renderLista(termo) {
    const filtrados = filtrar(termo);
    let html = '';

    if (allowEmpty) {
      html += `<button type="button" class="bs-opcao w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-500 border-b border-slate-100" data-id="">${escaparHtml(emptyLabel)}</button>`;
    }

    if (filtrados.length === 0) {
      html += `<p class="px-3 py-3 text-sm text-slate-400">Nenhum resultado para "${escaparHtml(termo)}"</p>`;
    } else {
      filtrados.forEach((item) => {
        const id = String(item.id);
        const ativo = id === String(selectedId);
        const sub = getSubLabel(item);
        html += `
          <button type="button" class="bs-opcao w-full text-left px-3 py-2 hover:bg-slate-50 ${ativo ? 'bg-sky-50' : ''}" data-id="${escaparHtml(id)}">
            <span class="block text-sm font-medium text-slate-700">${escaparHtml(getLabel(item))}</span>
            ${sub ? `<span class="block text-xs text-slate-400 mt-0.5">${escaparHtml(sub)}</span>` : ''}
          </button>`;
      });
    }

    lista.innerHTML = html;
    lista.classList.remove('hidden');
    aberto = true;
  }

  function fecharLista() {
    lista.classList.add('hidden');
    aberto = false;
  }

  function atualizarLimpar() {
    btnLimpar.classList.toggle('hidden', !selectedId && !input.value);
  }

  function selecionar(id) {
    selectedId = id ? String(id) : '';
    hidden.value = selectedId;
    const item = items.find((i) => String(i.id) === selectedId) || null;

    if (item) {
      input.value = getLabel(item);
    } else if (!selectedId) {
      input.value = '';
    }

    atualizarLimpar();
    fecharLista();
    if (typeof onChange === 'function') onChange(item);
  }

  input.addEventListener('focus', () => {
    renderLista(input.value);
  });

  input.addEventListener('input', () => {
    // Se o usuário digita depois de ter selecionado, limpa o vínculo
    if (selectedId) {
      selectedId = '';
      hidden.value = '';
      if (typeof onChange === 'function') onChange(null);
    }
    atualizarLimpar();
    renderLista(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharLista();
      input.blur();
    }
  });

  lista.addEventListener('click', (e) => {
    const btn = e.target.closest('.bs-opcao');
    if (!btn) return;
    selecionar(btn.dataset.id || '');
  });

  btnLimpar.addEventListener('click', () => {
    selecionar('');
    input.focus();
    renderLista('');
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) fecharLista();
  });

  return {
    setItems(listaItens) {
      items = Array.isArray(listaItens) ? listaItens : [];
      if (selectedId && !items.find((i) => String(i.id) === String(selectedId))) {
        selecionar('');
      } else if (selectedId) {
        const item = items.find((i) => String(i.id) === String(selectedId));
        if (item) input.value = getLabel(item);
      }
    },
    setValue(id) {
      selecionar(id || '');
    },
    getValue() {
      return hidden.value || '';
    },
    getSelected() {
      return items.find((i) => String(i.id) === String(selectedId)) || null;
    },
    clear() {
      selecionar('');
    },
    focus() {
      input.focus();
    }
  };
}

function formatarCpfBusca(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  if (d.length !== 11) return cpf || '';
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function escaparHtml(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
