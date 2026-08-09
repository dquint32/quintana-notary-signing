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
  // FLOATING BACK-TO-TOP BUTTON
  // ------------------------------------------------------------
  // Injects a single fixed button on every page (no per-page
  // HTML needed), reveals it once the user has scrolled well
  // down the page, and returns them to the top. Bilingual
  // aria-label; honours prefers-reduced-motion.
  // ==========================================================
  const ScrollTopButton = (function () {
    const SHOW_AFTER = 400; // px scrolled before the button appears
    let btn = null;

    function prefersReducedMotion() {
      return window.matchMedia &&
             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function onScroll() {
      if (!btn) return;
      if (window.pageYOffset > SHOW_AFTER) btn.classList.add('visible');
      else btn.classList.remove('visible');
    }

    function init() {
      // Avoid duplicates if init runs more than once
      if (document.querySelector('.scroll-top-btn')) return;

      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scroll-top-btn';
      btn.setAttribute('aria-label', 'Volver arriba / Back to top');
      btn.innerHTML = '<span aria-hidden="true">↑</span>';

      btn.addEventListener('click', function () {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion() ? 'auto' : 'smooth'
        });
      });

      document.body.appendChild(btn);

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll(); // set correct initial state (e.g. on reload mid-page)
    }

    return { init: init };
  })();

  // ==========================================================
  // FLOATING WHATSAPP BUTTON
  // ------------------------------------------------------------
  // Injects a persistent WhatsApp contact button in the bottom
  // -right corner of every page (no per-page HTML needed). The
  // back-to-top button stacks above it via CSS. Bilingual
  // aria-label; opens the chat in a new tab.
  // ==========================================================
  const WhatsAppFloat = (function () {
    const WA_URL = 'https://wa.me/13035004122';
    const ICON =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15' +
      '-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475' +
      '-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52' +
      '.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207' +
      '-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479' +
      '0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626' +
      '.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413' +
      '-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214' +
      '-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884' +
      '2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885' +
      'M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.547 4.142' +
      '1.588 5.945L0 24l6.304-1.654a11.881 11.881 0 005.674 1.446h.005c6.585 0 11.946-5.359 11.949-11.945' +
      'a11.9 11.9 0 00-3.485-8.436"/></svg>';

    function init() {
      if (document.querySelector('.whatsapp-float')) return;
      const a = document.createElement('a');
      a.className = 'whatsapp-float';
      a.href = WA_URL;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', 'Escríbeme por WhatsApp / Message me on WhatsApp');
      a.setAttribute('title', 'WhatsApp');
      a.innerHTML = ICON;
      document.body.appendChild(a);
    }

    return { init: init };
  })();

  // ==========================================================
  // MAGNETIC CTA BUTTONS  (hover force)
  // ------------------------------------------------------------
  // Gives the primary call-to-action buttons a light "magnetic"
  // pull toward the cursor. Applied only on devices with a fine
  // pointer + hover (desktops) and only when the user has not
  // requested reduced motion — on touch it silently does nothing
  // and the buttons behave normally. Kept subtle and limited to
  // the main conversion buttons, per a restrained, premium feel.
  // ==========================================================
  const MagneticButtons = (function () {
    const STRENGTH = 0.25; // fraction of the cursor offset applied
    const SELECTOR =
      '.hero .btn-primary, .hero-with-logo .btn-primary, ' +
      '.cta-card .btn-primary, .cta-card .btn-large';

    function enabled() {
      return window.matchMedia &&
             window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
             !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function bind(el) {
      el.classList.add('is-magnetic');
      el.addEventListener('mousemove', function (e) {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform =
          'translate(' + (dx * STRENGTH) + 'px,' + (dy * STRENGTH) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    }

    function init() {
      if (!enabled()) return;
      document.querySelectorAll(SELECTOR).forEach(bind);
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

    // 7. Floating back-to-top button (appears on scroll)
    ScrollTopButton.init();

    // 8. Floating WhatsApp contact button (always visible)
    WhatsAppFloat.init();

    // 9. Magnetic pull on primary CTA buttons (desktop, motion-safe)
    MagneticButtons.init();
  });

})();
