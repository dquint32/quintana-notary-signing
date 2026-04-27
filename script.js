// ============================================
// QUINTANA NOTARY & SIGNING — script.js
// Language toggle | Mobile menu | FAQ accordion
// ============================================

(function () {
  'use strict';

  // ============================================
  // CONSTANTS
  // ============================================
  const LANG_KEY   = 'qns_lang';
  const DEFAULT_LANG = 'es';

  // ============================================
  // LANGUAGE MANAGEMENT
  // ============================================

  /**
   * Returns the currently stored language preference.
   * Falls back to the <html lang> attribute, then DEFAULT_LANG.
   */
  function getSavedLang() {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch (_) {
      return null;
    }
  }

  /**
   * Persists the language preference.
   */
  function saveLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (_) {
      // Silently ignore — private/restricted browsing
    }
  }

  /**
   * Applies a language to the document by showing/hiding
   * all elements whose id ends with "-en" or "-es".
   * Works with both block and inline elements by restoring
   * the element's natural display value.
   *
   * @param {string} lang - 'en' or 'es'
   */
  function applyLang(lang) {
    if (lang !== 'en' && lang !== 'es') return;

    // Update <html lang="…">
    document.documentElement.lang = lang;

    // All elements that participate in bilingual toggling
    const all = document.querySelectorAll('[id$="-en"], [id$="-es"]');

    all.forEach(function (el) {
      const isEn = el.id.endsWith('-en');
      const isEs = el.id.endsWith('-es');

      if (!isEn && !isEs) return;

      const shouldShow = (lang === 'en' && isEn) || (lang === 'es' && isEs);

      if (shouldShow) {
        // Restore natural display.
        // Buttons, spans, and a-tags are inline; divs/sections are block.
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  /**
   * Toggles between 'en' and 'es', or forces a specific language.
   *
   * @param {string|null} forceLang - optional; if supplied, sets that language directly
   */
  function toggleLanguage(forceLang) {
    const current = document.documentElement.lang || DEFAULT_LANG;
    const next    = forceLang || (current === 'es' ? 'en' : 'es');
    applyLang(next);
    saveLang(next);
  }

  /**
   * Reads the saved preference (or html[lang]) and initialises
   * the page language WITHOUT flashing the wrong language.
   * Called as early as possible — before DOMContentLoaded isn't
   * always safe for querySelector, so we run it inside DOMContentLoaded
   * but before any other visual work.
   */
  function initLang() {
    const saved   = getSavedLang();
    // The HTML file sets lang="es" or lang="en" at authoring time.
    const htmlLang = document.documentElement.lang || DEFAULT_LANG;
    // Stored preference wins; then fall back to what the HTML says.
    const target  = saved || htmlLang;
    applyLang(target);
  }

  // ============================================
  // MOBILE MENU
  // ============================================

  /** Cache menu references after DOM is ready */
  let navEl        = null;
  let hamburgerEl  = null;

  function openMenu() {
    if (!navEl || !hamburgerEl) return;
    navEl.classList.add('active');
    hamburgerEl.classList.add('active');
    hamburgerEl.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!navEl || !hamburgerEl) return;
    navEl.classList.remove('active');
    hamburgerEl.classList.remove('active');
    hamburgerEl.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    if (!navEl) return;
    navEl.classList.contains('active') ? closeMenu() : openMenu();
  }

  // ============================================
  // STICKY HEADER OFFSET
  // Calculates the real height of the help-bar
  // and applies it as the header's `top` value.
  // This avoids hardcoding the pixel value in CSS.
  // ============================================
  function updateHeaderOffset() {
    const helpBar = document.querySelector('.top-help-bar');
    const header  = document.querySelector('header');
    if (!helpBar || !header) return;
    const h = helpBar.getBoundingClientRect().height;
    header.style.top = h + 'px';
    // Keep the CSS var in sync for any other consumers
    document.documentElement.style.setProperty('--help-bar-h', h + 'px');
  }

  // ============================================
  // FAQ ACCORDION
  // ============================================

  /**
   * Opens a single FAQ answer panel, closes siblings.
   *
   * @param {HTMLElement} btn - the .faq-question button
   */
  function openFaq(btn) {
    const item   = btn.closest('.faq-item');
    const answer = btn.nextElementSibling;
    if (!item || !answer) return;

    // Close any open FAQ within the same container
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

  /**
   * Closes a single FAQ answer panel.
   *
   * @param {HTMLElement} btn - the .faq-question button
   */
  function closeFaq(btn) {
    const item   = btn.closest('.faq-item');
    const answer = btn.nextElementSibling;
    if (!item || !answer) return;

    btn.classList.remove('active');
    item.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    answer.style.maxHeight = null;
  }

  /**
   * Toggles a FAQ item open/closed.
   */
  function toggleFaq(btn) {
    btn.classList.contains('active') ? closeFaq(btn) : openFaq(btn);
  }

  // ============================================
  // GLOBALLY EXPOSED HELPERS (used by inline
  // onclick in faq.html — expandAllFaqs / collapseAllFaqs)
  // ============================================

  window.expandAllFaqs = function () {
    document.querySelectorAll('.faq-question').forEach(openFaq);
  };

  window.collapseAllFaqs = function () {
    document.querySelectorAll('.faq-question').forEach(closeFaq);
  };

  // Also expose toggleLanguage globally so any page can call it
  // from an onclick attribute if needed (backwards compatibility).
  window.toggleLanguage = toggleLanguage;

  // ============================================
  // SMOOTH SCROLL FOR "#top" LINKS
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href="#top"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ============================================
  // DOM READY — WIRE EVERYTHING UP
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {

    // 1. Apply language FIRST — minimises visible language flash
    initLang();

    // 2. Cache nav elements
    navEl       = document.getElementById('main-nav');
    hamburgerEl = document.getElementById('hamburger');

    // 3. Language toggle button(s)
    //    Supports multiple toggle buttons on the same page.
    document.querySelectorAll('#lang-toggle, .toggle-btn').forEach(function (btn) {
      // Remove any pre-existing onclick set in HTML to avoid double-firing
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

    // 6. Close mobile menu on resize to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 860) closeMenu();
      updateHeaderOffset();
    });

    // 7. Calculate sticky header offset
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

    // 9. Smooth scroll back-to-top links
    initSmoothScroll();

    // 10. Ensure FAQ answers have maxHeight recalculated if the
    //     window is resized while one is open (prevents clipping)
    window.addEventListener('resize', function () {
      document.querySelectorAll('.faq-question.active').forEach(function (btn) {
        const answer = btn.nextElementSibling;
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
      });
    });

  });

})();
