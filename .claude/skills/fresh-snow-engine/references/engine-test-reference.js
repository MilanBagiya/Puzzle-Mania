const E = require('./engine-reference.js');
const levels = ['morning','noon','night'];
let fails=0, times={morning:[],noon:[],night:[]}, covers={morning:[],noon:[],night:[]};
for (let d=0; d<60; d++) {
  const seed = '2027-01-' + d;
  for (const lv of levels) {
    const t0=Date.now();
    const p = E.generatePuzzle(lv, seed);
    times[lv].push(Date.now()-t0);
    if (!p) { fails++; console.log('FAIL gen', seed, lv); continue; }
    covers[lv].push(p.covered.size);
    const sols = E.solve(p, p.covered, 3);
    if (!sols || sols.length !== 1) { fails++; console.log('NOT UNIQUE', seed, lv, sols && sols.length); continue; }
    // true solution passes check
    const st = {}; p.animals.forEach(a => st[a] = p.paths[a]);
    const errs = E.checkPaths(p, st);
    if (errs.length) { fails++; console.log('CHECK FAIL', seed, lv, errs); }
    // solver solution equals generator paths
    const same = sols[0].every((path,i)=>path.join()===p.paths[p.animals[i]].join());
    if (!same) { fails++; console.log('DIFF SOLUTION', seed, lv); }
  }
}
const avg=a=>(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
for (const lv of levels) console.log(lv, 'avg ms', avg(times[lv]), 'max ms', Math.max(...times[lv]), 'avg cover', avg(covers[lv]), 'min', Math.min(...covers[lv]));
console.log('fails', fails);
// determinism
const a=E.generatePuzzle('night','x'), b=E.generatePuzzle('night','x');
console.log('deterministic', JSON.stringify(a.paths)===JSON.stringify(b.paths));
