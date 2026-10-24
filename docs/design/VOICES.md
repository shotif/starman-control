# Voices (increment 70)

**Status:** written 24 October 2026, before building. The owner asked for it while shaping the
trailer: "I want you to generate audio for all the advisor lines that will be added to the game as
a feature, and use these same narration files for the trailer so you don't generate twice" (D-99).
Its questions were answered the same day ([DECISIONS.md Round 11](../DECISIONS.md#round-11-voices-and-the-trailers-ending-decided-24-october-2026),
D-100 to D-103). This takes voice acting out of SCOPE.md's *Out of scope for 1.0* (§5).

**Goals.** The people who serve the player speak: each advisor of the power they lead, in the
report, the lessons and the guided opening, and their commanders' radio during an invasion. Each
voice fits its face, its power and its manner (formal, warm, blunt; the Concord's not human). The
voices never get in the way: one at a time, after the first press, easy to turn off, never needed
to follow the game (the words are always on screen), and never downloaded before they are wanted.
The trailer uses the same files (TRAILER.md §5).

**Out of scope:** names, places and numbers in speech (D-100: the card keeps them); voices made while
playing (D-17: every clip is made at build time, so no key reaches the game, D-09); the advisors
of powers nobody can lead yet (the Drift Moot, the Continuance, the Last Hearth) until they can
be led; languages other than English; the trailer's narrator, who is not in the game.

## 1. What is voiced (D-101)

For each power the player can lead (the Authority, the Co-op, the Wake, the Concord):

| | Lines | Clips per power |
| --- | --- | --- |
| The report's advisor lines (`src/sim/advice.ts`) | 48 kinds, each spoken by the department that says it; the event line by any of six | 53 |
| The line when no other power is out there (`ALONE_LINES`) | 1 | 1 |
| The lessons (`src/content/lessons.ts`) | 16 | 16 |
| The guided opening (`src/content/guide.ts`) | 11 steps | 11 |
| The commanders' radio during invasions (`src/content/radio.ts`) | 4 for the landing, 4 for the garrison | 8 |
| | | **89**, **356 for the four powers** |

Each power speaks in its own manner (`ADVISORS[power].voice`): the Authority and the Concord
formal, the Co-op warm, the Wake blunt. The Concord's words are the formal ones, in voices that are
not human.

## 2. Spoken forms (D-100: short forms, no names)

Most lines carry blanks that the game fills while playing: 24 of the 48 kinds name a place, 23 a
power, others a technology, a ship, a number. A clip made in advance cannot say them, so **every
line gets a spoken form**, written once beside its text, that:

- carries **no blank**: no place, power, technology, ship or number;
- is **true for every case the line covers** (a colony or an outpost, one ship or many);
- **means what the written line means**, in the same manner, as short as it can be;
- leaves the details to the card, which shows the whole written line while it is spoken.

The lessons and the guided opening have no blanks: they are spoken as written. The radio's lines
lose their places and numbers the same way.

| Line | Written (on the card) | Spoken |
| --- | --- | --- |
| `founded`, formal | Control, a new colony stands on Proxima Centauri b. | Control, our new holding stands, as you ordered. |
| `built`, warm | Control, Tau Ceti e has finished an arcology. The builders are proud of it. | Control, it's finished, and the builders are proud of it. |
| `contact-words`, formal | Control, we have heard the Dusk Concord at Procyon, but cannot understand them yet. I have begun to learn their tongue. | Control, we have heard someone new out there, but cannot understand them yet. I have begun to learn their tongue. |
| `war-theirs`, blunt | The Transit Authority wants a fight. They've declared war. | They want a fight. They've declared war. |
| `event`, blunt | A new star. Your call, Control. | Your call, Control. |
| `no-research`, formal | Control, our laboratories have nothing to work on. Please choose a technology. | (the same: it has no blank) |
| Concord radio, landing | Control. We are come down at Ross 128 b, 5 of us, out of the long light. We go slowly. | Control. We are come down, out of the long light. We go slowly. |

The spoken forms live in `src/content/voices.ts`, keyed like the written lines, with a unit test
that every line, lesson, step and radio stage has one and that none holds a blank.

## 3. The cast (D-103: Claude picks, the owner overrules)

Forty parts: 32 advisors (8 departments × 4 powers) and 8 commanders (the landing and the garrison
for each power). For each, `voices/briefs.ts` holds a written description taken from their face
(`public/art/portrait/`), their power and their manner: age, sex as their portrait shows it,
accent, pace, warmth. The Authority's are measured and civil; the Co-op's warm and plain-spoken;
the Wake's rough and short; the Concord's very slow, deep and patient, not human.

- **Made with ElevenLabs' voice design** from those descriptions (D-91's key): designed voices
  only, never a cloned voice or a library voice made from a named person, and never "sounding
  like" anyone. The Concord's are designed voices with a light treatment in ffmpeg (lowered and
  slowed, a faint second voice beneath), the same for all its parts and recorded with them.
