# Music (increment 19)

**Status:** written 21 October 2026 before building, and built the same day (*As built*, §8). The owner chose generated music on
21 October 2026 ([D-31](../DECISIONS.md#d-31--music--decided), option B): instrumental pieces made
at build time with Google's Lyria through the owner's Gemini key, chosen from candidates like the
pictures. The interface's own sounds (CONSOLE.md §5) stay as they are.

**Goals.** The game has music from the title onwards: a theme of its own on the title, calm music
for the long hours on the map, something wider inside a system, and in a colony music with the
character of the power that built it. It never gets in the way: it waits for the first press, it
fades between places, it leaves silences, it never loads before it is wanted, it is easy to turn
off, and it is kept for offline play once heard.

**Out of scope:** music that changes with what happens (tension when rivals come near, battles,
victory: with M2's rivals and M4's wars, as new pieces); a volume slider (on or off for now);
voices and sung words; any music from other games or in the style of a named composer or artist.

## 1. The pieces

Seven instrumental pieces of about two and a half minutes, each written as a brief like a picture's
(`music/briefs.ts`): instruments, tempo, key, mood and shape, no vocals.

| Piece | Plays | Character |
| --- | --- | --- |
| **Title** | on the title, the new-game screen, the codex and the saves | the game's theme: a slow, wide opening that grows to a hopeful statement, strings and soft synthesiser pads under a clear melody, then settles |
| **Map I** and **Map II** | on the map, in turn, with silences between | calm and spacious, for thinking: slow pads, a soft piano or harp figure, distant bells, no drums |
| **System** | in the 3D system view | wonder and scale: deep drones, glassy textures, a slow rising line |
| **Authority colony** | in the colony view, for any colony of the Sol Transit Authority | orderly and civic: a measured string ensemble and brass, steady and dignified |
| **Cooperative colony** | for the Frontier Cooperative's | warm and communal: acoustic guitar, hand percussion, a wooden flute, open fifths |
| **Wake colony** | for the Hollow Wake's | low and tough: a slow, heavy pulse, metallic percussion, a lonely electric guitar, dust |
| **Concord colony** | for the Dusk Concord's (M6_ONE.md §24) | patient and very old: a low bowed drone, slow frame drums, a breathy wooden flute |
| **War** | on the map while we are at war, in place of the map's two (M6_ONE.md §25) | tense and grave: a low pulse, taut low strings, muted horns, a build that never breaks |
| **Victory** | on the end screen when we have won | warm and wide: the horn and the strings grown to a homecoming, then piano and pads |
| **Defeat** | on the end screen when we have lost, left, or no one won | quiet and dignified: a solo cello's lament over a drone, a sparse piano |

A colony's piece follows its owner's architecture (D-28), never the player's power (D-08), so an
alien power later brings its own.

## 2. How it plays

- **After the first press,** as the interface's sounds do (browsers allow no sound before it).
- **Moods follow the screen:** title, map, system, colony. A change fades the old piece out and the
  new one in over three seconds; going back to a place starts its next piece (the map's take turns).
- **Silences:** after a piece ends, about 20 seconds of quiet (40 on the map, where Map I and Map II
  then take turns), so the music never wears thin over a long session.
- **Level:** quieter than the interface's tones would suggest, under everything; the page hidden
  (another tab, the phone locked) pauses it, and it resumes when the game comes back.
- **A setting:** *Music* on or off, beside *Sound*, on by default. Off stops it at once and nothing
  more is downloaded.
- **Reduced motion** changes nothing here; the music has no motion.

## 3. Download and offline

- Each piece is published as MP3 (every browser plays it) at about 112 kbps: about 2 MB for two
  and a half minutes, **at most 3 MB a piece**, about 15 MB for all seven.
- **No piece is part of the first load** or of the offline list given to the service worker at the
  first visit: a piece is downloaded whole when it is first wanted (after the first press), then
  the service worker keeps it, so a phone never pays for music it has not heard. Both are checked by
  `npm run budgets`.
- A piece that cannot be downloaded (offline before it was ever heard) is simply silent.

## 4. The pipeline

Like the pictures (ART_PIPELINE.md), with its own small set of scripts:

- `music/briefs.ts`: each piece's brief (id, subject, purpose); a shared style for the series
  (instrumental, no vocals, cinematic and calm, mixed for a game, fading in and out cleanly).
- `npm run music:generate -- --piece <id>[,<id>…] --count 2`: candidates from `lyria-3.5` through
  the Interactions API to `music/out/` (ignored by git), each with its record (prompt, model, date).
- `npm run music:approve -- music/out/<id>/<file>.mp3`: encodes the chosen candidate with ffmpeg to
  `public/music/<id>.mp3` and records it in `music/manifest.json` (provider, model, prompt, dates,
  `aiGenerated: true`, Google's SynthID watermark noted).
- `npm run music:check` (in `npm run check`): every published piece has its record and every record
  its file.
- **The key never reaches the game** (D-09): generation runs only in scripts; only the approved
  files are committed.
- **Choosing:** the owner is sent the candidates as audio files, lettered A, B, C for each piece,
  and can overrule any pick.

## 5. Credits and terms

The codex's *Sources and licences* says the music is generated with Google's Lyria from the game's
own briefs, beside the pictures' line (D-29), and every record keeps `aiGenerated: true`, as a
store's declaration needs. Every Lyria piece carries Google's inaudible SynthID watermark. Google
claims no ownership of generated output (Gemini API terms); the prompts never name an artist,
composer or work.

## 6. Cost

Lyria 3.5 costs about **$0.08 a piece** (Google's price page, 20 October 2026): two candidates of
each of the seven pieces and a third for the title, 15 in all, about **$1.20**, from the D-27
allowance and recorded in DECISIONS.md.

## 7. Tests

- **Unit:** which mood each screen asks for; the silences and the turns between Map I and Map II;
  the colony's piece by its owner's architecture; the music records (`music:check`).
- **Browser:** no piece is requested before the first press; after it, the title's piece plays
  (a test hook, `window.__music`, says which piece and whether it plays); the map changes the mood;
  turning music off stops it and requests nothing more; on the phone, tablet and desktop.
- **Budgets:** each piece at most 3 MB; no piece in the first load or the offline list.

## 8. As built (21 October 2026)

- **The pieces:** 15 candidates from `lyria-3.5`, about $1.20, and four short trials while finding
  how Lyria answers (about $0.20): **about $1.40**, so the project's total is about **$15.85** of the
  owner's $25. Lyria's filter refused the title's prompt once and took the same prompt the next time,
  so the script tries a refused request twice more. Each candidate is two and a half minutes of
  44.1 kHz stereo, mastered loud (about −12 LUFS); approval levels it to −18 LUFS and encodes MP3 at
  112 kbps: about 2 MB a piece, 14 MB for all seven.
- **Chosen** (by what can be measured, a soft start and a clean fade, since the choice by ear is the
  owner's): title **A**, Map I **B**, Map II **B**, system **B**, the Authority's, the Cooperative's
  and the Wake's colonies **A**. Every candidate was sent to the owner, lettered, to listen to and
  overrule.
- **The player** (`src/app/music.ts`): two decks made at the first press, each unlocked by playing a
  moment of silence (as iOS needs), run through Web Audio gains for the three-second fades; a piece
  is fetched whole when it is first wanted, so the service worker keeps it for offline play. The
  router sets the title's mood, the map screen the map's, a system's or a colony's
  (`moodFor`, by the colony owner's architecture). The page hidden suspends it.
- **The setting:** *Music*, on or off, under *Sound*. In test runs it plays only when the address
  asks for it (`?test&music`) or it is turned on during the visit, so the other journeys stay quick.
- **Credits:** the codex's *Sources and licences* says the music is made with Lyria, with a link to
  `music/manifest.json`.
- **Budgets:** the largest piece is 2.0 MB of its 3 MB, and no piece is in the first load or the
  offline list; the title grew by 1.3 KB (the player), to 20.2 KB of its 40 KB.
- **Tests:** `music.test.ts` (moods, turns, briefs, records, the request and its answer, the audit),
  `settings.test.ts` (the music setting), `music.spec.ts` (nothing before the first press; the
  title's piece, then the map's, then a colony's; off downloads nothing; on and off again), and
  `data.spec.ts` (the credits).
