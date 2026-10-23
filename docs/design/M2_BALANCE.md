# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4):
6 rivals, 8 seeds, 100 turns each for the tables, then on to the end of each game. Regenerate it
after any change to the rules or the rivals.*

The slowest of the first 100 turns took 86 ms on the machine that wrote this; the largest save at turn 100
was 82.3 KB. The longest time in debt was 3 turns in a row. The longest time hungry was 1 turn in a row.

In all 8 games, by turn 100: 63 turns of plunder by raids, 4 battles, 8 wars declared and 3 colonies or outposts taken by invasion (M4).
The Assembly formed in 6 of them, on turn 50 at the earliest and 90 at the latest; it held 6 elections and passed 8 resolutions by turn 100.

The tree has 88 technologies, of which a power can learn 85 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.1 | 2.9 | 18.7 | 7.6 | 15.9 | 16.0 | 125 | 71 |
| 25 | Frontier Co-op | 3.8 | 1.8 | 19.9 | 6.3 | 9.5 | 13.9 | 109 | 41 |
| 25 | Hollow Wake | 3.6 | 2.3 | 19.3 | 7.1 | 8.8 | 15.6 | 115 | 85 |
| 25 | Dusk Concord | 3.9 | 2.0 | 18.7 | 5.0 | 8.9 | 14.3 | 101 | 56 |
| 25 | Drift Moot | 4.4 | 1.1 | 21.6 | 5.0 | 9.0 | 11.3 | 106 | 39 |
| 25 | Continuance | 2.9 | 2.0 | 16.5 | 5.3 | 8.0 | 11.5 | 88 | 56 |
| 50 | Transit Authority | 5.5 | 4.5 | 27.7 | 16.6 | 38.1 | 29.6 | 212 | 59 |
| 50 | Frontier Co-op | 6.1 | 3.9 | 36.4 | 11.8 | 15.1 | 21.8 | 189 | 46 |
| 50 | Hollow Wake | 5.6 | 3.3 | 33.5 | 12.3 | 13.5 | 29.6 | 188 | 171 |
| 50 | Dusk Concord | 7.1 | 4.5 | 35.0 | 9.6 | 13.0 | 19.8 | 184 | 60 |
| 50 | Drift Moot | 5.0 | 1.5 | 43.5 | 9.0 | 18.4 | 16.3 | 166 | 49 |
| 50 | Continuance | 5.1 | 4.0 | 25.7 | 9.0 | 9.4 | 22.5 | 158 | 54 |
| 100 | Transit Authority | 6.5 | 4.8 | 36.4 | 40.3 | 104.3 | 42.4 | 420 | 36 |
| 100 | Frontier Co-op | 11.1 | 6.0 | 74.1 | 22.8 | 32.5 | 36.1 | 370 | 35 |
| 100 | Hollow Wake | 11.0 | 8.4 | 71.8 | 23.1 | 32.1 | 47.4 | 379 | 89 |
| 100 | Dusk Concord | 11.4 | 7.5 | 86.3 | 22.3 | 38.5 | 38.1 | 386 | 61 |
| 100 | Drift Moot | 5.5 | 1.6 | 86.9 | 19.0 | 33.5 | 26.1 | 297 | 67 |
| 100 | Continuance | 10.1 | 7.0 | 65.8 | 21.1 | 29.3 | 44.5 | 346 | 46 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 6 | 5 | 41.0 | 45 | 121 | 41 | 460 | 26 |
| 42 | Frontier Co-op | 12 | 5 | 61.8 | 21 | 23 | 37 | 352 | 7 |
| 42 | Hollow Wake | 11 | 8 | 60.2 | 22 | 23 | 42 | 358 | 50 |
| 42 | Dusk Concord | 12 | 7 | 114.3 | 24 | 50 | 40 | 441 | 90 |
| 42 | Drift Moot | 6 | 2 | 91.2 | 19 | 37 | 25 | 308 | 69 |
| 42 | Continuance | 9 | 5 | 60.8 | 23 | 30 | 43 | 337 | 51 |
| 7 | Transit Authority | 7 | 4 | 34.0 | 35 | 102 | 42 | 381 | 24 |
| 7 | Frontier Co-op | 11 | 8 | 79.3 | 24 | 36 | 39 | 383 | 29 |
| 7 | Hollow Wake | 9 | 7 | 64.3 | 23 | 31 | 46 | 348 | 46 |
| 7 | Dusk Concord | 13 | 10 | 104.3 | 23 | 38 | 40 | 431 | 92 |
| 7 | Drift Moot | 5 | 1 | 81.1 | 19 | 34 | 28 | 288 | 73 |
| 7 | Continuance | 10 | 8 | 62.0 | 18 | 27 | 40 | 326 | 47 |
| 2176 | Transit Authority | 6 | 6 | 38.0 | 42 | 136 | 42 | 436 | 70 |
| 2176 | Frontier Co-op | 12 | 8 | 78.9 | 22 | 35 | 35 | 380 | 53 |
| 2176 | Hollow Wake | 12 | 9 | 85.7 | 24 | 39 | 49 | 423 | 99 |
| 2176 | Dusk Concord | 11 | 4 | 65.9 | 21 | 33 | 33 | 346 | 71 |
| 2176 | Drift Moot | 5 | 2 | 77.6 | 19 | 32 | 28 | 285 | 38 |
| 2176 | Continuance | 10 | 7 | 66.4 | 22 | 27 | 45 | 349 | 31 |
| 1 | Transit Authority | 8 | 4 | 45.0 | 45 | 138 | 45 | 481 | 45 |
| 1 | Frontier Co-op | 12 | 8 | 81.0 | 23 | 40 | 35 | 389 | 28 |
| 1 | Hollow Wake | 10 | 7 | 57.2 | 21 | 21 | 45 | 330 | 20 |
| 1 | Dusk Concord | 12 | 9 | 87.4 | 23 | 40 | 42 | 401 | 74 |
| 1 | Drift Moot | 6 | 2 | 87.2 | 19 | 33 | 28 | 302 | 98 |
| 1 | Continuance | 11 | 8 | 69.5 | 21 | 28 | 47 | 358 | 46 |
| 2 | Transit Authority | 5 | 4 | 33.3 | 39 | 93 | 45 | 383 | 35 |
| 2 | Frontier Co-op | 11 | 3 | 80.6 | 22 | 30 | 32 | 368 | 66 |
| 2 | Hollow Wake | 15 | 12 | 85.0 | 24 | 34 | 53 | 445 | 193 |
| 2 | Dusk Concord | 10 | 8 | 63.8 | 22 | 27 | 38 | 343 | 30 |
| 2 | Drift Moot | 6 | 1 | 94.2 | 19 | 32 | 25 | 309 | 63 |
| 2 | Continuance | 11 | 6 | 67.5 | 18 | 30 | 42 | 342 | 41 |
| 3 | Transit Authority | 6 | 5 | 32.0 | 39 | 100 | 39 | 404 | 20 |
| 3 | Frontier Co-op | 10 | 6 | 62.4 | 22 | 23 | 36 | 338 | 14 |
| 3 | Hollow Wake | 11 | 8 | 78.8 | 23 | 37 | 47 | 384 | 64 |
| 3 | Dusk Concord | 12 | 9 | 94.7 | 23 | 42 | 40 | 408 | 25 |
| 3 | Drift Moot | 6 | 2 | 92.4 | 19 | 34 | 25 | 306 | 28 |
| 3 | Continuance | 10 | 7 | 69.6 | 23 | 29 | 46 | 359 | 60 |
| 4 | Transit Authority | 8 | 5 | 36.6 | 41 | 57 | 43 | 438 | 42 |
| 4 | Frontier Co-op | 10 | 6 | 65.1 | 24 | 32 | 38 | 356 | 62 |
| 4 | Hollow Wake | 11 | 8 | 85.4 | 25 | 43 | 51 | 411 | 220 |
| 4 | Dusk Concord | 11 | 9 | 88.2 | 23 | 38 | 39 | 391 | 44 |
| 4 | Drift Moot | 5 | 2 | 88.7 | 19 | 32 | 25 | 290 | 72 |
| 4 | Continuance | 10 | 8 | 64.0 | 25 | 31 | 48 | 364 | 61 |
| 5 | Transit Authority | 6 | 5 | 31.2 | 36 | 87 | 42 | 373 | 28 |
| 5 | Frontier Co-op | 11 | 4 | 84.0 | 24 | 41 | 37 | 397 | 19 |
| 5 | Hollow Wake | 9 | 8 | 57.4 | 23 | 29 | 46 | 335 | 18 |
| 5 | Dusk Concord | 10 | 4 | 71.6 | 19 | 40 | 33 | 328 | 64 |
| 5 | Drift Moot | 5 | 1 | 82.6 | 19 | 34 | 25 | 289 | 95 |
| 5 | Continuance | 10 | 7 | 66.8 | 19 | 32 | 45 | 329 | 32 |

