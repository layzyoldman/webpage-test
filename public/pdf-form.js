/**
 * pdf-form.js — turns a filled form into a simple A4 PDF the visitor emails.
 *
 * DOCUMENTED PROGRESSIVE ENHANCEMENT (see AGENTS.md): this is the forms' v1
 * "submission" — there is no form backend. No dependencies, no network, no
 * cookies: it intercepts `submit` on `form[data-pdf]`, collects the filled
 * fields, renders a minimal A4 PDF (Helvetica + WinAnsiEncoding) and
 * downloads it; the page's "done" note then tells the visitor to email it.
 * Without JavaScript the forms stay hidden and their mailto fallback takes
 * over (the `html.js` gate that theme.js sets).
 *
 * PDF house rules the whole file obeys:
 *  - every string is latin1: bytes come from charCodeAt, so xref offsets are
 *    cumulative string lengths. NEVER build the file as a Blob from a JS
 *    string (`new Blob([string])` UTF-8-encodes and breaks every offset);
 *    the download converts to Uint8Array explicitly.
 *  - text is mapped to WinAnsiEncoding (= latin1 for Portuguese; typographic
 *    dashes/quotes/€ land in their WinAnsi slots, anything else beyond
 *    latin1 becomes '?').
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------- text */

  /* WinAnsi slots that differ from latin1 (typography people actually type). */
  var WINANSI = {
    0x2018: 0x91, /* ' */ 0x2019: 0x92, /* ' */
    0x201c: 0x93, /* " */ 0x201d: 0x94, /* " */
    0x2013: 0x96, /* – */ 0x2014: 0x97, /* — */
    0x2026: 0x85, /* … */ 0x2022: 0x95, /* • */
    0x20ac: 0x80, /* € */ 0x2122: 0x99, /* ™ */
    0x00a0: 0x20, /* nbsp → space */
  };

  /** One text character → one PDF byte. */
  function toByte(code) {
    if (WINANSI[code]) return WINANSI[code];
    if (code >= 0x20 && code <= 0x7e) return code;
    if (code >= 0xa0 && code <= 0xff) return code; /* latin1 ≈ WinAnsi for PT */
    return 0x3f; /* '?' — controls and anything beyond latin1 */
  }

  /** Text → escaped PDF string body (still latin1: one char in, one byte out). */
  function pdfString(text) {
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var c = String.fromCharCode(toByte(text.charCodeAt(i)));
      out += c === '(' || c === ')' || c === '\\' ? '\\' + c : c;
    }
    return out;
  }

  /** Collapse whitespace runs so labels/values fit on one line. */
  function clean(text) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  }

  /* ---------------------------------------------------------- layout */

  var PAGE_W = 595.28; /* A4 in points */
  var PAGE_H = 841.89;
  var MARGIN = 56;
  var MAX_W = PAGE_W - 2 * MARGIN;
  var TOP = PAGE_H - MARGIN;
  var BOTTOM = MARGIN + 16;
  var INDENT = 12; /* hanging indent for wrapped values */

  /* Rough Helvetica advance widths (em) — good enough to wrap by. */
  function charWidth(ch) {
    switch (ch) {
      case ' ': case 'i': case 'l': case 'j': case 't': case 'f': case 'r':
      case 'I': case '.': case ',': case ';': case ':': case '!': case '|':
      case "'": case '(': case ')': case '[': case ']':
        return 0.3;
      case 'm': case 'w':
        return 0.83;
      case 'M': case 'W':
        return 0.92;
      default:
        if (ch >= '0' && ch <= '9') return 0.556;
        if (ch >= 'A' && ch <= 'Z') return 0.68;
        return 0.53;
    }
  }

  /** Greedy word wrap to `width` points at `size` pt; hard-breaks long words. */
  function wrap(text, size, width) {
    var words = clean(text).split(' ');
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (line && measure(line + ' ' + word, size) <= width) {
        line += ' ' + word;
        continue;
      }
      if (line) {
        lines.push(line);
        line = '';
      }
      /* The word alone: cut it by characters if it overflows. */
      while (measure(word, size) > width && word.length > 1) {
        var cut = word.length - 1;
        while (cut > 1 && measure(word.slice(0, cut), size) > width) cut--;
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      line = word;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function measure(text, size) {
    var w = 0;
    for (var i = 0; i < text.length; i++) w += charWidth(text[i]);
    return w * size;
  }

  /** title + rows → flat line list (page breaks come later). */
  function layout(title, rows) {
    var lines = [];
    var push = function (text, font, size, gray, x, gap) {
      var parts = wrap(text, size, MAX_W - (x || 0));
      for (var i = 0; i < parts.length; i++) {
        lines.push({ text: parts[i], font: font, size: size, gray: gray, x: x || MARGIN, gap: i === 0 ? gap || 0 : 0 });
      }
    };

    push(title, 'F2', 16, 0, MARGIN, 0);
    push(new Date().toISOString().slice(0, 10), 'F1', 9, 0.45, MARGIN, 2);
    lines.push({ rule: true, gap: 10 });

    for (var r = 0; r < rows.length; r++) {
      push(rows[r].label, 'F2', 9.5, 0.35, MARGIN, r === 0 ? 2 : 9);
      var value = String(rows[r].value == null ? '' : rows[r].value);
      var segments = value.split(/\r?\n/);
      for (var s = 0; s < segments.length; s++) {
        if (clean(segments[s]) || segments[s] === '') {
          push(segments[s], 'F1', 11, 0, MARGIN + INDENT, s === 0 ? 1 : 0);
        }
      }
    }
    return lines;
  }

  /** Flat line list → pages of {line, y} (baseline positions). */
  function paginate(lines) {
    var pages = [];
    var page = [];
    var y = TOP;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var height = (line.rule ? 4 : line.size * 1.35) + line.gap;
      if (y - height < BOTTOM && page.length) {
        pages.push(page);
        page = [];
        y = TOP;
      }
      y -= line.gap;
      if (line.rule) {
        page.push({ rule: true, y: y });
      } else {
        y -= line.size;
        page.push({ text: line.text, font: line.font, size: line.size, gray: line.gray, x: line.x, y: y });
        y -= line.size * 0.35;
        continue;
      }
      y -= 4;
    }
    if (page.length) pages.push(page);
    return pages.length ? pages : [[]];
  }

  function contentStream(page) {
    var out = [];
    for (var i = 0; i < page.length; i++) {
      var l = page[i];
      if (l.rule) {
        out.push('0.78 0.78 0.78 RG 0.75 w ' + MARGIN + ' ' + f2(l.y) + ' m ' + f2(PAGE_W - MARGIN) + ' ' + f2(l.y) + ' l S');
      } else {
        out.push('BT /' + l.font + ' ' + l.size + ' Tf ' + l.gray + ' g ' + l.x + ' ' + f2(l.y) + ' Td (' + pdfString(l.text) + ') Tj ET');
      }
    }
    return out.join('\n');
  }

  function f2(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  function pad10(n) {
    var s = String(n);
    while (s.length < 10) s = '0' + s;
    return s;
  }

  /* ------------------------------------------------------- PDF assembly */

  /** title + [{label, value}] → PDF bytes (Uint8Array). */
  function buildPdf(title, rows) {
    var pages = paginate(layout(title, rows));
    var n = pages.length;
    var objects = [null]; /* 1-based */
    var font1 = 3 + 2 * n;
    var font2 = font1 + 1;

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    var kids = [];
    for (var i = 0; i < n; i++) kids.push(3 + i + ' 0 R');
    objects[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>';
    for (i = 0; i < n; i++) {
      var content = 3 + n + i;
      objects[3 + i] =
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PAGE_W + ' ' + PAGE_H + '] ' +
        '/Resources << /Font << /F1 ' + font1 + ' 0 R /F2 ' + font2 + ' 0 R >> >> ' +
        '/Contents ' + content + ' 0 R >>';
      var stream = contentStream(pages[i]);
      objects[content] = '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream';
    }
    objects[font1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[font2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    var last = font2;
    var out = '%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n';
    var offsets = [0];
    for (var num = 1; num <= last; num++) {
      offsets[num] = out.length;
      out += num + ' 0 obj\n' + objects[num] + '\nendobj\n';
    }
    var xrefPos = out.length;
    out += 'xref\n0 ' + (last + 1) + '\n0000000000 65535 f \n';
    for (num = 1; num <= last; num++) out += pad10(offsets[num]) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + (last + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF\n';

    var bytes = new Uint8Array(out.length);
    for (i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }

  /* ------------------------------------------------------ DOM half */

  function labelText(form, el) {
    var label = null;
    if (el.id) {
      var labels = form.getElementsByTagName('label');
      for (var i = 0; i < labels.length; i++) {
        if (labels[i].htmlFor === el.id) {
          label = labels[i];
          break;
        }
      }
    }
    if (!label && el.closest) label = el.closest('label');
    return label ? clean(label.textContent) : '';
  }

  /**
   * Filled fields of `form` → [{label, value}], in DOM order.
   * Checkbox/radio groups collapse into one row (fieldset <legend>, or the
   * name; a lone checked checkbox outside a fieldset carries its own label);
   * empty fields are skipped.
   */
  function collectFields(form) {
    var rows = [];
    var groups = Object.create(null);
    var els = form.querySelectorAll('input, select, textarea');

    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.disabled) continue;
      var type = (el.type || '').toLowerCase();
      if (type === 'hidden' || type === 'submit' || type === 'button' ||
          type === 'reset' || type === 'file') continue;

      if (type === 'checkbox' || type === 'radio') {
        if (!el.checked) continue;
        var fieldset = el.closest('fieldset');
        var key = (fieldset ? 'fs:' : 'el:') + (el.name || '#' + i);
        var g = groups[key];
        if (!g) {
          var legend = fieldset ? fieldset.querySelector('legend') : null;
          g = { fieldset: fieldset, legend: legend ? clean(legend.textContent) : '', items: [] };
          g.row = { label: '', value: '' };
          groups[key] = g;
          rows.push(g.row);
        }
        g.items.push(el);
        continue;
      }

      var value;
      if (el.tagName.toLowerCase() === 'select') {
        var opts = el.selectedOptions || [];
        value = '';
        for (var o = 0; o < opts.length; o++) {
          if (opts[o].value === '') continue;
          value += (value ? ', ' : '') + (clean(opts[o].textContent) || opts[o].value);
        }
      } else {
        value = el.value.replace(/^\s+|\s+$/g, '');
      }
      if (value) rows.push({ label: labelText(form, el) || el.name, value: value });
    }

    for (var k in groups) {
      var gr = groups[k];
      var lone = gr.items.length === 1 && (gr.items[0].type || '').toLowerCase() === 'checkbox';
      if (lone && !gr.fieldset) {
        gr.row.label = labelText(form, gr.items[0]) || gr.items[0].name;
        gr.row.value = 'X';
      } else {
        gr.row.label = gr.legend || gr.items[0].name;
        var vals = [];
        for (var j = 0; j < gr.items.length; j++) {
          vals.push(labelText(form, gr.items[j]) || gr.items[j].value);
        }
        gr.row.value = vals.join(', ');
      }
    }
    return rows;
  }

  function download(bytes, filename) {
    var blob = new Blob([bytes], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var a = el('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return blob;
  }

  function el(tag) {
    return document.createElement(tag);
  }

  /* ---------------------------------------------------------- wiring */

  if (typeof document !== 'undefined') {
    document.addEventListener('submit', function (ev) {
      var form = ev.target;
      if (!form || !form.matches || !form.matches('form[data-pdf]')) return;
      ev.preventDefault();
      var note = form.querySelector('[data-pdf-sent]');
      try {
        var title = form.getAttribute('data-pdf-title') || 'Form';
        var filename = form.getAttribute('data-pdf-file') || 'form.pdf';
        download(buildPdf(title, collectFields(form)), filename);
      } catch (err) {
        if (window.console && console.error) console.error('pdf-form:', err);
      }
      /* Either way, point at the email — that is where the form ends up. */
      if (note) {
        note.hidden = false;
        if (note.tabIndex < 0) note.tabIndex = -1;
        note.focus();
      }
    });
  }

  /* Node (scripts/pdf-form.test.mjs) loads the file as a plain script. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildPdf: buildPdf, collectFields: collectFields, wrap: wrap, pdfString: pdfString };
  }
})();
