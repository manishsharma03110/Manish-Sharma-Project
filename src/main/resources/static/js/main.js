(() => {
  'use strict';

  const root = document.documentElement;
  const navbar = document.querySelector('.navbar');
  const menuButton = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1024px)');
  const counters = [...document.querySelectorAll('.stat-number[data-target]')];
  const finishedCounters = new WeakSet();
  const counterFrames = new Map();
  let counterObserver;
  let aosInitialized = false;

  // Touch browsers do not consistently apply :active to non-link cards.
  let pressedCard;
  const clearPressedCard = () => {
    pressedCard?.classList.remove('is-touch-pressed');
    pressedCard = undefined;
  };
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    clearPressedCard();
    pressedCard = event.target.closest('.card');
    pressedCard?.classList.add('is-touch-pressed');
  }, { passive: true });
  document.addEventListener('pointerup', clearPressedCard, { passive: true });
  document.addEventListener('pointercancel', clearPressedCard, { passive: true });
  window.addEventListener('blur', clearPressedCard);

  /*
   * Brand icons retained from Lucide 0.468.0; newer releases omit these icons.
   * Source: https://github.com/lucide-icons/lucide/tree/0.468.0/icons
   * License: https://github.com/lucide-icons/lucide/blob/0.468.0/LICENSE
   *
   * ISC License
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as
   * part of Feather (MIT). All other copyright (c) for Lucide are held by
   * Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   */
  const socialIcons = {
    Github: [
      ['path', { d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' }],
      ['path', { d: 'M9 18c-4.51 2-5-2-7-2' }]
    ],
    Linkedin: [
      ['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' }],
      ['rect', { width: '4', height: '12', x: '2', y: '9' }],
      ['circle', { cx: '4', cy: '4', r: '2' }]
    ],
    Twitter: [
      ['path', { d: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' }]
    ]
  };

  root.classList.add('js');

  function createIcons() {
    // Navigation and page content remain usable if either CDN is unavailable.
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons({ icons: { ...window.lucide.icons, ...socialIcons } });
      } catch {
        // CSS supplies a menu icon fallback; decorative icons are nonessential.
      }
    }
  }

  function setMenuOpen(open) {
    if (!menuButton || !navLinks) return;
    if ((menuButton.getAttribute('aria-expanded') === 'true') === open) return;
    menuButton.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('is-open', open);

    // Lucide replaces <i> with <svg>, so replace the rendered node before updating.
    const currentIcon = menuButton.querySelector('.menu-icon');
    if (currentIcon) {
      const nextIcon = document.createElement('i');
      nextIcon.className = 'menu-icon';
      nextIcon.setAttribute('data-lucide', open ? 'x' : 'menu');
      nextIcon.setAttribute('aria-hidden', 'true');
      currentIcon.replaceWith(nextIcon);
      createIcons();
    }
  }

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    navLinks.addEventListener('click', event => {
      if (event.target.closest('a')) setMenuOpen(false);
    });
    document.addEventListener('click', event => {
      // Lucide may replace the clicked SVG before this bubbles to document.
      const clickedNavbar = typeof event.composedPath === 'function'
        ? event.composedPath().includes(navbar)
        : navbar && navbar.contains(event.target);
      if (navbar && !clickedNavbar) setMenuOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuButton.focus();
      }
    });
    desktop.addEventListener('change', () => {
      const focusWasInMenu = navLinks.contains(document.activeElement);
      setMenuOpen(false);
      if (!desktop.matches && focusWasInMenu) menuButton.focus();
    });
  }

  function updateNavbar() {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();
  createIcons();

  function finalCounterText(element) {
    return `${element.dataset.target}${element.dataset.suffix || ''}`;
  }

  function finishCounter(element) {
    if (counterFrames.has(element)) {
      window.cancelAnimationFrame(counterFrames.get(element));
      counterFrames.delete(element);
    }
    element.textContent = finalCounterText(element);
    finishedCounters.add(element);
  }

  function animateCounter(element, duration = 1200) {
    const target = Number(element.dataset.target);
    if (!Number.isFinite(target) || reducedMotion.matches) {
      finishCounter(element);
      return;
    }

    const suffix = element.dataset.suffix || '';
    const precision = (element.dataset.target.split('.')[1] || '').length;
    const factor = 10 ** precision;
    const startTime = performance.now();
    element.textContent = `0${suffix}`;

    function step(currentTime) {
      if (reducedMotion.matches) {
        finishCounter(element);
        return;
      }
      const progress = Math.min(Math.max((currentTime - startTime) / duration, 0), 1);
      const value = Math.floor(progress * target * factor) / factor;
      element.textContent = `${value}${suffix}`;
      if (progress < 1) {
        counterFrames.set(element, window.requestAnimationFrame(step));
      } else {
        finishCounter(element);
      }
    }

    counterFrames.set(element, window.requestAnimationFrame(step));
  }

  function observeCounters() {
    if (counterObserver || !('IntersectionObserver' in window)) return;
    counterObserver = new IntersectionObserver(entries => {
      if (reducedMotion.matches) return;
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        counterObserver.unobserve(entry.target);
        if (!finishedCounters.has(entry.target) && !counterFrames.has(entry.target)) {
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(element => {
      if (!finishedCounters.has(element)) counterObserver.observe(element);
    });
  }

  function refreshReveals() {
    if (!aosInitialized || reducedMotion.matches) return;
    try {
      window.AOS.refresh();
    } catch {
      root.classList.remove('aos-ready');
    }
  }

  function applyMotionPreference() {
    if (reducedMotion.matches) {
      root.classList.remove('aos-ready');
      if (counterObserver) counterObserver.disconnect();
      counterObserver = undefined;
      counters.forEach(finishCounter);
      return;
    }

    if (window.AOS && typeof window.AOS.init === 'function') {
      try {
        if (!aosInitialized) {
          window.AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 60 });
          aosInitialized = true;
        } else {
          window.AOS.refreshHard();
        }
        root.classList.add('aos-ready');
      } catch {
        root.classList.remove('aos-ready');
      }
    }
    observeCounters();
  }

  reducedMotion.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
  window.addEventListener('load', refreshReveals, { once: true });
  if (document.fonts) document.fonts.ready.then(refreshReveals);
})();

