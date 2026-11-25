// Prints one short summary table for the whole run and writes the full list to tools/qa/report/qa-report.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { QA_DIR } from './lib/site.mjs';

const ORDER = ['links', 'overflow', 'clipping', 'overlap', 'footer-gap', 'contrast', 'console', 'smoke-play', 'seo', 'focus'];
const TITLE = {
  links: '1 Links', overflow: '2 Overflow (360/390/1280)', clipping: '2 Clipped button/tab/pill text', overlap: '3 Overlap',
  'footer-gap': '4 Footer gap >= 24px', contrast: '5 Contrast AA (light+dark)', console: '6 Console errors', 'smoke-play': '7 Smoke play', seo: '8 Sitemap and robots', focus: '9 Keyboard focus on boards',
};

export default class SummaryReporter {
  constructor() { this.ran = new Map(); this.fails = []; this.notes = []; this.crashed = []; }
  onTestEnd(test, result) {
    let flagged = false;
    // Annotations added while a test runs show up on the result (and, in newer Playwright, on the test too): read one list only.
    for (const a of (result.annotations?.length ? result.annotations : test.annotations)) {
      if (a.type === 'qa-ran') this.ran.set(a.description, (this.ran.get(a.description) ?? 0) + 1);
      else if (a.type === 'qa-fail') { this.fails.push(JSON.parse(a.description)); flagged = true; }
      else if (a.type === 'qa-note') this.notes.push(JSON.parse(a.description));
    }
    // A test that failed without recording a finding crashed (timeout, navigation error): report it too.
    if (result.status !== 'passed' && result.status !== 'skipped' && !flagged) this.crashed.push(`${test.titlePath().slice(1).join(' › ')}: ${(result.error?.message ?? result.status).split('\n')[0]}`);
  }
  onEnd(result) {
    const byCheck = new Map(ORDER.map((c) => [c, []]));
    for (const f of this.fails) (byCheck.get(f.check) ?? byCheck.set(f.check, []).get(f.check)).push(f);
    const rows = [...byCheck].map(([c, list]) => {
      const pages = new Set(list.map((f) => f.page)).size;
      return [TITLE[c] ?? c, String(this.ran.get(c) ?? 0), String(list.length), list.length ? `FAIL (${pages} page${pages === 1 ? '' : 's'})` : (this.ran.get(c) ? 'pass' : 'NOT RUN')];
    });
    const head = ['Check', 'Runs', 'Problems', 'Result'];
    const w = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
    const line = (r) => '| ' + r.map((v, i) => v.padEnd(w[i])).join(' | ') + ' |';
    const out = ['', 'Wild Daily QA summary', line(head), '|' + w.map((n) => '-'.repeat(n + 2)).join('|') + '|', ...rows.map(line)];

    const orphans = this.notes.filter((n) => n.kind === 'orphan');
    const fps = this.notes.filter((n) => n.kind === 'false positive');
    if (orphans.length) out.push('', `Orphan pages (nothing links to them; reported, not a failure): ${orphans.length}`, ...orphans.map((n) => `  - ${n.msg}`));
    if (fps.length) out.push('', `Known false positives (not failures): ${fps.length}`, ...fps.map((n) => `  - ${n.msg}`));

    // Group identical problems across pages so the list stays readable.
    if (this.fails.length) {
      out.push('', 'Problems:');
      for (const [c, list] of byCheck) {
        if (!list.length) continue;
        const groups = new Map();
        for (const f of list) { const g = groups.get(f.msg) ?? groups.set(f.msg, []).get(f.msg); g.push(`${f.page || '-'} @${f.setup}`); }
        out.push(`  [${c}] ${list.length} problem(s), ${groups.size} distinct`);
        for (const [msg, where] of [...groups].slice(0, 25)) out.push(`    - ${msg}\n        on ${where.slice(0, 4).join(', ')}${where.length > 4 ? ` and ${where.length - 4} more` : ''}`);
        if (groups.size > 25) out.push(`    … ${groups.size - 25} more distinct problems in report/qa-report.json`);
      }
    }
    if (this.crashed.length) out.push('', `Tests that crashed: ${this.crashed.length}`, ...this.crashed.slice(0, 20).map((c) => `  - ${c}`));
    const ok = !this.fails.length && !this.crashed.length && result.status === 'passed';
    out.push('', ok ? 'QA PASSED' : `QA FAILED: ${this.fails.length} problem(s)${this.crashed.length ? `, ${this.crashed.length} crashed test(s)` : ''}. Full list: tools/qa/report/qa-report.json`, '');
    console.log(out.join('\n'));
    mkdirSync(join(QA_DIR, 'report'), { recursive: true });
    writeFileSync(join(QA_DIR, 'report', 'qa-report.json'), JSON.stringify({ status: ok ? 'passed' : 'failed', ran: Object.fromEntries(this.ran), problems: this.fails, notes: this.notes, crashed: this.crashed }, null, 2));
  }
  printsToStdio() { return true; }
}
