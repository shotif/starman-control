# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 108 ms on the machine that wrote this; the largest save at turn 100
was 38.0 KB. No power fell into debt. No colony went hungry.

The tree has 54 technologies. No power finished it in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 9.0 | 20.3 | 12.9 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.6 | 9.3 | 13.8 | 46 |
| 25 | Hollow Wake | 4.0 | 2.4 | 19.7 | 7.0 | 8.8 | 16.1 | 93 |
| 50 | Transit Authority | 5.6 | 4.4 | 27.4 | 17.5 | 38.9 | 22.0 | 69 |
| 50 | Frontier Co-op | 6.5 | 3.8 | 39.5 | 11.9 | 16.1 | 17.6 | 52 |
| 50 | Hollow Wake | 7.3 | 4.9 | 37.3 | 11.6 | 13.3 | 24.3 | 191 |
| 100 | Transit Authority | 10.9 | 7.0 | 45.2 | 36.8 | 134.4 | 27.8 | 43 |
| 100 | Frontier Co-op | 12.6 | 7.9 | 77.3 | 23.4 | 41.8 | 26.1 | 38 |
| 100 | Hollow Wake | 15.1 | 12.0 | 87.4 | 21.6 | 37.4 | 32.5 | 227 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 12 | 9 | 41.8 | 37 | 115 | 27 | 38 |
| 42 | Frontier Co-op | 12 | 9 | 60.7 | 21 | 30 | 28 | 17 |
| 42 | Hollow Wake | 11 | 9 | 63.0 | 20 | 28 | 28 | 238 |
| 7 | Transit Authority | 14 | 7 | 48.5 | 37 | 151 | 29 | 41 |
| 7 | Frontier Co-op | 12 | 4 | 75.5 | 23 | 41 | 23 | 43 |
| 7 | Hollow Wake | 15 | 14 | 84.8 | 21 | 38 | 33 | 232 |
| 2176 | Transit Authority | 12 | 6 | 54.3 | 38 | 202 | 28 | 55 |
| 2176 | Frontier Co-op | 12 | 11 | 79.8 | 24 | 44 | 28 | 50 |
| 2176 | Hollow Wake | 14 | 9 | 90.5 | 22 | 39 | 34 | 273 |
| 1 | Transit Authority | 9 | 6 | 49.9 | 39 | 166 | 28 | 64 |
| 1 | Frontier Co-op | 12 | 7 | 79.2 | 23 | 45 | 24 | 27 |
| 1 | Hollow Wake | 16 | 12 | 82.7 | 20 | 35 | 30 | 228 |
| 2 | Transit Authority | 10 | 4 | 43.2 | 36 | 106 | 26 | 46 |
| 2 | Frontier Co-op | 14 | 6 | 84.2 | 23 | 42 | 24 | 27 |
| 2 | Hollow Wake | 21 | 19 | 98.6 | 23 | 39 | 33 | 224 |
| 3 | Transit Authority | 9 | 7 | 36.6 | 36 | 109 | 27 | 20 |
| 3 | Frontier Co-op | 14 | 9 | 89.6 | 25 | 50 | 27 | 56 |
| 3 | Hollow Wake | 14 | 14 | 87.9 | 20 | 36 | 33 | 270 |
| 4 | Transit Authority | 11 | 8 | 48.8 | 36 | 123 | 29 | 26 |
| 4 | Frontier Co-op | 12 | 10 | 70.0 | 24 | 39 | 30 | 33 |
| 4 | Hollow Wake | 19 | 15 | 113.6 | 25 | 50 | 36 | 261 |
| 5 | Transit Authority | 10 | 9 | 38.7 | 35 | 103 | 28 | 53 |
| 5 | Frontier Co-op | 13 | 7 | 79.2 | 24 | 43 | 25 | 48 |
| 5 | Hollow Wake | 11 | 4 | 77.9 | 22 | 34 | 33 | 87 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 6 (burn and replant) | 4 (live with it) |
| A comet | 19 (capture its ice) | 0 (study it) |
| A derelict | 4 (salvage it) | 0 (study it) |
| An epidemic | 17 (medical aid) | 4 (quarantine) |
| Flare | 15 (shelter) | 0 (ride it out) |
| Founders’ Day | 43 (a festival) | 5 (a quiet day) |
| Lane drift | 25 (retune it) | 0 (let it drift) |
| Settlers’ petition | 7 (grant it) | 7 (refuse) |
| A smugglers’ offer | 29 (buy) | 3 (report them) |
| A strike | 12 (meet their demands) | 3 (wait it out) |
