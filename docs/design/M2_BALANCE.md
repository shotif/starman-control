# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4):
5 rivals, 8 seeds, 100 turns each for the tables, then on to the end of each game. Regenerate it
after any change to the rules or the rivals.*

The slowest of the first 100 turns took 70 ms on the machine that wrote this; the largest save at turn 100
was 64.8 KB. The longest time in debt was 2 turns in a row. The longest time hungry was 1 turn in a row.

In all 8 games, by turn 100: 56 turns of plunder by raids, 2 battles, 8 wars declared and 2 colonies or outposts taken by invasion (M4).
The Assembly formed in 6 of them, on turn 50 at the earliest and 75 at the latest; it held 7 elections and passed 10 resolutions by turn 100.

The tree has 83 technologies, of which a power can learn 80 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 8.6 | 20.3 | 14.9 | 130 | 66 |
| 25 | Frontier Co-op | 4.1 | 2.0 | 20.2 | 6.5 | 9.1 | 14.0 | 115 | 49 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 16.0 | 118 | 92 |
| 25 | Dusk Concord | 3.8 | 2.0 | 18.5 | 5.0 | 8.9 | 14.4 | 99 | 54 |
| 25 | Drift Moot | 4.4 | 1.0 | 21.6 | 5.0 | 9.0 | 11.6 | 105 | 37 |
| 50 | Transit Authority | 5.4 | 4.3 | 27.1 | 17.9 | 41.6 | 28.4 | 212 | 77 |
| 50 | Frontier Co-op | 6.9 | 4.1 | 38.6 | 11.9 | 15.6 | 21.8 | 199 | 51 |
| 50 | Hollow Wake | 6.3 | 3.9 | 35.4 | 12.8 | 14.0 | 31.8 | 200 | 176 |
| 50 | Dusk Concord | 7.1 | 4.3 | 34.9 | 9.3 | 12.9 | 19.9 | 181 | 68 |
| 50 | Drift Moot | 5.4 | 2.0 | 44.5 | 9.0 | 18.6 | 17.8 | 171 | 45 |
| 100 | Transit Authority | 6.8 | 5.0 | 34.6 | 40.3 | 99.1 | 38.0 | 406 | 38 |
| 100 | Frontier Co-op | 12.1 | 6.8 | 78.5 | 23.3 | 39.1 | 35.5 | 387 | 43 |
| 100 | Hollow Wake | 12.8 | 8.9 | 80.5 | 23.3 | 36.8 | 49.8 | 414 | 99 |
| 100 | Dusk Concord | 11.0 | 7.5 | 92.8 | 21.6 | 39.0 | 37.9 | 386 | 59 |
| 100 | Drift Moot | 5.9 | 2.8 | 93.0 | 19.8 | 39.3 | 28.5 | 317 | 86 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 9 | 5 | 35.5 | 42 | 87 | 39 | 438 | 44 |
| 42 | Frontier Co-op | 13 | 5 | 64.7 | 21 | 23 | 35 | 360 | 44 |
| 42 | Hollow Wake | 11 | 8 | 62.1 | 22 | 28 | 47 | 364 | 134 |
| 42 | Dusk Concord | 12 | 10 | 122.3 | 23 | 46 | 41 | 442 | 98 |
| 42 | Drift Moot | 5 | 2 | 87.2 | 19 | 35 | 26 | 292 | 101 |
| 7 | Transit Authority | 9 | 3 | 38.0 | 41 | 115 | 39 | 439 | 37 |
| 7 | Frontier Co-op | 13 | 5 | 83.8 | 25 | 38 | 36 | 411 | 44 |
| 7 | Hollow Wake | 9 | 7 | 65.3 | 23 | 32 | 48 | 350 | 216 |
| 7 | Dusk Concord | 12 | 10 | 103.6 | 22 | 38 | 42 | 413 | 36 |
| 7 | Drift Moot | 9 | 5 | 119.9 | 24 | 58 | 38 | 418 | 78 |
| 2176 | Transit Authority | 8 | 7 | 42.3 | 43 | 148 | 38 | 452 | 31 |
| 2176 | Frontier Co-op | 13 | 10 | 83.2 | 21 | 45 | 38 | 393 | 46 |
| 2176 | Hollow Wake | 13 | 8 | 91.0 | 24 | 42 | 50 | 435 | 261 |
| 2176 | Dusk Concord | 11 | 6 | 65.9 | 20 | 32 | 33 | 341 | 65 |
| 2176 | Drift Moot | 6 | 2 | 83.1 | 19 | 34 | 28 | 301 | 80 |
| 1 | Transit Authority | 8 | 6 | 46.0 | 44 | 138 | 39 | 468 | 51 |
| 1 | Frontier Co-op | 12 | 9 | 82.9 | 23 | 50 | 34 | 391 | 25 |
| 1 | Hollow Wake | 13 | 7 | 72.8 | 22 | 33 | 48 | 396 | 47 |
| 1 | Dusk Concord | 12 | 9 | 105.7 | 22 | 44 | 41 | 415 | 59 |
| 1 | Drift Moot | 5 | 2 | 85.4 | 19 | 36 | 27 | 293 | 88 |
| 2 | Transit Authority | 7 | 6 | 37.0 | 39 | 97 | 36 | 400 | 45 |
| 2 | Frontier Co-op | 11 | 5 | 81.0 | 23 | 37 | 32 | 377 | 38 |
| 2 | Hollow Wake | 15 | 12 | 83.7 | 23 | 32 | 50 | 443 | 130 |
| 2 | Dusk Concord | 7 | 6 | 63.9 | 20 | 25 | 34 | 296 | 41 |
| 2 | Drift Moot | 6 | 5 | 92.3 | 20 | 41 | 30 | 338 | 58 |
| 3 | Transit Authority | 5 | 4 | 29.0 | 39 | 96 | 32 | 372 | 34 |
| 3 | Frontier Co-op | 12 | 7 | 85.0 | 24 | 46 | 37 | 399 | 59 |
| 3 | Hollow Wake | 13 | 11 | 89.2 | 23 | 35 | 51 | 431 | -23 |
| 3 | Dusk Concord | 11 | 9 | 97.1 | 22 | 42 | 39 | 396 | 48 |
| 3 | Drift Moot | 6 | 2 | 104.8 | 20 | 42 | 27 | 324 | 89 |
| 4 | Transit Authority | 4 | 4 | 28.0 | 36 | 61 | 39 | 334 | 44 |
| 4 | Frontier Co-op | 11 | 8 | 69.0 | 25 | 34 | 38 | 375 | 44 |
| 4 | Hollow Wake | 15 | 10 | 102.2 | 25 | 46 | 54 | 477 | -43 |
| 4 | Dusk Concord | 12 | 5 | 100.9 | 22 | 44 | 38 | 408 | 63 |
| 4 | Drift Moot | 5 | 2 | 88.2 | 19 | 34 | 25 | 290 | 104 |
| 5 | Transit Authority | 4 | 5 | 21.0 | 38 | 51 | 42 | 348 | 18 |
| 5 | Frontier Co-op | 12 | 5 | 78.8 | 24 | 40 | 34 | 390 | 42 |
| 5 | Hollow Wake | 13 | 8 | 77.3 | 24 | 46 | 50 | 413 | 71 |
| 5 | Dusk Concord | 11 | 5 | 83.2 | 22 | 41 | 35 | 374 | 65 |
| 5 | Drift Moot | 5 | 2 | 83.4 | 18 | 34 | 27 | 282 | 92 |

