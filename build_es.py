#!/usr/bin/env python3
"""Build the English pages (root), the Spanish pages (es/*.html) and sitemap.xml.

The editable pages live in _src/. Each one holds BOTH languages: every
paired element has an id ending in -es or -en. This script writes two
single-language pages from each source:

    _src/about.html  ->  about.html      (English only: every -es element removed)
                     ->  es/about.html   (Spanish only: every -en element removed,
                                          Spanish title, description and address)

So search engines see one language per address, with one H1. The language
button opens the twin page. Jekyll does not publish folders whose names
start with "_", so _src/ never goes live.

    Edit the pages in _src/, never the root copies or the copies in es/.
    Then run:   python build_es.py
    Then commit everything: _src/, the root pages, es/ and sitemap.xml.

Wording rule (C.R.S. 24-21-525): the Spanish noun for a notary, and the word
for a notary's office, must never appear in any title, description or text.
Say "Notary Public" or "servicios notariales". The script stops if it finds
either word (see BANNED below).
"""
import datetime
from html.parser import HTMLParser
import io
import os
import re
import sys

BASE = "https://www.quintananotarysigning.com"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "_src")   # editable two-language pages

# file -> (sitemap priority, change frequency, Spanish title, Spanish description)
PAGES = {
    "index.html": ("1.0", "weekly",
        "Notary Public en español a domicilio en Denver | Quintana",
        "Notarizo su firma en su casa, oficina u hospital, de Loveland a Castle Rock. $15 por acto (máximo legal). Apostillas y traducciones. 303-500-4122"),
    "services.html": ("0.9", "monthly",
        "Servicios notariales en español en Denver | Quintana",
        "Notary Public móvil en español en el área de Denver: notarizaciones, copias certificadas, apostillas, traducciones, aeropuerto DIA e I-9. Solo con cita."),
    "apostille.html": ("0.9", "monthly",
        "Apostillas de Colorado en Denver | Quintana Notary",
        "Llevo en persona sus documentos a la Secretaría de Estado de Colorado. Servicio completo $150 (local), mensajería en Denver $85 o estatal $115."),
    "certified-copies.html": ("0.8", "monthly",
        "Copias certificadas en Denver | Quintana Notary",
        "Copias certificadas en el área de Denver: $15 por copia, $10 en lugares comunitarios. Qué puede certificar un Notary Public de Colorado y qué no."),
    "airport-notarizations.html": ("0.9", "monthly",
        "Notary Public en el aeropuerto de Denver (DIA) | Quintana",
        "Notary Public en el Aeropuerto Internacional de Denver (DIA): $95 fijos con estacionamiento, más $10 por firma. Mándeme su terminal y su hora."),
    "pricing.html": ("0.8", "monthly",
        "Precios de servicios notariales en Denver | Quintana",
        "$15 por acto notarial (máximo legal en Colorado) más viaje por millas, $10 en lugares comunitarios, DIA $95 fijos, apostillas y traducciones. Por escrito."),
    "translate.html": ("0.8", "monthly",
        "Traducciones certificadas español–inglés en Denver",
        "Traducciones certificadas español–inglés en Denver desde $30 por página: actas de nacimiento, matrimonio y defunción, diplomas y papeles del DMV."),
    "b2b-real-estate.html": ("0.8", "monthly",
        "Para compañías de títulos y abogados en Denver | Quintana",
        "Firmas de préstamos para compañías de títulos, visitas al centro de ICE de Aurora para abogados y apostillas para colegas en el área de Denver."),
    "about.html": ("0.6", "yearly",
        "David Quintana, Notary Public bilingüe en Denver",
        "Soy David Quintana, Notary Public comisionado en Colorado y traductor de español e inglés, asegurado. Trabajo de Loveland a Castle Rock, con cita."),
    "faq.html": ("0.7", "monthly",
        "Preguntas frecuentes: Notary Public en Denver | Quintana",
        "Respuestas sobre notarización en Denver: identificación aceptada, tarifas ($15 por acto), servicio a domicilio, apostillas, copias y traducciones."),
    "contact.html": ("0.7", "monthly",
        "Haga su cita con un Notary Public en Denver | Quintana",
        "Llame o escriba al 303-500-4122 para hacer una cita con un Notary Public bilingüe en Denver. $10 por acto en lugares comunitarios. Solo con cita."),
    "privacy.html": ("0.2", "yearly",
        "Política de privacidad | Quintana Notary & Signing",
        "Política de privacidad y cookies: qué datos recopilamos, cómo usamos Microsoft Clarity y sus derechos de privacidad en Colorado."),
    "immigration-attorney-notary-aurora-ice.html": ("0.8", "monthly",
        "Notary Public para abogados en ICE de Aurora | Quintana",
        "Notary Public bilingüe para abogados de inmigración en ICE de Aurora. Autorizado con G-28 y carta. $150 por visita, todos los días de 8 a.m. a 9 p.m."),
}

