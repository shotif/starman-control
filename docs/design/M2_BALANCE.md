# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): 5
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 186 ms on the machine that wrote this; the largest save at turn 100
was 63.1 KB. The longest time in debt was 2 turns in a row. No colony went hungry.

The tree has 79 technologies, of which a power can learn 76 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 126 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.4 | 9.3 | 13.9 | 109 | 46 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 16.0 | 114 | 92 |
| 25 | Dusk Concord | 3.8 | 2.0 | 18.5 | 5.0 | 8.9 | 14.4 | 96 | 54 |
| 25 | Drift Moot | 4.4 | 1.0 | 21.6 | 5.0 | 9.0 | 11.6 | 102 | 37 |
| 50 | Transit Authority | 5.5 | 4.6 | 27.2 | 17.5 | 44.1 | 29.1 | 195 | 69 |
| 50 | Frontier Co-op | 7.0 | 3.6 | 39.9 | 11.8 | 15.9 | 22.0 | 190 | 53 |
| 50 | Hollow Wake | 7.5 | 5.1 | 37.9 | 12.0 | 13.8 | 31.8 | 198 | 180 |
| 50 | Dusk Concord | 7.1 | 4.3 | 34.9 | 9.3 | 12.9 | 19.9 | 170 | 68 |
| 50 | Drift Moot | 5.4 | 2.0 | 44.5 | 9.0 | 18.6 | 17.8 | 159 | 45 |
| 100 | Transit Authority | 10.5 | 7.3 | 43.2 | 37.6 | 126.6 | 40.4 | 368 | 45 |
| 100 | Frontier Co-op | 13.1 | 7.5 | 79.7 | 23.0 | 42.8 | 36.5 | 353 | 42 |
| 100 | Hollow Wake | 16.1 | 13.0 | 90.0 | 22.1 | 39.4 | 46.5 | 397 | 226 |
| 100 | Dusk Concord | 13.0 | 9.1 | 99.9 | 19.9 | 39.4 | 37.4 | 356 | 70 |
| 100 | Drift Moot | 5.9 | 2.8 | 93.0 | 19.8 | 39.3 | 28.5 | 273 | 86 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 14 | 9 | 49.6 | 38 | 145 | 41 | 412 | 43 |
| 42 | Frontier Co-op | 13 | 7 | 66.6 | 20 | 29 | 35 | 323 | 43 |
| 42 | Hollow Wake | 14 | 10 | 68.5 | 20 | 28 | 43 | 344 | 115 |
| 42 | Dusk Concord | 15 | 12 | 126.8 | 22 | 46 | 40 | 413 | 102 |
| 42 | Drift Moot | 5 | 2 | 87.2 | 19 | 35 | 26 | 253 | 101 |
| 7 | Transit Authority | 14 | 6 | 48.3 | 38 | 151 | 40 | 408 | 69 |
| 7 | Frontier Co-op | 14 | 5 | 81.4 | 25 | 42 | 36 | 373 | 8 |
| 7 | Hollow Wake | 13 | 12 | 78.3 | 21 | 35 | 47 | 349 | 244 |
| 7 | Dusk Concord | 15 | 12 | 120.2 | 20 | 39 | 40 | 397 | 97 |
| 7 | Drift Moot | 9 | 5 | 119.9 | 24 | 58 | 38 | 359 | 78 |
| 2176 | Transit Authority | 10 | 7 | 47.1 | 39 | 171 | 42 | 372 | 51 |
| 2176 | Frontier Co-op | 13 | 10 | 84.7 | 21 | 45 | 39 | 346 | 45 |
| 2176 | Hollow Wake | 17 | 13 | 103.9 | 24 | 46 | 48 | 429 | 240 |
| 2176 | Dusk Concord | 12 | 6 | 68.4 | 18 | 32 | 33 | 305 | 21 |
| 2176 | Drift Moot | 6 | 2 | 83.1 | 19 | 34 | 28 | 262 | 80 |
| 1 | Transit Authority | 11 | 8 | 51.1 | 40 | 157 | 40 | 391 | 27 |
| 1 | Frontier Co-op | 13 | 8 | 84.1 | 22 | 50 | 34 | 351 | 30 |
| 1 | Hollow Wake | 16 | 12 | 82.5 | 20 | 35 | 43 | 378 | 223 |
| 1 | Dusk Concord | 14 | 11 | 112.6 | 21 | 44 | 40 | 387 | 72 |
| 1 | Drift Moot | 5 | 2 | 85.4 | 19 | 36 | 27 | 251 | 88 |
| 2 | Transit Authority | 7 | 6 | 37.0 | 38 | 111 | 39 | 327 | 67 |
| 2 | Frontier Co-op | 14 | 7 | 84.7 | 23 | 42 | 35 | 366 | 59 |
| 2 | Hollow Wake | 18 | 15 | 90.4 | 22 | 36 | 46 | 413 | 233 |
| 2 | Dusk Concord | 8 | 7 | 65.4 | 19 | 25 | 33 | 264 | 54 |
| 2 | Drift Moot | 6 | 5 | 92.3 | 20 | 41 | 30 | 285 | 58 |
| 3 | Transit Authority | 9 | 8 | 35.0 | 37 | 100 | 38 | 346 | 25 |
| 3 | Frontier Co-op | 13 | 7 | 90.3 | 25 | 57 | 38 | 372 | 52 |
| 3 | Hollow Wake | 15 | 15 | 96.1 | 21 | 46 | 47 | 390 | 242 |
| 3 | Dusk Concord | 14 | 11 | 115.3 | 20 | 44 | 39 | 382 | 83 |
| 3 | Drift Moot | 6 | 2 | 104.8 | 20 | 42 | 27 | 282 | 89 |
| 4 | Transit Authority | 10 | 6 | 41.9 | 35 | 81 | 42 | 346 | 24 |
| 4 | Frontier Co-op | 13 | 10 | 71.6 | 25 | 39 | 41 | 353 | 44 |
| 4 | Hollow Wake | 20 | 16 | 114.3 | 24 | 50 | 50 | 473 | 267 |
| 4 | Dusk Concord | 14 | 8 | 102.3 | 20 | 44 | 39 | 369 | 66 |
| 4 | Drift Moot | 5 | 2 | 88.2 | 19 | 34 | 25 | 251 | 104 |
| 5 | Transit Authority | 9 | 8 | 35.9 | 36 | 97 | 41 | 341 | 51 |
| 5 | Frontier Co-op | 12 | 6 | 74.5 | 23 | 38 | 34 | 336 | 57 |
| 5 | Hollow Wake | 16 | 11 | 85.6 | 25 | 39 | 48 | 403 | 246 |
| 5 | Dusk Concord | 12 | 6 | 88.5 | 19 | 41 | 35 | 327 | 64 |
| 5 | Drift Moot | 5 | 2 | 83.4 | 18 | 34 | 27 | 244 | 92 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 24 (burn and replant) | 3 (live with it) |
| A comet | 36 (capture its ice) | 0 (study it) |
| A derelict | 16 (salvage it) | 0 (study it) |
| An epidemic | 18 (medical aid) | 8 (quarantine) |
| Flare | 16 (shelter) | 0 (ride it out) |
| Founders’ Day | 71 (a festival) | 9 (a quiet day) |
| Lane drift | 36 (retune it) | 6 (let it drift) |
| Settlers’ petition | 13 (grant it) | 11 (refuse) |
| A smugglers’ offer | 47 (buy) | 4 (report them) |
| A strike | 22 (meet their demands) | 6 (wait it out) |
