// Registro do PWA e botão "Instalar aplicativo".
// Qualquer elemento com [data-instalar-app] vira botão de instalação e só aparece quando a instalação é possível.
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker não registrado:', err));
    });
  }

  const jaInstalado = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const ehIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let eventoInstalacao = null;

  function botoes() {
    return document.querySelectorAll('[data-instalar-app]');
  }

  function mostrarBotoes(mostrar) {
    botoes().forEach((b) => b.classList.toggle('hidden', !mostrar));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    eventoInstalacao = e;
    mostrarBotoes(true);
  });

  window.addEventListener('appinstalled', () => {
    eventoInstalacao = null;
    mostrarBotoes(false);
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (jaInstalado) return;

    // O Safari do iPhone não dispara beforeinstallprompt: a instalação é manual pelo menu Compartilhar.
    if (ehIos) mostrarBotoes(true);

    botoes().forEach((botao) => {
      botao.addEventListener('click', async () => {
        if (eventoInstalacao) {
          eventoInstalacao.prompt();
          await eventoInstalacao.userChoice;
          eventoInstalacao = null;
          mostrarBotoes(false);
        } else if (ehIos) {
          alert('Para instalar no iPhone/iPad: toque no botão Compartilhar (quadrado com seta) e escolha "Adicionar à Tela de Início".');
        }
      });
    });
  });
})();
