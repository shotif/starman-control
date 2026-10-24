// The trailer's script and cut as data (docs/design/TRAILER.md §5 and §6, approved 24 October 2026):
// what is said and when, the feature cards, and the shots' times. The capture (shots.ts), the voices
// (narrator.ts), the music (music.ts) and the assembly (build.ts) all read it. Times are seconds.

export const LENGTH = 120;

/** The narrator's lines (N), made for the trailer. */
export const NARRATOR: readonly { id: string; at: number; text: string }[] = [
  { id: 'N1', at: 1.0, text: 'Three hundred and fifty-six star systems.' },
  { id: 'N2', at: 4.2, text: 'Every one of them real.' },
  { id: 'N3', at: 7.5, text: 'The old lanes run dark.' },
  { id: 'N4', at: 9.6, text: 'The stars are waiting.' },
  { id: 'N5', at: 12.0, text: 'Every captain answers to one voice.' },
  { id: 'N6', at: 20.6, text: 'Settle real worlds. Build them up.' },
  { id: 'N7', at: 30.5, text: 'Relight the old lanes. Lay new ones.' },
  { id: 'N8', at: 43.5, text: 'You are not alone out here.' },
  { id: 'N9a', at: 47.5, text: 'Four powers to lead.' },
  { id: 'N9b', at: 49.8, text: 'One of them is not human.' },
  { id: 'N10', at: 55.0, text: 'Make treaties. Win the Assembly’s vote.' },
  { id: 'N11a', at: 65.5, text: 'Design the ships.' },
  { id: 'N11b', at: 69.5, text: 'Watch every battle.' },
  { id: 'N12', at: 86.2, text: 'Someone was here before us.' },
  { id: 'N13', at: 91.5, text: 'Five keys. One answer.' },
  { id: 'N14', at: 96.0, text: 'And the sky is never still.' },
  { id: 'N15a', at: 101.5, text: 'Conquer them. Outvote them.' },
  { id: 'N15b', at: 104.2, text: 'Or find the keys first.' },
  { id: 'N16', at: 113.0, text: 'Starman Control.' },
  { id: 'N17', at: 115.0, text: 'The stars are waiting, Control.' },
];

/** The advisors' and commanders' lines (A): the game's own clips (public/voice/, VOICES.md). */
export const ADVISORS: readonly { id: string; at: number; clip: string; who: string }[] = [
  { id: 'A1', at: 16.5, clip: 'voice/sta/colonies-founded.mp3', who: 'Adaeze Morrow' },
  { id: 'A2', at: 23.8, clip: 'voice/frontier/works-built.mp3', who: 'Tobias Mwangi' },
  { id: 'A3', at: 35.5, clip: 'voice/sta/envoy-contact-words.mp3', who: 'Isabel Achterberg' },
  { id: 'A4', at: 60.5, clip: 'voice/hollow-wake/envoy-war-theirs.mp3', who: 'Hush' },
  { id: 'A5', at: 77.0, clip: 'voice/dusk-concord/radio-landing.mp3', who: 'Keeper of the descent' },
  { id: 'A6', at: 107.4, clip: 'voice/hollow-wake/survey-event.mp3', who: 'Farcast' },
];

/** The feature cards (D-94): a line in the game's type in the lower third, and when. */
export const CARDS: readonly { text: string; sub?: string; from: number; to: number }[] = [
  { text: '356 real star systems', sub: 'within 33 light-years, from Gaia DR3 and SIMBAD', from: 1.5, to: 6.6 },
  { text: 'You are Control', from: 13.5, to: 16 },
  { text: 'Settle real worlds', from: 20.8, to: 23 },
  { text: 'Build the lanes', from: 30.6, to: 35 },
  { text: 'First contact', from: 43.4, to: 47 },
  { text: 'Four powers to lead', from: 47.6, to: 54 },
  { text: 'Treaties and the Assembly', from: 54.6, to: 60 },
  { text: 'Design your fleets', from: 65.4, to: 69 },
  { text: 'Battles you can watch', from: 69.6, to: 76.6 },
  { text: 'Invasion', from: 77.2, to: 80 },
  { text: 'The Absent', from: 86.4, to: 91 },
  { text: 'Five keys. One answer.', from: 91.6, to: 95 },
  { text: 'A living sky', from: 96.0, to: 101 },
  { text: 'Four ways to win', from: 101.8, to: 107 },
];

/** The game's own closing line (D-95), under the title. */
export const CLOSING =
  'Every star is real. Every world nobody has observed, and every lane, power and person, is the game’s fiction.';

/** The shots and their times (§6); how each is filmed is in shots.ts. */
export const CUT: readonly { id: string; from: number; to: number }[] = [
  { id: 'S01', from: 0, to: 7 },
  { id: 'S02', from: 7, to: 11 },
  { id: 'S03', from: 11, to: 16 },
  { id: 'S04', from: 16, to: 23 },
  { id: 'S05', from: 23, to: 30 },
  { id: 'S06', from: 30, to: 35 },
  { id: 'S07', from: 35, to: 43 },
  { id: 'S08', from: 43, to: 47 },
  { id: 'S09a', from: 47, to: 50.5 },
  { id: 'S09b', from: 50.5, to: 54 },
  { id: 'S10a', from: 54, to: 57 },
  { id: 'S10b', from: 57, to: 60 },
  { id: 'S11', from: 60, to: 65 },
  { id: 'S12', from: 65, to: 69 },
  { id: 'S13', from: 69, to: 77 },
  { id: 'S14', from: 77, to: 85 },
  { id: 'S15', from: 85, to: 91 },
  { id: 'S16', from: 91, to: 95 },
  { id: 'S17a', from: 95, to: 97 },
  { id: 'S17b', from: 97, to: 99 },
  { id: 'S17c', from: 99, to: 101 },
  { id: 'S18', from: 101, to: 107 },
  { id: 'S19', from: 107, to: 110.5 },
  { id: 'S20', from: 110.5, to: 111.5 },
  { id: 'S21', from: 111.5, to: 120 },
];
