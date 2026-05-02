// ===== MATH CAPTCHA =====
const Captcha = {
  _answer: null,
  _canvas: null,

  generate(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let answer;
    if (op === '+') {
      answer = num1 + num2;
    } else {
      // Ensure positive result for subtraction
      const a = Math.max(num1, num2);
      const b = Math.min(num1, num2);
      answer = a - b;
      this._answer = answer;
      this._render(container, `${a} ${op} ${b}`);
      return;
    }

    this._answer = answer;
    this._render(container, `${num1} ${op} ${num2}`);
  },

  _render(container, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = 'rgba(18, 11, 32, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(124, 58, 237, ${Math.random() * 0.3 + 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(167, 139, 250, ${Math.random() * 0.3 + 0.1})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text with gradient
    const gradient = ctx.createLinearGradient(20, 0, 160, 0);
    gradient.addColorStop(0, '#a78bfa');
    gradient.addColorStop(0.5, '#c4b5fd');
    gradient.addColorStop(1, '#6366f1');
    ctx.fillStyle = gradient;
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(124, 58, 237, 0.5)';
    ctx.shadowBlur = 8;

    // Slight rotation for each char
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((Math.random() - 0.5) * 0.15);
    ctx.fillText(text, 0, 0);
    ctx.restore();

    // Wavy line across text
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 15; x < canvas.width - 15; x += 2) {
      const y = centerY + Math.sin(x * 0.1) * 3 + (Math.random() - 0.5) * 2;
      if (x === 15) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    this._canvas = canvas;

    // Build widget HTML
    container.innerHTML = `
      <div class="captcha-wrap">
        <div class="captcha-image-wrap">
          <img src="${canvas.toDataURL()}" alt="CAPTCHA" class="captcha-img" />
          <button type="button" class="captcha-refresh" onclick="Captcha.refresh('${container.id}')" title="Новая капча">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
          </button>
        </div>
        <div class="input-wrap">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3"/></svg>
          </span>
          <input
            type="text"
            class="form-input captcha-input"
            id="${container.id}Input"
            placeholder="Ответ"
            autocomplete="off"
            inputmode="numeric"
            maxlength="3"
          />
        </div>
      </div>
    `;
  },

  refresh(containerId) {
    this.generate(containerId);
    const input = document.getElementById(`${containerId}Input`);
    if (input) input.value = '';
  },

  validate(containerId) {
    const input = document.getElementById(`${containerId}Input`);
    if (!input) return { valid: false, error: 'Капча не найдена' };

    const value = input.value.trim();
    if (!value) return { valid: false, error: 'Введите ответ с картинки' };

    const num = parseInt(value, 10);
    if (isNaN(num)) return { valid: false, error: 'Ответ должен быть числом' };
    if (num !== this._answer) {
      this.refresh(containerId);
      return { valid: false, error: 'Неверный ответ. Попробуйте ещё раз.' };
    }

    return { valid: true };
  },

  getAnswer() {
    return this._answer;
  }
};

window.Captcha = Captcha;
