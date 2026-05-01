// ===== PAGE TRANSITIONS =====

(function () {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);

  // Reveal page on load
  function revealPage() {
    overlay.classList.add('exit');
    document.body.classList.add('page-loaded');
    overlay.addEventListener('animationend', () => {
      overlay.classList.remove('exit');
    }, { once: true });
  }

  // Intercept all internal link clicks
  function interceptLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      if (link.dataset.transitioned) return;
      link.dataset.transitioned = 'true';

      link.addEventListener('click', function (e) {
        const target = this.getAttribute('href');
        if (!target || target.startsWith('#')) return;

        e.preventDefault();
        overlay.classList.remove('exit');
        overlay.classList.add('enter');

        overlay.addEventListener('animationend', () => {
          window.location.href = target;
        }, { once: true });
      });
    });
  }

  // Scroll reveal
  function initScrollReveal() {
    const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur, .stagger-children';
    const els = document.querySelectorAll(selectors);
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
  }

  // Navbar scroll effect
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // ===== PARTICLE GENERATION =====
  function initParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const count = 30;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = (Math.random() * 3 + 1) + 'px';
      p.style.height = p.style.width;
      p.style.animationDuration = (Math.random() * 12 + 8) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.opacity = '0';

      const colors = ['var(--primary-light)', 'var(--accent-pink)', 'var(--accent-blue)', 'var(--accent-cyan)'];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];

      container.appendChild(p);
    }
  }

  // ===== ANIMATED COUNTERS =====
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const isDecimal = el.dataset.decimal === 'true';
    const duration = 2000;
    const start = performance.now();

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = easedProgress * target;

      if (isDecimal) {
        el.textContent = current.toFixed(1) + suffix;
      } else if (target >= 1000) {
        el.textContent = Math.floor(current / 1000) + 'K' + suffix;
      } else {
        el.textContent = Math.floor(current) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ===== 3D TILT EFFECT ON CARDS =====
  function init3DTilt() {
    const cards = document.querySelectorAll('.feature-card, .price-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `translateY(-6px) scale(1.02) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ===== PARALLAX ON HERO =====
  function initParallax() {
    const hero = document.querySelector('.hero');
    const orbs = document.querySelectorAll('.hero-orb');
    const grid = document.querySelector('.hero-grid');
    if (!hero || !orbs.length) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      orbs.forEach((orb, i) => {
        const factor = (i + 1) * 15;
        orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });

      if (grid) {
        grid.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
      }
    });

    hero.addEventListener('mouseleave', () => {
      orbs.forEach(orb => {
        orb.style.transform = '';
      });
      if (grid) {
        grid.style.transform = '';
      }
    });
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    revealPage();
    interceptLinks();
    initScrollReveal();
    initNavbarScroll();
    initParticles();
    initCounters();
    init3DTilt();
    initParallax();
  });
})();
