#!/usr/bin/env python3
"""Build the Spanish pages (es/*.html) and sitemap.xml.

Every page in this folder holds BOTH languages: English is the visible one in
the file, Spanish is hidden until the language button is used. Search engines
read a page as an English visitor, so Spanish text that only exists hidden on
an English address is hard to find. This script therefore writes a Spanish
twin of each page under es/ where Spanish is the visible language, with a
Spanish title and description and its own address.

    Edit the pages in this folder, never the copies in es/.
    Then run:   python build_es.py
    Then commit everything, including the es/ folder and sitemap.xml.

Wording rule (C.R.S. 24-21-525): the Spanish noun for a notary, and the word
for a notary's office, must never appear in any title, description or text.
Say "Notary Public" or "servicios notariales". The script stops if it finds
either word (see BANNED below).
"""
import datetime
import io
import os
import re
import sys

BASE = "https://www.quintananotarysigning.com"
HERE = os.path.dirname(os.path.abspath(__file__))

# file -> (sitemap priority, change frequency, Spanish title, Spanish description)
PAGES = {
    "index.html": ("1.0", "weekly",
        "Servicios Notariales Móviles en Denver | Notary Public en Español | Quintana Notary & Signing",
        "Notary Public bilingüe a domicilio en el área metropolitana de Denver. Notarizo su firma en su hogar u oficina, apostillas de Colorado, traducciones certificadas y cartas de permiso de viaje. Solo con cita previa."),
    "services.html": ("0.9", "monthly",
        "Servicios Notariales en Español en Denver | Quintana Notary & Signing",
        "Servicios notariales móviles y bilingües en el área metropolitana de Denver: notarizaciones, apostillas, traducciones certificadas, notarizaciones en el aeropuerto (DIA) y cartas de permiso de viaje para menores. Solo con cita previa."),
    "apostille.html": ("0.9", "monthly",
        "Apostillas de Colorado en Denver | Quintana Notary & Signing",
        "Apostillas de Colorado entregadas en mano en la Secretaría de Estado en Denver. Servicio completo ($150, local), mensajería en Denver ($85) o estatal ($115). Atención en español y lista de requisitos."),
    "certified-copies.html": ("0.8", "monthly",
        "Copias Certificadas en Denver | Servicios Notariales | Quintana Notary & Signing",
        "Copias certificadas en el área metropolitana de Denver: $15 por copia, $10 en centros comunitarios. Qué puede certificar un Notary Public de Colorado (diplomas, pasaportes, identificaciones) y qué no."),
    "airport-notarizations.html": ("0.9", "monthly",
        "Notarizaciones en el Aeropuerto de Denver (DIA) | Quintana Notary & Signing",
        "Servicio notarial móvil y bilingüe el mismo día dentro del Aeropuerto Internacional de Denver (DIA). Tarifa fija de $95 más $10 por firma, estacionamiento incluido. Envíe un mensaje para reservar."),
    "pricing.html": ("0.8", "monthly",
        "Precios de Servicios Notariales en Denver | Quintana Notary & Signing",
        "Precios transparentes de servicios notariales móviles y bilingües en el área metropolitana de Denver: $15 por acto notarial, tarifas de viaje por millaje, apostillas, notarizaciones en el aeropuerto (DIA $95) y más. Solo con cita previa."),
    "translate.html": ("0.8", "monthly",
        "Traducciones Certificadas Español–Inglés en Denver | Quintana Notary & Signing",
        "Traducciones certificadas español–inglés en Denver desde $30 por página: actas de nacimiento, matrimonio y defunción, diplomas y documentos para el DMV. Solo traducción, sin asesoría legal."),
    "b2b-real-estate.html": ("0.8", "monthly",
        "Servicios Notariales para Empresas y Compañías de Títulos en Denver | Quintana Notary & Signing",
        "Apoyo notarial para empresas en el área metropolitana de Denver: firmas de préstamos para compañías de títulos, visitas notariales al centro de ICE de Aurora para abogados de inmigración y trámite de apostillas."),
    "about.html": ("0.6", "yearly",
        "Acerca de David Quintana, Notary Public Bilingüe en Denver | Quintana Notary & Signing",
        "Conozca a David Quintana, Notary Public bilingüe comisionado en Colorado y traductor español–inglés en el área metropolitana de Denver. Servicios notariales móviles en español. Solo con cita previa."),
    "faq.html": ("0.7", "monthly",
        "Preguntas Frecuentes sobre Servicios Notariales en Denver | Quintana Notary & Signing",
        "Respuestas sobre notarización en Denver, Colorado: identificación aceptada, tarifas ($15 por acto), servicio móvil, apostillas, copias certificadas y traducciones."),
    "contact.html": ("0.7", "monthly",
        "Contacto y Ubicaciones | Servicios Notariales en Denver | Quintana Notary & Signing",
        "Reserve servicios notariales móviles en el área metropolitana de Denver: llame o envíe un mensaje al 303-500-4122. $10 por acto en centros comunitarios. Atención en español. Solo con cita previa."),
    "privacy.html": ("0.2", "yearly",
        "Política de Privacidad | Quintana Notary & Signing",
        "Política de privacidad y cookies de Quintana Notary & Signing: qué datos recopilamos, cómo usamos Microsoft Clarity y sus derechos de privacidad en Colorado."),
    "immigration-attorney-notary-aurora-ice.html": ("0.8", "monthly",
        "Servicio Notarial para Abogados de Inmigración en el Centro de ICE de Aurora | Quintana Notary & Signing",
        "Notary Public bilingüe y móvil para abogados de inmigración en el Centro de Procesamiento de ICE de Aurora (GEO). Autorizado como su representante mediante el G-28 y una carta de autorización. 7 días, de 8 a.m. a 9 p.m."),
}

BANNED = re.compile(r"\bnotar[ií][oa]s?\b", re.I)
LANG_TAG = re.compile(r'<[A-Za-z][^<>]*?\bid="[^"<>]*-(es|en)"[^<>]*>')
ASSET = re.compile(
    r'\b(href|src)="(?!https?:|//|/|#|\.\./|mailto:|tel:|sms:|data:)'
    r'([^"]+\.(?:css|js|png|ico|jpe?g|svg|webp|gif))"')
REDIRECT = re.compile(r"[ \t]*<!-- lang-redirect -->.*?<!-- /lang-redirect -->\n", re.S)


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


def spanish_page(name, html):
    _, _, title, desc = PAGES[name]
    html = set_default(html, "es")
    html = REDIRECT.sub("", html)
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
    return html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n<!-- GENERATED by build_es.py from ../"
                        + name + " -- edit that file, then run: python build_es.py -->\n", 1)


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
    for name in PAGES:
        html, crlf = read(os.path.join(HERE, name))
        bad = BANNED.search(html) or BANNED.search(" ".join(PAGES[name][2:]))
        if bad:
            sys.exit(f"{name}: found the banned word '{bad.group(0)}'. Fix it before building.")
        if f'hreflang="es" href="{url(name, "es")}"' not in html:
            sys.exit(f"{name}: the hreflang=\"es\" link must point to {url(name, 'es')}")
        write(os.path.join(HERE, "es", name), spanish_page(name, html), crlf)
    _, crlf = read(os.path.join(HERE, "sitemap.xml"))
    write(os.path.join(HERE, "sitemap.xml"), sitemap(), crlf)
    print(f"Built {len(PAGES)} Spanish pages in es/ and sitemap.xml")


if __name__ == "__main__":
    main()
