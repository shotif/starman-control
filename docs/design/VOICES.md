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

## 3. The cast (D-103: Claude picks, the owner overrules; stock voices, by the owner's direction)

Forty parts: 32 advisors (8 departments × 4 powers) and 8 commanders (the landing and the garrison
for each power). For each, `voices/briefs.ts` holds a written description taken from their face
(`public/art/portrait/`), their power and their manner: age, sex as their portrait shows it, pace,
warmth. The Authority's are measured and civil; the Co-op's warm and plain-spoken; the Wake's rough
and short; the Concord's very slow, deep and patient, not human.

- **ElevenLabs' stock voices only** (the owner, 24 October 2026: "use stock voices which best match
  the character's descriptions. Maybe just morph them or make something that will not consume voice
  slots"): no voice is designed, cloned or added to the account, and none is made from a named
  person. The account's 21 stock voices are enough because **a player only ever hears the power
  they lead**: within a power its ten parts have ten different stock voices; across powers a stock
  voice may serve again, shaped differently.
- **Shaped into the character** after generation, in ffmpeg, and recorded with each clip: *deeper*
  or *lighter* (the pitch and the timbre moved a semitone together, the pace kept), the **radio**
  for the commanders (a narrow band, compressed, as a voice over a link), and the **Concord's**
  for all its people (lowered and slowed, a faint second voice a step lower beneath, a short echo)
  so they do not sound human. Every shaping was checked to keep each word clear in a transcription.
- **Directed** with the model's delivery tags, which are not spoken (`eleven_v4`: "[measured,
  formal]" for the Authority, "[warm, friendly]" for the Co-op, "[gruff, blunt]" for the Wake,
  "[slow, calm, patient]" for the Concord; the commanders as their power's, on the radio).
- **Three candidates for each part** (three stock voices, each shaped), each reading two of its
  lines. Claude picks by what can be measured (every word right in a transcription, the pace for the
  manner, no clipping, ten different voices in each power) and sends the owner **one file per
  power**, every part announced and its candidates lettered A to C, to overrule with one command.
- **The trailer's narrator** is a stock voice the game's parts do not use (George or Daniel are kept
  for it).

## 4. The pipeline

Like the pictures and the music (ART_PIPELINE.md, MUSIC.md §4):

- `voices/briefs.ts`: each part's description, its three candidates (a stock voice and a shaping
  each), and once chosen its pick; the shapings and the delivery tags, written once.
- `npm run voice:cast -- --power <id>`: the three candidates of each part of that power, each
  reading two of its lines, to `voices/out/` (ignored by git), with their records and measures; a
  lettered file for the power, every part announced before its candidates.
- `npm run voice:pick -- <part> <letter>`: the owner's choice of a part's candidate, kept in
  `voices/cast.json`, where a pick by measure never replaces it.
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

- **When a turn's report opens**, its first advisor line (the most pressing) is spoken, once however
  often the report is opened; any other line is spoken when its *Hear* is pressed (beside the
  speaker's name, shown only where a voice can speak). **A lesson or a guide step** is spoken as it appears. **The
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

- Each clip is mono MP3 at 40 kbps and 24 kHz, levelled for speech: about 18 KB for a clip of three
  and a half seconds, about **2 MB for a power's 89** (the slow Concord's 2.5 MB) and 8 MB for all four
  in the repository.
- **No clip is in the first load** or the offline list given at the first visit. A clip is fetched
  when it is first spoken and the service worker keeps it, so a phone never pays for a voice it has
  not heard; **only the clips of the power being led are ever fetched**.
- `npm run budgets` checks it: each clip at most 60 KB, a power's set at most 3 MB, none in the first
  load or the offline list.

## 7. Credits and disclosure

The codex's *Sources and licences* says the voices are made with ElevenLabs' stock voices and
speech from the game's own lines, shaped for each character, beside the pictures' and the music's (D-29). Every clip keeps
`aiGenerated: true` in its record, as a store's declaration needs (Steam's content survey: pre-made
generated content). The account's plan (Enterprise, checked 24 October 2026) covers commercial use.

## 8. Cost

ElevenLabs credits from the owner's plan, outside D-27: the casting (40 parts, three candidates,
two lines each) about 25,000 characters; every clip once, about 25,000; transcription checks and
retakes perhaps as much again: **about 75,000 characters** of the plan's 109.65 million a month. No
voice slot is used (§3).

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

## 12. As built: increment 70a, the cast (24 October 2026)

