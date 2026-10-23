# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4):
5 rivals, 8 seeds, 100 turns each for the tables, then on to the end of each game. Regenerate it
after any change to the rules or the rivals.*

The slowest of the first 100 turns took 84 ms on the machine that wrote this; the largest save at turn 100
was 69.2 KB. The longest time in debt was 2 turns in a row. The longest time hungry was 1 turn in a row.

In all 8 games, by turn 100: 67 turns of plunder by raids, 8 battles, 8 wars declared and 3 colonies or outposts taken by invasion (M4).
The Assembly formed in 5 of them, on turn 50 at the earliest and 73 at the latest; it held 6 elections and passed 7 resolutions by turn 100.

The tree has 88 technologies, of which a power can learn 85 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.1 | 2.9 | 18.7 | 7.6 | 15.9 | 15.4 | 125 | 71 |
| 25 | Frontier Co-op | 3.8 | 1.8 | 19.9 | 6.3 | 9.5 | 13.9 | 109 | 41 |
| 25 | Hollow Wake | 3.6 | 2.3 | 19.3 | 7.1 | 8.8 | 15.6 | 115 | 85 |
| 25 | Dusk Concord | 3.9 | 2.0 | 18.7 | 5.0 | 8.9 | 14.3 | 101 | 56 |
| 25 | Drift Moot | 4.4 | 1.1 | 21.6 | 5.0 | 9.0 | 11.3 | 106 | 39 |
| 50 | Transit Authority | 5.8 | 4.3 | 28.0 | 16.5 | 38.1 | 29.6 | 215 | 65 |
| 50 | Frontier Co-op | 6.1 | 4.0 | 36.4 | 12.0 | 15.1 | 22.3 | 191 | 51 |
| 50 | Hollow Wake | 5.6 | 3.3 | 33.5 | 12.3 | 13.5 | 29.6 | 188 | 171 |
| 50 | Dusk Concord | 7.1 | 4.5 | 35.0 | 9.5 | 13.0 | 19.8 | 183 | 60 |
| 50 | Drift Moot | 5.0 | 1.5 | 43.5 | 9.0 | 18.4 | 16.3 | 166 | 49 |
| 100 | Transit Authority | 6.5 | 4.3 | 36.5 | 39.8 | 108.1 | 42.1 | 415 | 40 |
| 100 | Frontier Co-op | 11.1 | 6.6 | 72.5 | 22.6 | 32.6 | 36.5 | 369 | 46 |
| 100 | Hollow Wake | 11.1 | 8.5 | 72.2 | 23.1 | 32.4 | 47.6 | 381 | 116 |
| 100 | Dusk Concord | 11.4 | 7.6 | 85.5 | 22.0 | 38.4 | 37.5 | 384 | 41 |
| 100 | Drift Moot | 5.5 | 1.6 | 86.9 | 19.0 | 33.5 | 26.0 | 297 | 71 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 7 | 4 | 42.0 | 44 | 121 | 41 | 460 | 55 |
| 42 | Frontier Co-op | 11 | 6 | 60.0 | 21 | 22 | 38 | 341 | 72 |
| 42 | Hollow Wake | 11 | 8 | 60.2 | 22 | 25 | 40 | 361 | 87 |
| 42 | Dusk Concord | 12 | 9 | 106.6 | 23 | 47 | 40 | 429 | 37 |
| 42 | Drift Moot | 6 | 2 | 91.2 | 19 | 37 | 25 | 308 | 76 |
| 7 | Transit Authority | 7 | 4 | 34.0 | 35 | 102 | 42 | 381 | 27 |
| 7 | Frontier Co-op | 11 | 8 | 79.3 | 24 | 36 | 39 | 383 | 30 |
| 7 | Hollow Wake | 9 | 7 | 64.3 | 23 | 31 | 46 | 348 | 232 |
| 7 | Dusk Concord | 13 | 10 | 103.7 | 23 | 38 | 39 | 430 | 41 |
| 7 | Drift Moot | 5 | 1 | 81.1 | 19 | 34 | 27 | 289 | 60 |
| 2176 | Transit Authority | 7 | 4 | 41.0 | 42 | 144 | 44 | 446 | 64 |
| 2176 | Frontier Co-op | 11 | 10 | 78.1 | 21 | 43 | 38 | 368 | 34 |
| 2176 | Hollow Wake | 12 | 10 | 85.8 | 24 | 39 | 54 | 423 | 101 |
| 2176 | Dusk Concord | 11 | 4 | 65.9 | 20 | 33 | 33 | 341 | 71 |
| 2176 | Drift Moot | 5 | 2 | 77.6 | 19 | 32 | 28 | 285 | 38 |
| 1 | Transit Authority | 6 | 4 | 42.0 | 44 | 133 | 44 | 451 | 47 |
| 1 | Frontier Co-op | 12 | 8 | 81.0 | 24 | 40 | 34 | 393 | 26 |
| 1 | Hollow Wake | 10 | 7 | 57.1 | 21 | 21 | 45 | 331 | 104 |
| 1 | Dusk Concord | 12 | 9 | 87.4 | 23 | 40 | 41 | 401 | 74 |
| 1 | Drift Moot | 6 | 2 | 87.2 | 19 | 33 | 28 | 301 | 100 |
| 2 | Transit Authority | 6 | 3 | 35.3 | 38 | 93 | 41 | 385 | 29 |
| 2 | Frontier Co-op | 11 | 5 | 68.0 | 21 | 25 | 32 | 350 | 53 |
| 2 | Hollow Wake | 15 | 12 | 85.0 | 24 | 34 | 53 | 445 | 199 |
| 2 | Dusk Concord | 10 | 8 | 63.8 | 22 | 27 | 37 | 343 | 30 |
| 2 | Drift Moot | 6 | 1 | 94.2 | 19 | 32 | 25 | 309 | 89 |
| 3 | Transit Authority | 6 | 5 | 32.0 | 39 | 100 | 39 | 404 | 20 |
| 3 | Frontier Co-op | 11 | 6 | 62.7 | 22 | 22 | 36 | 348 | 40 |
| 3 | Hollow Wake | 11 | 8 | 79.1 | 23 | 37 | 47 | 384 | 87 |
| 3 | Dusk Concord | 12 | 9 | 94.7 | 23 | 42 | 40 | 408 | 25 |
| 3 | Drift Moot | 6 | 2 | 92.5 | 19 | 34 | 25 | 306 | 57 |
| 4 | Transit Authority | 7 | 5 | 34.0 | 41 | 85 | 44 | 424 | 27 |
| 4 | Frontier Co-op | 10 | 6 | 65.1 | 24 | 32 | 38 | 357 | 62 |
| 4 | Hollow Wake | 12 | 8 | 88.3 | 25 | 43 | 51 | 424 | 88 |
| 4 | Dusk Concord | 11 | 9 | 90.5 | 23 | 40 | 38 | 393 | -12 |
| 4 | Drift Moot | 5 | 2 | 88.7 | 19 | 32 | 25 | 290 | 72 |
| 5 | Transit Authority | 6 | 5 | 31.5 | 35 | 87 | 42 | 365 | 54 |
| 5 | Frontier Co-op | 12 | 4 | 85.9 | 24 | 41 | 37 | 408 | 53 |
| 5 | Hollow Wake | 9 | 8 | 57.4 | 23 | 29 | 45 | 335 | 33 |
| 5 | Dusk Concord | 10 | 3 | 71.5 | 19 | 40 | 32 | 328 | 62 |
| 5 | Drift Moot | 5 | 1 | 82.6 | 19 | 34 | 25 | 289 | 73 |