- **Three candidates for each part**, each reading two of its lines. Claude picks by what can be
  measured and heard in a transcription (clear, unhurried, the manner right, no artefacts) and
  sends the owner **one file per power**, every part lettered A to C, as the music was, to overrule
  with one command.

## 4. The pipeline

Like the pictures and the music (ART_PIPELINE.md, MUSIC.md §4):

- `voices/briefs.ts`: each part's description, and once chosen its voice's id and settings.
- `npm run voice:design -- --part <id>[,…]`: three designed candidates for each part, each reading
  two of its lines, to `voices/out/` (ignored by git), with their records; `--sheet` joins a
  power's candidates into one lettered file.
- `npm run voice:generate -- --power <id>`: every clip of that power in its chosen voices, each
  transcribed back and compared with its spoken form; a clip that does not match is made again.
- `npm run voice:approve -- --power <id>`: levels and encodes the clips to
  `public/voice/<power>/<id>.mp3` and records each in `voices/manifest.json` (the text, the voice,
  the model, the settings, the dates, `aiGenerated: true`).
- `npm run voice:check` (in `npm run check`): every clip the game can ask for has its file and its
  record, and every file its record.
- **The key:** `ELEVENLABS_API_KEY` and `ELEVENLABS_API_BASE` from the environment or the git-ignored
  `.env` in the repository root, as the Gemini key is (`scripts/art/env.ts`), sent only to that host
  and never printed. The trailer reads the same file.

## 5. Playing them (D-102: the first line, then on a press)

- **When the report opens**, its first advisor line (the most pressing) is spoken; any other line
  is spoken when its card is pressed. **A lesson or a guide step** is spoken as it appears. **The
  radio** is spoken as an invasion's lines come into the report, the landing before the garrison.
- **Never two at once:** a new line stops the one speaking. Closing the report stops it.
- **The music steps back** by about 6 dB while a voice speaks and returns after.
- **After the first press** only, as the music (browsers allow no sound before it); the page hidden
  stops the voice.
- **A setting:** *Voices*, on or off, beside *Music*, on by default. Off stops at once and nothing
  more is downloaded. In test runs voices speak only when the address asks (`?test&voices`).
- **The words stay on screen**: a voice never says what the card does not show, so the game is the
  same muted, and the advisor setting that quietens them (*Advisors: off*) quietens their voices too.

## 6. Download and offline

- Each clip is mono MP3 at about 48 kbps, levelled for speech: about 20 KB for a clip of three and a
  half seconds, about **2 MB for a power's 89** and 8 MB for all four in the repository.
- **No clip is in the first load** or the offline list given at the first visit. A clip is fetched
  when it is first spoken and the service worker keeps it, so a phone never pays for a voice it has
  not heard; **only the clips of the power being led are ever fetched**.
- `npm run budgets` checks it: each clip at most 60 KB, a power's set at most 3 MB, none in the first
  load or the offline list.

## 7. Credits and disclosure

The codex's *Sources and licences* says the voices are made with ElevenLabs' voice design and
speech from the game's own lines, beside the pictures' and the music's (D-29). Every clip keeps
`aiGenerated: true` in its record, as a store's declaration needs (Steam's content survey: pre-made
generated content). The account's plan (Enterprise, checked 24 October 2026) covers commercial use.

## 8. Cost

ElevenLabs credits from the owner's plan, outside D-27: the casting (40 parts, three candidates,
two lines each) about 25,000 characters; every clip once, about 25,000; transcription checks and
retakes perhaps as much again: **about 75,000 characters** of the plan's 109.65 million a month.

## 9. Tests

- **Unit:** every kind, lesson, step and radio stage has a spoken form in each manner it is spoken
  in, with no blank; which clip a line asks for (power, department, kind); one voice at a time; the
  setting; the records (`voice:check`).
- **Browser:** no clip is requested before the first press; the report's first line is spoken when
  the report opens; pressing another card speaks it; turning *Voices* off stops it and requests
  nothing more; on the phone, tablet and desktop.
- **Budgets:** as §6.

## 10. Order of work

1. **Increment 70a, the cast:** the briefs, the spoken forms, the scripts, three candidates for all
   40 parts, the lettered files sent to the owner with Claude's picks.
2. **Increment 70b, in the game:** every clip in the chosen voices, checked by transcription; the
   player, the setting, the credits, the budgets and the tests; shipped as an increment.
3. **The trailer** then takes its advisors' lines from `public/voice/` and makes only the narrator's.

## 11. Reversing it

Turning *Voices* off silences them for a player. To take the feature out: remove the player
(`src/app/voice.ts`) and its calls, the setting, `public/voice/` and `voices/manifest.json`; the
written lines are untouched throughout.
