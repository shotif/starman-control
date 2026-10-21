# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 128 ms on the machine that wrote this; the largest save at turn 100
was 39.7 KB. No power fell into debt. No colony went hungry.

The tree has 61 technologies, of which a power can learn 58 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 126 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.4 | 9.3 | 13.9 | 109 | 46 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 15.6 | 114 | 92 |
| 50 | Transit Authority | 5.6 | 4.5 | 27.3 | 17.1 | 38.9 | 25.5 | 194 | 68 |
| 50 | Frontier Co-op | 6.5 | 3.8 | 39.3 | 11.3 | 16.0 | 20.5 | 182 | 54 |
| 50 | Hollow Wake | 7.5 | 5.1 | 37.9 | 12.1 | 13.5 | 29.3 | 199 | 173 |
| 100 | Transit Authority | 11.1 | 7.5 | 45.4 | 37.4 | 131.9 | 32.6 | 375 | 44 |
| 100 | Frontier Co-op | 12.9 | 8.1 | 78.8 | 21.5 | 41.3 | 31.4 | 342 | 41 |
| 100 | Hollow Wake | 15.4 | 12.0 | 88.4 | 22.0 | 38.6 | 38.3 | 387 | 226 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 13 | 10 | 45.3 | 38 | 127 | 34 | 398 | 44 |
| 42 | Frontier Co-op | 12 | 9 | 62.9 | 19 | 28 | 32 | 304 | 38 |
| 42 | Hollow Wake | 11 | 9 | 62.9 | 20 | 28 | 34 | 305 | 236 |
| 7 | Transit Authority | 14 | 7 | 48.6 | 38 | 156 | 35 | 408 | 28 |
| 7 | Frontier Co-op | 12 | 5 | 76.1 | 22 | 41 | 29 | 333 | 34 |
| 7 | Hollow Wake | 13 | 11 | 79.0 | 21 | 32 | 39 | 350 | 242 |
| 2176 | Transit Authority | 10 | 9 | 48.5 | 39 | 178 | 32 | 373 | 34 |
| 2176 | Frontier Co-op | 13 | 11 | 80.8 | 21 | 44 | 34 | 342 | 33 |
| 2176 | Hollow Wake | 14 | 9 | 95.5 | 23 | 42 | 39 | 386 | 250 |
| 1 | Transit Authority | 13 | 7 | 56.5 | 39 | 175 | 33 | 411 | 63 |
| 1 | Frontier Co-op | 12 | 7 | 78.6 | 19 | 38 | 29 | 320 | 41 |
| 1 | Hollow Wake | 16 | 12 | 83.0 | 21 | 37 | 37 | 384 | 184 |
| 2 | Transit Authority | 9 | 5 | 41.4 | 38 | 111 | 30 | 351 | 67 |
| 2 | Frontier Co-op | 15 | 6 | 85.5 | 22 | 42 | 30 | 372 | 47 |
| 2 | Hollow Wake | 23 | 19 | 99.6 | 23 | 36 | 39 | 480 | 247 |
| 3 | Transit Authority | 9 | 7 | 34.9 | 36 | 97 | 31 | 340 | 27 |
| 3 | Frontier Co-op | 13 | 9 | 97.0 | 24 | 52 | 32 | 374 | 56 |
| 3 | Hollow Wake | 15 | 13 | 96.0 | 21 | 46 | 38 | 390 | 262 |
| 4 | Transit Authority | 11 | 7 | 48.1 | 35 | 108 | 33 | 363 | 47 |
| 4 | Frontier Co-op | 13 | 10 | 71.2 | 23 | 39 | 35 | 343 | 48 |
| 4 | Hollow Wake | 19 | 17 | 111.2 | 24 | 49 | 42 | 460 | 263 |
| 5 | Transit Authority | 10 | 8 | 39.5 | 36 | 103 | 33 | 355 | 44 |
| 5 | Frontier Co-op | 13 | 8 | 78.7 | 22 | 46 | 30 | 345 | 29 |
| 5 | Hollow Wake | 12 | 6 | 80.2 | 23 | 39 | 38 | 342 | 122 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 7 (burn and replant) | 3 (live with it) |
| A comet | 19 (capture its ice) | 0 (study it) |
| A derelict | 5 (salvage it) | 0 (study it) |
| An epidemic | 14 (medical aid) | 6 (quarantine) |
| Flare | 15 (shelter) | 0 (ride it out) |
| Founders’ Day | 42 (a festival) | 6 (a quiet day) |
| Lane drift | 26 (retune it) | 0 (let it drift) |
| Settlers’ petition | 8 (grant it) | 8 (refuse) |
| A smugglers’ offer | 28 (buy) | 3 (report them) |
| A strike | 11 (meet their demands) | 4 (wait it out) |
