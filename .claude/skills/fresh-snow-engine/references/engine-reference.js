// ===== Fresh Snow engine (shared by page and tests) =====
const ANIMAL_ORDER = ['fox', 'rabbit', 'deer'];
const LEVELS = {
  morning: { label: 'Morning', n: 5, animals: ['fox', 'rabbit'], rocks: 1, trees: 2, len: [3, 5], cover: [2, 3] },
  noon:    { label: 'Noon',    n: 6, animals: ['fox', 'rabbit', 'deer'], rocks: 2, trees: 3, len: [3, 6], cover: [3, 5] },
  night:   { label: 'Night',   n: 7, animals: ['fox', 'rabbit', 'deer'], rocks: 3, trees: 4, len: [4, 7], cover: [6, 9] }
};
const SNOW = 0, ROCK = 1, TREE = 2;
const DIRS4 = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

function hashStr(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rngFrom = s => mulberry32(hashStr(s));
const randInt = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
function shuffle(rng, arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

const isBorder = (n, idx) => { const r = Math.floor(idx / n), c = idx % n; return r === 0 || c === 0 || r === n - 1 || c === n - 1; };

// Candidate moves from idx for an animal. prevDir only matters for deer.
function rawMoves(n, animal, idx, prevDir) {
  const r = Math.floor(idx / n), c = idx % n, out = [];
  const add = (d, k) => { const rr = r + d[0] * k, cc = c + d[1] * k; if (rr >= 0 && cc >= 0 && rr < n && cc < n) out.push({ idx: rr * n + cc, dir: d }); };
  if (animal === 'fox') DIAG.forEach(d => add(d, 1));
  else if (animal === 'rabbit') DIRS4.forEach(d => add(d, 2));
  else DIRS4.forEach(d => { if (!(prevDir && d[0] === -prevDir[0] && d[1] === -prevDir[1])) add(d, 1); });
  return out;
}
function dirBetween(n, a, b, animal) {
  const dr = Math.floor(b / n) - Math.floor(a / n), dc = (b % n) - (a % n);
  const k = animal === 'rabbit' ? 2 : 1;
  return [dr / k, dc / k];
}
function prevDirOf(n, path, animal) { return path.length < 2 ? null : dirBetween(n, path[path.length - 2], path[path.length - 1], animal); }

function tryGenerate(L, rng) {
  const n = L.n, N = n * n, terrain = new Array(N).fill(SNOW);
  const cells = shuffle(rng, [...Array(N).keys()]);
  let k = 0;
  for (let i = 0; i < L.rocks; i++) terrain[cells[k++]] = ROCK;
  for (let i = 0; i < L.trees; i++) terrain[cells[k++]] = TREE;
  const paths = {}, hideouts = [];
  for (const a of L.animals) {
    let ok = false;
    for (let t = 0; t < 300 && !ok; t++) {
      const target = randInt(rng, L.len[0], L.len[1]);
      const starts = [...Array(N).keys()].filter(i => isBorder(n, i) && terrain[i] === SNOW && !hideouts.includes(i));
      if (!starts.length) return null;
      const path = [starts[Math.floor(rng() * starts.length)]];
      const seen = new Set(path);
      while (path.length < target) {
        const opts = rawMoves(n, a, path[path.length - 1], prevDirOf(n, path, a))
          .filter(m => terrain[m.idx] === SNOW && !seen.has(m.idx) && !hideouts.includes(m.idx));
        if (!opts.length) break;
        const m = opts[Math.floor(rng() * opts.length)];
        path.push(m.idx); seen.add(m.idx);
      }
      if (path.length < target) continue;
      const end = path[path.length - 1];
      if (Object.values(paths).some(p => p.includes(end))) continue;
      paths[a] = path; hideouts.push(end); ok = true;
    }
    if (!ok) return null;
  }
  const prints = Array.from({ length: N }, () => []);
  for (const a of L.animals) paths[a].slice(0, -1).forEach(i => { if (!prints[i].includes(a)) prints[i].push(a); });
  return { n, terrain, hideouts, paths, prints, animals: L.animals.slice() };
}

// Enumerate every path for one animal consistent with what the player can see.
function enumeratePaths(p, covered, a, cap) {
  const n = p.n, N = n * n, hide = new Set(p.hideouts);
  const ownVisible = i => !covered.has(i) && p.prints[i].includes(a);
  const required = [...Array(N).keys()].filter(ownVisible).length;
  const allowed = i => p.terrain[i] === SNOW && !hide.has(i) && (covered.has(i) || p.prints[i].includes(a));
  const out = [];
  let overflow = false;
  const path = [], seen = new Set();
  function dfs(got) {
    if (overflow) return;
    const last = path[path.length - 1];
    for (const m of rawMoves(n, a, last, prevDirOf(n, path, a))) {
      if (seen.has(m.idx)) continue;
      if (hide.has(m.idx)) {
        if (got === required) { out.push([...path, m.idx]); if (out.length > cap) { overflow = true; return; } }
        continue;
      }
      if (!allowed(m.idx)) continue;
      path.push(m.idx); seen.add(m.idx);
      dfs(got + (ownVisible(m.idx) ? 1 : 0));
      path.pop(); seen.delete(m.idx);
      if (overflow) return;
    }
  }
  for (let s = 0; s < N; s++) {
    if (!isBorder(n, s) || !allowed(s)) continue;
    path.push(s); seen.add(s);
    dfs(ownVisible(s) ? 1 : 0);
    path.pop(); seen.delete(s);
    if (overflow) return null;
  }
  return out;
}

function solve(p, covered, limit) {
  const lists = p.animals.map(a => enumeratePaths(p, covered, a, 600));
  if (lists.some(l => l === null)) return null; // too many options: treat as not unique
  const sols = [], used = new Set(), chosen = [];
  (function rec(i) {
    if (sols.length >= limit) return;
    if (i === lists.length) { sols.push(chosen.slice()); return; }
    for (const path of lists[i]) {
      const e = path[path.length - 1];
      if (used.has(e)) continue;
      used.add(e); chosen.push(path); rec(i + 1); chosen.pop(); used.delete(e);
      if (sols.length >= limit) return;
    }
  })(0);
  return sols;
}

function stoodMap(p, sol) {
  const m = new Map();
  sol.forEach((path, ai) => path.slice(0, -1).forEach(i => { const k = m.get(i) || []; k.push(p.animals[ai]); m.set(i, k); }));
  return m;
}

function makeUnique(p, covered, rng) {
  for (let iter = 0; iter < 60; iter++) {
    const sols = solve(p, covered, 2);
    if (sols && sols.length === 1) return true;
    if (sols && sols.length === 0) return false;
    let candidates = [...covered];
    if (sols) {
      const m0 = stoodMap(p, sols[0]), m1 = stoodMap(p, sols[1]);
      const diff = candidates.filter(i => (m0.get(i) || []).sort().join() !== (m1.get(i) || []).sort().join());
      if (diff.length) candidates = diff;
    }
    if (!candidates.length) return false;
    covered.delete(candidates[Math.floor(rng() * candidates.length)]);
  }
  return false;
}

function generatePuzzle(levelKey, seed) {
  const L = LEVELS[levelKey], rng = rngFrom(seed + ':' + levelKey);
  let best = null;
  for (let attempt = 0; attempt < 120; attempt++) {
    const p = tryGenerate(L, rng);
    if (!p) continue;
    const N = p.n * p.n, hide = new Set(p.hideouts);
    const printed = [...Array(N).keys()].filter(i => p.prints[i].length && !hide.has(i));
    const blank = [...Array(N).keys()].filter(i => !p.prints[i].length && p.terrain[i] === SNOW && !hide.has(i));
    const want = randInt(rng, L.cover[0], L.cover[1]);
    const covered = new Set();
    shuffle(rng, printed).slice(0, Math.ceil(want * 0.6)).forEach(i => covered.add(i));
    shuffle(rng, blank).slice(0, want - covered.size).forEach(i => covered.add(i));
    if (!makeUnique(p, covered, rng)) continue;
    // every animal should leave at least one visible print so the puzzle is fair
    if (p.animals.some(a => !printed.some(i => p.prints[i].includes(a) && !covered.has(i)))) continue;
    p.covered = covered;
    if (!best || covered.size > best.covered.size) best = p;
    if (covered.size >= L.cover[0]) break;
  }
  return best;
}

// Check a player's paths. Returns [] when solved, else a list of problems in plain words.
function checkPaths(p, state) {
  const n = p.n, hide = new Set(p.hideouts), errs = [];
  const name = a => a[0].toUpperCase() + a.slice(1);
  const where = i => `row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}`;
  const ends = {};
  for (const a of p.animals) {
    const path = state[a] || [];
    if (!path.length) { errs.push(`The ${a} has no path yet.`); continue; }
    const last = path[path.length - 1];
    if (!hide.has(last)) { errs.push(`The ${a} isn’t home yet.`); continue; }
    if (ends[last]) errs.push(`The ${ends[last]} and the ${a} can’t share a home. Each home fits one animal.`);
    ends[last] = a;
    const stood = new Set(path.slice(0, -1));
    for (const i of stood) if (!p.covered.has(i) && !p.prints[i].includes(a)) { errs.push(`The ${a} can’t walk on ${where(i)}: there’s no ${a} print there.`); break; }
    for (let i = 0; i < n * n; i++) if (!p.covered.has(i) && p.prints[i].includes(a) && !stood.has(i)) { errs.push(`You missed a ${a} print at ${where(i)}. Every print must be on the trail.`); break; }
  }
  return errs;
}

if (typeof module !== 'undefined') module.exports = { LEVELS, generatePuzzle, solve, checkPaths, rawMoves, isBorder, prevDirOf };