- **The spoken forms** are in `src/content/voices.ts` (`SPOKEN`, `SPOKEN_RADIO`), with which
  department says each kind (`SPEAKERS`) and every clip a power plays (`clipsOf`: 89 each, about
  6,000 characters for the Authority, the Co-op and the Concord, 3,900 for the Wake's short
  manner). `tests/unit/voices.test.ts` checks that every line, lesson, step and radio stage has one,
  that none holds a blank, that Control is addressed wherever the written line does, that the
  speakers match `src/sim/advice.ts`, and the count.
- **The model:** `eleven_v4`, chosen by measure on 24 October 2026 from `eleven_v4`, `eleven_v3` and
  `eleven_multilingual_v2`: all three were heard word for word; v4 and v3 take delivery tags they do
  not speak; v4 is the newest. Every shaping (`deeper`, `lighter`, `radio`, `concord`) was
  transcribed back without losing a word.
- **The casting:** `npm run voice:cast` made the three candidates of all 40 parts (120 candidates,
  240 takes, 19,681 characters), each transcribed and measured; the picks are in `voices/cast.json`,
  ten different stock voices in each power. Where every candidate of a part scored lower, the
  transcription misheard a word ("yard's" as "yard", "Wake's" as "wakes"), not the voice.
- **Sent to the owner:** one lettered recording per power with every part announced, and an index of
  each letter's voice, shaping, time and score; `npm run voice:pick -- <part> <letter>` applies an
  overrule.
- **Tools:** ffmpeg and ffprobe come from the small `tools/` package (`npm ci --prefix tools`,
  `ffmpeg-static` and `ffprobe-static`, as Reborn's `promo/` has), found by `scripts/media.ts`, which
  `music:approve` now uses too; the game's own dependencies and CI are unchanged.

## 13. As built: increment 70b, in the game (24 October 2026)

- **Every clip:** `npm run voice:make -- --power all` spoke all 356 in the cast's voices (29,124
  characters for one take of each, about 33,000 with the retakes), each shaped, heard back and made again if a word was lost (up to five
  times), trimmed of silence, levelled to −16 LUFS and published as mono MP3 at 40 kbps, 24 kHz, to
  `public/voice/<power>/<clip>.mp3`, with its record in `voices/manifest.json`: 27½ minutes of speech,
  8.0 MB, the Concord's the largest at 2.53 MB (its speech is slowest). 341 were heard back word for
  word; the other 15 differ only as the transcriber writes them ("cue" for "queue", "arcs" for
  "arks", "10" for "ten"). The Wake's "They want a fight" came out as "wanna fight" three times
  running and was made again until it was heard as written. `--encode` encodes again from the
  takes already made without asking the service (used once, from 48 to 40 kbps, to keep the
  Concord's longest lesson within 60 KB). `npm run voice:check` is in `npm run check`.
- **The player** (`src/app/voice.ts`): one audio element unlocked at the first press; a clip fetched
  whole, so the service worker keeps it; one line at a time; the music steps back by about 6 dB
  (`duckMusic` in `src/app/music.ts`); the page hidden or the setting off stops it. Clips are
  excluded from the offline list by its own rule (only scripts, styles, fonts and pictures).
- **Where it speaks:** the report (`src/ui/map/play.tsx`) speaks its most pressing line and then any
  radio traffic once a turn; each advisor's line has *Hear*; the guided opening's steps and the
  lessons speak as they appear (`src/ui/map/guide.tsx`); `radioTraffic` now gives each line's stage.
- **The setting:** *Voices*, on or off, under *Music* (`voices` in the settings, on by default);
  *Advisors: off* silences them too; test runs stay silent unless the address says `voices`.
- **Credits:** the codex's *Sources and licences* says how the voices are made, with a link to the
  records. **Budgets:** each clip at most 60 KB, a power's set at most 3 MB, none in the first load.
- **Tests:** `tests/unit/voices.test.ts` (the spoken forms, the speakers against the report, the 89
  clips, the records' audit, hearing a take back), `tests/unit/settings.test.ts` (the setting),
  `tests/e2e/voices.spec.ts` (nothing before the first press, the guide's step, the report's first
  line, *Hear*, only the led power's clips; off downloads nothing and shows no *Hear*), and
  `tests/e2e/data.spec.ts` (the credits), on the phone, the tablet and the desktop.
- **Owner's overrules:** a lettered pick from the casting is `npm run voice:pick -- <part> <letter>`,
  then `npm run voice:make -- --power <power>`, which remakes only that part's clips.
