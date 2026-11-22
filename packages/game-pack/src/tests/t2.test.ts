import { describe, expect, it } from 'vitest';
import pond, { solvePond } from '../games/frog-pond.js';
import fire, { solveFireflies } from '../games/firefly-night.js';
import lodge, { solveLodges } from '../games/beaver-lodges.js';
import { PICTURES, SOLVABLE, generate as pic } from '../games/snow-picture.js';
describe('logic games 2', () => {
  it('frog pond', () => { const t = Date.now(); for (let d = 0; d < 30; d++) expect(solvePond(pond.generate('d' + d), 2)).toHaveLength(1); console.log('pond', Date.now() - t); });
  it('firefly', () => { const t = Date.now(); for (let d = 0; d < 30; d++) expect(solveFireflies(fire.generate('d' + d), 2)).toHaveLength(1); console.log('fire', Date.now() - t); });
  it('lodges', () => { const t = Date.now(); for (let d = 0; d < 30; d++) expect(solveLodges(lodge.generate('d' + d), 2)).toHaveLength(1); console.log('lodge', Date.now() - t); });
  it('pictures', () => { console.log('solvable pictures', SOLVABLE.map((p) => p.name), 'of', PICTURES.length); expect(SOLVABLE.length).toBeGreaterThanOrEqual(8); expect(pic('x').name).toBeTruthy(); });
});
