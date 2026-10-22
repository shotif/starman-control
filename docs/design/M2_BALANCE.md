# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 136 ms on the machine that wrote this; the largest save at turn 100
was 40.6 KB. No power fell into debt. No colony went hungry.

The tree has 61 technologies, of which a power can learn 58 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 126 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.4 | 9.3 | 13.9 | 109 | 46 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 15.6 | 114 | 92 |
| 50 | Transit Authority | 5.9 | 4.5 | 27.5 | 17.4 | 39.3 | 25.0 | 198 | 64 |
| 50 | Frontier Co-op | 6.5 | 3.8 | 39.4 | 11.5 | 16.0 | 20.6 | 183 | 54 |
| 50 | Hollow Wake | 7.4 | 5.1 | 37.7 | 12.0 | 13.5 | 28.9 | 197 | 174 |
| 100 | Transit Authority | 11.0 | 7.3 | 45.0 | 37.1 | 131.0 | 32.5 | 372 | 40 |
| 100 | Frontier Co-op | 13.1 | 8.0 | 79.5 | 21.6 | 41.0 | 32.1 | 345 | 46 |
| 100 | Hollow Wake | 15.1 | 11.8 | 88.2 | 22.0 | 38.4 | 38.0 | 384 | 232 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 14 | 9 | 45.6 | 38 | 120 | 33 | 405 | 7 |
| 42 | Frontier Co-op | 12 | 9 | 62.9 | 19 | 28 | 32 | 304 | 38 |
| 42 | Hollow Wake | 10 | 8 | 59.5 | 20 | 25 | 34 | 292 | 239 |
| 7 | Transit Authority | 14 | 7 | 48.6 | 38 | 156 | 35 | 408 | 28 |
| 7 | Frontier Co-op | 14 | 6 | 80.1 | 23 | 41 | 32 | 362 | 35 |
| 7 | Hollow Wake | 14 | 10 | 81.3 | 21 | 33 | 38 | 359 | 253 |
| 2176 | Transit Authority | 10 | 9 | 48.4 | 39 | 178 | 32 | 373 | 40 |
| 2176 | Frontier Co-op | 13 | 10 | 80.8 | 20 | 38 | 33 | 337 | 40 |
| 2176 | Hollow Wake | 13 | 9 | 97.5 | 24 | 46 | 37 | 380 | 231 |
| 1 | Transit Authority | 13 | 7 | 56.4 | 39 | 175 | 33 | 411 | 63 |
| 1 | Frontier Co-op | 12 | 7 | 79.6 | 21 | 43 | 31 | 331 | 66 |
| 1 | Hollow Wake | 16 | 12 | 82.9 | 20 | 35 | 37 | 378 | 230 |
| 2 | Transit Authority | 6 | 5 | 37.0 | 37 | 106 | 28 | 312 | 39 |
| 2 | Frontier Co-op | 15 | 6 | 85.5 | 22 | 42 | 30 | 372 | 47 |
| 2 | Hollow Wake | 22 | 20 | 98.7 | 23 | 38 | 39 | 469 | 226 |
| 3 | Transit Authority | 9 | 7 | 36.6 | 36 | 102 | 32 | 342 | 36 |
| 3 | Frontier Co-op | 13 | 9 | 97.4 | 24 | 52 | 33 | 374 | 56 |
| 3 | Hollow Wake | 15 | 13 | 96.0 | 21 | 46 | 39 | 390 | 265 |
| 4 | Transit Authority | 12 | 6 | 48.5 | 35 | 108 | 34 | 373 | 48 |
| 4 | Frontier Co-op | 13 | 10 | 71.2 | 23 | 39 | 36 | 343 | 48 |
| 4 | Hollow Wake | 20 | 16 | 113.1 | 24 | 49 | 42 | 472 | 252 |
| 5 | Transit Authority | 10 | 8 | 39.2 | 35 | 103 | 33 | 350 | 60 |
| 5 | Frontier Co-op | 13 | 7 | 78.4 | 21 | 45 | 30 | 340 | 38 |
| 5 | Hollow Wake | 11 | 6 | 76.6 | 23 | 35 | 38 | 328 | 163 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 6 (burn and replant) | 4 (live with it) |
| A comet | 18 (capture its ice) | 0 (study it) |
| A derelict | 5 (salvage it) | 0 (study it) |
| An epidemic | 11 (medical aid) | 5 (quarantine) |
| Flare | 17 (shelter) | 0 (ride it out) |
| Founders’ Day | 42 (a festival) | 6 (a quiet day) |
| Lane drift | 27 (retune it) | 0 (let it drift) |
| Settlers’ petition | 9 (grant it) | 7 (refuse) |
| A smugglers’ offer | 27 (buy) | 4 (report them) |
| A strike | 11 (meet their demands) | 5 (wait it out) |
