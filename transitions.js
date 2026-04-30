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
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

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

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    revealPage();
    interceptLinks();
    initScrollReveal();
    initNavbarScroll();
  });
})();
