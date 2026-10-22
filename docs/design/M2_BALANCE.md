# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 125 ms on the machine that wrote this; the largest save at turn 100
was 40.7 KB. No power fell into debt. No colony went hungry.

The tree has 62 technologies, of which a power can learn 59 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 126 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.4 | 9.3 | 13.9 | 109 | 46 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 15.6 | 114 | 92 |
| 50 | Transit Authority | 5.9 | 4.5 | 27.5 | 17.5 | 39.3 | 26.0 | 199 | 65 |
| 50 | Frontier Co-op | 6.5 | 3.8 | 39.4 | 11.8 | 16.0 | 21.0 | 185 | 54 |
| 50 | Hollow Wake | 7.4 | 5.1 | 37.7 | 12.0 | 13.5 | 29.0 | 197 | 174 |
| 100 | Transit Authority | 10.5 | 7.4 | 44.5 | 37.6 | 132.4 | 33.5 | 369 | 37 |
| 100 | Frontier Co-op | 13.1 | 7.9 | 77.9 | 23.1 | 41.6 | 33.1 | 351 | 34 |
| 100 | Hollow Wake | 15.1 | 11.9 | 88.4 | 22.0 | 38.4 | 38.8 | 384 | 229 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 12 | 9 | 42.7 | 38 | 115 | 34 | 382 | 21 |
| 42 | Frontier Co-op | 11 | 9 | 60.8 | 20 | 28 | 33 | 297 | 24 |
| 42 | Hollow Wake | 10 | 8 | 59.5 | 20 | 25 | 35 | 292 | 243 |
| 7 | Transit Authority | 14 | 7 | 48.6 | 38 | 156 | 36 | 408 | 27 |
| 7 | Frontier Co-op | 14 | 6 | 80.5 | 25 | 41 | 33 | 372 | 25 |
| 7 | Hollow Wake | 14 | 10 | 82.5 | 21 | 33 | 39 | 357 | 255 |
| 2176 | Transit Authority | 10 | 9 | 48.4 | 39 | 178 | 33 | 373 | 39 |
| 2176 | Frontier Co-op | 12 | 11 | 79.6 | 21 | 44 | 34 | 331 | 47 |
| 2176 | Hollow Wake | 13 | 9 | 97.5 | 24 | 46 | 37 | 380 | 231 |
| 1 | Transit Authority | 12 | 7 | 55.6 | 40 | 187 | 34 | 405 | 42 |
| 1 | Frontier Co-op | 13 | 7 | 80.8 | 22 | 45 | 31 | 347 | 35 |
| 1 | Hollow Wake | 16 | 12 | 82.9 | 20 | 35 | 37 | 378 | 230 |
| 2 | Transit Authority | 6 | 5 | 37.0 | 37 | 106 | 29 | 312 | 41 |
| 2 | Frontier Co-op | 15 | 6 | 85.4 | 23 | 42 | 32 | 377 | 32 |
| 2 | Hollow Wake | 23 | 20 | 99.8 | 23 | 38 | 40 | 480 | 247 |
| 3 | Transit Authority | 9 | 7 | 36.7 | 37 | 106 | 33 | 347 | 34 |
| 3 | Frontier Co-op | 13 | 9 | 84.6 | 25 | 48 | 34 | 366 | 32 |
| 3 | Hollow Wake | 15 | 13 | 96.0 | 21 | 46 | 40 | 390 | 263 |
| 4 | Transit Authority | 11 | 7 | 47.7 | 36 | 108 | 35 | 367 | 44 |
| 4 | Frontier Co-op | 13 | 9 | 71.0 | 26 | 39 | 37 | 358 | 21 |
| 4 | Hollow Wake | 19 | 17 | 112.2 | 24 | 49 | 43 | 464 | 251 |
| 5 | Transit Authority | 10 | 8 | 39.5 | 36 | 103 | 34 | 355 | 44 |
| 5 | Frontier Co-op | 14 | 6 | 80.2 | 23 | 46 | 31 | 362 | 53 |
| 5 | Hollow Wake | 11 | 6 | 76.6 | 23 | 35 | 39 | 328 | 113 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 5 (burn and replant) | 5 (live with it) |
| A comet | 18 (capture its ice) | 0 (study it) |
| A derelict | 4 (salvage it) | 0 (study it) |
| An epidemic | 13 (medical aid) | 5 (quarantine) |
| Flare | 17 (shelter) | 0 (ride it out) |
| Founders’ Day | 44 (a festival) | 4 (a quiet day) |
| Lane drift | 27 (retune it) | 0 (let it drift) |
| Settlers’ petition | 8 (grant it) | 8 (refuse) |
| A smugglers’ offer | 29 (buy) | 1 (report them) |
| A strike | 12 (meet their demands) | 3 (wait it out) |
