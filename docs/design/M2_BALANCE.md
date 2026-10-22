# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): 5
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 218 ms on the machine that wrote this; the largest save at turn 100
was 64.6 KB. The longest time in debt was 1 turn in a row. No colony went hungry.

In all 8 games: 76 turns of plunder by raids, 4 battles, 0 wars declared and 0 colonies or outposts taken by invasion (M4).

The tree has 83 technologies, of which a power can learn 80 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 126 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.4 | 9.3 | 13.9 | 109 | 46 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 16.0 | 114 | 92 |
| 25 | Dusk Concord | 3.8 | 2.0 | 18.5 | 5.0 | 8.9 | 14.4 | 96 | 54 |
| 25 | Drift Moot | 4.4 | 1.0 | 21.6 | 5.0 | 9.0 | 11.6 | 102 | 37 |
| 50 | Transit Authority | 5.5 | 4.6 | 27.2 | 17.5 | 44.1 | 29.1 | 195 | 75 |
| 50 | Frontier Co-op | 7.0 | 3.6 | 39.9 | 11.8 | 15.9 | 22.0 | 190 | 53 |
| 50 | Hollow Wake | 6.3 | 3.9 | 35.4 | 12.6 | 14.0 | 31.8 | 186 | 176 |
| 50 | Dusk Concord | 7.1 | 4.3 | 34.9 | 9.3 | 12.9 | 19.9 | 170 | 68 |
| 50 | Drift Moot | 5.4 | 2.0 | 44.5 | 9.0 | 18.6 | 17.8 | 159 | 45 |
| 100 | Transit Authority | 10.1 | 7.6 | 42.7 | 37.5 | 126.0 | 40.5 | 363 | 41 |
| 100 | Frontier Co-op | 13.0 | 7.4 | 79.4 | 23.1 | 42.8 | 36.4 | 352 | 40 |
| 100 | Hollow Wake | 15.1 | 11.6 | 82.9 | 23.5 | 34.9 | 48.3 | 386 | 225 |
| 100 | Dusk Concord | 13.0 | 9.1 | 99.8 | 19.9 | 39.3 | 37.4 | 355 | 70 |
| 100 | Drift Moot | 5.9 | 2.8 | 93.0 | 19.8 | 39.3 | 28.5 | 273 | 86 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 14 | 8 | 49.8 | 38 | 153 | 40 | 412 | 24 |
| 42 | Frontier Co-op | 13 | 6 | 66.4 | 20 | 29 | 35 | 323 | 19 |
| 42 | Hollow Wake | 13 | 10 | 66.4 | 22 | 28 | 43 | 339 | 212 |
| 42 | Dusk Concord | 15 | 12 | 126.8 | 22 | 46 | 40 | 413 | 102 |
| 42 | Drift Moot | 5 | 2 | 87.2 | 19 | 35 | 26 | 253 | 101 |
| 7 | Transit Authority | 12 | 7 | 45.1 | 38 | 145 | 42 | 385 | 44 |
| 7 | Frontier Co-op | 14 | 5 | 81.4 | 25 | 42 | 36 | 373 | 26 |
| 7 | Hollow Wake | 12 | 8 | 71.0 | 23 | 32 | 49 | 336 | 253 |
| 7 | Dusk Concord | 15 | 12 | 119.5 | 20 | 38 | 40 | 396 | 101 |
| 7 | Drift Moot | 9 | 5 | 119.9 | 24 | 58 | 38 | 359 | 78 |
| 2176 | Transit Authority | 9 | 7 | 44.9 | 39 | 163 | 39 | 359 | 58 |
| 2176 | Frontier Co-op | 13 | 10 | 84.7 | 21 | 45 | 39 | 346 | 63 |
| 2176 | Hollow Wake | 15 | 10 | 93.3 | 25 | 42 | 50 | 401 | 272 |
| 2176 | Dusk Concord | 12 | 6 | 68.4 | 18 | 32 | 33 | 305 | 21 |
| 2176 | Drift Moot | 6 | 2 | 83.1 | 19 | 34 | 28 | 262 | 80 |
| 1 | Transit Authority | 10 | 9 | 50.0 | 40 | 157 | 40 | 380 | 27 |
| 1 | Frontier Co-op | 13 | 8 | 83.7 | 22 | 50 | 34 | 350 | 42 |
| 1 | Hollow Wake | 15 | 10 | 75.4 | 22 | 33 | 45 | 371 | 168 |
| 1 | Dusk Concord | 14 | 11 | 112.6 | 21 | 44 | 40 | 387 | 72 |
| 1 | Drift Moot | 5 | 2 | 85.4 | 19 | 36 | 27 | 251 | 88 |
| 2 | Transit Authority | 8 | 7 | 38.4 | 38 | 111 | 42 | 338 | 46 |
| 2 | Frontier Co-op | 13 | 6 | 83.0 | 24 | 42 | 35 | 360 | 37 |
| 2 | Hollow Wake | 19 | 15 | 85.2 | 24 | 31 | 51 | 431 | 232 |
| 2 | Dusk Concord | 8 | 7 | 65.4 | 19 | 25 | 33 | 264 | 54 |
| 2 | Drift Moot | 6 | 5 | 92.3 | 20 | 41 | 30 | 285 | 58 |
| 3 | Transit Authority | 8 | 7 | 33.3 | 36 | 100 | 40 | 329 | 43 |
| 3 | Frontier Co-op | 14 | 9 | 92.0 | 25 | 57 | 38 | 384 | 27 |
| 3 | Hollow Wake | 15 | 14 | 92.7 | 23 | 35 | 50 | 396 | 245 |
| 3 | Dusk Concord | 14 | 11 | 115.3 | 20 | 44 | 39 | 382 | 83 |
| 3 | Drift Moot | 6 | 2 | 104.8 | 20 | 42 | 27 | 282 | 89 |
| 4 | Transit Authority | 11 | 7 | 45.3 | 35 | 88 | 42 | 360 | 30 |
| 4 | Frontier Co-op | 13 | 10 | 71.6 | 25 | 39 | 41 | 353 | 44 |
| 4 | Hollow Wake | 17 | 14 | 104.0 | 25 | 44 | 51 | 435 | 321 |
| 4 | Dusk Concord | 14 | 8 | 102.3 | 20 | 44 | 39 | 369 | 66 |
| 4 | Drift Moot | 5 | 2 | 88.2 | 19 | 34 | 25 | 251 | 104 |
| 5 | Transit Authority | 9 | 9 | 34.5 | 36 | 91 | 39 | 340 | 59 |
| 5 | Frontier Co-op | 11 | 5 | 72.3 | 23 | 38 | 33 | 324 | 61 |
| 5 | Hollow Wake | 15 | 12 | 75.3 | 24 | 34 | 47 | 378 | 100 |
| 5 | Dusk Concord | 12 | 6 | 88.5 | 19 | 41 | 35 | 327 | 64 |
| 5 | Drift Moot | 5 | 2 | 83.4 | 18 | 34 | 27 | 244 | 92 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 25 (burn and replant) | 2 (live with it) |
| A comet | 36 (capture its ice) | 0 (study it) |
| A derelict | 16 (salvage it) | 0 (study it) |
| An epidemic | 20 (medical aid) | 7 (quarantine) |
| Flare | 16 (shelter) | 0 (ride it out) |
| Founders’ Day | 73 (a festival) | 7 (a quiet day) |
| Lane drift | 36 (retune it) | 6 (let it drift) |
| Settlers’ petition | 13 (grant it) | 12 (refuse) |
| A smugglers’ offer | 45 (buy) | 5 (report them) |
| A strike | 24 (meet their demands) | 4 (wait it out) |
