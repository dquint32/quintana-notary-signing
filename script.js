// ============================================
// QUINTANA NOTARY & SIGNING — script.js
// Language toggle | Mobile menu | FAQ accordion
// WCAG 2.1 AA | ES6+
// ============================================

(function () {
  'use strict';

  // ============================================
  // CONSTANTS
  // ============================================
  const LANG_KEY     = 'qns_lang';
  const DEFAULT_LANG = 'es';          // Site defaults to Spanish
  const LANGS        = ['en', 'es'];

  // ============================================
  // LANGUAGE MANAGEMENT
  // ─────────────────────────────────────────────
  // Strategy: CSS classes .lang-en / .lang-es on
  // child spans, controlled by data-lang="en|es"
  // on <html>. No more per-element style.display
  // toggling; CSS handles visibility entirely.
  // ============================================

  function getSavedLang () {
    try { return localStorage.getItem(LANG_KEY); } catch (_) { return null; }
  }

  function saveLang (lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) { /* silent */ }
  }

  /**
   * Apply a language to the entire document.
   * 1. Sets data-lang on <html> (CSS uses this selector)
   * 2. Sets lang attribute on <html> for screen readers
   * 3. Updates toggle button aria-label & aria-pressed
   */
  function applyLang (lang) {
    if (!LANGS.includes(lang)) return;

    const root       = document.documentElement;
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);

    toggleBtns.forEach(function (btn) {
      // aria-pressed: true = currently showing this language
      // Semantically: "this button IS the Spanish button" → pressed when lang=es
      btn.setAttribute('aria-pressed', lang === 'es' ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        lang === 'es'
          ? 'Cambiar idioma a inglés / Switch language to English'
          : 'Cambiar idioma a español / Switch language to Spanish'
      );
    });
  }

  function toggleLanguage () {
    const current = document.documentElement.getAttribute('data-lang') || DEFAULT_LANG;
    const next    = current === 'es' ? 'en' : 'es';
    applyLang(next);
    saveLang(next);
  }

  /**
   * Initialise language from saved preference, then the HTML lang
   * attribute, then DEFAULT_LANG. Runs early to prevent flash.
   */
  function initLang () {
    const saved    = getSavedLang();
    const htmlLang = document.documentElement.getAttribute('lang') || DEFAULT_LANG;
    const target   = (saved && LANGS.includes(saved)) ? saved : htmlLang;
    applyLang(target);
  }

  // Expose for any inline onclick still present in older page files
  window.toggleLanguage = toggleLanguage;

  // ============================================
  // MOBILE MENU
  // ============================================
  let navEl       = null;
  let hamburgerEl = null;

  function openMenu () {
    if (!navEl || !hamburgerEl) return;
    navEl.classList.add('active');
    hamburgerEl.classList.add('active');
    hamburgerEl.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu () {
    if (!navEl || !hamburgerEl) return;
    navEl.classList.remove('active');
    hamburgerEl.classList.remove('active');
    hamburgerEl.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMenu () {
    if (!navEl) return;
    navEl.classList.contains('active') ? closeMenu() : openMenu();
  }

  // ============================================
  // STICKY HEADER OFFSET
  // ─────────────────────────────────────────────
  // Measures the help bar's real rendered height
  // and sets it as the header's `top` value plus
  // the --help-bar-h CSS variable.
  // ============================================
  function updateHeaderOffset () {
    const helpBar = document.querySelector('.top-help-bar');
    const header  = document.querySelector('header');
    if (!helpBar || !header) return;
    const h = helpBar.getBoundingClientRect().height;
    header.style.top = h + 'px';
    document.documentElement.style.setProperty('--help-bar-h', h + 'px');
  }

  // ============================================
  // FAQ ACCORDION
  // ============================================

  function openFaq (btn) {
    const item   = btn.closest('.faq-item');
    const answer = btn.nextElementSibling;
    if (!item || !answer) return;

    // Close siblings in the same container
    const container = btn.closest('.faq-accordion-container');
    if (container) {
      container.querySelectorAll('.faq-question.active').forEach(function (openBtn) {
        if (openBtn !== btn) closeFaq(openBtn);
      });
    }

    btn.classList.add('active');
    item.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }

  function closeFaq (btn) {
    const item   = btn.closest('.faq-item');
    const answer = btn.nextElementSibling;
    if (!item || !answer) return;

    btn.classList.remove('active');
    item.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    answer.style.maxHeight = null;
  }

  function toggleFaq (btn) {
    btn.classList.contains('active') ? closeFaq(btn) : openFaq(btn);
  }

  // Globally accessible for inline onclick in older pages
  window.expandAllFaqs   = function () { document.querySelectorAll('.faq-question').forEach(openFaq); };
  window.collapseAllFaqs = function () { document.querySelectorAll('.faq-question').forEach(closeFaq); };

  // ============================================
  // SMOOTH SCROLL
  // ============================================
  function initSmoothScroll () {
    document.querySelectorAll('a[href="#top"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ============================================
  // KEYBOARD TRAP FOR OPEN MOBILE MENU
  // ─────────────────────────────────────────────
  // Keeps Tab focus inside the nav overlay when
  // it is open (WCAG 2.1 success criterion 2.1.2).
  // ============================================
  function initMenuKeyboardTrap () {
    document.addEventListener('keydown', function (e) {
      if (!navEl || !navEl.classList.contains('active')) return;

      if (e.key === 'Escape') {
        closeMenu();
        if (hamburgerEl) hamburgerEl.focus();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        navEl.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) { return !el.hidden && el.offsetParent !== null; });

      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // ============================================
  // DOM READY — WIRE EVERYTHING UP
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {

    // 1. Apply language FIRST — prevents visible flash
    initLang();

    // 2. Cache nav elements
    navEl       = document.getElementById('main-nav');
    hamburgerEl = document.getElementById('hamburger');

    // 3. Language toggle button(s)
    document.querySelectorAll('#lang-toggle, .toggle-btn').forEach(function (btn) {
      btn.removeAttribute('onclick');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleLanguage();
      });
    });

    // 4. Hamburger toggle
    if (hamburgerEl) {
      hamburgerEl.removeAttribute('onclick');
      hamburgerEl.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
      });
    }

    // 5. Close mobile menu when a nav link is tapped
    if (navEl) {
      navEl.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          if (window.innerWidth < 860) closeMenu();
        });
      });
    }

    // 6. Close menu & recalculate offset on resize
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 860) closeMenu();
      updateHeaderOffset();
    });

    // 7. Initial sticky header offset
    updateHeaderOffset();

    // 8. FAQ accordion
    document.querySelectorAll('.faq-question').forEach(function (btn) {
      btn.removeAttribute('onclick');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggleFaq(btn);
      });
    });

    // 9. Smooth scroll
    initSmoothScroll();

    // 10. Keyboard trap for mobile nav
    initMenuKeyboardTrap();

    // 11. Recalculate open FAQ answer heights on resize
    window.addEventListener('resize', function () {
      document.querySelectorAll('.faq-question.active').forEach(function (btn) {
        const answer = btn.nextElementSibling;
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
      });
    });

  });

})();
