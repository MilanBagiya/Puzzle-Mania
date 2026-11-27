// Challenge a friend: a solver's result travels inside the link (?vs=...), so no accounts or server are needed and
// nothing personal is shared. The link holds only paws, time and an optional count (moves, crossings...), never answers.

/** Counts a result can carry. Lower is better for every one of them. */
export const CHALLENGE_UNITS = ['moves', 'crossings', 'guesses', 'jumps', 'hints', 'wrong guesses'] as const;
export type ChallengeUnit = (typeof CHALLENGE_UNITS)[number];
export interface Challenge { stars: number; time: number; n?: number; unit?: ChallengeUnit }

const SINGULAR: Record<ChallengeUnit, string> = { moves: 'move', crossings: 'crossing', guesses: 'guess', jumps: 'jump', hints: 'hint', 'wrong guesses': 'wrong guess' };
/** "9 crossings", "1 guess". */
export const unitText = (n: number, unit: ChallengeUnit): string => `${n} ${n === 1 ? SINGULAR[unit] : unit}`;
/** Turn a stat label from a result screen ("crossings", "guess", "jumps (best 7)") into a known unit, if it is one. */
export function unitFromLabel(label: string): ChallengeUnit | undefined {
  const l = label.split(' (')[0]!.trim().toLowerCase();
  return CHALLENGE_UNITS.find((u) => u === l || SINGULAR[u] === l);
}

/** Compact, URL-safe form: "s3.t123" plus ".n9.u1" when there is a count. */
export function encodeChallenge(c: Challenge): string {
  let s = `s${c.stars}.t${Math.round(c.time)}`;
  if (c.n !== undefined && c.unit) s += `.n${Math.round(c.n)}.u${CHALLENGE_UNITS.indexOf(c.unit)}`;
  return s;
}
/** Read a challenge from a link. Anything malformed or out of range gives null (links can be edited by hand). */
export function decodeChallenge(raw: string | null | undefined): Challenge | null {
  if (!raw || raw.length > 40) return null;
  const m = /^s([0-3])\.t(\d{1,5})(?:\.n(\d{1,3})\.u(\d))?$/.exec(raw);
  if (!m) return null;
  const time = Number(m[2]);
  if (time > 86_400) return null;
  const c: Challenge = { stars: Number(m[1]), time };
  if (m[3] !== undefined) {
    const unit = CHALLENGE_UNITS[Number(m[4])];
    if (!unit) return null;
    c.n = Number(m[3]); c.unit = unit;
  }
  return c;
}

/** Who did better: more paws first, then the lower count (when both have the same kind), then the faster time. */
export function compareChallenge(me: Challenge, them: Challenge): 'win' | 'lose' | 'tie' {
  if (me.stars !== them.stars) return me.stars > them.stars ? 'win' : 'lose';
  if (me.n !== undefined && them.n !== undefined && me.unit === them.unit && me.n !== them.n) return me.n < them.n ? 'win' : 'lose';
  if (me.time !== them.time) return me.time < them.time ? 'win' : 'lose';
  return 'tie';
}
