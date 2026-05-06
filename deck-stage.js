/**
 * deck-stage · custom element pra apresentação 1920×1080
 * Auto-scale pra viewport, navegação por teclado, HUD opcional.
 */
(function () {
  if (customElements.get('deck-stage')) return;

  class DeckStage extends HTMLElement {
    connectedCallback() {
      const w = parseInt(this.getAttribute('width') || '1920', 10);
      const h = parseInt(this.getAttribute('height') || '1080', 10);
      this.dataset.w = w;
      this.dataset.h = h;

      // base style
      Object.assign(this.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: w + 'px',
        height: h + 'px',
        transformOrigin: 'top left',
        background: '#0A0A0A',
      });

      // wrap each <section> as a slide
      const slides = Array.from(this.querySelectorAll(':scope > section'));
      slides.forEach((s, i) => {
        Object.assign(s.style, {
          position: 'absolute',
          inset: '0',
          width: w + 'px',
          height: h + 'px',
          display: i === 0 ? 'flex' : 'none',
          opacity: i === 0 ? '1' : '0',
          transition: 'opacity .25s ease',
        });
        s.dataset.slideIdx = i;
      });

      this.slides = slides;
      this.idx = 0;
      this.installNav();
      this.installScale();
      this.installHelpHud();

      window.addEventListener('resize', () => this.fit());
      this.fit();
    }

    fit() {
      const w = parseInt(this.dataset.w, 10);
      const h = parseInt(this.dataset.h, 10);
      const sx = window.innerWidth / w;
      const sy = window.innerHeight / h;
      const s = Math.min(sx, sy);
      // center
      const tx = (window.innerWidth - w * s) / 2;
      const ty = (window.innerHeight - h * s) / 2;
      this.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    }

    show(i) {
      if (i < 0) i = 0;
      if (i >= this.slides.length) i = this.slides.length - 1;
      const prev = this.slides[this.idx];
      const next = this.slides[i];
      if (prev === next) return;
      // simple cross-fade
      next.style.display = 'flex';
      requestAnimationFrame(() => {
        prev.style.opacity = '0';
        next.style.opacity = '1';
      });
      setTimeout(() => {
        prev.style.display = 'none';
      }, 260);
      this.idx = i;
      this.updateHud();
      // hash sync
      try { history.replaceState(null, '', '#' + (i + 1)); } catch (_) {}
    }

    next() { this.show(this.idx + 1); }
    prev() { this.show(this.idx - 1); }

    installNav() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault(); this.next();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault(); this.prev();
        } else if (e.key === 'Home') {
          e.preventDefault(); this.show(0);
        } else if (e.key === 'End') {
          e.preventDefault(); this.show(this.slides.length - 1);
        } else if (e.key === 'f' || e.key === 'F') {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
        }
      });

      // touch swipe
      let tx = 0;
      this.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
      this.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - tx;
        if (dx < -40) this.next();
        if (dx > 40) this.prev();
      }, { passive: true });

      // click on bottom-half advances
      this.addEventListener('click', (e) => {
        if (e.target.closest('a, button, input, [contenteditable]')) return;
        const rect = this.getBoundingClientRect();
        const localX = (e.clientX - rect.left) / rect.width;
        if (localX > 0.5) this.next(); else this.prev();
      });

      // hash on load
      window.addEventListener('load', () => {
        const m = (location.hash || '').match(/#(\d+)/);
        if (m) this.show(parseInt(m[1], 10) - 1);
      });
    }

    installScale() {
      Object.assign(document.body.style, {
        margin: '0',
        overflow: 'hidden',
        background: '#000',
      });
    }

    installHelpHud() {
      const hud = document.createElement('div');
      hud.id = 'deck-help';
      Object.assign(hud.style, {
        position: 'fixed',
        bottom: '14px',
        left: '14px',
        zIndex: '99',
        font: '11px / 1.4 "Geist Mono", monospace',
        letterSpacing: '.18em',
        textTransform: 'uppercase',
        color: 'rgba(201, 194, 176, .55)',
        pointerEvents: 'none',
      });
      hud.innerHTML = '<kbd style="border:1px solid #2E2E2E;padding:2px 6px;background:#121212;color:#F2EDE2;font-family:inherit;font-size:10px">←</kbd> <kbd style="border:1px solid #2E2E2E;padding:2px 6px;background:#121212;color:#F2EDE2;font-family:inherit;font-size:10px">→</kbd> nav · <kbd style="border:1px solid #2E2E2E;padding:2px 6px;background:#121212;color:#F2EDE2;font-family:inherit;font-size:10px">F</kbd> full · <span id="deck-counter" style="color:#C7FF00">01 / ' + String(this.slides.length).padStart(2, '0') + '</span>';
      document.body.appendChild(hud);
      this.hud = hud;
      this.updateHud();
    }

    updateHud() {
      const c = document.getElementById('deck-counter');
      if (c) c.textContent = String(this.idx + 1).padStart(2, '0') + ' / ' + String(this.slides.length).padStart(2, '0');
    }
  }

  customElements.define('deck-stage', DeckStage);
})();