## To the end of each game (M4)

Each game played on, after turn 100, until it was won or reached the default limit of 250 turns
(M4_FLEETS.md §30.4). 1 game was won before the limit; 8 games saw a war by turn 150;
0 powers left the game before turn 100. The slowest turn of all took 128 ms (turn 241); the
largest save was 148.5 KB. The deepest any treasury fell was -518 credits;
the longest time in debt was 54 turns in a row.
Of the 12 relic sites in each game, some power knew 6 to 10 by turn 150 (M5).

| Seed | Won by | How | On turn | First war | Wars | Battles | Taken | Surrenders | Left the game | Chapters | Most chapters | The arks | The Last Hearth at the end |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Frontier Co-op | score | 250 | 85 | 4 | 18 | 4 | 0 | — | 12 | Transit Authority (9) | given by the Transit Authority, turn 129 | 2 colonies, 6 outposts |
| 7 | Frontier Co-op | score | 250 | 90 | 2 | 20 | 6 | 0 | — | 18 | Frontier Co-op (9) | given by the Drift Moot, turn 115 | 10 colonies, 4 outposts |
| 2176 | Frontier Co-op | score | 250 | 85 | 2 | 13 | 3 | 0 | — | 10 | Transit Authority (9) | taken in by the Frontier Co-op, turn 147 | — |
| 1 | Frontier Co-op | score | 250 | 90 | 4 | 20 | 10 | 0 | — | 9 | Transit Authority (6) | given by the Transit Authority, turn 123 | 6 colonies, 4 outposts |
| 2 | Frontier Co-op | score | 250 | 85 | 2 | 6 | 6 | 0 | — | 9 | Transit Authority (6) | given by the Drift Moot, turn 130 | 5 colonies, 2 outposts |
| 3 | Dusk Concord | score | 250 | 90 | 5 | 4 | 4 | 0 | — | 3 | Transit Authority (3) | given by the Transit Authority, turn 144 | 5 colonies, 2 outposts |
| 4 | Hollow Wake | score | 250 | 85 | 3 | 17 | 6 | 0 | — | 9 | Transit Authority (6) | given by the Transit Authority, turn 133 | 4 colonies, 2 outposts |
| 5 | Frontier Co-op | the Assembly | 90 | 75 | 1 | 0 | 0 | 0 | — | 3 | Transit Authority (3) | — | — |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| An audit | 3 (prosecute) | 0 (settle quietly) |
| Blight | 16 (burn and replant) | 3 (live with it) |
| The charts match | 1 (fund the study) | 0 (publish it) |
| A comet | 29 (capture its ice) | 3 (study it) |
| A derelict | 11 (salvage it) | 0 (study it) |
| An epidemic | 14 (medical aid) | 8 (quarantine) |
| A feud in the dens | 8 (back the stronger) | 0 (buy them both off) |
| Flare | 10 (shelter) | 0 (ride it out) |
| Founders’ Day | 66 (a festival) | 14 (a quiet day) |
| A great flare | 5 (study it) | 0 (shelter) |
| A great storm | 7 (ride it out) | 0 (harvest its lightning) |
| A bumper harvest | 1 (store it) | 0 (sell it) |
| A key sings | 0 (shield it) | 3 (listen to it) |
| Lane drift | 22 (retune it) | 2 (let it drift) |
| The long night | 6 (move the fields) | 0 (wait for the light) |
| A meteor storm | 37 (shelter) | 0 (mine the falls) |
| A new star | 12 (turn the telescopes) | 0 (a night of lights) |
| Settlers’ petition | 8 (grant it) | 11 (refuse) |
| The shareholders’ vote | 8 (more homes) | 0 (more works) |
| A smugglers’ offer | 29 (buy) | 2 (report them) |
| A strike | 12 (meet their demands) | 3 (wait it out) |
