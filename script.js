// ============================================================
// QUINTANA NOTARY & SIGNING — script.js
// Language toggle | Mobile menu | FAQ accordion | Sticky header
// WCAG 2.1 AA | ES6+
// ------------------------------------------------------------
// THE FIX
// Every page marks up bilingual text as pairs of elements with
// matching IDs, e.g.:
//   <h1 id="hero-h1-es">...</h1>
//   <h1 id="hero-h1-en" style="display:none;">...</h1>
// The previous version of this file only set a `data-lang`
// attribute on <html> and updated the toggle button — nothing
// ever read that attribute to show/hide the `-es`/`-en` pairs,
// so the toggle looked broken everywhere.
//
// LanguageManager below fixes this by finding every element
// whose id ends in "-es" or "-en" once, caching the list, and
// flipping their `display` style whenever the language changes.
// It also still supports the class-based `.lang-en`/`.lang-es`
// system already defined in styles.css, so future markup can
// use either approach.
// ============================================================

(function () {
  'use strict';

  // ==========================================================
  // LANGUAGE MANAGER
  // ==========================================================
  const LanguageManager = (function () {
    const STORAGE_KEY   = 'qns_lang';
    const DEFAULT_LANG  = 'es';
    const SUPPORTED     = ['en', 'es'];

    let idPairedElements = []; // [{ el, lang }] — built once, reused on every toggle

    function getSavedLang() {
      try { return localStorage.getItem(STORAGE_KEY); }
      catch (_) { return null; }
    }

    function saveLang(lang) {
      try { localStorage.setItem(STORAGE_KEY, lang); }
      catch (_) { /* localStorage unavailable (private mode, etc.) — fail silently */ }
    }

    /**
     * Cache every element that follows the "-es" / "-en" id
     * convention so we don't have to re-query the DOM on every
     * toggle. Safe to call once, on DOMContentLoaded.
     */
    function collectPairedElements() {
      const nodes = document.querySelectorAll('[id$="-es"], [id$="-en"]');
      idPairedElements = Array.from(nodes).map(function (el) {
        return { el: el, lang: el.id.endsWith('-es') ? 'es' : 'en' };
      });
    }

    /**
     * Show/hide every cached "-es"/"-en" element for the given
     * language. Setting style.display to an empty string clears
     * only the display property (any other inline styles the
     * element already has, like color or font-size, are left
     * untouched) and lets the element's normal default display
     * type take over.
     */
    function togglePairedElements(lang) {
      idPairedElements.forEach(function (item) {
        item.el.style.display = (item.lang === lang) ? '' : 'none';
      });
    }

    /**
     * Apply a language to the whole document:
     * 1. Toggle every "-es"/"-en" element pair (see above).
     * 2. Set data-lang on <html> so the class-based .lang-en/
     *    .lang-es system in styles.css also works for any
     *    future markup.
     * 3. Set the lang attribute for assistive tech / SEO.
     * 4. Update toggle button aria-pressed/aria-label.
     */
    function applyLang(lang) {
      if (!SUPPORTED.includes(lang)) return;

      togglePairedElements(lang);

      const root = document.documentElement;
      root.setAttribute('data-lang', lang);
      root.setAttribute('lang', lang);

      document.querySelectorAll('.toggle-btn').forEach(function (btn) {
        // Button always OFFERS the other language, so its own
        // pressed state reflects whichever language is *shown*.
        btn.setAttribute('aria-pressed', lang === 'es' ? 'true' : 'false');
        btn.setAttribute(
          'aria-label',
          lang === 'es'
            ? 'Cambiar idioma a inglés / Switch language to English'
            : 'Cambiar idioma a español / Switch language to Spanish'
        );
      });
    }

    function toggle() {
      const current = document.documentElement.getAttribute('data-lang') || DEFAULT_LANG;
      const next = current === 'es' ? 'en' : 'es';
      applyLang(next);
      saveLang(next);
    }

    /**
     * Initialise language from (in priority order): a saved
     * preference, the page's own <html lang="..."> attribute,
     * then the site default. Runs before paint to avoid a
     * flash of the wrong language.
     */
    function init() {
      collectPairedElements();

      const saved    = getSavedLang();
      const htmlLang = document.documentElement.getAttribute('lang') || DEFAULT_LANG;
      const target   = (saved && SUPPORTED.includes(saved)) ? saved : htmlLang;

      applyLang(target);
    }

    return { init: init, toggle: toggle, apply: applyLang };
  })();

  // Exposed for any legacy inline onclick handlers
  window.toggleLanguage = LanguageManager.toggle;

  // ==========================================================
  // MOBILE MENU
  // ==========================================================
  const MobileMenu = (function () {
    let navEl = null;
    let hamburgerEl = null;

    function open() {
      if (!navEl || !hamburgerEl) return;
      navEl.classList.add('active');
      hamburgerEl.classList.add('active');
      hamburgerEl.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      if (!navEl || !hamburgerEl) return;
      navEl.classList.remove('active');
      hamburgerEl.classList.remove('active');
      hamburgerEl.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function toggle() {
      if (!navEl) return;
      navEl.classList.contains('active') ? close() : open();
    }

    function isOpen() {
      return !!(navEl && navEl.classList.contains('active'));
    }

    function init() {
      navEl = document.getElementById('main-nav');
      hamburgerEl = document.getElementById('hamburger');

      if (hamburgerEl) {
        hamburgerEl.removeAttribute('onclick');
        hamburgerEl.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        });
      }

      // Close the mobile menu whenever a nav link is tapped
      if (navEl) {
        navEl.querySelectorAll('a').forEach(function (link) {
          link.addEventListener('click', function () {
            if (window.innerWidth < 860) close();
          });
        });
      }

      window.addEventListener('resize', function () {
        if (window.innerWidth >= 860) close();
      });
    }

    return { init: init, open: open, close: close, toggle: toggle, isOpen: isOpen };
  })();

  // ==========================================================
  // STICKY HEADER OFFSET
  // ------------------------------------------------------------
  // Measures the help bar's real rendered height and exposes it
  // as the --help-bar-h CSS variable, so the header sticks
  // directly beneath it regardless of how the help bar wraps.
  // ==========================================================
  const HeaderOffset = (function () {
    function update() {
      const helpBar = document.querySelector('.top-help-bar');
      const header  = document.querySelector('header');
      if (!helpBar || !header) return;

      const height = helpBar.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--help-bar-h', height + 'px');
    }

    function init() {
      update();
      window.addEventListener('resize', update);
    }

    return { init: init, update: update };
  })();

  // ==========================================================
  // FAQ ACCORDION
  // ==========================================================
  const FaqAccordion = (function () {
    function openItem(btn) {
      const item = btn.closest('.faq-item');
      const answer = btn.nextElementSibling;
      if (!item || !answer) return;

      // Close sibling items within the same accordion container
      const container = btn.closest('.faq-accordion-container');
      if (container) {
        container.querySelectorAll('.faq-question.active').forEach(function (openBtn) {
          if (openBtn !== btn) closeItem(openBtn);
        });
      }

      btn.classList.add('active');
      item.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    function closeItem(btn) {
      const item = btn.closest('.faq-item');
      const answer = btn.nextElementSibling;
      if (!item || !answer) return;

      btn.classList.remove('active');
      item.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = null;
    }

    function toggleItem(btn) {
      btn.classList.contains('active') ? closeItem(btn) : openItem(btn);
    }

    function expandAll() { document.querySelectorAll('.faq-question').forEach(openItem); }
    function collapseAll() { document.querySelectorAll('.faq-question').forEach(closeItem); }

    function init() {
      document.querySelectorAll('.faq-question').forEach(function (btn) {
        btn.removeAttribute('onclick');
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          toggleItem(btn);
        });
      });

      // Recalculate open answers' heights on resize (text reflow changes scrollHeight)
      window.addEventListener('resize', function () {
        document.querySelectorAll('.faq-question.active').forEach(function (btn) {
          const answer = btn.nextElementSibling;
          if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
        });
      });
    }

    return { init: init, expandAll: expandAll, collapseAll: collapseAll };
  })();

  // Exposed for the "Expand All" / "Collapse All" buttons on faq.html
  window.expandAllFaqs   = FaqAccordion.expandAll;
  window.collapseAllFaqs = FaqAccordion.collapseAll;

  // ==========================================================
  // SMOOTH SCROLL (back-to-top links)
  // ==========================================================
  const SmoothScroll = (function () {
    function init() {
      document.querySelectorAll('a[href="#top"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }
    return { init: init };
  })();

  // ==========================================================
  // KEYBOARD TRAP FOR OPEN MOBILE MENU (WCAG 2.1.2)
  // ==========================================================
  const MenuKeyboardTrap = (function () {
    function init() {
      document.addEventListener('keydown', function (e) {
        if (!MobileMenu.isOpen()) return;

        const navEl = document.getElementById('main-nav');
        const hamburgerEl = document.getElementById('hamburger');
        if (!navEl) return;

        if (e.key === 'Escape') {
          MobileMenu.close();
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

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    }
    return { init: init };
  })();

  // ==========================================================
  // BOOTSTRAP — wire everything up once the DOM is ready
  // ==========================================================
  document.addEventListener('DOMContentLoaded', function () {

    // 1. Apply language FIRST to prevent a flash of the wrong language
    LanguageManager.init();

    // 2. Language toggle button(s)
    document.querySelectorAll('#lang-toggle, .toggle-btn').forEach(function (btn) {
      btn.removeAttribute('onclick');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        LanguageManager.toggle();
      });
    });

    // 3. Mobile nav + keyboard trap
    MobileMenu.init();
    MenuKeyboardTrap.init();

    // 4. Sticky header offset (initial + on resize)
    HeaderOffset.init();

    // 5. FAQ accordion
    FaqAccordion.init();

    // 6. Smooth scroll for back-to-top links
    SmoothScroll.init();
  });

})();
