# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4):
5 rivals, 8 seeds, 100 turns each for the tables, then on to the end of each game. Regenerate it
after any change to the rules or the rivals.*

The slowest of the first 100 turns took 81 ms on the machine that wrote this; the largest save at turn 100
was 60.9 KB. The longest time in debt was 1 turn in a row. The longest time hungry was 1 turn in a row.

In all 8 games, by turn 100: 67 turns of plunder by raids, 3 battles, 8 wars declared and 1 colony or outpost taken by invasion (M4).
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
| 100 | Transit Authority | 6.6 | 4.4 | 36.8 | 39.6 | 108.8 | 41.6 | 415 | 36 |
| 100 | Frontier Co-op | 10.9 | 6.6 | 72.0 | 22.6 | 32.5 | 36.4 | 365 | 38 |
| 100 | Hollow Wake | 11.1 | 8.4 | 72.1 | 23.1 | 32.4 | 47.6 | 382 | 193 |
| 100 | Dusk Concord | 11.4 | 7.8 | 86.6 | 22.0 | 38.8 | 37.8 | 385 | 68 |
| 100 | Drift Moot | 5.6 | 1.6 | 87.3 | 18.9 | 33.8 | 26.4 | 299 | 87 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 7 | 4 | 42.0 | 44 | 129 | 40 | 461 | 45 |
| 42 | Frontier Co-op | 11 | 6 | 60.4 | 21 | 22 | 38 | 341 | 26 |
| 42 | Hollow Wake | 11 | 8 | 60.1 | 22 | 23 | 42 | 356 | 131 |
| 42 | Dusk Concord | 12 | 9 | 110.1 | 23 | 50 | 40 | 433 | 57 |
| 42 | Drift Moot | 6 | 2 | 91.2 | 19 | 37 | 25 | 308 | 76 |
| 7 | Transit Authority | 8 | 4 | 36.3 | 34 | 102 | 42 | 385 | 19 |
| 7 | Frontier Co-op | 10 | 8 | 76.6 | 24 | 35 | 39 | 370 | 19 |
| 7 | Hollow Wake | 9 | 7 | 64.1 | 23 | 31 | 46 | 351 | 233 |
| 7 | Dusk Concord | 13 | 10 | 104.3 | 23 | 38 | 40 | 431 | 97 |
| 7 | Drift Moot | 5 | 1 | 81.1 | 19 | 34 | 28 | 289 | 96 |
| 2176 | Transit Authority | 7 | 5 | 41.0 | 42 | 141 | 42 | 446 | 44 |
| 2176 | Frontier Co-op | 12 | 11 | 79.5 | 21 | 43 | 38 | 379 | 35 |
| 2176 | Hollow Wake | 12 | 9 | 85.8 | 24 | 39 | 50 | 424 | 222 |
| 2176 | Dusk Concord | 11 | 4 | 65.9 | 20 | 33 | 33 | 341 | 71 |
| 2176 | Drift Moot | 5 | 2 | 77.6 | 19 | 34 | 28 | 285 | 71 |
| 1 | Transit Authority | 6 | 4 | 42.0 | 44 | 133 | 44 | 451 | 60 |
| 1 | Frontier Co-op | 12 | 8 | 81.0 | 24 | 40 | 34 | 393 | 26 |
| 1 | Hollow Wake | 10 | 7 | 57.0 | 21 | 23 | 46 | 331 | 173 |
| 1 | Dusk Concord | 12 | 9 | 87.4 | 23 | 40 | 41 | 401 | 79 |
| 1 | Drift Moot | 6 | 2 | 87.2 | 19 | 33 | 28 | 302 | 98 |
| 2 | Transit Authority | 6 | 4 | 35.3 | 38 | 93 | 40 | 385 | 28 |
| 2 | Frontier Co-op | 11 | 5 | 68.0 | 21 | 25 | 32 | 350 | 53 |
| 2 | Hollow Wake | 15 | 11 | 85.0 | 24 | 34 | 50 | 445 | 234 |
| 2 | Dusk Concord | 10 | 8 | 63.8 | 22 | 27 | 37 | 343 | 30 |
| 2 | Drift Moot | 6 | 1 | 94.2 | 19 | 32 | 25 | 309 | 89 |
| 3 | Transit Authority | 6 | 5 | 32.0 | 39 | 100 | 39 | 404 | 27 |
| 3 | Frontier Co-op | 11 | 6 | 62.7 | 22 | 22 | 36 | 348 | 40 |
| 3 | Hollow Wake | 11 | 8 | 78.9 | 23 | 37 | 47 | 384 | 204 |
| 3 | Dusk Concord | 12 | 9 | 94.7 | 23 | 42 | 40 | 408 | 82 |
| 3 | Drift Moot | 6 | 2 | 92.4 | 19 | 34 | 26 | 307 | 63 |
| 4 | Transit Authority | 7 | 5 | 34.0 | 41 | 85 | 44 | 424 | 51 |
| 4 | Frontier Co-op | 10 | 6 | 65.1 | 24 | 32 | 38 | 357 | 62 |
| 4 | Hollow Wake | 12 | 8 | 88.2 | 25 | 43 | 52 | 425 | 222 |
| 4 | Dusk Concord | 11 | 9 | 94.7 | 23 | 40 | 39 | 398 | 65 |
| 4 | Drift Moot | 5 | 2 | 88.7 | 19 | 32 | 26 | 290 | 88 |
| 5 | Transit Authority | 6 | 4 | 31.5 | 35 | 87 | 42 | 365 | 13 |
| 5 | Frontier Co-op | 10 | 3 | 82.4 | 24 | 41 | 36 | 385 | 39 |
| 5 | Hollow Wake | 9 | 9 | 57.4 | 23 | 29 | 48 | 339 | 124 |
| 5 | Dusk Concord | 10 | 4 | 71.6 | 19 | 40 | 32 | 328 | 64 |
| 5 | Drift Moot | 6 | 1 | 86.1 | 18 | 34 | 25 | 298 | 112 |

