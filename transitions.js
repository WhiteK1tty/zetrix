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
      // Only intercept local .html links
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

  // Magnetic buttons
  function initMagneticButtons() {
    document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
      btn.classList.add('magnetic-btn');
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // 3D tilt cards
  function initTiltCards() {
    document.querySelectorAll('.feature-card, .price-card').forEach(card => {
      card.classList.add('tilt-card');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // Cursor glow
  function initCursorGlow() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      glow.classList.add('active');
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('active'));

    function animate() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      glow.style.left = glowX + 'px';
      glow.style.top = glowY + 'px';
      requestAnimationFrame(animate);
    }
    animate();
  }

  // Parallax scroll
  function initParallax() {
    document.querySelectorAll('.hero-glow, .hero-orb-1, .hero-orb-2, .hero-orb-3').forEach(el => {
      el.classList.add('parallax-float');
    });

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      document.querySelectorAll('.parallax-float').forEach((el, i) => {
        const speed = 0.1 + (i % 3) * 0.05;
        el.style.transform = `translateY(${y * speed}px)`;
      });
    }, { passive: true });
  }

  // Ripple effect
  function initRipple() {
    document.querySelectorAll('.btn-primary, .btn-outline, .tbl-btn').forEach(btn => {
      btn.classList.add('ripple');
      btn.addEventListener('click', function(e) {
        const circle = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        circle.style.width = circle.style.height = size + 'px';
        circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
        circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
      });
    });
  }

  // Liquid button effect
  function initLiquidButtons() {
    document.querySelectorAll('.btn-primary').forEach(btn => {
      btn.classList.add('liquid-btn');
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--x', ((e.clientX - rect.left) / rect.width * 100) + '%');
        btn.style.setProperty('--y', ((e.clientY - rect.top) / rect.height * 100) + '%');
      });
    });
  }

  // Scroll progress bar
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (scrollTop / docHeight * 100) + '%';
    }, { passive: true });
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    revealPage();
    interceptLinks();
    initScrollReveal();
    initNavbarScroll();
    initMagneticButtons();
    initTiltCards();
    // Keep the experience smooth and readable: avoid overloading with heavy effects.
    initScrollProgress();
  });
})();
