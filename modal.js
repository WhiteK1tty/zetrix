// ===== CUSTOM MODAL =====
// Usage: ZModal.confirm({ title, text, confirmText, danger }).then(ok => { if(ok) ... })
// Usage: ZModal.alert({ title, text })

const ZModal = (() => {
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'zmodal-overlay';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    return overlay;
  }

  function removeOverlay(overlay) {
    overlay.classList.remove('visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  function confirm({ title = 'Подтвердите действие', text = '', confirmText = 'Подтвердить', cancelText = 'Отмена', danger = false } = {}) {
    return new Promise(resolve => {
      const overlay = createOverlay();
      overlay.innerHTML = `
        <div class="zmodal">
          <div class="zmodal-icon ${danger ? 'danger' : 'info'}">
            ${danger
              ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
              : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
            }
          </div>
          <div class="zmodal-title">${title}</div>
          ${text ? `<div class="zmodal-text">${text}</div>` : ''}
          <div class="zmodal-actions">
            <button class="zmodal-btn cancel">${cancelText}</button>
            <button class="zmodal-btn confirm ${danger ? 'danger' : ''}">${confirmText}</button>
          </div>
        </div>
      `;

      overlay.querySelector('.zmodal-btn.cancel').addEventListener('click', () => {
        removeOverlay(overlay);
        resolve(false);
      });
      overlay.querySelector('.zmodal-btn.confirm').addEventListener('click', () => {
        removeOverlay(overlay);
        resolve(true);
      });
      overlay.addEventListener('click', e => {
        if (e.target === overlay) { removeOverlay(overlay); resolve(false); }
      });
    });
  }

  function alert({ title = 'Уведомление', text = '', type = 'success' } = {}) {
    return new Promise(resolve => {
      const overlay = createOverlay();
      const icons = {
        success: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        error:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        info:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      };
      overlay.innerHTML = `
        <div class="zmodal">
          <div class="zmodal-icon ${type}">${icons[type] || icons.info}</div>
          <div class="zmodal-title">${title}</div>
          ${text ? `<div class="zmodal-text">${text}</div>` : ''}
          <div class="zmodal-actions">
            <button class="zmodal-btn confirm">Понятно</button>
          </div>
        </div>
      `;
      overlay.querySelector('.zmodal-btn.confirm').addEventListener('click', () => {
        removeOverlay(overlay); resolve(true);
      });
    });
  }

  return { confirm, alert };
})();