# Screen-reader / tooltip text that is not split into -es/-en elements.
# On es/ pages these exact attribute values are swapped for Spanish.
ATTR_ES = {
    "Toggle menu": "Abrir o cerrar el menú",
    "Switch to dark mode": "Cambiar a modo oscuro",
    "Light / dark": "Claro / oscuro",
    "Main": "Principal",
    "Site": "Sitio",
    "On this page": "En esta página",
    "Address suggestions": "Sugerencias de direcciones",
    "Start typing: street, city…": "Empiece a escribir: calle, ciudad…",
    "Quintana Notary & Signing — home": "Quintana Notary & Signing — inicio",
    "David Quintana, bilingual Colorado Notary Public in Denver": "David Quintana, Notary Public bilingüe de Colorado en Denver",
    "David Quintana, Notary Public, in a navy button-up shirt": "David Quintana, Notary Public, con camisa azul marino",
    "David Quintana smiling, in a navy suit and bow tie": "David Quintana sonriendo, con traje azul marino y corbata de moño",
}
ATTR_RE = re.compile(r'\b(aria-label|alt|title|placeholder)="([^"]*)"')


def translate_attrs(html):
    def sub(m):
        val = m.group(2).replace("&amp;", "&")
        es = ATTR_ES.get(val)
        return f'{m.group(1)}="{es.replace("&", "&amp;")}"' if es else m.group(0)
    return ATTR_RE.sub(sub, html)


BANNED = re.compile(r"\bnotar[ií][oa]s?\b", re.I)
LANG_TAG = re.compile(r'<[A-Za-z][^<>]*?\bid="[^"<>]*-(es|en)"[^<>]*>')
ASSET = re.compile(
    r'\b(href|src)="(?!https?:|//|/|#|\.\./|mailto:|tel:|sms:|data:)'
    r'([^"]+\.(?:css|js|png|ico|jpe?g|svg|webp|gif)(?:\?[^"]*)?)"')
LD_JSON = re.compile(r"[ \t]*<!-- ld-json -->.*?<!-- /ld-json -->\n", re.S)
LD_ES_DIR = os.path.join(HERE, "_build", "ld-es")   # Spanish JSON-LD per page (Jekyll does not publish _build/)
REDIRECT = re.compile(r"[ \t]*<!-- lang-redirect -->.*?<!-- /lang-redirect -->\n", re.S)


VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}


