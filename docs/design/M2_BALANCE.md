# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4):
5 rivals, 8 seeds, 100 turns each for the tables, then on to the end of each game. Regenerate it
after any change to the rules or the rivals.*

The slowest of the first 100 turns took 82 ms on the machine that wrote this; the largest save at turn 100
was 63.2 KB. The longest time in debt was 2 turns in a row. The longest time hungry was 2 turns in a row.

In all 8 games, by turn 100: 48 turns of plunder by raids, 0 battles, 8 wars declared and 1 colony or outpost taken by invasion (M4).
The Assembly formed in 6 of them, on turn 50 at the earliest and 75 at the latest; it held 7 elections and passed 10 resolutions by turn 100.

The tree has 86 technologies, of which a power can learn 83 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.0 | 7.5 | 17.4 | 15.1 | 124 | 67 |
| 25 | Frontier Co-op | 4.1 | 2.0 | 20.2 | 6.4 | 9.1 | 14.3 | 114 | 49 |
| 25 | Hollow Wake | 3.9 | 2.4 | 19.6 | 7.1 | 8.8 | 16.1 | 118 | 92 |
| 25 | Dusk Concord | 3.8 | 2.0 | 18.5 | 5.0 | 8.9 | 14.4 | 99 | 54 |
| 25 | Drift Moot | 4.4 | 1.0 | 21.6 | 5.0 | 9.0 | 11.6 | 105 | 38 |
| 50 | Transit Authority | 5.6 | 4.4 | 28.1 | 15.6 | 40.1 | 29.0 | 210 | 74 |
| 50 | Frontier Co-op | 6.9 | 4.1 | 38.6 | 11.8 | 15.6 | 21.8 | 198 | 51 |
| 50 | Hollow Wake | 6.4 | 3.9 | 35.5 | 12.8 | 14.0 | 31.9 | 201 | 177 |
| 50 | Dusk Concord | 7.1 | 4.3 | 34.9 | 9.3 | 12.9 | 19.9 | 181 | 68 |
| 50 | Drift Moot | 5.4 | 2.0 | 44.7 | 9.0 | 18.6 | 17.8 | 172 | 47 |
| 100 | Transit Authority | 7.3 | 4.8 | 38.4 | 37.9 | 107.8 | 40.4 | 417 | 42 |
| 100 | Frontier Co-op | 11.4 | 6.8 | 77.3 | 22.9 | 38.5 | 35.9 | 376 | 36 |
| 100 | Hollow Wake | 12.5 | 8.8 | 78.5 | 23.3 | 34.4 | 49.0 | 408 | 142 |
| 100 | Dusk Concord | 11.4 | 7.4 | 86.4 | 22.1 | 38.0 | 38.3 | 385 | 53 |
| 100 | Drift Moot | 6.0 | 2.8 | 93.0 | 19.6 | 39.1 | 28.4 | 317 | 75 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 7 | 4 | 42.0 | 43 | 133 | 40 | 461 | 32 |
| 42 | Frontier Co-op | 11 | 5 | 60.4 | 21 | 23 | 35 | 335 | 48 |
| 42 | Hollow Wake | 11 | 8 | 61.7 | 22 | 25 | 43 | 360 | 165 |
| 42 | Dusk Concord | 12 | 8 | 103.6 | 23 | 45 | 41 | 423 | 64 |
| 42 | Drift Moot | 5 | 2 | 87.3 | 19 | 35 | 25 | 290 | 69 |
| 7 | Transit Authority | 11 | 4 | 43.1 | 35 | 69 | 45 | 438 | 19 |
| 7 | Frontier Co-op | 12 | 4 | 79.7 | 24 | 38 | 36 | 390 | 36 |
| 7 | Hollow Wake | 9 | 7 | 65.4 | 23 | 32 | 48 | 352 | 237 |
| 7 | Dusk Concord | 12 | 10 | 100.6 | 22 | 35 | 42 | 407 | 41 |
| 7 | Drift Moot | 9 | 5 | 119.7 | 23 | 58 | 38 | 413 | 78 |
| 2176 | Transit Authority | 8 | 5 | 41.7 | 40 | 144 | 42 | 444 | 55 |
| 2176 | Frontier Co-op | 13 | 10 | 82.8 | 21 | 41 | 38 | 392 | 17 |
| 2176 | Hollow Wake | 12 | 8 | 86.9 | 24 | 41 | 50 | 419 | 261 |
| 2176 | Dusk Concord | 11 | 6 | 65.6 | 20 | 32 | 33 | 341 | 23 |
| 2176 | Drift Moot | 6 | 2 | 83.1 | 19 | 34 | 28 | 301 | 80 |
| 1 | Transit Authority | 9 | 5 | 47.7 | 42 | 133 | 42 | 477 | 32 |
| 1 | Frontier Co-op | 12 | 9 | 82.7 | 22 | 50 | 34 | 386 | 29 |
| 1 | Hollow Wake | 12 | 7 | 70.2 | 22 | 34 | 49 | 382 | 84 |
| 1 | Dusk Concord | 11 | 9 | 86.8 | 23 | 40 | 40 | 390 | 61 |
| 1 | Drift Moot | 5 | 2 | 85.2 | 19 | 36 | 27 | 290 | 97 |
| 2 | Transit Authority | 6 | 5 | 39.7 | 38 | 141 | 38 | 413 | 40 |
| 2 | Frontier Co-op | 11 | 4 | 80.9 | 23 | 37 | 32 | 376 | 32 |
| 2 | Hollow Wake | 16 | 11 | 84.7 | 23 | 31 | 50 | 454 | 135 |
| 2 | Dusk Concord | 10 | 6 | 63.4 | 21 | 25 | 35 | 332 | 28 |
| 2 | Drift Moot | 6 | 5 | 92.3 | 20 | 41 | 31 | 335 | 60 |
| 3 | Transit Authority | 5 | 4 | 29.0 | 38 | 93 | 33 | 369 | 60 |
| 3 | Frontier Co-op | 11 | 7 | 82.8 | 24 | 44 | 37 | 385 | 36 |
| 3 | Hollow Wake | 13 | 11 | 88.4 | 23 | 32 | 52 | 430 | 86 |
| 3 | Dusk Concord | 12 | 9 | 95.2 | 23 | 42 | 40 | 409 | 77 |
| 3 | Drift Moot | 6 | 2 | 104.8 | 20 | 42 | 27 | 325 | 58 |
| 4 | Transit Authority | 7 | 6 | 34.0 | 34 | 67 | 41 | 383 | 40 |
| 4 | Frontier Co-op | 10 | 8 | 67.1 | 24 | 34 | 39 | 357 | 52 |
| 4 | Hollow Wake | 15 | 10 | 101.1 | 25 | 46 | 54 | 476 | -51 |
| 4 | Dusk Concord | 12 | 6 | 95.3 | 23 | 44 | 40 | 409 | 100 |
| 4 | Drift Moot | 5 | 2 | 87.8 | 19 | 34 | 25 | 289 | 85 |
| 5 | Transit Authority | 5 | 5 | 30.0 | 33 | 82 | 42 | 354 | 54 |
| 5 | Frontier Co-op | 11 | 7 | 81.8 | 24 | 41 | 36 | 384 | 35 |
| 5 | Hollow Wake | 12 | 8 | 69.4 | 24 | 34 | 46 | 394 | 219 |
| 5 | Dusk Concord | 11 | 5 | 80.6 | 22 | 41 | 35 | 371 | 32 |
| 5 | Drift Moot | 6 | 2 | 83.9 | 18 | 33 | 26 | 292 | 76 |

