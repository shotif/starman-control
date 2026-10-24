# The trailer

**Status:** written 24 October 2026. The options were put to the owner and answered the same day
([DECISIONS.md Round 10](../DECISIONS.md#round-10-the-trailer-decided-24-october-2026), D-87 to
D-98). **The script (§5) and the shot list (§6) wait for the owner's approval**, with an animatic
(§9); nothing costly is generated before it.

**Goals.** A cinematic trailer with voice-over, as if for the game's future Steam page: it shows the
game's greatest parts, says each in a few plain words, and makes people want it. Every frame is the
build; every claim is one the game backs; everything invented is labelled.

**Out of scope:** a 9:16 cut and other languages (D-97); generated stills or video (D-92); a price, a
release date, review quotes or awards; another game's names or art; any imitation of a real person's
voice.

## 1. What was decided (Round 10)

| | Decided |
| --- | --- |
| Concept (D-87) | **You are Control**: the reports, the advisors' faces and real lines, the player as the voice everyone answers to; opening on the real sky |
| Length (D-88) | **90 to 120 seconds**; this script runs 119 s |
| Voices (D-89) | **a narrator and the advisors**, the Dusk Concord's in a non-human voice; every advisor line word for word from the game, its card on screen while it is spoken |
| Tone (D-90) | **calm, quietly awed**: low, close, unhurried; rising only at the war |
| Voice tool (D-91) | **ElevenLabs**, with the key from Reborn's `promo/.env` (EU host, an active Enterprise plan) in the git-ignored `trailer/.env` |
| Pictures (D-92) | **capture only**: the build, and the game's own approved paintings moved slowly |
| Music (D-93) | **a new cue from Lyria 3.5**, written to the cut with timestamped sections |
| Words on screen (D-94) | **a feature card per feature** (3 to 6 words) and an **.srt** of every spoken line |
| Fiction labels (D-95) | **a closing line only**, the game's own: "Every star is real. Every world nobody has observed, and every lane, power and person, is the game's fiction." The badges in captured screens stay |
| End card (D-96) | **Wishlist on Steam**, a placeholder until D-18; no price, no date |
| Formats (D-97) | **16:9 only**: 1920×1080, 60 fps, H.264 and AAC 48 kHz, about 20 Mbps, and the .srt |
| Spend (D-98) | **inside D-27** (about $10 of $50 left): Lyria about $0.30 to $0.50; the voices from the ElevenLabs plan's credits |

## 2. What Steam asks (checked 24 October 2026)

From [Steamworks: trailers](https://partner.steamgames.com/doc/store/trailer):

| | Steam's guidance | This trailer |
| --- | --- | --- |
| Size and shape | the highest resolution you have, up to 1920×1080; 16:9 preferred | 1920×1080, 16:9 |
| Format | .mp4, .mov or .wmv; H.264 video and AAC audio preferred; 30/29.97 or 60/59.94 fps; 5,000+ kbps; audio at 44 or 48 kHz, reduced to stereo | .mp4, H.264 High, yuv420p, 60 fps, about 20 Mbps, `+faststart`; AAC stereo 48 kHz |
| Length and number | no minimum or maximum; the first two trailers stand before the screenshots | 119 s, the first trailer |
| What first | "We highly recommend that the first trailer you list on your store page is primarily gameplay"; the game's interface on screen often helps | every frame is the build; the interface is on screen in most shots |
| Attention | viewers may have less than 10 seconds in the Discovery Queue, and may watch without sound | the real sky and its card in the first 2 seconds; a card for every feature |
| Microtrailer | a 6-second loop made by Steam from the first trailer; not editable | the opening is the strongest footage |
| Thumbnails | a custom thumbnail must be a frame of the video, 1920×1080, best without text | a frame of the 3D neighbourhood |

**Generated content.** Steam's [content survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey)
asks developers to describe pre-generated AI content; reports of Valve's January 2026 rewrite say it
covers the store page and marketing material as well
([Notebookcheck](https://www.notebookcheck.net/Steam-updates-AI-disclosure-form-requiring-developers-to-report-visible-and-in-game-AI-but-not-background-tools.1206103.0.html)),
and the Steam Distribution Agreement asks that a game be "consistent with your marketing materials".
So: the trailer's voices (ElevenLabs) and music (Lyria) are declared as generated, beside the game's
paintings (ART_PIPELINE.md, *Principles* 7), and the trailer shows nothing the game does not do.

## 3. What the trailer may claim (checked in the build, 24 October 2026)

Every claim was seen in the build, staged by headless games played to turn 250 with every power as
a rival and loaded with `__setGame` (§10.2).

| Claim | Where it is in the game |
| --- | --- |
| 356 real star systems | the title: "356 real star systems, free to explore"; `src/data/shell.json` and the census (D-02, D-51) |
| The old lanes run dark | the new-game screen: "Beyond them, the old lanes run dark, and the stars are waiting." (D-19) |
| Every captain answers to one voice: you are Control | D-11; every advisor addresses the player as Control |
| Settle real worlds | the Authority settles Proxima Centauri b, a real planet, on turn 4 of seed 42 |
| Relight the old lanes, lay new ones | lanes relit and built as projects (D-19); the map's sparks and fields |
| First contact, learning their tongue | the Envoy's line on contact; Diplomacy: "learning their tongue: 1 of 20" (D-52) |
| Four powers to lead, one not human | the new-game screen's four cards; the Dusk Concord (D-81, fiction) |
| Treaties and the Assembly's vote | Diplomacy's treaties; the Assembly (**G**) and its elections; victory by its vote (D-14) |
| Design the ships, watch every battle | Designs (**B**); *Watch* on every battle in the report (D-63) |
| Invasion | the Concord's radio traffic at Ross 128 b, turn 224 of seed 42 (D-65) |
| Someone was here before us | the Absent's first revelation, in a relic chapter's text (M5) |
| Five keys, one answer | the five keys and the Answer, a road to victory (D-71) |
| The sky is never still | the great flare, the nova and the arks, each an event with its picture (D-75, D-76) |
| Four ways to win | conquest, the Assembly's vote, the score at a turn limit, the keys |

Not shown, as the game does not have them: guardians (deferred after 1.0), spoken voices in play
(SCOPE.md §5), playing the Drift Moot or the Continuance.

## 4. The story

*You are Control.* The neighbourhood is real and waiting; everyone out there answers to one voice,
and the trailer lets the voices of four powers speak to it, as the game's advisors do in every
report. It moves in six parts, each with its place in the music (§8):

1. **The real sky** (0:00 to 0:16): every star real, the lanes dark, one voice.
2. **Building** (0:16 to 0:35): a colony on a real planet, a town that grows, lanes relit.
3. **Others** (0:35 to 1:00): a signal nobody understands; four powers, one not human; treaties and
   the Assembly.
4. **War** (1:00 to 1:25): war declared, ships designed, a battle, an invasion.
5. **The unknown** (1:25 to 1:41): someone was here before us; five keys; the living sky.
6. **Your call** (1:41 to 1:59): four ways to win; "Your call, Control."; the title at 1:51.

## 5. The script

N is the narrator; A an advisor, speaking a line the game shows, word for word, filled from the
staged game named, while the game's own card for it is on screen (D-89). Times are where each line
starts.

| # | At | Who | Line | Words | From |
| --- | --- | --- | --- | --- | --- |
| N1 | 0:01.0 | Narrator | Three hundred and fifty-six star systems. | 6 | |
| N2 | 0:04.2 | Narrator | Every one of them real. | 5 | |
| N3 | 0:07.5 | Narrator | The old lanes run dark. | 5 | |
| N4 | 0:09.6 | Narrator | The stars are waiting. | 4 | |
| N5 | 0:12.0 | Narrator | Every captain answers to one voice. | 6 | |
| A1 | 0:16.5 | Adaeze Morrow, Commissioner for Colonies (the Authority, formal) | Control, a new colony stands on Proxima Centauri b. | 9 | seed 42, the Authority, turn 4 |
| N6 | 0:20.6 | Narrator | Settle real worlds. Build them up. | 6 | |
| A2 | 0:23.8 | Tobias Mwangi, of the Builders' table (the Co-op, warm) | Control, Tau Ceti e has finished an arcology. The builders are proud of it. | 14 | seed 42, the Co-op, turn 166 |
| N7 | 0:30.5 | Narrator | Relight the old lanes. Lay new ones. | 7 | |
| A3 | 0:35.5 | Isabel Achterberg, Envoy of the Authority (formal) | Control, we have heard the Dusk Concord at Procyon, but cannot understand them yet. I have begun to learn their tongue. | 21 | seed 42, the Authority, turn 75 |
| N8 | 0:43.5 | Narrator | You are not alone out here. | 6 | |
| N9 | 0:47.5 | Narrator | Four powers to lead. One of them is not human. | 4 + 6 | |
| N10 | 0:55.0 | Narrator | Make treaties. Win the Assembly's vote. | 6 | |
| A4 | 1:00.5 | Hush, who does the talking (the Wake, blunt) | The Transit Authority wants a fight. They've declared war. | 9 | seed 42, the Wake, turn 86 |
| N11 | 1:05.5 | Narrator | Design the ships. (1:09.5) Watch every battle. | 3 + 3 | |
| A5 | 1:17.0 | Keeper of the descent (the Dusk Concord's radio, non-human) | Control. We are come down at Ross 128 b, 5 of us, out of the long light. We go slowly. | 19 | seed 42, the Concord, turn 224 |
| N12 | 1:26.2 | Narrator | Someone was here before us. | 5 | the Absent's first revelation |
| N13 | 1:31.5 | Narrator | Five keys. One answer. | 4 | |
| N14 | 1:36.0 | Narrator | And the sky is never still. | 6 | |
| N15 | 1:41.5 | Narrator | Conquer them. Outvote them. (1:44.2) Or find the keys first. | 4 + 5 | |
| A6 | 1:47.2 | Farcast, navigator (the Wake, blunt) | A new star. Your call, Control. | 6 | seed 42, the Wake, turn 58 (the nova) |
| N16 | 1:51.8 | Narrator | Starman Control. | 2 | |

**The count.** The narrator says 93 words in 18 lines, none longer than seven; the advisors 78 words
in six lines; 171 words in 119 seconds. Spoken calmly (about 2.2 words a second for the narrator,
2.6 for the advisors) that is about 72 seconds of speech, so about 47 seconds are the pictures and
the music alone. **Three advisor lines run past eight words** (A2 14, A3 21, A5 19): they are the
game's own sentences and sound like the game because of their length; the shorter choice is to
speak only their first sentence while the card shows the whole line (§12).

## 6. The shot list

Times in seconds. *Card* is the feature card (D-94), in the game's Saira type, in the lower third.
An advisor's card is the game's own report card for that line, cropped from the capture and laid
over the shot while it is spoken (§10.3). Every source is a state staged in §10.2 or a screen of
the build.

| Shot | Time | Picture | Voice | Card | Source |
| --- | --- | --- | --- | --- | --- |
| S01 | 0:00–0:07 | The whole neighbourhood in 3D, the Milky Way behind, turning slowly and pulling back; names faint | N1, N2 | 356 real star systems · *within 33 light-years, from Gaia DR3 and SIMBAD* | *Explore the neighbourhood*, 3D, `__map.showAll()`, turned a little each frame; panels hidden |
| S02 | 0:07–0:11 | Sol's corner of the map on turn 1: the Authority's few green lanes, the old ones dashed and dark beyond | N3, N4 | | the Authority, seed 42, turn 1; `__map.focus('sol')` |
| S03 | 0:11–0:16 | The glide into Sol and the system in 3D: the Sun, Earth, Jupiter's moons | N5 | You are Control | the same; `__map.glideInto('sol')`, the system view |
| S04 | 0:16–0:23 | The colony on Proxima Centauri b, a red dwarf's light on the Authority's buildings, people walking | A1, N6 | Settle real worlds | seed 42, the Authority, turn 4 (A1's card) and turn 50 (the diorama, `setClock` for the hour) |
| S05 | 0:23–0:30 | Tau Ceti e, the Co-op's town with its arcology, dawn turning to day | A2 | | seed 42, the Co-op, turn 166 |
| S06 | 0:30–0:35 | The Co-op's lanes around Tau Ceti, sparks running on them, the territory fields | N7 | Build the lanes | seed 42, the Co-op, turn 60, after a lane opens |
| S07 | 0:35–0:43 | Out past the old sphere, a slow push to Procyon, where the Concord's ship stands | A3 | | seed 42, the Authority, turn 75 |
| S08 | 0:43–0:47 | Diplomacy: the Dusk Concord, "learning their tongue: 1 of 20" | N8 | First contact | the same, Diplomacy (**Y**) |
| S09 | 0:47–0:54 | The Concord's capital GJ 433 d under its red sun, then the four powers' cards | N9 | Four powers to lead | seed 42, the Concord, turn 150; the new-game screen |
| S10 | 0:54–1:00 | A power's regard and its reasons, then the Assembly's chamber and its votes | N10 | Treaties and the Assembly | seed 7, the Authority, turn 106: Diplomacy, the Assembly (**G**) |
| S11 | 1:00–1:05 | The Wake's map, red-edged fleets closing on Wolf 1061 | A4 | | seed 42, the Wake, turn 86 |
| S12 | 1:05–1:09 | Designs: a destroyer's hull and its modules | N11a | Design your fleets | seed 7, the Authority, turn 106, Designs (**B**) |
| S13 | 1:09–1:17 | The battle at Sol replayed: shots by kind, shields flaring, a ship breaking up | N11b | Battles you can watch | the same, *Watch the battle at Sol*, with a camera placed for capture |
| S14 | 1:17–1:25 | The invasion's painting, slowly closer, the Concord's radio card over it | A5 | Invasion | seed 42, the Concord, turn 224 |
| S15 | 1:25–1:31 | The hollow moon's painting from the relic chapter, slowly closer | N12 | The Absent | seed 42, the Concord, turn 178, Relics (**J**) |
| S16 | 1:31–1:35 | The relics screen and a key found | N13 | Five keys. One answer. | seed 42, the Concord, turn 196 |
| S17 | 1:35–1:41 | The great flare's aurora, the new star, the arks: two seconds each | N14 | A living sky | seed 7, the Authority, turn 17; seed 42, the Authority, turn 95; seed 42, the Concord, turn 126 |
| S18 | 1:41–1:47 | The neighbourhood in 3D again at turn 250, full of powers, pulling back | N15 | Four ways to win | seed 42, the Co-op, turn 250 |
| S19 | 1:47–1:51 | Farcast's card over the turning map | A6 | | seed 42, the Wake, turn 58 |
| S20 | 1:51–1:56 | The title, the game's own *Starman Control*, and the closing line | N16 | (the closing line, D-95) | the title screen's lettering |
| S21 | 1:56–1:59 | End card: Wishlist on Steam | | | |

## 7. The voices

ElevenLabs, from the account's **stock voices** and voices **designed from a description** only:
no cloned voice and no library voice made from a named person. Each part gets four to six
candidates, lettered, sent to the owner with Claude's pick (§10.4).

| Part | Character | In the animatic (temporary) |
| --- | --- | --- |
| Narrator | calm, low, close, British, quietly awed | George (stock) |
| Adaeze Morrow | formal, measured, the Authority's civil service | Alice (stock) |
| Tobias Mwangi | warm, proud, a builder | Chris (stock) |
| Isabel Achterberg | formal, careful, a diplomat | Lily (stock) |
| Hush | blunt, low, unimpressed | Callum (stock) |
| Keeper of the descent | the Concord: very slow, deep, patient, not human | Brian (stock), lowered and slowed, with a faint second voice under it in ffmpeg |
| Farcast | blunt, a navigator, half a smile | Adam (stock) |

## 8. The music

One cue from Lyria 3.5, about two minutes, instrumental, built on the title theme's instruments
(strings and soft pads under a clear melody, MUSIC.md §1) with the Concord's low drone and wooden
flute for the alien part, written as timestamped sections to the cut:

| From | Section | Music |
| --- | --- | --- |
| 0:00 | The real sky | silence into a high, soft pad; a single piano figure; distant bells |
| 0:16 | Building | a slow pulse under the strings; the melody first stated, gently |
| 0:35 | Others | the colour changes: a low bowed drone and a breathy wooden flute |
| 1:00 | War | a low pulse, taut low strings, muted horns, a build that grows |
| 1:17 | The landing | the build at its height, then cut away |
| 1:25 | The unknown | almost nothing: glassy high textures, a held note |
| 1:41 | Your call | the theme in full on horns and strings |
| 1:51 | The title | one last chord, held, fading by 1:59 |

The animatic uses the game's own title piece (`public/music/title.mp3`) as a stand-in.

## 9. The animatic

Stills from the build for every shot, slow moves, the cards, the advisors' cards, a temporary voice
(the temporary casting in §7, one take each from ElevenLabs) and the title piece, cut to §6's
times, sent to the owner as a file before anything costly. It shows the timing and the order, not
the finish: the stills stand for moving shots, and the cards use a stand-in type.

**As made (24 October 2026):** 30 stills captured on the GPU from the staged games, six advisor cards
cropped from the reports, 25 temporary takes from ElevenLabs (`eleven_multilingual_v2`, 926
characters, the casting in §7; the Keeper of the descent lowered and slowed, with a second voice a
step lower under it), and the game's own title, war, system and victory pieces as the stand-in bed,
ducked under the voices. 119.0 s, 1920×1080 at 30 fps, −17 LUFS. Every take fits its slot: five
starts moved by under a second to keep lines apart (N6, A5, N12, A6, N16; §5 has the new times).
Nobody listened to it while it was made; the takes were measured, not heard. The scripts that made
it were scratch work, not the pipeline of §10.

## 10. Making it (after approval)

### 10.1 Where it lives

A pipeline under `trailer/` like `art/` and `music/`, with its own small package (`ffmpeg-static`,
as Reborn's `promo/` has), run from the root by `npm run trailer:build`. Captures, voice takes,
music candidates and renders go to `trailer/out/`, which git ignores. The finished video is sent to
the owner as a file; where it lives after that (a GitHub release on this repository, or only
locally) is the owner's (§12).

### 10.2 Staging

`trailer/stage.ts` plays the headless games (`resolveTurn`, every power a rival, seeds 7 and 42)
and keeps the state at each moment the shot list names; the capture starts a new game with the same
seed and power and loads the state with `__setGame`. Nothing in the game changes for this.

### 10.3 Capture

Playwright's Chromium on the machine's GPU (Metal on a Mac), the game at 1920×1080 with high
quality. The first job is a **10-second test capture** of S01 and S13; if it stutters, the capture is
**frame-stepped**: `requestAnimationFrame` and `performance.now` run on a clock the capture advances
one frame at a time, as Reborn's `promo/lib/harness.mjs` does, so every frame is whole whatever the
machine's speed, and only if that cannot reach a scene, a test-only hook in that scene's clock. A
capture-only style sheet hides the panels in the cinematic shots (S01, S04, S05, S09, S13, S18) and
the cursor everywhere; the advisors' cards are screenshots of the game's own report cards.

### 10.4 Voices and music

`trailer/voice.ts` asks ElevenLabs for every line in every candidate voice (the key read from
`trailer/.env`, sent only to its host, never printed or logged), measures each take, and lays them
out lettered for the owner. `trailer/music.ts` asks Lyria 3.5 for the cue (the Gemini key from the
environment). Every generated file is recorded in `trailer/manifest.json`: its prompt or text, the
service and model, the voice, the settings, the cost, the date, and whether the owner approved it,
as the art and music manifests do; `aiGenerated: true` throughout.

### 10.5 Assembly

`trailer/build.ts` lays the shots, cards, voices and music with ffmpeg to §6's times: voices
ducking the music, mastered to −14 LUFS with peaks under −1 dBTP, encoded as D-97 says, and the
.srt written from the script's times.

## 11. Cost

| | | |
| --- | --- | --- |
| Capture, cards, assembly | done on this machine | nothing |
| Voices | ElevenLabs: all candidates, about 10,000 to 15,000 characters | the Enterprise plan's credits (about 24,000 of 109.65 million used this cycle); outside D-27 |
| Music | Lyria 3.5: four to six candidates at $0.08 | about **$0.30 to $0.50**, inside D-27 (D-98) |
| The animatic | one temporary take of each line, about 1,000 characters | the plan's credits |

Every Gemini spend is logged in DECISIONS.md with the running total, which stands at about $40.00 of
$50 before the trailer.

## 12. For the owner, with the animatic

1. **The script (§5):** approve, or name lines to change.
2. **The long advisor lines:** keep A2, A3 and A5 whole (recommended), or speak only their first
   sentence while the card shows the whole.
3. **The shot list (§6):** approve, or name shots to change.
4. **Where the finished video lives:** recommended, a GitHub release on this repository, holding the
   master and its .srt, with renders kept out of git; or only on this machine and sent as files.
5. **The Gemini key:** Lyria needs `GEMINI_API_KEY`, which this session's environment does not have
   (24 October 2026); it is needed before the music.