## To the end of each game (M4)

Each game played on, after turn 100, until it was won or reached the default limit of 250 turns
(M4_FLEETS.md §30.4). 1 game was won before the limit; 8 games saw a war by turn 150;
0 powers left the game before turn 100. The slowest turn of all took 161 ms (turn 215); the
largest save was 173.3 KB. The deepest any treasury fell was -62 credits;
the longest time in debt was 21 turns in a row.
Of the 12 relic sites in each game, some power knew 7 to 11 by turn 150 (M5).

| Seed | Won by | How | On turn | First war | Wars | Battles | Taken | Surrenders | Left the game | Chapters | Most chapters | The keys at the end | The arks | The Last Hearth at the end |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Frontier Co-op | score | 250 | 85 | 5 | 19 | 6 | 0 | — | 21 | Transit Authority (6) | 4 found: Dusk Concord 1, Drift Moot 1, Frontier Co-op 1, Transit Authority 1 | given by the Transit Authority, turn 129 | 3 colonies, 6 outposts |
| 7 | Frontier Co-op | score | 250 | 90 | 2 | 10 | 10 | 0 | — | 21 | Transit Authority (9) | 3 found: Dusk Concord 1, Frontier Co-op 1, Hollow Wake 1 | given by the Drift Moot, turn 115 | 5 colonies, 2 outposts |
| 2176 | Continuance | score | 250 | 85 | 3 | 2 | 3 | 0 | — | 12 | Transit Authority (9) | 2 found: Transit Authority 2 | taken in by the Frontier Co-op, turn 147 | — |
| 1 | Hollow Wake | score | 250 | 90 | 2 | 22 | 7 | 0 | — | 9 | Transit Authority (6) | 1 found: Hollow Wake 1 | given by the Transit Authority, turn 123 | 3 colonies, 2 outposts |
| 2 | Frontier Co-op | score | 250 | 85 | 4 | 3 | 5 | 0 | — | 10 | Transit Authority (6) | 1 found: Transit Authority 1 | given by the Drift Moot, turn 130 | 5 colonies, 2 outposts |
| 3 | Dusk Concord | score | 250 | 90 | 4 | 12 | 5 | 0 | — | 6 | Transit Authority (3) | 1 found: Transit Authority 1 | given by the Transit Authority, turn 144 | 4 colonies, 2 outposts |
| 4 | Transit Authority | score | 250 | 85 | 4 | 17 | 11 | 0 | — | 18 | Transit Authority (12) | 3 found: Transit Authority 1, Dusk Concord 2 | given by the Transit Authority, turn 133 | 3 colonies, 0 outposts |
| 5 | Frontier Co-op | the Assembly | 90 | 75 | 1 | 0 | 0 | 0 | — | 7 | Transit Authority (4) | 1 found: Transit Authority 1 | — | — |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| An audit | 3 (prosecute) | 0 (settle quietly) |
| Blight | 22 (burn and replant) | 3 (live with it) |
| The charts match | 4 (fund the study) | 0 (publish it) |
| A comet | 35 (capture its ice) | 2 (study it) |
| A derelict | 13 (salvage it) | 0 (study it) |
| The dust stirs | 6 (dig on) | 0 (record it) |
| An epidemic | 18 (medical aid) | 8 (quarantine) |
| A feud in the dens | 8 (back the stronger) | 0 (buy them both off) |
| Flare | 11 (shelter) | 0 (ride it out) |
| Founders’ Day | 77 (a festival) | 19 (a quiet day) |
| A great flare | 7 (study it) | 0 (shelter) |
| A great storm | 7 (ride it out) | 0 (harvest its lightning) |
| A bumper harvest | 1 (store it) | 0 (sell it) |
| A key sings | 0 (shield it) | 2 (listen to it) |
| Lane drift | 24 (retune it) | 2 (let it drift) |
| The long night | 6 (move the fields) | 0 (wait for the light) |
| A meteor storm | 40 (shelter) | 0 (mine the falls) |
| A new star | 15 (turn the telescopes) | 0 (a night of lights) |
| Settlers’ petition | 9 (grant it) | 15 (refuse) |
| Digging next door | 2 (send observers) | 0 (leave them to it) |
| The shareholders’ vote | 8 (more homes) | 0 (more works) |
| A smugglers’ offer | 38 (buy) | 2 (report them) |
| A strike | 13 (meet their demands) | 4 (wait it out) |
