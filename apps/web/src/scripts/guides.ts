// Filter chips on the animal guides index.
const chips = document.querySelectorAll<HTMLButtonElement>('[data-filter]');
const cards = document.querySelectorAll<HTMLElement>('[data-group]');
const count = document.getElementById('gd-count');
chips.forEach((c) => c.addEventListener('click', () => {
  const f = c.dataset.filter;
  chips.forEach((x) => x.setAttribute('aria-selected', String(x === c)));
  let n = 0;
  cards.forEach((card) => { const show = f === 'all' || card.dataset.group === f; card.hidden = !show; if (show) n++; });
  if (count) count.textContent = `${n} ${n === 1 ? 'guide' : 'guides'}`;
}));
