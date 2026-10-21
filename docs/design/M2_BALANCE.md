# M2's headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2): three rivals, 8 seeds,
100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 158 ms on the machine that wrote this; the largest save at turn 100
was 30.3 KB. No power was in debt for more than 0 turns in a
row; no colony was hungry for more than 0 turns in a row.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Treasury |
| --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 2.6 | 3.1 | 16.7 | 3.8 | 58 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.3 | 4.0 | 44 |
| 25 | Hollow Wake | 3.3 | 2.1 | 18.2 | 3.4 | 92 |
| 50 | Transit Authority | 3.3 | 5.0 | 23.2 | 9.3 | 55 |
| 50 | Frontier Co-op | 6.6 | 3.9 | 38.9 | 6.8 | 50 |
| 50 | Hollow Wake | 6.6 | 5.0 | 32.5 | 6.1 | 229 |
| 100 | Transit Authority | 8.8 | 11.3 | 42.7 | 30.3 | 134 |
| 100 | Frontier Co-op | 11.8 | 7.1 | 75.6 | 10.9 | 35 |
| 100 | Hollow Wake | 12.4 | 9.8 | 71.0 | 10.5 | 275 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Treasury |
| --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 11 | 15 | 51.2 | 33 | 174 |
| 42 | Frontier Co-op | 12 | 8 | 70.1 | 11 | 39 |
| 42 | Hollow Wake | 11 | 9 | 59.9 | 11 | 296 |
| 7 | Transit Authority | 5 | 10 | 29.6 | 27 | 70 |
| 7 | Frontier Co-op | 12 | 9 | 81.3 | 10 | 29 |
| 7 | Hollow Wake | 16 | 13 | 86.4 | 10 | 337 |
| 2176 | Transit Authority | 9 | 14 | 45.0 | 32 | 133 |
| 2176 | Frontier Co-op | 12 | 9 | 81.2 | 11 | 43 |
| 2176 | Hollow Wake | 13 | 11 | 75.2 | 11 | 259 |
| 1 | Transit Authority | 14 | 11 | 67.0 | 33 | 281 |
| 1 | Frontier Co-op | 9 | 5 | 71.2 | 11 | 26 |
| 1 | Hollow Wake | 12 | 7 | 71.7 | 10 | 215 |
| 2 | Transit Authority | 11 | 14 | 50.7 | 33 | 207 |
| 2 | Frontier Co-op | 13 | 6 | 70.8 | 11 | 34 |
| 2 | Hollow Wake | 11 | 8 | 59.1 | 11 | 272 |
| 3 | Transit Authority | 7 | 10 | 33.0 | 30 | 75 |
| 3 | Frontier Co-op | 13 | 7 | 86.3 | 11 | 42 |
| 3 | Hollow Wake | 12 | 11 | 83.1 | 10 | 299 |
| 4 | Transit Authority | 8 | 7 | 38.9 | 27 | 61 |
| 4 | Frontier Co-op | 12 | 8 | 68.0 | 11 | 35 |
| 4 | Hollow Wake | 14 | 12 | 85.9 | 11 | 290 |
| 5 | Transit Authority | 5 | 9 | 26.1 | 27 | 73 |
| 5 | Frontier Co-op | 11 | 5 | 76.1 | 11 | 35 |
| 5 | Hollow Wake | 10 | 7 | 47.1 | 10 | 228 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 14 (burn and replant) | 0 (live with it) |
| A comet | 15 (capture its ice) | 2 (study it) |
| A derelict | 7 (salvage it) | 0 (study it) |
| An epidemic | 16 (medical aid) | 4 (quarantine) |
| Flare | 14 (shelter) | 0 (ride it out) |
| Founders’ Day | 40 (a festival) | 8 (a quiet day) |
| Lane drift | 25 (retune it) | 0 (let it drift) |
| Settlers’ petition | 9 (grant it) | 7 (refuse) |
| A smugglers’ offer | 31 (buy) | 0 (report them) |
| A strike | 12 (meet their demands) | 3 (wait it out) |
