# The art pipeline

How Starman Control makes its portraits and illustrations with the **OpenAI** and **Google
Gemini** image services (decision D-09), and how those pictures get into the game. Set up on
19 October 2026.

## Principles

1. **Build time only.** Pictures are made by scripts and committed. The game is a public static
   site: it never calls an image service and never holds a key.
2. **Keys never enter the repository.** They live in environment variables or a git-ignored
   `.env` file.
3. **Nothing goes in unreviewed.** Scripts make *candidates*; a person picks one and approves it.
4. **Every picture is traceable.** `art/manifest.json` records, for each picture in the game, the
   brief, the service, the model, the exact prompt and the dates. `npm run check` (and so CI) fails
   if a published picture has no record.
5. **One hand.** Each series (portraits, illustrations) has one written style in `art/styles.ts`,
   added to every prompt, so pictures look like they belong together.
6. **Phones first for size.** Approved pictures are published as WebP at two widths, the smaller
   for phones.
7. **Disclosed.** Every picture is marked as AI-generated in its record; stores such as Steam ask
   for this (as "pre-generated" AI content) and we will declare it.

## What is procedural and what is generated

| Made by the game itself (procedural, as in Reborn) | Generated with OpenAI or Gemini |
| --- | --- |
| The star map, planets, ships, battles, the interface, music and sound | Species, leader and advisor portraits; event and relic illustrations; concept art for design |

## Setting up the keys (the owner)

Use the variable names **`OPENAI_API_KEY`** and **`GEMINI_API_KEY`**. Never paste a key into a
chat, an issue or a commit.

- **For Claude Code cloud sessions** (how this project is usually worked on): open the cloud
  environment's settings (the environment menu in the session's title bar, then *Edit*) and add
  both as environment variables (or as network secrets, where that section is offered, under the
  same names). A **new session** picks them up.
- **On your own computer:** copy `.env.example` to `.env` in the repository root and fill it in.
  Git ignores `.env`.

Things to know about the accounts:

- **OpenAI:** the image models may need *API Organization Verification* on the OpenAI platform
  before they work. There is no free tier for the current image models.
- **Gemini:** image models are only available on the paid tier. Paid use is not used to train
  Google's models; in the EEA, Switzerland and the UK only paid services may be used anyway. The
  scripts send `store: false` so Google does not keep the requests for later retrieval. Every
  Gemini picture carries Google's invisible SynthID watermark.

Then check the keys (this makes no pictures and costs nothing):

```bash
npm run art:ping
```

It says whether each key works, lists the image models the key can use, and warns if a default
model is not among them.

## Making pictures

```bash
npm run art:generate -- --all --dry-run                  # show every prompt; calls nothing
npm run art:generate -- --brief style-test-relic         # one candidate from each service
npm run art:generate -- --brief style-test-relic --provider gemini --count 3
npm run art:generate -- --brief style-test-wake-captain --provider openai --model gpt-image-2.5-flare --quality high
```

Candidates are written to `art/out/<brief>/` (ignored by git), each with a `.json` record of how
it was made. Look at them, then approve the one you want:

```bash
npm run art:approve -- art/out/style-test-relic/20261019-153000-gemini-2.png
npm run art:check                                         # also part of npm run check
```

Approval writes `public/art/<series>/<brief>-<width>.webp` at the series' widths and records the
picture in `art/manifest.json`. Approving a brief again replaces its picture.

## Briefs and styles

- `art/styles.ts` holds the **series**: the shape (2:3 for portraits, 3:2 for illustrations), the
  published widths, the written style and what to avoid.
- `art/briefs.ts` holds the **briefs**: an id, a series, the subject, and why the game needs it.
- The prompt sent is the series style, then the subject, then what to avoid. `--dry-run` shows it.

Subjects must keep to the game's rules ([../CLAUDE.md](../CLAUDE.md)): everything depicted is
fiction, real astronomy in a picture must match the real sky, and nothing may borrow from other
games, real people or brands.

## Models and cost

The defaults are each service's flagship as their documentation stood on 19 October 2026. Image
models are renamed and retired quickly — Gemini's `gemini-2.5-flash-image` was shut down on
2 October 2026 and OpenAI retired DALL·E in May 2026 — so `npm run art:ping` checks the defaults
against what each key can actually use, and `--model` picks another.

| Service | Default | Other choices | Approximate cost per picture |
| --- | --- | --- | --- |
| OpenAI | `gpt-image-2.5-sunburst` (most capable) | `gpt-image-2.5-flare` (fast, everyday), `gpt-image-2` | charged by tokens ($30 per million output tokens); `gpt-image-2` at medium quality is about $0.05 for a square picture |
| Gemini | `gemini-nano-banana-2.1` | `gemini-3-pro-image` (premium) | about $0.05 at the 2K size the scripts ask for; $0.13 for the premium model |

A style test of four briefs from both services costs well under a dollar. Neither service promises
the same picture twice from the same prompt, which is why approved pictures are committed rather
than regenerated.

Sources (checked 19 October 2026):
[OpenAI image generation](https://developers.openai.com/api/docs/guides/image-generation),
[OpenAI pricing](https://developers.openai.com/api/docs/pricing),
[OpenAI Services Agreement](https://cdn.openai.com/osa/openai-services-agreement.pdf) (you own the
output),
[Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation),
[Interactions API](https://ai.google.dev/api/interactions-api),
[Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing),
[Gemini API terms](https://ai.google.dev/gemini-api/terms) (Google claims no ownership of
generated content),
[Steam content survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey).

## Style test (next step, once the keys are in)

The art direction in `art/styles.ts` is a draft. The four `style-test-*` briefs — two human leader
portraits (an Authority officer, a Wake captain), a colony on a red dwarf world, and a precursor
relic — will be generated with both services so the owner can choose a **direction** and a
**service** (or one service per series) before any picture goes into the game. Alien portraits wait
for the species to be designed (D-12).

## Files

| Path | What it is |
| --- | --- |
| `art/styles.ts` | the series and their written styles |
| `art/briefs.ts` | what to paint |
| `art/manifest.json` | the record of every approved picture (committed) |
| `art/out/` | candidates awaiting review (ignored by git) |
| `public/art/` | approved pictures, served with the game |
| `scripts/art/providers.ts` | the two services' requests and responses |
| `scripts/art/catalogue.ts` | prompts, the manifest and its checks |
| `scripts/art/{ping,generate,approve,check}.ts` | the commands above |
| `.env.example` | the key names, for a local `.env` |
