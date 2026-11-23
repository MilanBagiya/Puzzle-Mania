// Shared on every page: Options dialog (theme, erase progress), help dialogs, close buttons.
import { activeSeason, loadProgress, saveProgress, SEASON_INFO, todayIso, type Theme } from '@wild-daily/core';
import { toast } from './toast';
import { play } from './sound';

function applyTheme(t: Theme): void {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}
function syncThemeButtons(): void {
  const cur = loadProgress().theme ?? 'auto';
  document.querySelectorAll<HTMLElement>('[data-act="theme"]').forEach((b) => {
    const on = String(b.dataset.v === cur);
    b.setAttribute('aria-checked', on); b.setAttribute('aria-selected', on);
  });
}
const tz = (): string => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; } };
function syncFx(): void {
  const p = loadProgress();
  document.querySelectorAll<HTMLElement>('[data-act="sound"]').forEach((b) => { const on = String((b.dataset.v === 'on') === !!p.sound); b.setAttribute('aria-checked', on); b.setAttribute('aria-selected', on); });
  document.querySelectorAll<HTMLElement>('[data-act="vibrate"]').forEach((b) => { const on = String((b.dataset.v === 'on') === !!p.vibrate); b.setAttribute('aria-checked', on); b.setAttribute('aria-selected', on); });
}
export function applySeason(): void {
  const p = loadProgress(), s = activeSeason(p, todayIso(), tz());
  document.documentElement.setAttribute('data-season', s);
  document.querySelectorAll<HTMLElement>('[data-act="season"]').forEach((b) => { const on = String(b.dataset.v === (p.season ?? 'auto')); b.setAttribute('aria-checked', on); b.setAttribute('aria-selected', on); });
  document.querySelectorAll<HTMLElement>('[data-act="hemi"]').forEach((b) => { const on = String(b.dataset.v === (p.hemisphere ?? 'auto')); b.setAttribute('aria-checked', on); b.setAttribute('aria-selected', on); });
  const auto = !p.season || p.season === 'auto';
  const now = document.getElementById('season-now'); if (now) now.textContent = auto ? `· showing ${SEASON_INFO[s].name.toLowerCase()}` : '';
  const row = document.getElementById('hemi-row'); if (row) row.classList.toggle('dim', !auto);
  const note = document.getElementById('hemi-note'); if (note) note.textContent = auto ? '· used to pick your season' : '· only used when Season is Auto';
  document.dispatchEvent(new CustomEvent('wd:season', { detail: s }));
}
const openDialog = (id: string): void => { const d = document.getElementById(id) as HTMLDialogElement | null; d?.showModal?.(); };

document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!t) return;
  switch (t.dataset.act) {
    case 'opts': e.preventDefault(); syncThemeButtons(); applySeason(); syncFx(); openDialog('optsdlg'); break;
    case 'help': e.preventDefault(); openDialog('helpdlg'); break;
    case 'closedlg': t.closest('dialog')?.close(); break;
    case 'theme': {
      const p = loadProgress(); p.theme = (t.dataset.v as Theme) ?? 'auto'; saveProgress(p); applyTheme(p.theme); syncThemeButtons(); break;
    }
    case 'season': { const p = loadProgress(); p.season = (t.dataset.v as typeof p.season) ?? 'auto'; saveProgress(p); applySeason(); break; }
    case 'hemi': { const p = loadProgress(); p.hemisphere = (t.dataset.v as typeof p.hemisphere) ?? 'auto'; saveProgress(p); applySeason(); break; }
    case 'sound': { const p = loadProgress(); p.sound = t.dataset.v === 'on'; saveProgress(p); syncFx(); if (p.sound) play('win', true); break; }
    case 'vibrate': { const p = loadProgress(); p.vibrate = t.dataset.v === 'on'; saveProgress(p); syncFx(); if (p.vibrate) { try { navigator.vibrate?.(30); } catch { /* not supported */ } } break; }
    case 'reset': {
      if (!t.dataset.armed) { t.dataset.armed = '1'; t.textContent = 'Tap again to erase everything'; t.classList.replace('btn-w', 'btn-c'); break; }
      const keep = loadProgress();
      saveProgress({ days: {}, ...(keep.sound ? { sound: keep.sound } : {}), ...(keep.vibrate ? { vibrate: keep.vibrate } : {}), ...(keep.theme ? { theme: keep.theme } : {}), ...(keep.season ? { season: keep.season } : {}), ...(keep.hemisphere ? { hemisphere: keep.hemisphere } : {}) });
      t.closest('dialog')?.close(); toast('Progress erased. Fresh start!');
      window.setTimeout(() => { window.location.href = '/'; }, 600);
      break;
    }
  }
});
