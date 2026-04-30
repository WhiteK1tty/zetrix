// ===== CUSTOM SELECT COMPONENT =====
// Usage: new CustomSelect(containerEl, options, defaultValue, onChange)
// Or via HTML: <div class="custom-select-wrap" data-options="Базовый,Премиум,VIP" data-value="Базовый"></div>

class CustomSelect {
  constructor(container, options, defaultValue, onChange) {
    this.container = container;
    this.options   = options;
    this.value     = defaultValue || options[0];
    this.onChange  = onChange || (() => {});
    this.isOpen    = false;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.classList.add('cselect-wrap');
    this.container.innerHTML = `
      <button type="button" class="cselect-trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="cselect-value">${this.value}</span>
        <span class="cselect-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>
      <div class="cselect-dropdown" role="listbox">
        ${this.options.map(opt => `
          <div class="cselect-option ${opt === this.value ? 'selected' : ''}" role="option" data-value="${opt}">
            <span class="cselect-option-check">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            ${opt}
          </div>
        `).join('')}
      </div>
    `;

    this.trigger  = this.container.querySelector('.cselect-trigger');
    this.dropdown = this.container.querySelector('.cselect-dropdown');
    this.valueEl  = this.container.querySelector('.cselect-value');
    this.arrow    = this.container.querySelector('.cselect-arrow');
  }

  bindEvents() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.dropdown.querySelectorAll('.cselect-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        this.select(opt.dataset.value);
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) this.close();
    });

    // Keyboard navigation
    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(); }
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowDown') { e.preventDefault(); this.moveSelection(1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); this.moveSelection(-1); }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    // Close all other selects first
    document.querySelectorAll('.cselect-wrap.open').forEach(el => {
      if (el !== this.container) el._cselectInstance?.close();
    });

    this.isOpen = true;
    this.container.classList.add('open');
    this.trigger.setAttribute('aria-expanded', 'true');
    this.arrow.style.transform = 'rotate(180deg)';

    // Animate options in
    this.dropdown.querySelectorAll('.cselect-option').forEach((opt, i) => {
      opt.style.opacity   = '0';
      opt.style.transform = 'translateY(-6px)';
      setTimeout(() => {
        opt.style.transition = `opacity 0.2s ease ${i * 0.04}s, transform 0.2s ease ${i * 0.04}s`;
        opt.style.opacity    = '1';
        opt.style.transform  = 'translateY(0)';
      }, 10);
    });
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('open');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.arrow.style.transform = '';
  }

  select(val) {
    this.value = val;
    this.valueEl.textContent = val;

    this.dropdown.querySelectorAll('.cselect-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.value === val);
    });

    this.onChange(val);
    this.close();
  }

  moveSelection(dir) {
    const idx     = this.options.indexOf(this.value);
    const newIdx  = Math.max(0, Math.min(this.options.length - 1, idx + dir));
    this.select(this.options[newIdx]);
    if (!this.isOpen) this.open();
  }

  getValue() { return this.value; }
  setValue(val) { this.select(val); }
}

// ===== AUTO-INIT from data attributes =====
function initCustomSelects() {
  document.querySelectorAll('[data-custom-select]').forEach(el => {
    if (el._cselectInstance) return;
    const options = el.dataset.options ? el.dataset.options.split(',') : [];
    const def     = el.dataset.value || options[0];
    const targetId = el.dataset.target; // hidden input id to sync

    const instance = new CustomSelect(el, options, def, (val) => {
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) target.value = val;
      }
    });

    el._cselectInstance = instance;

    // Sync initial value to hidden input
    if (targetId) {
      const target = document.getElementById(targetId);
      if (target) target.value = def;
    }
  });
}

document.addEventListener('DOMContentLoaded', initCustomSelects);
