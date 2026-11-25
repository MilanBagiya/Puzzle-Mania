// Fresh Snow board UI in plain DOM (no framework). Works from the puzzle alone:
// the solution is never needed in the browser (hints come from the solver).
import { ANIMAL_NAME, ANIMAL_RULE, ANIMAL_SHORT, Mover, burrow, character, drift, escapeHtml, moodClass, print, rock, tree, type Gait, type Mood } from '@wild-daily/ui';
import { checkPaths, isBorder, prevDirOf, rawMoves, solve, SNOW, ROCK, TREE, type AnimalId, type PlayerPaths, type Puzzle } from './engine.js';

export interface GameStats { time: number; hints: number }
export interface GameOptions {
  puzzle: Puzzle;
  /** Element whose text shows the running time (optional). */
  timerEl?: HTMLElement | null;
  onSolved?: (stats: GameStats) => void;
}
export interface GameHandle { destroy(): void }

interface State {
  paths: Record<string, number[]>;
  hist: AnimalId[];
  sel: AnimalId;
  hints: number;
  t0: number;
  wrong: number;
  oops: AnimalId | null;
  msg: string | null;
  kind: '' | 'bad' | 'good';
  done: boolean;
  secs: number;
  next: number[];
}

export function createFreshSnowGame(root: HTMLElement, opts: GameOptions): GameHandle {
  const p = opts.puzzle;
  const n = p.n;
  const homes = new Set(p.homes);
  const covered = new Set(p.covered);
  const first = p.animals[0] as AnimalId;
  const S: State = { paths: Object.fromEntries(p.animals.map((a) => [a, [] as number[]])), hist: [], sel: first, hints: 0, t0: Date.now(), wrong: -1, oops: null, msg: null, kind: '', done: false, secs: 0, next: [] };
  let wrongTimer = 0;
  let solution: Record<string, number[]> | null = null;
  // Animals walk the board: fox trots, rabbit hops, deer walks.
  const GAIT: Record<AnimalId, Gait> = { fox: 'trot', rabbit: 'hop', deer: 'walk' };
  const mover = new Mover();
  let prevHome = new Set<AnimalId>();

  const pathOf = (a: AnimalId): number[] => S.paths[a] ?? [];
  const isHome = (a: AnimalId): boolean => { const pa = pathOf(a); return pa.length > 0 && homes.has(pa[pa.length - 1] as number); };
  const mood = (a: AnimalId): Mood => (S.done ? 'happy' : S.oops === a ? 'oops' : isHome(a) ? 'happy' : 'idle');
  /** Rule-based options only: a step must land on a burrow, a drift, or a square showing this animal's own print. */
  const ok = (a: AnimalId, i: number): boolean => p.terrain[i] === SNOW && (homes.has(i) || covered.has(i) || (p.prints[i] ?? []).includes(a));
  function legal(a: AnimalId): number[] {
    const path = pathOf(a);
    if (!path.length) return [...Array(n * n).keys()].filter((i) => isBorder(n, i) && !homes.has(i) && ok(a, i));
    const last = path[path.length - 1] as number;
    if (homes.has(last)) return [];
    return rawMoves(n, a, last, prevDirOf(n, path, a)).map((m) => m.idx).filter((i) => ok(a, i) && !path.includes(i));
  }

  function coach(): [string, State['kind']] {
    if (S.done) return ['Every animal is home and smiling!', 'good'];
    if (S.msg) return [S.msg, S.kind];
    const a = S.sel;
    if (p.animals.every((x) => isHome(x))) return ['Every animal is in a burrow. Tap Check to see if you’re right.', 'good'];
    if (isHome(a)) return [`The ${a} is home! Pick another animal.`, 'good'];
    if (!pathOf(a).length) return [`Start the ${a}: tap the edge square where its trail begins. Glowing squares are the places it could start.`, ''];
    return [`The ${a} ${ANIMAL_RULE[a]}. Tap a glowing square to take the next step.`, ''];
  }

  function cell(i: number): string {
    const t = p.terrain[i];
    let cls = 'cell';
    let inner = '';
    let label = `Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}`;
    if (t === ROCK) { inner = rock(); label += ': rock'; cls += ' blocked'; }
    else if (t === TREE) { inner = tree(); label += ': tree'; cls += ' blocked'; }
    else if (homes.has(i)) {
      const arrived = p.animals.find((a) => { const pa = pathOf(a); return pa[pa.length - 1] === i; });
      inner = arrived ? character(arrived, 'happy', undefined, 'cheer') : burrow();
      label += arrived ? `: burrow, the ${arrived} is home` : ': empty burrow';
    } else {
      const pr = p.prints[i] ?? [];
      if (covered.has(i)) { inner = drift(); label += ': snow drift, prints hidden'; }
      else if (pr.length) { inner = `<span class="prints${pr.length > 1 ? ' two' : ''}">${pr.map((a) => print(a)).join('')}</span>`; label += `: ${pr.join(' and ')} print`; }
      else label += ': snow';
      const on = p.animals.filter((a) => pathOf(a).includes(i));
      if (on.length) {
        const a = on.includes(S.sel) ? S.sel : (on[0] as AnimalId);
        const k = pathOf(a).indexOf(i) + 1;
        cls += ' st-' + a;
        inner += `<span class="badge ${a}">${k}</span>`;
        label += `, ${a} step ${k}`;
      }
    }
    if (!S.done && S.next.includes(i)) { cls += ' next'; label += `, the ${S.sel} can step here`; }
    if (S.wrong === i) cls += ' bad';
    return `<button type="button" class="${cls}" data-fs="cell" data-i="${i}" aria-label="${label}">${inner}</button>`;
  }

  function render(focus?: number): void {
    S.next = S.done ? [] : legal(S.sel);
    const [msg, kind] = coach();
    const cards = p.animals.map((a) => {
      const m = mood(a);
      return `<button type="button" class="acard" data-fs="sel" data-a="${a}" aria-pressed="${S.sel === a}">${character(a, m, 50, moodClass(a, m), `${ANIMAL_NAME[a]}, ${m === 'idle' ? 'calm' : m === 'oops' ? 'worried' : 'happy'}`)}<span><b>${ANIMAL_NAME[a]}</b><small>${ANIMAL_SHORT[a]}</small></span>${isHome(a) ? '<span class="pill p-g home">Home</span>' : ''}</button>`;
    }).join('');
    const dis = S.done ? ' disabled' : '';
    root.innerHTML = `<div class="cards" role="group" aria-label="Animals">${cards}</div>
<p class="coach ${kind}" role="status">${escapeHtml(msg)}</p>
<div class="boardwrap" style="--bmax:${n * 86}px"><div class="board" role="grid" aria-label="Snowfield, ${n} by ${n}" style="grid-template-columns:repeat(${n},1fr); max-width:var(--bcap)">${[...Array(n * n).keys()].map(cell).join('')}</div></div>
<div class="tools"><button type="button" class="btn btn-w" data-fs="undo"${dis}>Undo</button><button type="button" class="btn btn-w" data-fs="clear"${dis}>Clear</button><button type="button" class="btn btn-y" data-fs="hint"${dis}>Hint</button><button type="button" class="btn btn-p" data-fs="check"${dis}>Check</button></div>`;
    if (focus != null) (root.querySelector(`[data-i="${focus}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
    syncAnimals();
  }

  function syncAnimals(): void {
    const cellEl = (i: number): Element | null => root.querySelector(`[data-fs="cell"][data-i="${i}"]`);
    const nowHome = new Set(p.animals.filter((a) => isHome(a)));
    const arrived = [...nowHome].filter((a) => !prevHome.has(a));
    const specs = S.done ? [] : p.animals.filter((a) => pathOf(a).length > 0 && (!isHome(a) || arrived.includes(a))).map((a) => {
      const last = pathOf(a)[pathOf(a).length - 1] as number;
      return { id: a, cell: last, el: cellEl(last), html: character(a, mood(a)), gait: GAIT[a], selected: a === S.sel && !isHome(a) };
    });
    mover.sync(root.querySelector<HTMLElement>('.boardwrap'), specs);
    for (const a of arrived) {
      if (S.done) break;
      const home = pathOf(a)[pathOf(a).length - 1] as number;
      cellEl(home)?.classList.add('arriving', 'burrowshake');
      mover.dive(a, 330);
    }
    prevHome = nowHome;
  }

  function flashWrong(i: number, a: AnimalId, msg: string): void {
    S.wrong = i; S.oops = a; S.msg = msg; S.kind = 'bad'; render(i); mover.shake(a);
    window.clearTimeout(wrongTimer);
    wrongTimer = window.setTimeout(() => { S.wrong = -1; S.oops = null; S.msg = null; S.kind = ''; render(); }, 1500);
  }

  function tapCell(i: number): void {
    if (S.done) return;
    const a = S.sel;
    const path = pathOf(a);
    if (path.includes(i)) { path.length = path.indexOf(i) + (i === path[path.length - 1] ? 0 : 1); S.msg = null; render(i); return; }
    if (S.next.includes(i)) {
      path.push(i); S.hist.push(a); S.msg = null;
      if (homes.has(i)) {
        const other = p.animals.find((b) => b !== a && pathOf(b)[pathOf(b).length - 1] === i);
        if (other) { S.msg = `The ${other} is already in that burrow. Each burrow fits one animal.`; S.kind = 'bad'; }
        else {
          const nxt = p.animals.find((b) => !isHome(b));
          if (nxt) window.setTimeout(() => { if (!S.done) { S.sel = nxt; render(); } }, 700);
        }
      }
      render(i); return;
    }
    const r = Math.floor(i / n) + 1, c = (i % n) + 1;
    if (p.terrain[i] !== SNOW) return flashWrong(i, a, 'Trees and rocks block every animal.');
    if (!path.length) return flashWrong(i, a, isBorder(n, i) ? `The ${a} didn’t start there: an edge start needs a ${a} print or a drift.` : `The ${a} came in from the edge of the snow. Start on an edge square.`);
    if (isHome(a)) return flashWrong(i, a, `The ${a} is already home. Pick another animal, or tap its trail to change it.`);
    const reach = rawMoves(n, a, path[path.length - 1] as number, prevDirOf(n, path, a)).some((m) => m.idx === i);
    if (reach && !covered.has(i) && !(p.prints[i] ?? []).includes(a)) return flashWrong(i, a, `There’s no ${a} print on row ${r}, column ${c}, so the ${a} didn’t step there.`);
    return flashWrong(i, a, `The ${a} can’t reach row ${r}, column ${c} from there. It ${ANIMAL_RULE[a]}.`);
  }

  function hint(): void {
    solution ??= (solve(p) as Record<string, number[]> | null);
    if (!solution) return;
    for (const a of p.animals) {
      const sol = solution[a] ?? [];
      const cur = pathOf(a);
      let k = 0;
      while (k < cur.length && cur[k] === sol[k]) k++;
      if (k === sol.length && cur.length === sol.length) continue;
      S.paths[a] = sol.slice(0, k + 1); S.sel = a; S.hints++; S.hist.push(a);
      S.msg = k < cur.length ? `Hint: part of the ${a}’s trail was off track. Here’s the next correct step.` : `Hint: here’s the ${a}’s next step.`;
      S.kind = '';
      render(sol[k]); return;
    }
  }

  function check(): void {
    const errs = checkPaths(p, S.paths as PlayerPaths);
    if (!errs.length) {
      S.done = true; S.secs = Math.round((Date.now() - S.t0) / 1000); render(); tick();
      opts.onSolved?.({ time: S.secs, hints: S.hints });
      return;
    }
    const e = errs[0]!;
    S.oops = e.animal; S.msg = e.message; S.kind = 'bad'; render(); mover.shake(e.animal);
    window.clearTimeout(wrongTimer);
    wrongTimer = window.setTimeout(() => { S.oops = null; render(); }, 1600);
  }

  function onClick(ev: Event): void {
    const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-fs]');
    if (!t || !root.contains(t)) return;
    const act = t.dataset.fs;
    if (act === 'cell') tapCell(Number(t.dataset.i));
    else if (act === 'sel') { S.sel = t.dataset.a as AnimalId; S.msg = null; render(); mover.hop(S.sel); }
    else if (act === 'undo') {
      const a = S.hist.pop();
      if (a && pathOf(a).length) { pathOf(a).pop(); S.sel = a; }
      S.msg = null; render();
    } else if (act === 'clear') { p.animals.forEach((a) => { S.paths[a] = []; }); S.hist = []; S.sel = first; S.msg = null; render(); }
    else if (act === 'hint') hint();
    else if (act === 'check') check();
  }

  function tick(): void {
    if (!opts.timerEl) return;
    const s = S.done ? S.secs : Math.round((Date.now() - S.t0) / 1000);
    opts.timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  root.addEventListener('click', onClick);
  const onResize = (): void => render();
  window.addEventListener('resize', onResize);
  const timer = window.setInterval(tick, 1000);
  render(); tick();
  return { destroy(): void { root.removeEventListener('click', onClick); window.removeEventListener('resize', onResize); window.clearInterval(timer); window.clearTimeout(wrongTimer); mover.clear(); } };
}
