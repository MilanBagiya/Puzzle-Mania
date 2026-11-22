// Shared on every page: Options dialog (theme, erase progress), help dialogs, close buttons.
import { loadProgress, saveProgress, type Theme } from '@wild-daily/core';
import { toast } from './toast';

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
const openDialog = (id: string): void => { const d = document.getElementById(id) as HTMLDialogElement | null; d?.showModal?.(); };

document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!t) return;
  switch (t.dataset.act) {
    case 'opts': e.preventDefault(); syncThemeButtons(); openDialog('optsdlg'); break;
    case 'help': e.preventDefault(); openDialog('helpdlg'); break;
    case 'closedlg': t.closest('dialog')?.close(); break;
    case 'theme': {
      const p = loadProgress(); p.theme = (t.dataset.v as Theme) ?? 'auto'; saveProgress(p); applyTheme(p.theme); syncThemeButtons(); break;
    }
    case 'reset': {
      if (!t.dataset.armed) { t.dataset.armed = '1'; t.textContent = 'Tap again to erase everything'; t.classList.replace('btn-w', 'btn-c'); break; }
      const theme = loadProgress().theme;
      saveProgress(theme ? { days: {}, theme } : { days: {} });
      t.closest('dialog')?.close(); toast('Progress erased. Fresh start!');
      window.setTimeout(() => { window.location.href = '/'; }, 600);
      break;
    }
  }
});
