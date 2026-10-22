# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): 5
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 75 ms on the machine that wrote this; the largest save at turn 100
was 64.1 KB. The longest time in debt was 1 turn in a row. The longest time hungry was 1 turn in a row.

In all 8 games: 52 turns of plunder by raids, 1 battle, 5 wars declared and 1 colony or outpost taken by invasion (M4).

The tree has 83 technologies, of which a power can learn 80 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 126 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.4 | 9.3 | 13.9 | 109 | 46 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 16.0 | 114 | 92 |
| 25 | Dusk Concord | 3.8 | 2.0 | 18.5 | 5.0 | 8.9 | 14.4 | 96 | 54 |
| 25 | Drift Moot | 4.4 | 1.0 | 21.6 | 5.0 | 9.0 | 11.6 | 102 | 37 |
| 50 | Transit Authority | 5.4 | 4.3 | 27.1 | 17.9 | 41.6 | 28.4 | 195 | 77 |
| 50 | Frontier Co-op | 7.0 | 3.6 | 39.9 | 11.8 | 15.9 | 22.0 | 190 | 53 |
| 50 | Hollow Wake | 6.3 | 3.9 | 35.4 | 12.8 | 14.0 | 31.8 | 187 | 176 |
| 50 | Dusk Concord | 7.1 | 4.3 | 34.9 | 9.3 | 12.9 | 19.9 | 170 | 68 |
| 50 | Drift Moot | 5.4 | 2.0 | 44.5 | 9.0 | 18.6 | 17.8 | 159 | 45 |
| 100 | Transit Authority | 7.4 | 5.3 | 35.7 | 40.4 | 101.5 | 38.1 | 342 | 36 |
| 100 | Frontier Co-op | 11.9 | 6.4 | 77.3 | 23.0 | 38.0 | 35.8 | 338 | 46 |
| 100 | Hollow Wake | 13.8 | 9.8 | 81.7 | 23.4 | 36.9 | 48.0 | 369 | 172 |
| 100 | Dusk Concord | 12.9 | 8.8 | 97.2 | 20.6 | 39.0 | 37.1 | 355 | 62 |
| 100 | Drift Moot | 5.9 | 2.8 | 93.0 | 19.8 | 39.3 | 28.5 | 273 | 86 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 11 | 6 | 38.3 | 42 | 94 | 39 | 388 | 19 |
| 42 | Frontier Co-op | 11 | 5 | 62.8 | 21 | 25 | 34 | 304 | 50 |
| 42 | Hollow Wake | 13 | 10 | 66.1 | 22 | 28 | 41 | 339 | 173 |
| 42 | Dusk Concord | 15 | 12 | 125.8 | 21 | 46 | 40 | 407 | 104 |
| 42 | Drift Moot | 5 | 2 | 87.2 | 19 | 35 | 26 | 253 | 101 |
| 7 | Transit Authority | 9 | 3 | 38.0 | 41 | 115 | 39 | 363 | 37 |
| 7 | Frontier Co-op | 13 | 4 | 79.7 | 25 | 36 | 36 | 361 | 49 |
| 7 | Hollow Wake | 9 | 7 | 65.3 | 23 | 32 | 46 | 297 | 216 |
| 7 | Dusk Concord | 15 | 11 | 119.3 | 21 | 38 | 40 | 401 | 86 |
| 7 | Drift Moot | 9 | 5 | 119.9 | 24 | 58 | 38 | 359 | 78 |
| 2176 | Transit Authority | 8 | 7 | 42.3 | 43 | 148 | 38 | 367 | 45 |
| 2176 | Frontier Co-op | 13 | 10 | 84.6 | 21 | 45 | 39 | 346 | 57 |
| 2176 | Hollow Wake | 15 | 11 | 93.4 | 24 | 42 | 51 | 399 | 246 |
| 2176 | Dusk Concord | 12 | 6 | 68.4 | 18 | 32 | 33 | 305 | 21 |
| 2176 | Drift Moot | 6 | 2 | 83.1 | 19 | 34 | 28 | 262 | 80 |
| 1 | Transit Authority | 10 | 7 | 49.1 | 45 | 145 | 40 | 404 | 42 |
| 1 | Frontier Co-op | 13 | 8 | 83.7 | 22 | 50 | 34 | 350 | 42 |
| 1 | Hollow Wake | 16 | 9 | 77.0 | 22 | 33 | 44 | 383 | 192 |
| 1 | Dusk Concord | 14 | 11 | 108.6 | 20 | 44 | 40 | 378 | 68 |
| 1 | Drift Moot | 5 | 2 | 85.4 | 19 | 36 | 27 | 251 | 88 |
| 2 | Transit Authority | 6 | 6 | 30.0 | 39 | 61 | 36 | 315 | 30 |
| 2 | Frontier Co-op | 11 | 5 | 81.0 | 23 | 37 | 34 | 333 | 13 |
| 2 | Hollow Wake | 17 | 12 | 91.8 | 24 | 48 | 51 | 417 | 75 |
| 2 | Dusk Concord | 8 | 7 | 64.9 | 19 | 25 | 33 | 263 | 43 |
| 2 | Drift Moot | 6 | 5 | 92.3 | 20 | 41 | 30 | 285 | 58 |
| 3 | Transit Authority | 5 | 4 | 29.0 | 39 | 96 | 32 | 307 | 37 |
| 3 | Frontier Co-op | 12 | 6 | 86.6 | 24 | 45 | 37 | 353 | 76 |
| 3 | Hollow Wake | 13 | 11 | 89.2 | 23 | 35 | 51 | 370 | 169 |
| 3 | Dusk Concord | 14 | 12 | 101.5 | 22 | 42 | 39 | 378 | 74 |
| 3 | Drift Moot | 6 | 2 | 104.8 | 20 | 42 | 27 | 282 | 89 |
| 4 | Transit Authority | 5 | 4 | 31.0 | 36 | 66 | 39 | 291 | 55 |
| 4 | Frontier Co-op | 11 | 8 | 69.0 | 25 | 34 | 39 | 331 | 49 |
| 4 | Hollow Wake | 15 | 10 | 100.3 | 25 | 43 | 53 | 405 | 125 |
| 4 | Dusk Concord | 13 | 6 | 103.8 | 22 | 44 | 38 | 370 | 70 |
| 4 | Drift Moot | 5 | 2 | 88.2 | 19 | 34 | 25 | 251 | 104 |
| 5 | Transit Authority | 5 | 5 | 28.0 | 38 | 87 | 42 | 304 | 25 |
| 5 | Frontier Co-op | 11 | 5 | 70.8 | 23 | 32 | 33 | 322 | 33 |
| 5 | Hollow Wake | 12 | 8 | 70.3 | 24 | 34 | 47 | 343 | 176 |
| 5 | Dusk Concord | 12 | 5 | 85.2 | 22 | 41 | 34 | 339 | 28 |
| 5 | Drift Moot | 5 | 2 | 83.4 | 18 | 34 | 27 | 244 | 92 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 24 (burn and replant) | 3 (live with it) |
| A comet | 37 (capture its ice) | 0 (study it) |
| A derelict | 16 (salvage it) | 0 (study it) |
| An epidemic | 19 (medical aid) | 9 (quarantine) |
| Flare | 14 (shelter) | 1 (ride it out) |
| Founders’ Day | 71 (a festival) | 9 (a quiet day) |
| Lane drift | 36 (retune it) | 6 (let it drift) |
| Settlers’ petition | 12 (grant it) | 12 (refuse) |
| A smugglers’ offer | 47 (buy) | 4 (report them) |
| A strike | 23 (meet their demands) | 4 (wait it out) |
