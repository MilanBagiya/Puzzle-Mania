// Page address helpers. On the real site these use the browser address bar.
// Inside the single-file preview (used to show work in progress), the preview shell provides them instead.
type PreviewWindow = Window & { __wdSearch?: string; __wdNav?: (href: string) => void };
const w = (): PreviewWindow => window as PreviewWindow;
/** Query parameters of the current page (?date=…&level=…). */
export const params = (): URLSearchParams => new URLSearchParams(location.search || w().__wdSearch || '');
/** Go to another page of the site. */
export function goTo(href: string): void {
  const nav = w().__wdNav;
  if (nav) nav(href); else window.location.href = href;
}
