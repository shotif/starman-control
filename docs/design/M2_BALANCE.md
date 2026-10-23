# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4):
6 rivals, 8 seeds, 100 turns each for the tables, then on to the end of each game. Regenerate it
after any change to the rules or the rivals.*

The slowest of the first 100 turns took 83 ms on the machine that wrote this; the largest save at turn 100
was 81.4 KB. The longest time in debt was 2 turns in a row. The longest time hungry was 1 turn in a row.

In all 8 games, by turn 100: 71 turns of plunder by raids, 3 battles, 8 wars declared and 1 colony or outpost taken by invasion (M4).
The Assembly formed in 6 of them, on turn 50 at the earliest and 96 at the latest; it held 6 elections and passed 7 resolutions by turn 100.

The tree has 88 technologies, of which a power can learn 85 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.1 | 2.9 | 18.7 | 7.6 | 15.9 | 16.0 | 125 | 71 |
| 25 | Frontier Co-op | 3.8 | 1.8 | 19.9 | 6.3 | 9.5 | 13.9 | 109 | 41 |
| 25 | Hollow Wake | 3.6 | 2.3 | 19.3 | 7.1 | 8.8 | 15.6 | 115 | 85 |
| 25 | Dusk Concord | 3.9 | 2.0 | 18.7 | 5.0 | 8.9 | 14.3 | 101 | 56 |
| 25 | Drift Moot | 4.4 | 1.1 | 21.6 | 5.0 | 9.0 | 11.3 | 106 | 39 |
| 25 | Continuance | 2.8 | 2.0 | 16.4 | 5.4 | 8.0 | 12.1 | 88 | 61 |
| 50 | Transit Authority | 5.8 | 4.3 | 28.0 | 16.6 | 38.1 | 29.5 | 215 | 65 |
| 50 | Frontier Co-op | 6.1 | 4.0 | 36.4 | 11.8 | 15.1 | 22.1 | 189 | 50 |
| 50 | Hollow Wake | 5.6 | 3.3 | 33.5 | 12.3 | 13.5 | 29.6 | 188 | 171 |
| 50 | Dusk Concord | 7.1 | 4.5 | 35.0 | 9.5 | 13.0 | 19.8 | 183 | 60 |
| 50 | Drift Moot | 5.0 | 1.5 | 43.5 | 9.0 | 18.4 | 16.3 | 166 | 49 |
| 50 | Continuance | 5.9 | 4.1 | 27.1 | 10.1 | 9.4 | 19.4 | 173 | 58 |
| 100 | Transit Authority | 6.9 | 4.5 | 37.0 | 40.4 | 110.3 | 42.1 | 422 | 41 |
| 100 | Frontier Co-op | 11.0 | 6.4 | 73.8 | 23.0 | 33.3 | 36.6 | 371 | 49 |
| 100 | Hollow Wake | 11.1 | 8.3 | 72.1 | 23.1 | 32.4 | 47.0 | 381 | 87 |
| 100 | Dusk Concord | 11.5 | 7.8 | 88.0 | 22.5 | 39.0 | 38.4 | 391 | 65 |
| 100 | Drift Moot | 5.5 | 1.6 | 86.9 | 19.0 | 33.5 | 26.1 | 297 | 67 |
| 100 | Continuance | 10.8 | 6.6 | 69.4 | 22.9 | 29.5 | 41.0 | 365 | 46 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 7 | 4 | 42.0 | 45 | 129 | 40 | 466 | 28 |
| 42 | Frontier Co-op | 11 | 6 | 60.4 | 21 | 22 | 38 | 341 | 77 |
| 42 | Hollow Wake | 11 | 8 | 60.1 | 22 | 23 | 40 | 356 | 70 |
| 42 | Dusk Concord | 12 | 9 | 117.5 | 24 | 52 | 40 | 445 | 55 |
| 42 | Drift Moot | 6 | 2 | 91.2 | 19 | 37 | 25 | 308 | 69 |
| 42 | Continuance | 10 | 6 | 68.8 | 24 | 30 | 42 | 364 | 31 |
| 7 | Transit Authority | 7 | 4 | 34.0 | 35 | 102 | 42 | 381 | 27 |
| 7 | Frontier Co-op | 11 | 8 | 79.3 | 24 | 36 | 39 | 383 | 29 |
| 7 | Hollow Wake | 9 | 7 | 64.3 | 23 | 31 | 46 | 348 | 46 |
| 7 | Dusk Concord | 13 | 10 | 104.3 | 23 | 38 | 40 | 431 | 92 |
| 7 | Drift Moot | 5 | 1 | 81.1 | 19 | 34 | 28 | 288 | 73 |
| 7 | Continuance | 10 | 7 | 62.1 | 22 | 25 | 39 | 346 | 55 |
| 2176 | Transit Authority | 9 | 5 | 44.0 | 44 | 153 | 44 | 479 | 50 |
| 2176 | Frontier Co-op | 11 | 10 | 77.6 | 23 | 37 | 38 | 376 | 40 |
| 2176 | Hollow Wake | 12 | 9 | 85.8 | 24 | 39 | 49 | 424 | 83 |
| 2176 | Dusk Concord | 11 | 4 | 65.9 | 21 | 33 | 34 | 346 | 71 |
| 2176 | Drift Moot | 5 | 2 | 77.6 | 19 | 32 | 28 | 285 | 38 |
| 2176 | Continuance | 8 | 7 | 60.2 | 22 | 25 | 37 | 322 | 22 |
| 1 | Transit Authority | 6 | 5 | 42.0 | 44 | 133 | 43 | 451 | 41 |
| 1 | Frontier Co-op | 12 | 8 | 81.0 | 23 | 40 | 35 | 389 | 46 |
| 1 | Hollow Wake | 10 | 6 | 57.0 | 21 | 23 | 43 | 331 | 26 |
| 1 | Dusk Concord | 12 | 9 | 87.4 | 23 | 40 | 42 | 401 | 74 |
| 1 | Drift Moot | 6 | 2 | 87.2 | 19 | 33 | 28 | 302 | 98 |
| 1 | Continuance | 11 | 7 | 68.8 | 23 | 28 | 40 | 366 | 81 |
| 2 | Transit Authority | 7 | 3 | 36.3 | 39 | 93 | 43 | 401 | 69 |
| 2 | Frontier Co-op | 11 | 3 | 80.6 | 23 | 36 | 32 | 374 | 55 |
| 2 | Hollow Wake | 15 | 12 | 85.0 | 24 | 34 | 53 | 445 | 202 |
| 2 | Dusk Concord | 10 | 8 | 63.8 | 23 | 27 | 38 | 348 | 30 |
| 2 | Drift Moot | 6 | 1 | 94.2 | 19 | 32 | 25 | 309 | 63 |
| 2 | Continuance | 11 | 5 | 64.7 | 23 | 29 | 38 | 362 | 32 |
| 3 | Transit Authority | 6 | 5 | 32.0 | 39 | 100 | 39 | 404 | 20 |
| 3 | Frontier Co-op | 11 | 6 | 62.7 | 22 | 22 | 36 | 348 | 66 |
| 3 | Hollow Wake | 11 | 8 | 78.8 | 23 | 37 | 47 | 384 | 64 |
| 3 | Dusk Concord | 13 | 9 | 95.7 | 23 | 42 | 41 | 419 | 72 |
| 3 | Drift Moot | 6 | 2 | 92.4 | 19 | 34 | 25 | 306 | 28 |
| 3 | Continuance | 12 | 7 | 75.6 | 23 | 33 | 42 | 385 | 37 |
| 4 | Transit Authority | 7 | 5 | 34.0 | 41 | 85 | 44 | 424 | 56 |
| 4 | Frontier Co-op | 10 | 6 | 65.1 | 24 | 32 | 38 | 357 | 62 |
| 4 | Hollow Wake | 12 | 8 | 88.2 | 25 | 43 | 52 | 425 | 183 |
| 4 | Dusk Concord | 11 | 9 | 98.2 | 24 | 40 | 39 | 407 | 65 |
| 4 | Drift Moot | 5 | 2 | 88.7 | 19 | 32 | 25 | 290 | 72 |
| 4 | Continuance | 12 | 8 | 76.3 | 24 | 31 | 46 | 394 | 54 |
| 5 | Transit Authority | 6 | 5 | 31.5 | 36 | 87 | 42 | 370 | 35 |
| 5 | Frontier Co-op | 11 | 4 | 84.0 | 24 | 41 | 37 | 397 | 19 |
| 5 | Hollow Wake | 9 | 8 | 57.4 | 23 | 29 | 46 | 335 | 18 |
| 5 | Dusk Concord | 10 | 4 | 71.6 | 19 | 40 | 33 | 328 | 64 |
| 5 | Drift Moot | 5 | 1 | 82.6 | 19 | 34 | 25 | 289 | 95 |
| 5 | Continuance | 12 | 6 | 78.4 | 22 | 35 | 44 | 381 | 53 |

