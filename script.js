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

    /**
     * The ADDRESS decides the language: pages under /es/ are Spanish,
     * everything else is English. Each page has a twin at the other
     * address (built by build_es.py), so search engines can index the
     * Spanish pages on their own.
     */
    function pageLang() {
      return /\/es\/[^\/]*$/.test(location.pathname) ? 'es' : 'en';
    }

    function twinUrl(next) {
      const file = location.pathname.split('/').pop() || '';
      const page = (file === 'index.html') ? '' : file;
      return (next === 'es' ? 'es/' + page : '../' + page) + location.search + location.hash;
    }

    /**
     * Keep the reader's place when switching language.
     * Before leaving, note which paired element ("x-en"/"x-es") sits
     * at the top of the screen and how far down it is. The twin page
     * has the same element in the other language ("x-es"/"x-en"),
     * so on arrival we scroll that one to the same spot. If no match
     * is found, fall back to the same fraction of the page.
     */
    const PLACE_KEY = 'qns_lang_place';
    const SKIP_AREAS = 'header, .top-help-bar, .lang-float, .appointment-bar, .statutory-bar, .cookie-banner';

    function topEdge() {
      const h = document.querySelector('header');
      const b = h ? h.getBoundingClientRect().bottom : 0;
      return Math.max(0, b);
    }

    function rememberPlace(fromLang) {
      try {
        const edge = topEdge();
        let below = null, above = null;
        idPairedElements.forEach(function (item) {
          if (item.lang !== fromLang || item.el.closest(SKIP_AREAS)) return;
          const r = item.el.getBoundingClientRect();
          if (!r.width && !r.height) return;                 // hidden
          if (r.top >= edge && r.top < window.innerHeight) {
            if (!below || r.top < below.top) below = { el: item.el, top: r.top };
          } else if (r.top < edge && r.bottom > edge) {
            if (!above || r.top > above.top) above = { el: item.el, top: r.top };
          }
        });
        const pick = below || above;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        sessionStorage.setItem(PLACE_KEY, JSON.stringify({
          file: location.pathname.split('/').pop() || 'index.html',
          base: pick ? pick.el.id.replace(/-(en|es)$/, '') : null,
          top: pick ? pick.top : 0,
          ratio: max > 0 ? window.pageYOffset / max : 0,
          at: Date.now()
        }));
      } catch (_) { /* storage unavailable: the twin page simply opens at the top */ }
    }

    function restorePlace(lang) {
      let place = null;
      try { place = JSON.parse(sessionStorage.getItem(PLACE_KEY) || 'null'); } catch (_) {}
      if (!place) return;
      const file = location.pathname.split('/').pop() || 'index.html';
      if (place.file !== file || Date.now() - place.at > 15000) {
        try { sessionStorage.removeItem(PLACE_KEY); } catch (_) {}
        return;
      }
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      function go() {
        const el = place.base && document.getElementById(place.base + '-' + lang);
        let y;
        if (el && el.getClientRects().length) {
          y = el.getBoundingClientRect().top + window.pageYOffset - place.top;
        } else {
          y = place.ratio * (document.documentElement.scrollHeight - window.innerHeight);
        }
        // Jump straight there. The site uses smooth scrolling, so switch it
        // off for this one jump; plain scrollTo(x, y) works in every browser
        // (some Safari versions reject behavior: 'instant').
        const root = document.documentElement;
        const prev = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo(0, Math.max(0, y));
        root.style.scrollBehavior = prev;
      }
      go();
      requestAnimationFrame(go);
      // Fonts and images can shift the layout after first paint; settle once more.
      window.addEventListener('load', function () {
        go();
        try { sessionStorage.removeItem(PLACE_KEY); } catch (_) {}
      }, { once: true });
    }

    /** The language button remembers the choice and opens the twin page at the same spot. */
    function toggle() {
      const now = pageLang();
      const next = now === 'es' ? 'en' : 'es';
      saveLang(next);
      rememberPlace(now);
      location.href = twinUrl(next);
    }

    /**
     * Initialise language from the page's address (see pageLang).
     */
    function init() {
      collectPairedElements();

      // A Spanish device with no saved choice is sent to the /es/ twin by
      // the small script in each page's <head>, before anything is drawn.
      applyLang(pageLang());
      restorePlace(pageLang());
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
            if (window.innerWidth < 1200) close();
          });
        });
      }

      window.addEventListener('resize', function () {
        if (window.innerWidth >= 1200) close();
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

      // A link to "#faq-qN" (e.g. the key-rules strip) opens that question.
      function openFromHash() {
        const id = location.hash.slice(1);
        if (!id) return;
        const item = document.getElementById(id);
        if (!item || !item.classList.contains('faq-item')) return;
        const q = item.querySelector('.faq-question');
        if (q && !q.classList.contains('active')) openItem(q);
      }
      window.addEventListener('hashchange', openFromHash);
      openFromHash();

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
      ' 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626' +
      '.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413' +
      '-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214' +
      '-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884' +
      ' 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885' +
      'M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.547 4.142' +
      ' 1.588 5.945L0 24l6.304-1.654a11.881 11.881 0 005.674 1.446h.005c6.585 0 11.946-5.359 11.949-11.945' +
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
  // GROUPED NAV (Services / For Business / About)
  // Phones: tap a group to expand it inside the menu.
  // Desktop: hover or focus opens the panel; click toggles it.
  // ==========================================================
  const NavGroups = (function () {
    function setOpen(group, open) {
      group.classList.toggle('open', open);
      const btn = group.querySelector('.nav-group-btn');
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function closeAll(except) {
      document.querySelectorAll('.nav-group.open').forEach(function (g) {
        if (g !== except) setOpen(g, false);
      });
    }
    function init() {
      document.querySelectorAll('.nav-group-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          const group = btn.closest('.nav-group');
          const willOpen = !group.classList.contains('open');
          closeAll(group);
          setOpen(group, willOpen);
        });
      });
      document.addEventListener('click', function (e) {
        if (window.innerWidth >= 1200 && !e.target.closest('.nav-group')) closeAll();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && window.innerWidth >= 1200) {
          const open = document.querySelector('.nav-group.open');
          closeAll();
          if (open) { const b = open.querySelector('.nav-group-btn'); if (b) b.focus(); }
        }
      });
      // Phones: open the group that contains the current page
      if (window.innerWidth < 1200) {
        const current = document.querySelector('.nav-group.active');
        if (current) setOpen(current, true);
      }
    }
    return { init: init };
  })();

  // ==========================================================
  // LANGUAGE-AWARE ANCHORS
  // Some sections exist once per language (id="x-es" / "x-en").
  // A link to "#x" scrolls to the version currently shown.
  // ==========================================================
  const LangAnchors = (function () {
    function target(hash) {
      if (!hash || hash.length < 2) return null;
      const id = decodeURIComponent(hash.slice(1));
      if (document.getElementById(id)) return null; // normal anchor, browser handles it
      const lang = document.documentElement.getAttribute('data-lang') || 'es';
      return document.getElementById(id + '-' + lang);
    }
    function go(hash, smooth) {
      const el = target(hash);
      if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    }
    function init() {
      if (location.hash) setTimeout(function () { go(location.hash, false); }, 60);
      window.addEventListener('hashchange', function () { go(location.hash, true); });
    }
    return { init: init };
  })();

  // ==========================================================
  // LIGHT / DARK THEME TOGGLE
  // The <head> script sets data-theme before paint (saved choice,
  // else the system setting); this wires the header button.
  // ==========================================================
  const ThemeToggle = (function () {
    const KEY = 'qnsTheme';
    function label() {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      const es = (document.documentElement.getAttribute('data-lang') || 'es') === 'es';
      if (dark) return es ? 'Cambiar a modo claro' : 'Switch to light mode';
      return es ? 'Cambiar a modo oscuro' : 'Switch to dark mode';
    }
    function refresh() {
      const btn = document.getElementById('theme-toggle');
      if (btn) { btn.setAttribute('aria-label', label()); btn.title = label(); }
    }
    function set(mode) {
      document.documentElement.setAttribute('data-theme', mode);
      try { localStorage.setItem(KEY, mode); } catch (_) {}
      refresh();
    }
    function init() {
      if (!document.documentElement.getAttribute('data-theme')) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      const btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          set(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
      }
      // keep the label in the current language
      new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
      refresh();
    }
    return { init: init };
  })();

  // ==========================================================
  // FLOATING LANGUAGE BUTTON
  // ------------------------------------------------------------
  // A second English/Español toggle that stays on screen while
  // scrolling (bottom-left; the back-to-top and WhatsApp buttons
  // use the bottom-right). Its two labels use the "-es"/"-en" id
  // pattern, so it must be added BEFORE LanguageManager.init()
  // caches the paired elements. Clicking it does exactly what the
  // header toggle does.
  // ==========================================================
  const LangFloat = (function () {
    const GLOBE =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/>' +
      '<path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5z"/></svg>';

    function init() {
      if (document.querySelector('.lang-float')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-float';
      btn.setAttribute('aria-label', 'Cambiar idioma / Change language');
      btn.innerHTML = GLOBE +
        '<span id="lang-float-label-en" lang="es">Español</span>' +
        '<span id="lang-float-label-es" lang="en" style="display:none;">English</span>';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        LanguageManager.toggle();
      });
      document.body.appendChild(btn);
    }

    return { init: init };
  })();

  // ==========================================================
  // BOOTSTRAP — wire everything up once the DOM is ready
  // ==========================================================
  document.addEventListener('DOMContentLoaded', function () {

    // 0. Floating language button (must exist before the language
    //    manager caches the "-es"/"-en" elements)
    LangFloat.init();

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

    // 3. Mobile nav + keyboard trap + grouped dropdowns
    MobileMenu.init();
    MenuKeyboardTrap.init();
    NavGroups.init();
    ThemeToggle.init();
    LangAnchors.init();

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

// ==========================================================
// PRICE ESTIMATOR (#estimator on index + pricing) and hero CTA
// watcher: while a hero's #hero-cta is on screen, the floating
// WhatsApp / back-to-top buttons step aside (body.hero-cta-visible).
// ==========================================================
document.addEventListener('DOMContentLoaded', function () {/* Homepage: price estimator + hide the floating WhatsApp button while the hero button is on screen. */

    var form = document.getElementById('estimator');
    if (form) {
        var receipt = document.getElementById('est-receipt');
        var count = document.getElementById('est-count');
        var $ = function (id) { return document.getElementById(id); };
        var es = function () { return (document.documentElement.getAttribute('data-lang') || 'en') === 'es'; };
        var money = function (n) { return '$' + (n % 1 ? n.toFixed(2) : n); };
        var picked = function (name) { return form.querySelector('input[name="' + name + '"]:checked'); };
        var clamp = function () {
            var n = parseInt(count.value, 10);
            if (isNaN(n) || n < 1) n = 1;
            if (n > 20) n = 20;
            return n;
        };
        var update = function () {
            var n = clamp();
            var where = picked('where'), when = picked('when');
            var act = where && where.getAttribute('data-act') ? parseInt(where.getAttribute('data-act'), 10) : 15;
            var travel = where ? where.getAttribute('data-travel') : '20';
            var extra = when ? parseInt(when.getAttribute('data-extra'), 10) : 0;
            var acts = n * act;
            var far = travel === 'far';
            var knownMi = parseInt(form.dataset.miles || '', 10);
            var farKnown = far && knownMi > 0;
            var t = farKnown ? Math.round(knownMi * 1.35 * 100) / 100 : (far ? 0 : parseInt(travel, 10));
            var total = Math.round((acts + t + extra) * 100) / 100;
            $('est-calc-act').textContent = n + ' × ' + money(act);
            $('est-v-act').textContent = money(acts);
            $('est-v-travel').textContent = farKnown ? money(t) + ' (' + knownMi + (es() ? ' millas' : ' mi') + ')' : far ? (es() ? '$1.35 / milla' : '$1.35 / mile') : (t === 0 ? (es() ? 'Sin cargo' : 'None') : money(t));
            $('est-v-extra').textContent = '+' + money(extra);
            $('est-v-total').textContent = far && !farKnown ? money(total) + (es() ? ' + millas' : ' + miles') : money(total);
            form.querySelectorAll('.h3-chip').forEach(function (c) {
                c.classList.toggle('is-on', c.querySelector('input').checked);
            });
            var placeEs = { community: 'en un lugar comunitario', '20': 'cerca (hasta 20 millas)', '35': 'a 21–35 millas', '50': 'a 36–50 millas', '75': 'a 51–75 millas', far: 'a más de 75 millas' };
            var placeEn = { community: 'at a community spot', '20': 'close by (under 20 mi)', '35': '21–35 mi out', '50': '36–50 mi out', '75': '51–75 mi out', far: 'over 75 mi out' };
            var whenEs = { day: 'entre semana de día', eve: 'entre semana temprano o de noche', wkd: 'en fin de semana de día', 'wkd-eve': 'en fin de semana temprano o de noche' };
            var whenEn = { day: 'a weekday daytime', eve: 'a weekday early or evening', wkd: 'a weekend daytime', 'wkd-eve': 'a weekend early or evening' };
            var w = where ? where.value : '20', h = when ? when.value : 'day';
            var tot = $('est-v-total').textContent;
            var addr = form.dataset.addr, addrMi = form.dataset.miles;
            var hereEs = addr && w !== 'community' ? 'Mi dirección: ' + addr + ' (unas ' + addrMi + ' millas ida y vuelta según su página).' : 'Estoy en (ciudad).';
            var hereEn = addr && w !== 'community' ? 'My address: ' + addr + ' (about ' + addrMi + ' miles round trip per your site).' : 'I’m in (city).';
            var msgEs = 'Hola David, necesito notarizar ' + n + (n === 1 ? ' firma' : ' firmas') + ', ' + placeEs[w] + ', ' + whenEs[h] + '. ' + hereEs + ' Su página me da un estimado de ' + tot + '. ¿Tiene cita disponible?';
            var msgEn = 'Hi David, I need ' + n + (n === 1 ? ' signature' : ' signatures') + ' notarized, ' + placeEn[w] + ', ' + whenEn[h] + '. ' + hereEn + ' Your site estimate says ' + tot + '. Do you have an opening?';
            var sEs = $('est-send-es'), sEn = $('est-send-en');
            if (sEs) sEs.href = 'https://wa.me/13035004122?text=' + encodeURIComponent(msgEs);
            if (sEn) sEn.href = 'https://wa.me/13035004122?text=' + encodeURIComponent(msgEn);
        };
        form.querySelectorAll('.h3-count-btn').forEach(function (b) {
            b.addEventListener('click', function () {
                count.value = Math.min(20, Math.max(1, clamp() + parseInt(b.getAttribute('data-step'), 10)));
                update();
            });
        });
        form.addEventListener('input', update);
        form.addEventListener('change', update);
        count.addEventListener('blur', function () { count.value = clamp(); update(); });
        new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
        receipt.hidden = false;
        update();
    }

    var heroCta = document.getElementById('hero-cta');
    if (heroCta && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            document.body.classList.toggle('hero-cta-visible', entries[0].isIntersecting);
        }).observe(heroCta);
    }
});
// ==========================================================
// ADDRESS → ROUND-TRIP MILES (#est-addr, inside #estimator)
// Free, no API key, nothing loads until the visitor clicks:
//  1. U.S. Census Bureau geocoder (JSONP; it has no CORS) turns
//     the address into map coordinates.
//  2. FOSSGIS OSRM server (routing.openstreetmap.de, max 1 req/s)
//     measures office → address → office by road.
// Sets the matching travel chip; over 75 mi it stores the miles
// on the form (data-miles) so the receipt shows miles × $1.35.
// ==========================================================
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('estimator');
    var box = document.getElementById('est-addr');
    if (!form || !box) return;
    var input = document.getElementById('est-addr-input');
    var go = document.getElementById('est-addr-go');
    var out = document.getElementById('est-addr-out');
    var es = function () { return (document.documentElement.getAttribute('data-lang') || 'en') === 'es'; };
    var OFFICE_ADDR = '5128 E Colfax Ave, Denver, CO 80220';
    var OFFICE_FALLBACK = { lat: 39.7401, lon: -104.9268 };
    var office = null;
    var cache = {};
    var last = null;
    var busy = false;
    var lastCall = 0;

    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var money = function (n) { return '$' + (n % 1 ? n.toFixed(2) : n); };

    function census(address) {
        return new Promise(function (resolve, reject) {
            var cb = 'qnsGeo' + Date.now() + Math.floor(Math.random() * 1000);
            var s = document.createElement('script');
            var done = function () { delete window[cb]; s.remove(); clearTimeout(timer); };
            var timer = setTimeout(function () { done(); reject(new Error('timeout')); }, 12000);
            window[cb] = function (data) {
                done();
                var m = data && data.result && data.result.addressMatches;
                resolve(m && m.length ? { lat: m[0].coordinates.y, lon: m[0].coordinates.x, label: m[0].matchedAddress, inCO: /,\s*CO,?\s*\d{5}/.test(m[0].matchedAddress) } : null);
            };
            s.onerror = function () { done(); reject(new Error('network')); };
            s.src = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=jsonp&callback=' + cb + '&address=' + encodeURIComponent(address);
            document.head.appendChild(s);
        });
    }

    // Backup lookup when Census has no match (its street files miss many newer
    // streets, e.g. parts of Central Park). Photon = free OpenStreetMap search
    // by komoot, limited to a box around Colorado. No key; fair use only.
    function photon(address) {
        var ctl = 'AbortController' in window ? new AbortController() : null;
        var t = ctl ? setTimeout(function () { ctl.abort(); }, 10000) : null;
        var url = 'https://photon.komoot.io/api/?limit=1&lang=en&bbox=-109.06,36.99,-102.04,41.01&q=' + encodeURIComponent(address);
        return fetch(url, ctl ? { signal: ctl.signal } : {})
            .then(function (res) { if (t) clearTimeout(t); if (!res.ok) throw new Error('photon ' + res.status); return res.json(); })
            .then(function (d) {
                var f = d && d.features && d.features[0];
                if (!f) return null;
                var pr = f.properties || {};
                var street = pr.street || pr.name || '';
                var line1 = (pr.housenumber ? pr.housenumber + ' ' : '') + street;
                var label = [line1, pr.city || pr.district || pr.county, 'CO' + (pr.postcode ? ' ' + pr.postcode : '')].filter(Boolean).join(', ');
                return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], label: label, inCO: pr.state === 'Colorado', approx: !pr.housenumber };
            });
    }

    function findAddress(q) {
        return census(q).then(function (r) { return r || photon(q); }, function () { return photon(q); });
    }

    function getOffice() {
        if (office) return Promise.resolve(office);
        try { var saved = JSON.parse(sessionStorage.getItem('qnsOffice') || 'null'); if (saved) { office = saved; return Promise.resolve(office); } } catch (e) {}
        return census(OFFICE_ADDR).then(function (p) {
            office = p ? { lat: p.lat, lon: p.lon } : OFFICE_FALLBACK;
            try { sessionStorage.setItem('qnsOffice', JSON.stringify(office)); } catch (e) {}
            return office;
        }, function () { return OFFICE_FALLBACK; });
    }

    function roadMiles(a, b) {
        var wait = Math.max(0, 1100 - (Date.now() - lastCall));
        return new Promise(function (r) { setTimeout(r, wait); }).then(function () {
            lastCall = Date.now();
            var ctl = 'AbortController' in window ? new AbortController() : null;
            var t = ctl ? setTimeout(function () { ctl.abort(); }, 10000) : null;
            var pts = [a, b, a].map(function (p) { return p.lon.toFixed(6) + ',' + p.lat.toFixed(6); }).join(';');
            return fetch('https://routing.openstreetmap.de/routed-car/route/v1/driving/' + pts + '?overview=false', ctl ? { signal: ctl.signal } : {})
                .then(function (res) { if (t) clearTimeout(t); if (!res.ok) throw new Error('route ' + res.status); return res.json(); })
                .then(function (d) {
                    if (!d.routes || !d.routes.length) throw new Error('no route');
                    return d.routes[0].distance / 1609.344;
                });
        });
    }

    function straightMiles(a, b) {
        var R = 3958.8, rad = Math.PI / 180;
        var dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
        var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R * Math.asin(Math.sqrt(h)) * 2 * 1.3; // there and back, roads ≈ 1.3× a straight line
    }

    function tierFor(mi) {
        var m = Math.round(mi);
        if (m <= 20) return '20';
        if (m <= 35) return '35';
        if (m <= 50) return '50';
        if (m <= 75) return '75';
        return 'far';
    }

    function render() {
        if (!last) { out.hidden = true; return; }
        var e = es(), html;
        if (last.state === 'busy') html = e ? 'Buscando su dirección…' : 'Looking up your address…';
        else if (last.state === 'empty') html = e ? 'Escriba su dirección con número, calle, ciudad y código postal.' : 'Type your street address, city and ZIP.';
        else if (last.state === 'notfound') html = e ? 'No encontré esa dirección. Revise el número y la calle y agregue la ciudad y el código postal. O mándeme un mensaje y yo la busco.' : 'I couldn’t find that address. Check the number and street, and add the city and ZIP. Or just text me and I’ll look it up.';
        else if (last.state === 'outside') html = e ? 'Esa dirección parece estar fuera de Colorado. Mándeme un mensaje y lo vemos.' : 'That address looks like it’s outside Colorado. Text me and we’ll work it out.';
        else if (last.state === 'error') html = e ? 'La búsqueda de direcciones no responde ahora. Elija abajo la opción que le parezca, o mándeme su dirección por WhatsApp.' : 'The address lookup isn’t answering right now. Pick your best guess below, or text me your address.';
        else {
            var mi = Math.round(last.miles);
            var fee = last.tier === 'far' ? money(Math.round(mi * 1.35 * 100) / 100) + ' (' + mi + (e ? ' millas' : ' mi') + ' × $1.35)' : '$' + last.tier;
            html = '<strong>' + esc(last.label) + '</strong><br>' +
                (e ? 'Unas <strong>' + mi + ' millas ida y vuelta</strong>' : 'About <strong>' + mi + ' miles round trip</strong>') +
                (last.rough ? (e ? ' (cálculo aproximado: el servicio de rutas no respondió)' : ' (rough guess: the route service didn’t answer)') : (e ? ' por carretera' : ' by road')) +
                (last.approx ? (e ? ' (encontré la calle, no el número exacto, así que las millas son aproximadas)' : ' (I found the street but not the exact house number, so the miles are close, not exact)') : '') +
                (e ? ' → viaje: <strong>' + fee + '</strong>. Ya marqué esa opción abajo.' : ' → travel: <strong>' + fee + '</strong>. I picked that option below for you.');
        }
        out.innerHTML = html;
        out.className = 'h3-addr-out' + (last.state === 'ok' ? ' is-ok' : last.state === 'busy' ? '' : ' is-warn');
        out.hidden = false;
    }

    function setPlaceholder() { input.placeholder = es() ? 'Calle, ciudad y código postal' : 'Street, city and ZIP'; }

    function clearForm() { delete form.dataset.miles; delete form.dataset.addr; }

    function apply(r) {
        form.dataset.miles = String(Math.round(r.miles));
        form.dataset.addr = r.label;
        var chip = form.querySelector('input[name="where"][value="' + r.tier + '"]');
        if (chip) { chip.checked = true; }
        form.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function lookup() {
        if (busy) return;
        var q = input.value.trim();
        if (q.length < 6) { last = { state: 'empty' }; render(); return; }
        if (!/\b(co|colorado)\b/i.test(q)) q += ', CO';
        var key = q.toLowerCase();
        if (cache[key]) { last = cache[key]; apply(last); render(); return; }
        busy = true; go.disabled = true;
        last = { state: 'busy' }; render();
        Promise.all([getOffice(), findAddress(q)]).then(function (res) {
            var from = res[0], to = res[1];
            if (!to) { clearForm(); form.dispatchEvent(new Event('change', { bubbles: true })); last = { state: 'notfound' }; return; }
            if (!to.inCO) { clearForm(); form.dispatchEvent(new Event('change', { bubbles: true })); last = { state: 'outside' }; return; }
            return roadMiles(from, to).then(function (mi) { return { mi: mi, rough: false }; }, function () { return { mi: straightMiles(from, to), rough: true }; })
                .then(function (m) {
                    last = { state: 'ok', label: to.label, miles: m.mi, rough: m.rough, approx: to.approx, tier: tierFor(m.mi) };
                    if (!m.rough) cache[key] = last;
                    apply(last);
                });
        }).catch(function () { last = { state: 'error' }; })
          .then(function () { busy = false; go.disabled = false; render(); });
    }

    go.addEventListener('click', lookup);
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); lookup(); } });
    // Typing a new address clears the old miles so a stale per-mile price isn't sent.
    input.addEventListener('input', function () { if (form.dataset.miles) { clearForm(); form.dispatchEvent(new Event('change', { bubbles: true })); } if (last && last.state !== 'busy') { last = null; render(); } });
    new MutationObserver(function () { setPlaceholder(); render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
    setPlaceholder();
});
