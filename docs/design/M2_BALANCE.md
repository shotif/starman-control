# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4):
5 rivals, 8 seeds, 100 turns each for the tables, then on to the end of each game. Regenerate it
after any change to the rules or the rivals.*

The slowest of the first 100 turns took 84 ms on the machine that wrote this; the largest save at turn 100
was 65.8 KB. The longest time in debt was 1 turn in a row. The longest time hungry was 1 turn in a row.

In all 8 games, by turn 100: 39 turns of plunder by raids, 6 battles, 8 wars declared and 2 colonies or outposts taken by invasion (M4).
The Assembly formed in 6 of them, on turn 50 at the earliest and 75 at the latest; it held 7 elections and passed 11 resolutions by turn 100.

The tree has 88 technologies, of which a power can learn 85 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 7.5 | 17.4 | 15.1 | 124 | 67 |
| 25 | Frontier Co-op | 4.1 | 2.0 | 20.2 | 6.4 | 9.1 | 14.1 | 114 | 49 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 16.1 | 118 | 92 |
| 25 | Dusk Concord | 3.8 | 2.0 | 18.5 | 5.0 | 8.9 | 14.4 | 99 | 54 |
| 25 | Drift Moot | 4.4 | 1.0 | 21.6 | 5.0 | 9.0 | 11.6 | 105 | 38 |
| 50 | Transit Authority | 5.6 | 4.4 | 27.9 | 16.0 | 38.3 | 29.8 | 211 | 81 |
| 50 | Frontier Co-op | 6.9 | 4.1 | 38.5 | 11.8 | 15.6 | 22.0 | 198 | 51 |
| 50 | Hollow Wake | 6.4 | 3.9 | 35.5 | 12.8 | 14.0 | 31.9 | 201 | 171 |
| 50 | Dusk Concord | 7.1 | 4.3 | 34.9 | 9.3 | 12.9 | 19.9 | 181 | 68 |
| 50 | Drift Moot | 5.4 | 2.0 | 44.7 | 9.0 | 18.6 | 17.8 | 172 | 47 |
| 100 | Transit Authority | 7.4 | 4.6 | 38.3 | 38.5 | 105.8 | 42.9 | 418 | 50 |
| 100 | Frontier Co-op | 11.6 | 6.6 | 76.7 | 23.1 | 36.0 | 36.9 | 382 | 49 |
| 100 | Hollow Wake | 12.3 | 9.0 | 78.2 | 23.3 | 34.1 | 49.8 | 406 | 185 |
| 100 | Dusk Concord | 11.5 | 7.4 | 83.8 | 22.0 | 37.5 | 38.1 | 383 | 62 |
| 100 | Drift Moot | 6.0 | 2.8 | 93.0 | 19.6 | 39.1 | 28.4 | 317 | 75 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 7 | 4 | 42.0 | 44 | 129 | 41 | 461 | 40 |
| 42 | Frontier Co-op | 11 | 5 | 60.1 | 21 | 23 | 38 | 341 | 70 |
| 42 | Hollow Wake | 11 | 7 | 61.4 | 22 | 25 | 45 | 360 | 183 |
| 42 | Dusk Concord | 12 | 8 | 103.6 | 23 | 45 | 41 | 423 | 64 |
| 42 | Drift Moot | 5 | 2 | 87.3 | 19 | 35 | 25 | 290 | 69 |
| 7 | Transit Authority | 11 | 2 | 42.9 | 39 | 100 | 47 | 455 | 62 |
| 7 | Frontier Co-op | 12 | 4 | 79.7 | 24 | 38 | 36 | 390 | 36 |
| 7 | Hollow Wake | 9 | 8 | 65.4 | 23 | 32 | 50 | 350 | 219 |
| 7 | Dusk Concord | 12 | 10 | 82.8 | 22 | 32 | 41 | 390 | 69 |
| 7 | Drift Moot | 9 | 5 | 119.7 | 23 | 58 | 38 | 413 | 78 |
| 2176 | Transit Authority | 7 | 5 | 40.0 | 41 | 145 | 42 | 437 | 33 |
| 2176 | Frontier Co-op | 12 | 10 | 81.1 | 23 | 36 | 38 | 391 | 60 |
| 2176 | Hollow Wake | 12 | 8 | 86.9 | 24 | 41 | 50 | 419 | 261 |
| 2176 | Dusk Concord | 11 | 6 | 65.6 | 20 | 32 | 33 | 341 | 23 |
| 2176 | Drift Moot | 6 | 2 | 83.1 | 19 | 34 | 28 | 301 | 80 |
| 1 | Transit Authority | 7 | 5 | 44.0 | 44 | 133 | 43 | 463 | 28 |
| 1 | Frontier Co-op | 12 | 8 | 82.6 | 24 | 40 | 34 | 395 | 32 |
| 1 | Hollow Wake | 13 | 7 | 72.3 | 22 | 34 | 48 | 394 | 99 |
| 1 | Dusk Concord | 12 | 9 | 87.8 | 22 | 40 | 40 | 396 | 81 |
| 1 | Drift Moot | 5 | 2 | 85.2 | 19 | 36 | 27 | 290 | 97 |
| 2 | Transit Authority | 7 | 5 | 40.9 | 40 | 129 | 41 | 429 | 94 |
| 2 | Frontier Co-op | 13 | 5 | 82.9 | 23 | 37 | 32 | 398 | 38 |
| 2 | Hollow Wake | 16 | 11 | 84.7 | 23 | 31 | 50 | 457 | 235 |
| 2 | Dusk Concord | 10 | 6 | 59.2 | 21 | 24 | 35 | 328 | 52 |
| 2 | Drift Moot | 6 | 5 | 92.3 | 20 | 41 | 31 | 335 | 60 |
| 3 | Transit Authority | 7 | 6 | 30.0 | 34 | 63 | 43 | 367 | 61 |
| 3 | Frontier Co-op | 11 | 7 | 82.8 | 24 | 44 | 39 | 391 | 36 |
| 3 | Hollow Wake | 12 | 12 | 87.5 | 23 | 32 | 53 | 422 | 234 |
| 3 | Dusk Concord | 12 | 9 | 95.2 | 23 | 42 | 40 | 409 | 77 |
| 3 | Drift Moot | 6 | 2 | 104.8 | 20 | 42 | 27 | 325 | 58 |
| 4 | Transit Authority | 8 | 5 | 36.2 | 31 | 60 | 46 | 367 | 49 |
| 4 | Frontier Co-op | 10 | 8 | 67.1 | 23 | 34 | 40 | 355 | 51 |
| 4 | Hollow Wake | 14 | 11 | 99.3 | 25 | 44 | 58 | 464 | 135 |
| 4 | Dusk Concord | 12 | 6 | 95.3 | 23 | 44 | 40 | 409 | 100 |
| 4 | Drift Moot | 5 | 2 | 87.8 | 19 | 34 | 25 | 289 | 85 |
| 5 | Transit Authority | 5 | 5 | 30.0 | 35 | 87 | 40 | 364 | 36 |
| 5 | Frontier Co-op | 12 | 6 | 77.0 | 23 | 36 | 38 | 398 | 67 |
| 5 | Hollow Wake | 11 | 8 | 68.4 | 24 | 34 | 44 | 382 | 116 |
| 5 | Dusk Concord | 11 | 5 | 80.6 | 22 | 41 | 35 | 371 | 32 |
| 5 | Drift Moot | 6 | 2 | 83.9 | 18 | 33 | 26 | 292 | 76 |