## To the end of each game (M4)

Each game played on, after turn 100, until it was won or reached the default limit of 250 turns
(M4_FLEETS.md §30.4). 0 games were won before the limit; 8 games saw a war by turn 150;
0 powers left the game before turn 100. The slowest turn of all took 87 ms (turn 242); the
largest save was 122.0 KB.

| Seed | Won by | How | On turn | First war | Wars | Battles | Taken | Surrenders | Left the game |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Frontier Co-op | score | 250 | 95 | 3 | 4 | 2 | 0 | — |
| 7 | Dusk Concord | score | 250 | 90 | 4 | 8 | 7 | 0 | — |
| 2176 | Frontier Co-op | score | 250 | 95 | 3 | 1 | 4 | 0 | — |
| 1 | Dusk Concord | score | 250 | 90 | 2 | 27 | 3 | 0 | — |
| 2 | Frontier Co-op | score | 250 | 90 | 1 | 24 | 4 | 0 | — |
| 3 | Frontier Co-op | score | 250 | 85 | 2 | 2 | 3 | 0 | — |
| 4 | Hollow Wake | score | 250 | 85 | 4 | 13 | 10 | 0 | — |
| 5 | Frontier Co-op | score | 250 | 85 | 2 | 3 | 9 | 0 | — |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 24 (burn and replant) | 3 (live with it) |
| A comet | 36 (capture its ice) | 1 (study it) |
| A derelict | 17 (salvage it) | 0 (study it) |
| An epidemic | 18 (medical aid) | 8 (quarantine) |
| Flare | 14 (shelter) | 1 (ride it out) |
| Founders’ Day | 66 (a festival) | 14 (a quiet day) |
| Lane drift | 35 (retune it) | 6 (let it drift) |
| Settlers’ petition | 13 (grant it) | 13 (refuse) |
| A smugglers’ offer | 46 (buy) | 4 (report them) |
| A strike | 22 (meet their demands) | 6 (wait it out) |