// Navigation disclosures and optional ambient motion.
(() => {
  const desktop = matchMedia('(min-width: 1024px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = [...document.querySelectorAll('.nav-dropdown')];
  function setOpen(group, open) {
    group.querySelector('button').setAttribute('aria-expanded', String(open));
    group.querySelector('.dropdown-panel').hidden = !open;
  }
  const closeAll = () => groups.forEach(g => setOpen(g, false));
  groups.forEach(group => {
    const button = group.querySelector('button');
    button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') !== 'true'; closeAll(); setOpen(group, open); });
    group.addEventListener('pointerenter', e => { if (desktop.matches && e.pointerType === 'mouse') { closeAll(); setOpen(group, true); } });
    group.addEventListener('pointerleave', () => { if (desktop.matches && !group.contains(document.activeElement)) setOpen(group, false); });
    group.addEventListener('focusout', e => { if (!group.contains(e.relatedTarget)) setOpen(group, false); });
    group.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(group, false); button.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(group, true); group.querySelector('a').focus(); }
    });
    group.querySelectorAll('a').forEach(a => a.addEventListener('click', closeAll));
  });
  document.addEventListener('click', e => { if (!e.target.closest('.nav-dropdown')) closeAll(); });
  desktop.addEventListener('change', closeAll);
  const hero = document.querySelector('.hero');
  const portrait = document.querySelector('.portrait-placeholder');
  let frame;
  hero?.addEventListener('pointermove', e => {
    if (reduced.matches || e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mouse-x', `${e.clientX-r.left}px`);
    hero.style.setProperty('--mouse-y', `${e.clientY-r.top}px`);
  }, { passive: true });
  function parallax() {
    frame = undefined;
    if (!portrait || reduced.matches) return;
    const r = portrait.parentElement.getBoundingClientRect();
    const offset = Math.max(-18, Math.min(18, (innerHeight/2-r.top-r.height/2)*.035));
    portrait.style.setProperty('--parallax-y', `${offset}px`);
  }
  window.addEventListener('scroll', () => { if (!reduced.matches && !frame) frame = requestAnimationFrame(parallax); }, { passive: true });
  function motion() {
    cancelAnimationFrame(frame);
    portrait?.style.removeProperty('--parallax-y');
    if (reduced.matches) return;
    parallax();

  }
  reduced.addEventListener('change', motion);
  motion();
})();