## To the end of each game (M4)

Each game played on, after turn 100, until it was won or reached the default limit of 250 turns
(M4_FLEETS.md §30.4). 0 games were won before the limit; 8 games saw a war by turn 150;
0 powers left the game before turn 100. The slowest turn of all took 110 ms (turn 233); the
largest save was 135.4 KB. The deepest any treasury fell was -410 credits;
the longest time in debt was 69 turns in a row.
Of the 12 relic sites in each game, some power knew 8 to 10 by turn 150 (M5).

| Seed | Won by | How | On turn | First war | Wars | Battles | Taken | Surrenders | Left the game | Chapters | Most chapters |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Frontier Co-op | score | 250 | 80 | 4 | 9 | 3 | 0 | — | 16 | Transit Authority (8) |
| 7 | Frontier Co-op | score | 250 | 90 | 3 | 10 | 17 | 0 | — | 18 | Frontier Co-op (9) |
| 2176 | Frontier Co-op | score | 250 | 85 | 3 | 7 | 4 | 0 | — | 9 | Transit Authority (9) |
| 1 | Frontier Co-op | score | 250 | 90 | 4 | 13 | 11 | 0 | — | 9 | Transit Authority (6) |
| 2 | Frontier Co-op | score | 250 | 90 | 2 | 22 | 1 | 0 | — | 11 | Transit Authority (6) |
| 3 | Frontier Co-op | score | 250 | 90 | 4 | 5 | 7 | 0 | — | 6 | Transit Authority (3) |
| 4 | Hollow Wake | score | 250 | 90 | 1 | 34 | 5 | 0 | — | 15 | Transit Authority (6) |
| 5 | Frontier Co-op | score | 250 | 85 | 2 | 5 | 2 | 0 | — | 9 | Transit Authority (6) |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 24 (burn and replant) | 2 (live with it) |
| A comet | 35 (capture its ice) | 2 (study it) |
| A derelict | 17 (salvage it) | 0 (study it) |
| An epidemic | 23 (medical aid) | 7 (quarantine) |
| Flare | 15 (shelter) | 0 (ride it out) |
| Founders’ Day | 66 (a festival) | 14 (a quiet day) |
| Lane drift | 34 (retune it) | 6 (let it drift) |
| Settlers’ petition | 13 (grant it) | 15 (refuse) |
| A smugglers’ offer | 46 (buy) | 3 (report them) |
| A strike | 19 (meet their demands) | 9 (wait it out) |
