# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 366 ms on the machine that wrote this; the largest save at turn 100
was 39.2 KB. The longest time in debt was 2 turns in a row. No colony went hungry.

The tree has 33 technologies. Finished by: Transit Authority on turn 65 (seed 42); Hollow Wake on turn 95 (seed 42); Transit Authority on turn 69 (seed 7); Frontier Co-op on turn 89 (seed 7); Hollow Wake on turn 92 (seed 7); Transit Authority on turn 65 (seed 2176); Hollow Wake on turn 90 (seed 2176); Frontier Co-op on turn 96 (seed 2176); Transit Authority on turn 62 (seed 1); Frontier Co-op on turn 96 (seed 1); Transit Authority on turn 64 (seed 2); Hollow Wake on turn 98 (seed 2); Transit Authority on turn 67 (seed 3); Frontier Co-op on turn 91 (seed 3); Hollow Wake on turn 92 (seed 3); Transit Authority on turn 74 (seed 4); Hollow Wake on turn 89 (seed 4); Frontier Co-op on turn 90 (seed 4); Transit Authority on turn 75 (seed 5); Frontier Co-op on turn 83 (seed 5); Hollow Wake on turn 94 (seed 5).

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 2.6 | 3.0 | 16.7 | 9.1 | 20.3 | 9.3 | 60 |
| 25 | Frontier Co-op | 4.0 | 1.8 | 20.6 | 7.8 | 10.0 | 10.9 | 46 |
| 25 | Hollow Wake | 3.8 | 2.1 | 18.9 | 7.3 | 8.4 | 13.0 | 98 |
| 50 | Transit Authority | 5.3 | 5.0 | 26.9 | 23.8 | 22.0 | 14.4 | 68 |
| 50 | Frontier Co-op | 6.5 | 3.4 | 38.1 | 14.6 | 16.6 | 13.6 | 46 |
| 50 | Hollow Wake | 6.9 | 5.0 | 32.7 | 13.5 | 13.3 | 17.5 | 182 |
| 100 | Transit Authority | 14.1 | 11.1 | 58.5 | 33.0 | 87.5 | 15.0 | 129 |
| 100 | Frontier Co-op | 13.6 | 8.1 | 93.5 | 32.6 | 46.5 | 15.0 | 34 |
| 100 | Hollow Wake | 14.1 | 11.3 | 88.2 | 32.8 | 53.8 | 20.3 | 203 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 17 | 13 | 72.3 | 33 | 108 | 14 | 129 |
| 42 | Frontier Co-op | 14 | 8 | 74.1 | 31 | 39 | 16 | 46 |
| 42 | Hollow Wake | 12 | 10 | 71.7 | 33 | 41 | 20 | 225 |
| 7 | Transit Authority | 14 | 10 | 56.6 | 33 | 85 | 14 | 42 |
| 7 | Frontier Co-op | 11 | 6 | 99.2 | 33 | 52 | 15 | 48 |
| 7 | Hollow Wake | 13 | 12 | 83.7 | 33 | 53 | 21 | 244 |
| 2176 | Transit Authority | 15 | 13 | 68.6 | 33 | 120 | 16 | 333 |
| 2176 | Frontier Co-op | 14 | 11 | 95.0 | 33 | 38 | 15 | 7 |
| 2176 | Hollow Wake | 13 | 8 | 95.1 | 33 | 69 | 20 | 82 |
| 1 | Transit Authority | 16 | 12 | 62.5 | 33 | 96 | 16 | 106 |
| 1 | Frontier Co-op | 13 | 8 | 100.2 | 33 | 53 | 15 | 42 |
| 1 | Hollow Wake | 17 | 11 | 85.0 | 31 | 42 | 20 | 150 |
| 2 | Transit Authority | 17 | 12 | 70.1 | 33 | 106 | 16 | 243 |
| 2 | Frontier Co-op | 14 | 6 | 76.7 | 32 | 28 | 14 | 53 |
| 2 | Hollow Wake | 15 | 11 | 77.8 | 33 | 41 | 20 | 258 |
| 3 | Transit Authority | 16 | 12 | 62.2 | 33 | 79 | 17 | 34 |
| 3 | Frontier Co-op | 15 | 9 | 105.6 | 33 | 59 | 14 | 3 |
| 3 | Hollow Wake | 14 | 14 | 107.1 | 33 | 68 | 22 | 232 |
| 4 | Transit Authority | 8 | 7 | 35.2 | 33 | 46 | 14 | 88 |
| 4 | Frontier Co-op | 14 | 10 | 79.7 | 33 | 39 | 16 | 12 |
| 4 | Hollow Wake | 18 | 15 | 109.5 | 33 | 57 | 20 | 248 |
| 5 | Transit Authority | 10 | 10 | 40.1 | 33 | 60 | 13 | 56 |
| 5 | Frontier Co-op | 14 | 7 | 117.7 | 33 | 64 | 15 | 61 |
| 5 | Hollow Wake | 11 | 9 | 75.9 | 33 | 59 | 19 | 184 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 8 (burn and replant) | 5 (live with it) |
| A comet | 19 (capture its ice) | 1 (study it) |
| A derelict | 4 (salvage it) | 0 (study it) |
| An epidemic | 15 (medical aid) | 3 (quarantine) |
| Flare | 14 (shelter) | 0 (ride it out) |
| Founders’ Day | 44 (a festival) | 4 (a quiet day) |
| Lane drift | 25 (retune it) | 0 (let it drift) |
| Settlers’ petition | 9 (grant it) | 7 (refuse) |
| A smugglers’ offer | 29 (buy) | 2 (report them) |
| A strike | 15 (meet their demands) | 3 (wait it out) |
