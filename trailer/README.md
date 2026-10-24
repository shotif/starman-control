# The trailer

The pipeline for the game's trailer (design and decisions: [docs/design/TRAILER.md](../docs/design/TRAILER.md),
[DECISIONS.md Rounds 10 and 11](../docs/DECISIONS.md)). Every frame is the build, filmed one whole
frame at a time on a virtual clock; the advisors' voices are the game's own clips (`public/voice/`);
only the narrator and the music are made for the trailer. Everything made lands in `trailer/out/`,
which git ignores; what was generated is recorded in `trailer/manifest.json`.

## Rebuild

```bash
npm ci && npm ci --prefix tools          # the game's tools, and ffmpeg for the pipeline
npm run build                            # the game, as the trailer films it
npx vite preview --port 4173 &           # served where the capture looks for it
npm run trailer:stage                    # the staged games (about 30 s)
npm run trailer:film                     # every shot at 1080p60, then the cards (about 10 minutes on an Apple GPU)
npm run trailer:narrator -- --audition   # the narrator's candidates (ElevenLabs; the key from .env)
npm run trailer:narrator -- --takes      # every line in the chosen voice, three takes each
npm run trailer:music                    # four candidates for the cue (Lyria 3.5, about $0.32)
npm run trailer:build                    # cut, cards, mix, master: trailer/out/starman-control-trailer.mp4
```

With the shots, cards, takes and music in `trailer/out/`, **`npm run trailer:build` is the one command**
that makes the cut again (a few minutes). The narrator and the music cost credits or money, so they are
made only when asked for, never by the build.

## Change it

| To change | Edit | Then |
| --- | --- | --- |
| A line, its time, a card or a shot's length | `script.ts` (and TRAILER.md §5 and §6) | `trailer:narrator -- --takes` for a new narrator line; `trailer:build` |
| How a shot is filmed | `shots.ts` | `node trailer/shots.ts S07` (one shot), `trailer:build` |
| An advisor's line | the game's spoken form in `src/content/voices.ts` | `npm run voice:make -- --power <id>`, `trailer:build` |
| The narrator's voice | `npm run trailer:narrator -- --takes --voice B` (a letter from the audition) | `trailer:build` |
| The music | a candidate's record in `manifest.json` (`picked`) | `trailer:build` |
| The ending | `shots.ts`, `ending()` and its overlay | `node trailer/shots.ts S19`, `trailer:build` |

## Files

| File | What it does |
| --- | --- |
| `games.ts`, `stage.ts` | the headless games and the states kept at each moment the shots film |
| `harness.ts` | the browser on the GPU, the virtual clock, filming frames into ffmpeg |
| `shots.ts` | how each shot is set up and moved |
| `cards.ts` | the feature cards and the advisors' cards, drawn in the game's page |
| `narrator.ts` | the narrator's audition and takes |
| `music.ts` | the cue's candidates, measured against the cut's rise and fall |
| `script.ts` | the script and the cut as data |
| `build.ts` | the assembly: picture, overlays, voices, music, master, captions |
| `records.ts`, `manifest.json` | the records of everything generated |
| `test-capture.ts` | the 10-second test that showed real-time capture judders here |
