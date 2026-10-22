# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 136 ms on the machine that wrote this; the largest save at turn 100
was 41.4 KB. The longest time in debt was 1 turn in a row. No colony went hungry.

The tree has 62 technologies, of which a power can learn 59 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 126 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.4 | 9.3 | 13.9 | 109 | 46 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 15.6 | 114 | 92 |
| 50 | Transit Authority | 5.5 | 4.6 | 27.2 | 17.5 | 44.1 | 26.4 | 195 | 69 |
| 50 | Frontier Co-op | 7.0 | 3.6 | 39.9 | 11.8 | 15.9 | 20.9 | 190 | 53 |
| 50 | Hollow Wake | 7.5 | 5.1 | 37.9 | 12.0 | 13.8 | 29.0 | 198 | 180 |
| 100 | Transit Authority | 10.5 | 7.1 | 43.2 | 37.6 | 126.6 | 34.5 | 368 | 44 |
| 100 | Frontier Co-op | 13.1 | 7.8 | 79.5 | 23.3 | 42.3 | 33.4 | 354 | 53 |
| 100 | Hollow Wake | 16.3 | 13.1 | 90.3 | 22.0 | 39.4 | 39.6 | 399 | 236 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 14 | 8 | 49.6 | 38 | 145 | 34 | 412 | 41 |
| 42 | Frontier Co-op | 12 | 8 | 64.8 | 20 | 29 | 34 | 311 | 48 |
| 42 | Hollow Wake | 14 | 11 | 68.5 | 20 | 28 | 37 | 344 | 147 |
| 7 | Transit Authority | 14 | 6 | 48.3 | 38 | 151 | 34 | 408 | 69 |
| 7 | Frontier Co-op | 14 | 4 | 80.1 | 25 | 41 | 34 | 372 | 45 |
| 7 | Hollow Wake | 13 | 12 | 78.4 | 21 | 35 | 40 | 349 | 256 |
| 2176 | Transit Authority | 10 | 7 | 47.1 | 39 | 171 | 36 | 372 | 51 |
| 2176 | Frontier Co-op | 13 | 10 | 84.7 | 21 | 45 | 34 | 346 | 45 |
| 2176 | Hollow Wake | 17 | 13 | 103.9 | 24 | 46 | 39 | 429 | 240 |
| 1 | Transit Authority | 11 | 8 | 51.1 | 40 | 157 | 34 | 391 | 27 |
| 1 | Frontier Co-op | 13 | 8 | 84.1 | 22 | 50 | 31 | 351 | 30 |
| 1 | Hollow Wake | 16 | 12 | 82.5 | 20 | 35 | 37 | 378 | 223 |
| 2 | Transit Authority | 7 | 6 | 37.0 | 38 | 111 | 33 | 327 | 67 |
| 2 | Frontier Co-op | 14 | 8 | 84.5 | 23 | 42 | 32 | 366 | 42 |
| 2 | Hollow Wake | 19 | 16 | 92.5 | 22 | 36 | 40 | 428 | 257 |
| 3 | Transit Authority | 9 | 8 | 35.0 | 37 | 100 | 32 | 346 | 25 |
| 3 | Frontier Co-op | 15 | 8 | 92.7 | 26 | 54 | 34 | 399 | 65 |
| 3 | Hollow Wake | 15 | 15 | 96.2 | 21 | 46 | 40 | 390 | 261 |
| 4 | Transit Authority | 10 | 6 | 41.9 | 35 | 81 | 37 | 346 | 24 |
| 4 | Frontier Co-op | 12 | 10 | 70.0 | 26 | 39 | 37 | 347 | 87 |
| 4 | Hollow Wake | 20 | 15 | 115.0 | 24 | 50 | 43 | 474 | 273 |
| 5 | Transit Authority | 9 | 8 | 35.9 | 36 | 97 | 36 | 341 | 51 |
| 5 | Frontier Co-op | 12 | 6 | 74.7 | 23 | 38 | 31 | 336 | 64 |
| 5 | Hollow Wake | 16 | 11 | 85.1 | 24 | 39 | 41 | 398 | 231 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 7 (burn and replant) | 2 (live with it) |
| A comet | 19 (capture its ice) | 0 (study it) |
| A derelict | 4 (salvage it) | 0 (study it) |
| An epidemic | 12 (medical aid) | 5 (quarantine) |
| Flare | 16 (shelter) | 0 (ride it out) |
| Founders’ Day | 43 (a festival) | 5 (a quiet day) |
| Lane drift | 26 (retune it) | 0 (let it drift) |
| Settlers’ petition | 9 (grant it) | 6 (refuse) |
| A smugglers’ offer | 31 (buy) | 1 (report them) |
| A strike | 12 (meet their demands) | 5 (wait it out) |
