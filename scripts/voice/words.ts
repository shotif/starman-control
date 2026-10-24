// Comparing what a take was meant to say with what speech to text heard (docs/design/VOICES.md §3):
// pure, so it is tested without the service.

/** One spelling for comparing: speech to text writes American (catalog, neighbor); the game, British. */
function spelling(word: string): string {
  return word
    .replace(/^(catalog)ues?$/, (_, w: string) => (word.endsWith('s') ? `${w}s` : w))
    .replace(/^(\w{3,})our(s?)$/, '$1or$2');
}

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** A number below a thousand in words, the British way ("three hundred and fifty six"): speech to text writes digits. */
export function numberWords(n: number): string[] {
  if (n < 20) return [ONES[n] ?? String(n)];
  if (n < 100) return [TENS[Math.floor(n / 10)] ?? '', ...(n % 10 ? [ONES[n % 10] ?? ''] : [])];
  if (n < 1000)
    return [ONES[Math.floor(n / 100)] ?? '', 'hundred', ...(n % 100 ? ['and', ...numberWords(n % 100)] : [])];
  return [String(n)];
}

/** The words of a line, for comparing: lower case, no punctuation, one kind of apostrophe and spelling. */
export function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (/^\d+$/.test(w) ? numberWords(Number(w)) : [w]))
    .map(spelling);
}

/** How much of what was meant was heard, in order: the longest common run of words over the words meant. */
export function wordMatch(meant: string, heard: string): number {
  const a = wordsOf(meant);
  const b = wordsOf(heard);
  if (a.length === 0) return 1;
  const row = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = 0;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = a[i - 1] === b[j - 1] ? diagonal + 1 : Math.max(row[j], row[j - 1]);
      diagonal = above;
    }
  }
  return row[b.length] / a.length;
}
