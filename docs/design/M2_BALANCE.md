# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 127 ms on the machine that wrote this; the largest save at turn 100
was 40.6 KB. The longest time in debt was 1 turn in a row. No colony went hungry.

The tree has 62 technologies, of which a power can learn 59 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 126 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.4 | 9.3 | 13.9 | 109 | 46 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 15.6 | 114 | 92 |
| 50 | Transit Authority | 5.9 | 4.6 | 27.5 | 17.5 | 39.3 | 26.0 | 199 | 74 |
| 50 | Frontier Co-op | 7.0 | 3.6 | 39.9 | 11.8 | 15.9 | 20.9 | 190 | 53 |
| 50 | Hollow Wake | 7.4 | 5.1 | 37.7 | 12.0 | 13.5 | 29.0 | 197 | 174 |
| 100 | Transit Authority | 10.9 | 7.4 | 44.4 | 37.5 | 132.5 | 32.9 | 372 | 49 |
| 100 | Frontier Co-op | 13.0 | 7.9 | 79.3 | 23.1 | 43.0 | 33.4 | 352 | 41 |
| 100 | Hollow Wake | 15.0 | 11.8 | 88.2 | 22.0 | 38.4 | 38.8 | 382 | 231 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 16 | 7 | 51.9 | 38 | 150 | 34 | 434 | 53 |
| 42 | Frontier Co-op | 13 | 7 | 65.8 | 20 | 29 | 33 | 322 | 13 |
| 42 | Hollow Wake | 10 | 8 | 59.5 | 20 | 25 | 35 | 292 | 253 |
| 7 | Transit Authority | 15 | 9 | 52.8 | 39 | 168 | 34 | 427 | 43 |
| 7 | Frontier Co-op | 13 | 4 | 79.2 | 25 | 41 | 34 | 361 | 43 |
| 7 | Hollow Wake | 14 | 10 | 82.5 | 21 | 33 | 39 | 357 | 261 |
| 2176 | Transit Authority | 10 | 7 | 48.8 | 39 | 186 | 33 | 373 | 54 |
| 2176 | Frontier Co-op | 13 | 10 | 84.7 | 21 | 45 | 34 | 346 | 27 |
| 2176 | Hollow Wake | 13 | 9 | 97.5 | 24 | 46 | 37 | 380 | 231 |
| 1 | Transit Authority | 13 | 8 | 55.8 | 40 | 175 | 33 | 415 | 65 |
| 1 | Frontier Co-op | 13 | 8 | 83.7 | 22 | 50 | 31 | 350 | 51 |
| 1 | Hollow Wake | 16 | 12 | 82.9 | 20 | 35 | 37 | 378 | 230 |
| 2 | Transit Authority | 7 | 5 | 38.4 | 37 | 108 | 29 | 323 | 59 |
| 2 | Frontier Co-op | 14 | 7 | 84.3 | 23 | 42 | 32 | 366 | 53 |
| 2 | Hollow Wake | 22 | 19 | 98.7 | 23 | 38 | 40 | 469 | 232 |
| 3 | Transit Authority | 8 | 8 | 33.5 | 36 | 100 | 31 | 329 | 24 |
| 3 | Frontier Co-op | 14 | 9 | 90.9 | 25 | 56 | 35 | 382 | 56 |
| 3 | Hollow Wake | 15 | 13 | 96.0 | 21 | 46 | 40 | 390 | 258 |
| 4 | Transit Authority | 9 | 7 | 40.0 | 35 | 82 | 35 | 335 | 49 |
| 4 | Frontier Co-op | 12 | 10 | 70.0 | 26 | 39 | 37 | 347 | 27 |
| 4 | Hollow Wake | 19 | 17 | 112.1 | 24 | 49 | 43 | 461 | 259 |
| 5 | Transit Authority | 9 | 8 | 34.0 | 36 | 91 | 34 | 340 | 41 |
| 5 | Frontier Co-op | 12 | 8 | 76.1 | 23 | 42 | 31 | 338 | 55 |
| 5 | Hollow Wake | 11 | 6 | 76.6 | 23 | 35 | 39 | 328 | 127 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 4 (burn and replant) | 5 (live with it) |
| A comet | 18 (capture its ice) | 0 (study it) |
| A derelict | 4 (salvage it) | 0 (study it) |
| An epidemic | 15 (medical aid) | 2 (quarantine) |
| Flare | 17 (shelter) | 0 (ride it out) |
| Founders’ Day | 46 (a festival) | 2 (a quiet day) |
| Lane drift | 27 (retune it) | 0 (let it drift) |
| Settlers’ petition | 10 (grant it) | 5 (refuse) |
| A smugglers’ offer | 30 (buy) | 1 (report them) |
| A strike | 14 (meet their demands) | 3 (wait it out) |
