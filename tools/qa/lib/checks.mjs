// Checks that run inside the page (passed to page.evaluate). Each function is self-contained:
// it cannot use anything from this module's scope, because Playwright serialises it into the browser.
// Each returns a list of plain-text findings ([] = pass).

/** 2a. Horizontal overflow: the page must not scroll sideways. Names the elements that stick out. */
export function checkOverflow() {
  const doc = document.documentElement;
  const extra = doc.scrollWidth - doc.clientWidth;
  if (extra <= 0) return [];
  const W = doc.clientWidth;
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  // Is the element inside something that scrolls or clips sideways? Then it does not cause page overflow.
  const contained = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== 'visible') return true; } return false; };
  const culprits = [];
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width && r.right > W + 1 && !contained(el)) culprits.push(`${name(el)} (right edge ${Math.round(r.right)}px)`);
    if (culprits.length >= 3) break;
  }
  return [`page scrolls sideways by ${extra}px` + (culprits.length ? `; sticks out: ${culprits.join(', ')}` : '')];
}

/** 2b. Clipped text in buttons, tabs, pills and chips. */
export function checkClipping() {
  const SEL = 'button, .btn, [role="tab"], .tab, .pill, .tbadge, .chip, .jump a, .tabbar a, .tb-btn, .shelf-link';
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const out = [];
  for (const el of document.querySelectorAll(SEL)) {
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!text) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    // (1) Content wider than the box, and the box hides the rest (overflow hidden / ellipsis).
    if (cs.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1) { out.push(`"${text.slice(0, 40)}" is cut off in ${name(el)} (needs ${el.scrollWidth}px, has ${el.clientWidth}px)`); continue; }
    // (2) Visible text spills outside the box (overflow visible). Screen-reader-only text (.sr) is skipped:
    // it is deliberately positioned off the box and clipped to 1px.
    let left = Infinity, right = -Infinity;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim() || n.parentElement.closest('.sr, .sr-only, svg')) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      const tr = range.getBoundingClientRect();
      if (tr.width) { left = Math.min(left, tr.left); right = Math.max(right, tr.right); }
    }
    if (right > left && (left < r.left - 1 || right > r.right + 1)) out.push(`"${text.slice(0, 40)}" spills out of ${name(el)} by ${Math.round(Math.max(r.left - left, right - r.right))}px`);
  }
  return out;
}

/** 3. Overlap: visible block-level siblings inside <main> must not overlap by more than 3px. */
export function checkOverlap() {
  const main = document.querySelector('main');
  if (!main) return [];
  const TOL = 3;
  // Overlaps that are part of the design. Keep this list short and give the reason for each entry.
  const BY_DESIGN = [
    '.hexrow', // Beehive: honeycomb rows interlock (margin-top:-2% in styles.css), so neighbouring rows overlap a few px.
  ];
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const label = (el) => { const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30); return name(el) + (t ? ` "${t}"` : ''); };
  const boxy = (el) => {
    if (el.closest('svg')) return false; // skip SVG internals
    if (el.getAttribute('aria-hidden') === 'true') return false; // decorative
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.display === 'contents' || cs.display === 'inline') return false; // inline text flows, it does not "overlap"
    if (cs.position === 'absolute' || cs.position === 'fixed') return false; // deliberate overlays (badges on tiles, art layers)
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const out = [];
  const seen = new Set();
  for (const parent of [main, ...main.querySelectorAll('*')]) {
    if (parent.closest('svg') && parent.tagName.toLowerCase() !== 'svg') continue;
    const kids = [...parent.children].filter((k) => boxy(k) && !BY_DESIGN.some((sel) => k.matches(sel)));
    if (kids.length < 2) continue;
    const rects = kids.map((k) => k.getBoundingClientRect());
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      const a = rects[i], b = rects[j];
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > TOL && h > TOL) {
        const key = label(kids[i]) + '|' + label(kids[j]);
        if (seen.has(key)) continue; seen.add(key);
        out.push(`${label(kids[i])} overlaps ${label(kids[j])} by ${Math.round(Math.min(w, h))}px (inside ${name(parent)})`);
      }
    }
  }
  return out;
}