## To the end of each game (M4)

Each game played on, after turn 100, until it was won or reached the default limit of 250 turns
(M4_FLEETS.md §30.4). 1 game was won before the limit; 8 games saw a war by turn 150;
0 powers left the game before turn 100. The slowest turn of all took 176 ms (turn 240); the
largest save was 168.0 KB. The deepest any treasury fell was -156 credits;
the longest time in debt was 54 turns in a row.
Of the 12 relic sites in each game, some power knew 8 to 11 by turn 150 (M5).

| Seed | Won by | How | On turn | First war | Wars | Battles | Taken | Surrenders | Left the game | Chapters | Most chapters | The arks | The Last Hearth at the end |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Frontier Co-op | score | 250 | 90 | 4 | 17 | 3 | 0 | — | 18 | Transit Authority (6) | given by the Transit Authority, turn 129 | 4 colonies, 7 outposts |
| 7 | Frontier Co-op | score | 250 | 90 | 1 | 12 | 3 | 0 | — | 18 | Transit Authority (6) | given by the Drift Moot, turn 115 | 5 colonies, 2 outposts |
| 2176 | Frontier Co-op | score | 250 | 95 | 4 | 9 | 3 | 0 | — | 10 | Transit Authority (9) | taken in by the Frontier Co-op, turn 147 | — |
| 1 | Frontier Co-op | score | 250 | 90 | 3 | 13 | 5 | 0 | — | 6 | Transit Authority (6) | given by the Transit Authority, turn 123 | 3 colonies, 1 outposts |
| 2 | Frontier Co-op | score | 250 | 85 | 2 | 4 | 3 | 0 | — | 6 | Transit Authority (6) | given by the Drift Moot, turn 130 | 5 colonies, 2 outposts |
| 3 | Frontier Co-op | score | 250 | 90 | 5 | 6 | 2 | 0 | — | 6 | Transit Authority (6) | given by the Transit Authority, turn 144 | 5 colonies, 2 outposts |
| 4 | Hollow Wake | score | 250 | 85 | 3 | 19 | 4 | 0 | — | 9 | Transit Authority (6) | given by the Transit Authority, turn 133 | 4 colonies, 1 outposts |
| 5 | Frontier Co-op | the Assembly | 90 | 75 | 1 | 0 | 0 | 0 | — | 3 | Transit Authority (3) | — | — |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| An audit | 3 (prosecute) | 0 (settle quietly) |
| Blight | 19 (burn and replant) | 4 (live with it) |
| The charts match | 1 (fund the study) | 0 (publish it) |
| A comet | 40 (capture its ice) | 3 (study it) |
| A derelict | 15 (salvage it) | 0 (study it) |
| An epidemic | 17 (medical aid) | 8 (quarantine) |
| A feud in the dens | 8 (back the stronger) | 0 (buy them both off) |
| Flare | 10 (shelter) | 0 (ride it out) |
| Founders’ Day | 79 (a festival) | 17 (a quiet day) |
| A great flare | 5 (study it) | 0 (shelter) |
| A great storm | 7 (ride it out) | 0 (harvest its lightning) |
| A bumper harvest | 1 (store it) | 0 (sell it) |
| A key sings | 0 (shield it) | 3 (listen to it) |
| Lane drift | 29 (retune it) | 2 (let it drift) |
| The long night | 6 (move the fields) | 0 (wait for the light) |
| A meteor storm | 41 (shelter) | 0 (mine the falls) |
| A new star | 17 (turn the telescopes) | 0 (a night of lights) |
| Settlers’ petition | 13 (grant it) | 14 (refuse) |
| Digging next door | 1 (send observers) | 0 (leave them to it) |
| The shareholders’ vote | 8 (more homes) | 0 (more works) |
| A smugglers’ offer | 34 (buy) | 2 (report them) |
| A strike | 13 (meet their demands) | 5 (wait it out) |
