# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 177 ms on the machine that wrote this; the largest save at turn 100
was 41.6 KB. No power fell into debt. No colony went hungry.

The tree has 60 technologies, of which a power can learn 57 (one of each pair of doctrines). No power learnt them all in 100 turns.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 4.0 | 2.9 | 19.1 | 9.0 | 20.3 | 14.9 | 66 |
| 25 | Frontier Co-op | 3.9 | 1.9 | 20.2 | 6.6 | 9.3 | 13.9 | 46 |
| 25 | Hollow Wake | 4.1 | 2.4 | 19.9 | 7.3 | 8.8 | 15.9 | 92 |
| 50 | Transit Authority | 5.6 | 4.4 | 27.4 | 17.9 | 38.9 | 25.6 | 68 |
| 50 | Frontier Co-op | 6.5 | 3.8 | 39.5 | 11.9 | 16.1 | 20.8 | 52 |
| 50 | Hollow Wake | 7.5 | 5.0 | 37.9 | 12.4 | 13.8 | 28.9 | 182 |
| 100 | Transit Authority | 10.5 | 7.1 | 43.7 | 38.5 | 131.4 | 32.1 | 39 |
| 100 | Frontier Co-op | 13.1 | 8.4 | 78.3 | 22.8 | 41.4 | 31.0 | 34 |
| 100 | Hollow Wake | 15.8 | 12.6 | 91.7 | 23.0 | 41.3 | 37.6 | 228 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 13 | 8 | 44.5 | 38 | 115 | 32 | 29 |
| 42 | Frontier Co-op | 12 | 9 | 60.7 | 20 | 26 | 32 | 27 |
| 42 | Hollow Wake | 12 | 10 | 68.7 | 21 | 31 | 36 | 236 |
| 7 | Transit Authority | 14 | 7 | 48.7 | 39 | 156 | 34 | 61 |
| 7 | Frontier Co-op | 13 | 6 | 78.5 | 23 | 42 | 29 | 36 |
| 7 | Hollow Wake | 14 | 10 | 82.3 | 22 | 31 | 37 | 241 |
| 2176 | Transit Authority | 9 | 8 | 43.4 | 40 | 157 | 32 | 29 |
| 2176 | Frontier Co-op | 13 | 11 | 81.5 | 23 | 44 | 33 | 51 |
| 2176 | Hollow Wake | 15 | 11 | 101.8 | 24 | 42 | 39 | 241 |
| 1 | Transit Authority | 10 | 7 | 50.9 | 41 | 178 | 32 | 34 |
| 1 | Frontier Co-op | 13 | 7 | 80.7 | 21 | 42 | 29 | 37 |
| 1 | Hollow Wake | 16 | 12 | 83.0 | 21 | 37 | 35 | 198 |
| 2 | Transit Authority | 9 | 5 | 41.4 | 38 | 106 | 29 | 50 |
| 2 | Frontier Co-op | 14 | 7 | 84.2 | 23 | 42 | 29 | 22 |
| 2 | Hollow Wake | 22 | 21 | 99.8 | 24 | 41 | 38 | 218 |
| 3 | Transit Authority | 9 | 7 | 36.7 | 38 | 114 | 32 | 35 |
| 3 | Frontier Co-op | 14 | 10 | 90.0 | 25 | 50 | 33 | 49 |
| 3 | Hollow Wake | 13 | 12 | 86.0 | 21 | 36 | 39 | 267 |
| 4 | Transit Authority | 11 | 7 | 49.2 | 37 | 129 | 33 | 44 |
| 4 | Frontier Co-op | 13 | 10 | 71.2 | 24 | 39 | 34 | 24 |
| 4 | Hollow Wake | 22 | 19 | 131.4 | 27 | 70 | 41 | 272 |
| 5 | Transit Authority | 9 | 8 | 34.8 | 37 | 96 | 33 | 28 |
| 5 | Frontier Co-op | 13 | 7 | 79.4 | 23 | 46 | 29 | 23 |
| 5 | Hollow Wake | 12 | 6 | 80.8 | 24 | 42 | 36 | 150 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 4 (burn and replant) | 6 (live with it) |
| A comet | 18 (capture its ice) | 1 (study it) |
| A derelict | 5 (salvage it) | 0 (study it) |
| An epidemic | 17 (medical aid) | 4 (quarantine) |
| Flare | 15 (shelter) | 0 (ride it out) |
| Founders’ Day | 43 (a festival) | 5 (a quiet day) |
| Lane drift | 25 (retune it) | 0 (let it drift) |
| Settlers’ petition | 7 (grant it) | 7 (refuse) |
| A smugglers’ offer | 28 (buy) | 3 (report them) |
| A strike | 12 (meet their demands) | 3 (wait it out) |