## To the end of each game (M4)

Each game played on, after turn 100, until it was won or reached the default limit of 250 turns
(M4_FLEETS.md §30.4). 0 games were won before the limit; 8 games saw a war by turn 150;
0 powers left the game before turn 100. The slowest turn of all took 147 ms (turn 247); the
largest save was 131.1 KB. The deepest any treasury fell was -337 credits;
the longest time in debt was 126 turns in a row.
Of the 12 relic sites in each game, some power knew 7 to 10 by turn 150 (M5).

| Seed | Won by | How | On turn | First war | Wars | Battles | Taken | Surrenders | Left the game | Chapters | Most chapters |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Frontier Co-op | score | 250 | 80 | 4 | 4 | 6 | 0 | — | 9 | Transit Authority (6) |
| 7 | Frontier Co-op | score | 250 | 90 | 6 | 11 | 11 | 0 | — | 15 | Transit Authority (12) |
| 2176 | Frontier Co-op | score | 250 | 90 | 3 | 3 | 5 | 0 | — | 9 | Transit Authority (9) |
| 1 | Frontier Co-op | score | 250 | 90 | 3 | 12 | 14 | 0 | — | 6 | Transit Authority (6) |
| 2 | Frontier Co-op | score | 250 | 95 | 2 | 1 | 2 | 0 | — | 8 | Transit Authority (6) |
| 3 | Frontier Co-op | score | 250 | 85 | 2 | 2 | 7 | 0 | — | 3 | Transit Authority (3) |
| 4 | Hollow Wake | score | 250 | 85 | 2 | 6 | 16 | 0 | — | 10 | Transit Authority (6) |
| 5 | Frontier Co-op | score | 250 | 85 | 3 | 1 | 8 | 0 | — | 8 | Transit Authority (6) |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 24 (burn and replant) | 2 (live with it) |
| A comet | 34 (capture its ice) | 2 (study it) |
| A derelict | 17 (salvage it) | 0 (study it) |
| An epidemic | 23 (medical aid) | 7 (quarantine) |
| Flare | 16 (shelter) | 0 (ride it out) |
| Founders’ Day | 66 (a festival) | 14 (a quiet day) |
| A bumper harvest | 1 (store it) | 0 (sell it) |
| Lane drift | 34 (retune it) | 6 (let it drift) |
| Settlers’ petition | 14 (grant it) | 14 (refuse) |
| A smugglers’ offer | 47 (buy) | 2 (report them) |
| A strike | 20 (meet their demands) | 7 (wait it out) |
