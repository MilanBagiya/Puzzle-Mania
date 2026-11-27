// Seasonal page backdrops, drawn by packages/ui/src/backdrop.ts and written as static files at build time.
import type { APIRoute, GetStaticPaths } from 'astro';
import { BACKDROP_SEASONS, backdropSvg, type BackdropSeason, type BackdropTheme } from '@wild-daily/ui';

export const getStaticPaths: GetStaticPaths = () =>
  BACKDROP_SEASONS.flatMap((season) => (['light', 'dark'] as const).map((theme) => ({ params: { name: `${season}-${theme}` }, props: { season, theme } })));
export const GET: APIRoute = ({ props }) =>
  new Response(backdropSvg(props.season as BackdropSeason, props.theme as BackdropTheme), { headers: { 'Content-Type': 'image/svg+xml' } });