## To the end of each game (M4)

Each game played on, after turn 100, until it was won or reached the default limit of 250 turns
(M4_FLEETS.md §30.4). 0 games were won before the limit; 8 games saw a war by turn 150;
0 powers left the game before turn 100. The slowest turn of all took 98 ms (turn 240); the
largest save was 123.6 KB. The deepest any treasury fell was -300 credits;
the longest time in debt was 58 turns in a row.
Of the 12 relic sites in each game, some power knew 7 to 10 by turn 150 (M5).

| Seed | Won by | How | On turn | First war | Wars | Battles | Taken | Surrenders | Left the game | Chapters | Most chapters |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Frontier Co-op | score | 250 | 90 | 4 | 9 | 5 | 0 | — | 12 | Transit Authority (6) |
| 7 | Frontier Co-op | score | 250 | 90 | 3 | 16 | 15 | 0 | — | 18 | Transit Authority (9) |
| 2176 | Frontier Co-op | score | 250 | 90 | 3 | 10 | 2 | 0 | — | 9 | Transit Authority (9) |
| 1 | Frontier Co-op | score | 250 | 90 | 3 | 16 | 13 | 0 | — | 6 | Transit Authority (6) |
| 2 | Frontier Co-op | score | 250 | 85 | 2 | 3 | 4 | 0 | — | 9 | Transit Authority (6) |
| 3 | Dusk Concord | score | 250 | 90 | 4 | 8 | 4 | 0 | — | 6 | Transit Authority (6) |
| 4 | Hollow Wake | score | 250 | 85 | 4 | 18 | 11 | 0 | — | 9 | Transit Authority (6) |
| 5 | Frontier Co-op | score | 250 | 75 | 3 | 6 | 6 | 0 | — | 11 | Transit Authority (6) |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| An audit | 3 (prosecute) | 0 (settle quietly) |
| Blight | 16 (burn and replant) | 3 (live with it) |
| The charts match | 1 (fund the study) | 0 (publish it) |
| A comet | 30 (capture its ice) | 2 (study it) |
| A derelict | 11 (salvage it) | 0 (study it) |
| An epidemic | 15 (medical aid) | 7 (quarantine) |
| A feud in the dens | 8 (back the stronger) | 0 (buy them both off) |
| Flare | 10 (shelter) | 0 (ride it out) |
| Founders’ Day | 68 (a festival) | 12 (a quiet day) |
| A great flare | 5 (study it) | 0 (shelter) |
| A great storm | 7 (ride it out) | 0 (harvest its lightning) |
| A bumper harvest | 1 (store it) | 0 (sell it) |
| A key sings | 0 (shield it) | 3 (listen to it) |
| Lane drift | 22 (retune it) | 2 (let it drift) |
| The long night | 6 (move the fields) | 0 (wait for the light) |
| A meteor storm | 37 (shelter) | 0 (mine the falls) |
| A new star | 11 (turn the telescopes) | 1 (a night of lights) |
| Settlers’ petition | 10 (grant it) | 9 (refuse) |
| The shareholders’ vote | 7 (more homes) | 1 (more works) |
| A smugglers’ offer | 30 (buy) | 1 (report them) |
| A strike | 12 (meet their demands) | 3 (wait it out) |
