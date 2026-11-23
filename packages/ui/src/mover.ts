// Mover: animal tokens that physically travel across a game board with a gait that matches the animal.
// Games re-draw their boards often, so tokens live outside the board markup and are re-attached after each draw.
export type Gait = 'trot' | 'hop' | 'walk' | 'leap' | 'slide';
export interface TokenSpec {
  id: string;
  /** Index of the cell the token stands on (used to detect moves). */
  cell: number;
  /** The cell's element in the freshly drawn board. */
  el: Element | null;
  /** Token picture (SVG markup). */
  html: string;
  gait: Gait;
  selected?: boolean;
  /** Token size as a share of the cell width. */
  size?: number;
  /** Colour of the landing puff (snow by default; blue for water). */
  puff?: string;
}
interface Tok { el: HTMLElement; face: HTMLElement; inner: HTMLElement; x: number; y: number; w: number; dir: 1 | -1; cell: number }

const DUR: Record<Gait, number> = { trot: 300, hop: 480, walk: 420, leap: 520, slide: 380 };
const reduced = (): boolean => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function frames(g: Gait, dx: number, dy: number): Keyframe[] {
  const t = (x: number, y: number, extra = ''): string => `translate(${x}px, ${y}px) ${extra}`;
  const dist = Math.hypot(dx, dy), h = Math.max(22, dist * 0.42);
  switch (g) {
    case 'trot': return [
      { transform: t(dx, dy) }, { transform: t(dx * 0.5, dy * 0.5 - 10, 'scale(1.04, .96)'), offset: 0.5 }, { transform: t(0, 0, 'scale(1.08, .92)'), offset: 0.85 }, { transform: t(0, 0) }];
    case 'hop': return [
      { transform: t(dx, dy) }, { transform: t(dx, dy, 'scale(1.14, .84)'), offset: 0.14 },
      { transform: t(dx * 0.45, dy * 0.45 - h, 'scale(.9, 1.12)'), offset: 0.55 },
      { transform: t(0, 0, 'scale(1.16, .84)'), offset: 0.86 }, { transform: t(0, 0) }];
    case 'walk': return [
      { transform: t(dx, dy) }, { transform: t(dx * 0.75, dy * 0.75 - 5), offset: 0.25 }, { transform: t(dx * 0.5, dy * 0.5) , offset: 0.5 },
      { transform: t(dx * 0.25, dy * 0.25 - 5), offset: 0.75 }, { transform: t(0, 0) }];
    case 'leap': return [
      { transform: t(dx, dy) }, { transform: t(dx, dy, 'scale(1.12, .86)'), offset: 0.12 },
      { transform: t(dx * 0.5, dy * 0.5 - h * 1.3, `rotate(${dx > 0 ? -14 : 14}deg) scale(.94, 1.1)`), offset: 0.5 },
      { transform: t(0, 0, 'scale(1.14, .86)'), offset: 0.88 }, { transform: t(0, 0) }];
    case 'slide': return [
      { transform: t(dx, dy, `rotate(${dx > 0 ? 6 : dx < 0 ? -6 : 0}deg)`) }, { transform: t(-dx * 0.05, -dy * 0.05, `rotate(${dx > 0 ? -4 : dx < 0 ? 4 : 0}deg)`), offset: 0.8 },
      { transform: t(0, 0, 'rotate(0deg)') }];
  }
}

export class Mover {
  private toks = new Map<string, Tok>();
  private container: HTMLElement | null = null;