class _LangSpans(HTMLParser):
    """Find the start/end offsets of every element whose id ends in -<lang>."""
    def __init__(self, html, lang):
        super().__init__(convert_charrefs=False)
        self.html, self.suffix, self.spans, self.stack = html, "-" + lang, [], []
        self.lines = [0]
        for line in html.split("\n")[:-1]:
            self.lines.append(self.lines[-1] + len(line) + 1)

    def _pos(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def _drop(self, attrs):
        return any(k == "id" and v and v.endswith(self.suffix) for k, v in attrs)

    def _inside(self):
        return any(drop for _, _, drop in self.stack)

    def handle_starttag(self, tag, attrs):
        start = self._pos()
        drop = self._drop(attrs) and not self._inside()
        if tag in VOID:
            if drop:
                self.spans.append((start, start + len(self.get_starttag_text())))
            return
        self.stack.append((tag, start, drop))

    def handle_startendtag(self, tag, attrs):
        start = self._pos()
        if self._drop(attrs) and not self._inside():
            self.spans.append((start, start + len(self.get_starttag_text())))

    def handle_endtag(self, tag):
        if not any(t == tag for t, _, _ in self.stack):
            return
        while self.stack:
            t, start, drop = self.stack.pop()
            if t == tag:
                if drop:
                    end = self.html.index(">", self._pos()) + 1
                    self.spans.append((start, end))
                return


def strip_lang(html, lang):
    """Remove every element whose id ends in -<lang>, e.g. the English half
    of each pair on a Spanish page. The language button opens the twin page,
    so the hidden copy is not needed, and leaving it in makes search engines
    read a Spanish page as half English (two H1s, every heading twice)."""
    finder = _LangSpans(html, lang)
    finder.feed(html)
    finder.close()
    if finder.stack and any(drop for _, _, drop in finder.stack):
        sys.exit(f"strip_lang: an element with an id ending in -{lang} was never closed")
    for start, end in sorted(finder.spans, reverse=True):
        # take the whole line when the element sat on a line of its own
        ls = html.rfind("\n", 0, start) + 1
        le = html.find("\n", end)
        le = len(html) if le == -1 else le
        if not html[ls:start].strip() and not html[end:le].strip():
            start, end = ls, min(le + 1, len(html))
        html = html[:start] + html[end:]
    left = re.search(rf'\bid="[^"]*-{lang}"', html)
    if left:
        sys.exit(f"strip_lang: could not remove {left.group(0)}")
    return html


def url(name, lang="en"):
    page = "" if name == "index.html" else name
    return f"{BASE}/{'es/' if lang == 'es' else ''}{page}"


def read(path):
    """Return (text with \\n line endings, whether the file used CRLF)."""
    raw = io.open(path, encoding="utf-8", newline="").read()
    return raw.replace("\r\n", "\n"), "\r\n" in raw


def write(path, text, crlf):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    io.open(path, "w", encoding="utf-8", newline="").write(
        text.replace("\n", "\r\n") if crlf else text)


def set_default(html, lang):
    """Make `lang` the language that is visible in the raw HTML."""
    def fix(m):
        tag = m.group(0)
        hide = m.group(1) != lang
        style = re.search(r'\sstyle="([^"]*)"', tag)
        hidden = bool(style and re.search(r"display\s*:\s*none", style.group(1)))
        if hidden == hide:
            return tag
        if hide:
            if style:
                return tag.replace(style.group(0), f' style="display:none; {style.group(1)}"'.replace("; \"", ";\""), 1)
            end = "/>" if tag.endswith("/>") else ">"
            return tag[:-len(end)].rstrip() + ' style="display:none;"' + end
        rest = re.sub(r"display\s*:\s*none\s*;?\s*", "", style.group(1)).strip()
        return tag.replace(style.group(0), f' style="{rest}"' if rest else "", 1)
    html = LANG_TAG.sub(fix, html)
    return re.sub(r"<html\b[^>]*>", f'<html lang="{lang}" data-lang="{lang}">', html, count=1)


LABELLEDBY = re.compile(r'aria-labelledby="([^"]*)"')


def drop_missing_labels(html):
    """aria-labelledby often lists both "x-es x-en"; keep only ids left on the page."""
    ids = set(re.findall(r'\bid="([^"]+)"', html))
    def fix(m):
        keep = [i for i in m.group(1).split() if i in ids]
        return 'aria-labelledby="' + " ".join(keep) + '"' if keep else ""
    return LABELLEDBY.sub(fix, html)


def generated(html, name, prefix):
    return html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n<!-- GENERATED by build_es.py from " + prefix
                        + "_src/" + name + " -- edit that file, then run: python build_es.py -->\n", 1)


def english_page(name, html):
    html = set_default(html, "en")
    html = strip_lang(html, "es")
    return generated(drop_missing_labels(html), name, "")


