// Forest Journal: one card per day played, in this order. Facts come from the sourced track guides.
export type JournalArt = { kind: 'character'; animal: 'fox' | 'rabbit' | 'deer' } | { kind: 'print'; print: string } | { kind: 'bird'; color: string };
export interface JournalCard { id: string; name: string; fact: string; guide: string; art: JournalArt; tint: string }

export const JOURNAL: readonly JournalCard[] = [
  { id: 'fox', name: 'Red fox', guide: 'fox', tint: 'var(--fox-t)', art: { kind: 'character', animal: 'fox' }, fact: 'In winter, thick fur on its feet softens the outline of its prints.' },
  { id: 'rabbit', name: 'Cottontail rabbit', guide: 'rabbit', tint: 'var(--rabbit-t)', art: { kind: 'character', animal: 'rabbit' }, fact: 'When it hops, its big hind feet land in front of its small front feet.' },
  { id: 'deer', name: 'White-tailed deer', guide: 'deer', tint: 'var(--deer-t)', art: { kind: 'character', animal: 'deer' }, fact: 'The pointed tips of its split-heart prints face the way it was walking.' },
  { id: 'squirrel', name: 'Gray squirrel', guide: 'squirrel', tint: 'var(--soft)', art: { kind: 'print', print: 'squirrel' }, fact: 'Its trails usually start and end at a tree.' },
  { id: 'songbird', name: 'Songbird', guide: 'turkey-and-birds', tint: 'var(--soft)', art: { kind: 'bird', color: '#E2594A' }, fact: 'Small perching birds hop, leaving pairs of prints side by side.' },
  { id: 'coyote', name: 'Coyote', guide: 'coyote', tint: 'var(--soft)', art: { kind: 'print', print: 'canid' }, fact: 'The gap between its toes and heel pad often forms an H shape.' },
  { id: 'raccoon', name: 'Raccoon', guide: 'raccoon', tint: 'var(--soft)', art: { kind: 'print', print: 'hand' }, fact: 'Its hand-like prints usually come in side-by-side pairs.' },
  { id: 'bobcat', name: 'Bobcat', guide: 'bobcat', tint: 'var(--soft)', art: { kind: 'print', print: 'cat' }, fact: 'Its round prints show no claw marks, because cats pull their claws in.' },
  { id: 'skunk', name: 'Striped skunk', guide: 'skunk', tint: 'var(--soft)', art: { kind: 'print', print: 'skunk' }, fact: 'Its long front claws are made for digging up insects.' },
  { id: 'wolf', name: 'Gray wolf', guide: 'wolf', tint: 'var(--soft)', art: { kind: 'print', print: 'canid' }, fact: 'In deep snow, a pack often walks single file in the leader’s prints.' },
  { id: 'moose', name: 'Moose', guide: 'moose', tint: 'var(--soft)', art: { kind: 'print', print: 'hoof' }, fact: 'Its prints can be more than twice as long as a deer’s.' },
  { id: 'turkey', name: 'Wild turkey', guide: 'turkey-and-birds', tint: 'var(--soft)', art: { kind: 'print', print: 'bird' }, fact: 'A gobbler’s track is about an inch longer than a hen’s.' },
];