  /** Place (and animate) every token after the board has been drawn. */
  sync(container: HTMLElement | null, specs: TokenSpec[]): void {
    if (!container) return;
    this.container = container;
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    const cr = container.getBoundingClientRect(), seen = new Set<string>(), motion = !reduced();
    for (const s of specs) {
      if (!s.el) continue;
      seen.add(s.id);
      const r = s.el.getBoundingClientRect(), w = r.width * (s.size ?? 0.84);
      const x = r.left - cr.left + r.width / 2, y = r.top - cr.top + r.height / 2;
      let tk = this.toks.get(s.id);
      const fresh = !tk;
      if (!tk) {
        const el = document.createElement('span'), face = document.createElement('span'), inner = document.createElement('span');
        el.className = 'tok'; face.className = 'tok-face'; inner.className = 'tok-inner';
        el.setAttribute('aria-hidden', 'true'); face.appendChild(inner); el.appendChild(face);
        tk = { el, face, inner, x, y, w, dir: 1, cell: s.cell };
        this.toks.set(s.id, tk);
      }
      if (tk.inner.innerHTML !== s.html) tk.inner.innerHTML = s.html;
      if (tk.el.parentElement !== container) container.appendChild(tk.el);
      tk.el.classList.toggle('sel', !!s.selected);
      const dx = tk.x - x, dy = tk.y - y;
      if (Math.abs(dx) > 2) tk.dir = dx > 0 ? -1 : 1;
      tk.face.style.transform = `scaleX(${tk.dir})`;
      Object.assign(tk.el.style, { width: `${w}px`, height: `${w}px`, left: `${x - w / 2}px`, top: `${y - w / 2 - w * 0.1}px` });
      if (!fresh && tk.cell !== s.cell && motion) {
        tk.el.animate(frames(s.gait, dx, dy), { duration: DUR[s.gait], easing: s.gait === 'slide' ? 'cubic-bezier(.2,.8,.3,1)' : 'ease-in-out' });
        window.setTimeout(() => this.puff(x, y + w * 0.32, s.gait === 'hop' || s.gait === 'leap' ? 8 : 5, s.puff), DUR[s.gait] * 0.86);
      } else if (fresh && motion) {
        tk.el.animate([{ opacity: 0, transform: 'translateY(-18px) scale(.5)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' });
        window.setTimeout(() => this.puff(x, y + w * 0.32, 6, s.puff), 220);
      }
      tk.x = x; tk.y = y; tk.w = w; tk.cell = s.cell;
    }
    for (const [id, tk] of this.toks) if (!seen.has(id)) { tk.el.remove(); this.toks.delete(id); }
  }
  /** Little snow (or water) puff where a token lands. */
  puff(x: number, y: number, n = 6, color = '#FFFFFF'): void {
    const c = this.container; if (!c || reduced()) return;
    for (let k = 0; k < n; k++) {
      const p = document.createElement('span'); p.className = 'puff'; p.style.left = `${x}px`; p.style.top = `${y}px`; p.style.background = color;
      c.appendChild(p);
      const a = (Math.PI * 2 * k) / n + Math.random() * 0.6, d = 14 + Math.random() * 14;
      p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 0.95 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d * 0.6 - 6}px)) scale(.3)`, opacity: 0 }], { duration: 480, easing: 'ease-out' }).onfinish = () => p.remove();
    }
  }
  /** Quick hello hop (when an animal is picked). */
  hop(id: string): void {
    const tk = this.toks.get(id); if (!tk || reduced()) return;
    tk.inner.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-16px) scale(.95,1.06)', offset: 0.45 }, { transform: 'translateY(0) scale(1.08,.92)', offset: 0.8 }, { transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' });
  }
  /** Confused shake with a "?" bubble (wrong tap). */
  shake(id: string): void {
    const tk = this.toks.get(id); if (!tk) return;
    const b = document.createElement('span'); b.className = 'tok-bubble'; b.textContent = '?';
    tk.el.appendChild(b); window.setTimeout(() => b.remove(), 1100);
    if (reduced()) return;
    tk.inner.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px) rotate(-6deg)' }, { transform: 'translateX(5px) rotate(6deg)' }, { transform: 'translateX(-3px) rotate(-3deg)' }, { transform: 'translateX(0)' }], { duration: 420 });
  }
  /** Dive into a burrow, then disappear. */
  dive(id: string, delay = 0): void {
    const tk = this.toks.get(id); if (!tk) return;
    this.toks.delete(id);
    if (reduced()) { tk.el.remove(); return; }
    window.setTimeout(() => {
      tk.el.animate([{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(-12px) scale(1.05)', offset: 0.35 }, { transform: `translateY(${tk.w * 0.35}px) scale(.25)`, opacity: 0 }], { duration: 380, easing: 'ease-in', fill: 'forwards' }).onfinish = () => tk.el.remove();
    }, delay);
  }
  has(id: string): boolean { return this.toks.has(id); }
  clear(): void { for (const tk of this.toks.values()) tk.el.remove(); this.toks.clear(); }
}