def spanish_page(name, html):
    _, _, title, desc = PAGES[name]
    html = set_default(html, "es")
    html = strip_lang(html, "en")
    ld_es = os.path.join(LD_ES_DIR, name)
    if os.path.exists(ld_es):
        if len(LD_JSON.findall(html)) != 1:
            sys.exit(f"{name}: needs exactly one <!-- ld-json --> block to swap for {ld_es}")
        spanish_ld, _ = read(ld_es)
        html = LD_JSON.sub(lambda m: spanish_ld, html, count=1)
    html = REDIRECT.sub("", html)
    html = translate_attrs(html)
    html = re.sub(r"<title>.*?</title>",
                  lambda m: "<title>" + title.replace("&", "&amp;") + "</title>", html, count=1, flags=re.S)
    html, n = re.subn(r'<meta name="description" content="[^"]*">',
                      lambda m: f'<meta name="description" content="{desc}">', html, count=1)
    if n != 1:
        sys.exit(f"{name}: no meta description to replace")
    html = html.replace(f'<link rel="canonical" href="{url(name)}">',
                        f'<link rel="canonical" href="{url(name, "es")}">')
    html = re.sub(r'(<meta property="og:url" content=")[^"]*(")',
                  lambda m: m.group(1) + url(name, "es") + m.group(2), html)
    html = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  lambda m: m.group(1) + title.replace("&", "&amp;") + m.group(2), html)
    html = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
                  lambda m: m.group(1) + desc + m.group(2), html)
    html = html.replace('<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="es_US">')
    html = html.replace('<meta property="og:locale:alternate" content="es_US">', '<meta property="og:locale:alternate" content="en_US">')
    html = ASSET.sub(lambda m: f'{m.group(1)}="../{m.group(2)}"', html)
    return generated(drop_missing_labels(html), name, "../")


def sitemap():
    today = datetime.date.today().isoformat()
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           "<!--",
           "  Sitemap for Quintana Notary & Signing. GENERATED by build_es.py.",
           "  Every page has an English address and a Spanish twin under /es/;",
           "  each <url> lists both so search engines pair them.",
           "-->",
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
           '        xmlns:xhtml="http://www.w3.org/1999/xhtml">', ""]
    for name, (prio, freq, _, _) in PAGES.items():
        for lang in ("en", "es"):
            out += ["  <url>", f"    <loc>{url(name, lang)}</loc>", f"    <lastmod>{today}</lastmod>",
                    f"    <changefreq>{freq}</changefreq>", f"    <priority>{prio}</priority>",
                    f'    <xhtml:link rel="alternate" hreflang="en" href="{url(name)}"/>',
                    f'    <xhtml:link rel="alternate" hreflang="es" href="{url(name, "es")}"/>',
                    f'    <xhtml:link rel="alternate" hreflang="x-default" href="{url(name)}"/>',
                    "  </url>", ""]
    out.append("</urlset>")
    return "\n".join(out) + "\n"


def main():
    if not os.path.isdir(SRC):
        sys.exit("No _src/ folder: the editable pages live in _src/.")
    for name in PAGES:
        html, crlf = read(os.path.join(SRC, name))
        if "GENERATED by build_es.py" in html:
            sys.exit(f"_src/{name} is a generated copy. Restore the two-language source first.")
        ld_es = os.path.join(LD_ES_DIR, name)
        extra = read(ld_es)[0] if os.path.exists(ld_es) else ""
        bad = BANNED.search(html) or BANNED.search(" ".join(PAGES[name][2:])) or BANNED.search(extra)
        if bad:
            sys.exit(f"{name}: found the banned word '{bad.group(0)}'. Fix it before building.")
        if f'hreflang="es" href="{url(name, "es")}"' not in html:
            sys.exit(f"{name}: the hreflang=\"es\" link must point to {url(name, 'es')}")
        write(os.path.join(HERE, name), english_page(name, html), crlf)
        write(os.path.join(HERE, "es", name), spanish_page(name, html), crlf)
    _, crlf = read(os.path.join(HERE, "sitemap.xml"))
    write(os.path.join(HERE, "sitemap.xml"), sitemap(), crlf)
    print(f"Built {len(PAGES)} English pages, {len(PAGES)} Spanish pages in es/, and sitemap.xml")


if __name__ == "__main__":
    main()