/** 4. Footer gap: at least `min` px between the lowest card (plus its paper edge) and the footer. */
export function checkFooterGap(min) {
  const footer = document.querySelector('body > footer') || document.querySelector('footer');
  const main = document.querySelector('main');
  if (!footer || !main) return [];
  const PAPER_EDGE = 10;
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  // Solid (unblurred) shadows draw the paper edge under a card: its depth is offsetY + spread.
  const solidEdge = (shadow) => {
    if (!shadow || shadow === 'none') return 0;
    let max = 0;
    for (const part of shadow.split(/,(?![^(]*\))/)) {
      if (/inset/.test(part)) continue;
      const nums = (part.replace(/rgba?\([^)]*\)|#[0-9a-f]+|[a-z]+\([^)]*\)/gi, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
      const [, y = 0, blur = 0, spread = 0] = nums;
      if (blur === 0) max = Math.max(max, y + spread);
    }
    return max;
  };
  let lowest = null, lowestBottom = -Infinity;
  for (const el of main.querySelectorAll('*')) {
    if (el.closest('svg') || el.closest('dialog')) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed' || cs.display === 'inline' || cs.display === 'contents') continue;
    const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
    const hasShadow = cs.boxShadow !== 'none';
    const hasBorder = parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none';
    if (!hasBg && !hasShadow && !hasBorder) continue; // only things that look like cards/surfaces
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const bottom = r.bottom + window.scrollY + (hasShadow ? Math.max(PAPER_EDGE, solidEdge(cs.boxShadow)) : 0);
    if (bottom > lowestBottom) { lowestBottom = bottom; lowest = el; }
  }
  if (!lowest) return [];
  const footerTop = footer.getBoundingClientRect().top + window.scrollY;
  const gap = Math.round(footerTop - lowestBottom);
  return gap < min ? [`only ${gap}px between ${name(lowest)} (incl. paper edge) and the footer; needs ${min}px`] : [];
}

/** 5. Contrast (WCAG AA) for buttons, tabs, pills, labels, links and muted text. */
export function checkContrast() {
  const SEL = 'a, button, [role="tab"], .tab, .pill, .tbadge, .chip, label, .muted, small, summary, .btn, .sn-head, .crumbs, th, .optlabel, .grid-count, .tb-chip, .tile-title, .tile-time, .tile-go';
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  // Muted text = anything coloured with the soft/mute ink tokens, whatever its tag.
  const probe = document.createElement('span'); document.body.appendChild(probe);
  const tokenColor = (v) => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
  const MUTED = new Set([tokenColor('--ink-soft'), tokenColor('--ink-mute')]);
  probe.remove();
  const over = (base, top, alpha) => ({ r: base.r + (top.r - base.r) * alpha, g: base.g + (top.g - base.g) * alpha, b: base.b + (top.b - base.b) * alpha });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const dark = matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light' || document.documentElement.dataset.theme === 'dark';
  const canvas = dark ? { r: 18, g: 18, b: 18 } : { r: 255, g: 255, b: 255 };
  // Layers from <html> down to the element. Background images/gradients are ignored, so text on a tile's
  // gradient is measured against the tile's own background colour, as agreed.
  const chain = (el) => { const c = []; for (let a = el; a; a = a.parentElement) c.unshift(a); return c; };
  // Opacity groups: a faded ancestor fades its background AND its text over what is behind it.
  const render = (nodes, i, under, topColor) => {
    if (i === nodes.length) return topColor ? over(under, topColor, topColor.a) : under;
    const cs = getComputedStyle(nodes[i]);
    const bg = parse(cs.backgroundColor);
    const inside = bg && bg.a > 0 ? over(under, bg, bg.a) : under;
    const result = render(nodes, i + 1, inside, topColor);
    const o = parseFloat(cs.opacity);
    return o < 1 ? over(under, result, o) : result;
  };
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const out = [];
  const seen = new Set();
  const candidates = new Set(document.querySelectorAll(SEL));
  for (const el of document.body.querySelectorAll('*')) if (MUTED.has(getComputedStyle(el).color)) candidates.add(el);
  for (const el of candidates) {
    if (el.closest('svg, .sr, .sr-only, [aria-hidden="true"], dialog:not([open])')) continue;
    if (el.matches('[disabled], [aria-disabled="true"]') || el.closest('[disabled]')) continue; // WCAG exempts inactive controls
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (!fg) continue;
    const nodes = chain(el);
    const bgPx = render(nodes, 0, canvas, null);
    const fgPx = render(nodes, 0, canvas, fg);
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10);
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const got = ratio(fgPx, bgPx);
    if (got + 0.005 < need) {
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').trim().replace(/\s+/g, ' ').slice(0, 40);
      const key = name(el) + '|' + text;
      if (seen.has(key)) continue; seen.add(key);
      const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
      out.push(`${got.toFixed(2)}:1 (needs ${need}:1) "${text}" in ${name(el)}: ${hex(fgPx)} on ${hex(bgPx)}`);
    }
  }
  return out;
}
