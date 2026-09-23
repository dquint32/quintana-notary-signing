// ============================================================
// QUINTANA NOTARY & SIGNING — consent.js
// Cookie consent + Microsoft Clarity analytics loader
// ------------------------------------------------------------
// HOW IT WORKS
// - Microsoft Clarity (heatmaps, clicks, scroll depth, time on
//   page, session recordings) is NOT loaded until the visitor
//   clicks "Accept". Declining = no Clarity script, no cookies.
// - "Accept" and "Decline" are equally sized and equally easy
//   to click (no pre-checked boxes or hidden reject buttons),
//   which is what Colorado's consent rules (Colorado Privacy
//   Act, 4 CCR 904-3) expect.
// - If the visitor's browser sends a Global Privacy Control
//   (GPC) signal — Colorado's recognized universal opt-out —
//   analytics stay off and the banner is not shown.
// - Visitors can change their mind anytime with the
//   "Cookie Settings" link in the footer (any element with
//   the data-cookie-settings attribute). Withdrawing consent
//   deletes Clarity's cookies.
// - The banner follows the site's ES/EN language toggle.
//
// SETUP: paste your Clarity Project ID below
// (clarity.microsoft.com → your project → Settings → Overview).
// ============================================================

(function () {
  'use strict';

  var CLARITY_PROJECT_ID = 'PASTE_CLARITY_ID_HERE';

  var STORAGE_KEY  = 'qns_consent';   // 'granted' | 'denied'
  var CLARITY_COOKIES = ['_clck', '_clsk', 'CLID', 'ANONCHK', 'MR', 'MUID', 'SM'];

  var TEXT = {
    en: {
      title:   'Cookies & analytics',
      body:    'With your permission, we use Microsoft Clarity cookies to see how visitors use this site (clicks, scrolling, and time on page) so we can improve it. We never sell your information or use it for advertising.',
      policy:  'Privacy Policy',
      accept:  'Accept',
      decline: 'Decline',
      gpc:     'Your browser is sending a Global Privacy Control signal, so analytics are off. You can still turn them on here.',
      region:  'Cookie consent'
    },
    es: {
      title:   'Cookies y análisis',
      body:    'Con su permiso, usamos cookies de Microsoft Clarity para ver cómo los visitantes usan este sitio (clics, desplazamiento y tiempo en la página) y así mejorarlo. Nunca vendemos su información ni la usamos para publicidad.',
      policy:  'Política de Privacidad',
      accept:  'Aceptar',
      decline: 'Rechazar',
      gpc:     'Su navegador envía una señal de Control Global de Privacidad (GPC), por eso el análisis está desactivado. Aún puede activarlo aquí.',
      region:  'Consentimiento de cookies'
    }
  };

  // ---------- storage helpers (fail silently in private mode) ----------
  function getChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }
  function setChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) { /* ignore */ }
  }

  function hasGPC() {
    return navigator.globalPrivacyControl === true;
  }

  function currentLang() {
    var root = document.documentElement;
    var lang = root.getAttribute('data-lang') || root.getAttribute('lang') || 'es';
    return lang.indexOf('en') === 0 ? 'en' : 'es';
  }

  // ---------- Microsoft Clarity ----------
  var clarityLoaded = false;

  function loadClarity() {
    if (clarityLoaded) return;
    if (!CLARITY_PROJECT_ID || CLARITY_PROJECT_ID.indexOf('PASTE_') === 0) return;
    clarityLoaded = true;

    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);

    // Tell Clarity consent was given (analytics only, never ads)
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  }

  function removeClarityCookies() {
    var host = location.hostname;
    var domains = ['', host, '.' + host, '.' + host.replace(/^www\./, '')];
    CLARITY_COOKIES.forEach(function (name) {
      domains.forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  // ---------- banner ----------
  var bannerEl = null;

  function buildBanner() {
    bannerEl = document.createElement('div');
    bannerEl.className = 'cookie-banner';
    bannerEl.setAttribute('role', 'region');
    bannerEl.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<div class="cookie-banner-text">' +
          '<strong class="cookie-banner-title"></strong>' +
          '<p><span class="cookie-banner-body"></span> ' +
          '<a href="privacy.html" class="cookie-banner-policy"></a></p>' +
          '<p class="cookie-banner-gpc" hidden></p>' +
        '</div>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="cookie-btn" data-consent="denied"></button>' +
          '<button type="button" class="cookie-btn" data-consent="granted"></button>' +
        '</div>' +
      '</div>';

    bannerEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (btn) choose(btn.getAttribute('data-consent'));
    });

    document.body.appendChild(bannerEl);
    renderText();
  }

  function renderText() {
    if (!bannerEl) return;
    var t = TEXT[currentLang()];
    bannerEl.setAttribute('aria-label', t.region);
    bannerEl.querySelector('.cookie-banner-title').textContent  = t.title;
    bannerEl.querySelector('.cookie-banner-body').textContent   = t.body;
    bannerEl.querySelector('.cookie-banner-policy').textContent = t.policy;
    bannerEl.querySelector('[data-consent="denied"]').textContent  = t.decline;
    bannerEl.querySelector('[data-consent="granted"]').textContent = t.accept;
    var gpcEl = bannerEl.querySelector('.cookie-banner-gpc');
    gpcEl.textContent = t.gpc;
    gpcEl.hidden = !(hasGPC() && getChoice() !== 'granted');
  }

  function showBanner() {
    if (!bannerEl) buildBanner();
    renderText();
    bannerEl.hidden = false;
    var first = bannerEl.querySelector('.cookie-btn');
    if (first) first.focus({ preventScroll: true });
  }

  function hideBanner() {
    if (bannerEl) bannerEl.hidden = true;
  }

  function choose(value) {
    var previous = getChoice();
    setChoice(value);
    hideBanner();

    if (value === 'granted') {
      loadClarity();
    } else {
      if (window.clarity) {
        try {
          window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
          window.clarity('consent', false);
        } catch (_) { /* ignore */ }
      }
      removeClarityCookies();
      // If Clarity was already running on this page, reload so it stops completely.
      if (previous === 'granted' && clarityLoaded) location.reload();
    }
  }

  // ---------- init ----------
  function init() {
    var choice = getChoice();

    if (choice === 'granted') {
      loadClarity();
    } else if (choice === null && !hasGPC()) {
      showBanner();
    }
    // choice === 'denied', or GPC with no explicit opt-in: stay off.

    // Footer "Cookie Settings" links
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-cookie-settings]');
      if (!link) return;
      e.preventDefault();
      showBanner();
    });

    // Keep banner language in sync with the ES/EN toggle
    if ('MutationObserver' in window) {
      new MutationObserver(renderText).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-lang', 'lang']
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
