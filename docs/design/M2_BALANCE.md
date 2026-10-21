# The headless games

*Written by `npm run balance` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2): three
rivals, 8 seeds, 100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took 177 ms on the machine that wrote this; the largest save at turn 100
was 35.4 KB. The longest time in debt was 1 turn in a row. No colony went hungry.

The tree has 33 technologies. Finished by: Transit Authority on turn 84 (seed 42); Transit Authority on turn 89 (seed 7); Transit Authority on turn 84 (seed 2176); Transit Authority on turn 78 (seed 1); Transit Authority on turn 83 (seed 2); Transit Authority on turn 86 (seed 3); Transit Authority on turn 96 (seed 4); Transit Authority on turn 98 (seed 5).

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Transit Authority | 2.6 | 3.0 | 16.7 | 5.5 | 16.8 | 62 |
| 25 | Frontier Co-op | 4.0 | 1.9 | 20.4 | 4.8 | 9.3 | 45 |
| 25 | Hollow Wake | 3.3 | 2.3 | 18.2 | 4.5 | 8.4 | 91 |
| 50 | Transit Authority | 3.3 | 5.5 | 23.1 | 12.5 | 22.1 | 49 |
| 50 | Frontier Co-op | 6.5 | 3.4 | 40.9 | 10.4 | 17.8 | 49 |
| 50 | Hollow Wake | 6.3 | 4.3 | 32.2 | 8.5 | 13.0 | 188 |
| 100 | Transit Authority | 11.4 | 12.0 | 50.3 | 33.0 | 69.9 | 121 |
| 100 | Frontier Co-op | 12.1 | 7.4 | 82.3 | 28.6 | 41.4 | 40 |
| 100 | Hollow Wake | 13.6 | 11.9 | 75.1 | 22.0 | 31.3 | 222 |

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 42 | Transit Authority | 13 | 13 | 57.7 | 33 | 72 | 153 |
| 42 | Frontier Co-op | 14 | 7 | 75.5 | 25 | 38 | 33 |
| 42 | Hollow Wake | 10 | 8 | 57.3 | 22 | 25 | 203 |
| 7 | Transit Authority | 10 | 12 | 41.8 | 33 | 55 | 57 |
| 7 | Frontier Co-op | 11 | 7 | 85.4 | 29 | 40 | 33 |
| 7 | Hollow Wake | 18 | 17 | 92.4 | 23 | 31 | 223 |
| 2176 | Transit Authority | 11 | 15 | 54.0 | 33 | 93 | 164 |
| 2176 | Frontier Co-op | 11 | 6 | 84.8 | 30 | 43 | 33 |
| 2176 | Hollow Wake | 15 | 13 | 84.1 | 24 | 33 | 132 |
| 1 | Transit Authority | 16 | 11 | 72.6 | 33 | 100 | 248 |
| 1 | Frontier Co-op | 12 | 6 | 96.2 | 30 | 58 | 61 |
| 1 | Hollow Wake | 12 | 11 | 70.2 | 20 | 29 | 281 |
| 2 | Transit Authority | 13 | 14 | 58.2 | 33 | 81 | 181 |
| 2 | Frontier Co-op | 11 | 7 | 52.8 | 25 | 22 | 13 |
| 2 | Hollow Wake | 12 | 10 | 59.2 | 23 | 25 | 273 |
| 3 | Transit Authority | 10 | 12 | 39.7 | 33 | 60 | 35 |
| 3 | Frontier Co-op | 13 | 9 | 92.2 | 30 | 44 | 71 |
| 3 | Hollow Wake | 14 | 14 | 89.0 | 23 | 36 | 241 |
| 4 | Transit Authority | 9 | 9 | 41.9 | 33 | 49 | 61 |
| 4 | Frontier Co-op | 12 | 10 | 77.3 | 29 | 37 | 39 |
| 4 | Hollow Wake | 17 | 14 | 96.3 | 25 | 52 | 233 |
| 5 | Transit Authority | 9 | 10 | 36.3 | 33 | 49 | 70 |
| 5 | Frontier Co-op | 13 | 7 | 94.1 | 31 | 49 | 35 |
| 5 | Hollow Wake | 11 | 8 | 52.3 | 16 | 19 | 186 |

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
| Blight | 9 (burn and replant) | 4 (live with it) |
| A comet | 19 (capture its ice) | 0 (study it) |
| A derelict | 6 (salvage it) | 0 (study it) |
| An epidemic | 15 (medical aid) | 3 (quarantine) |
| Flare | 15 (shelter) | 0 (ride it out) |
| Founders’ Day | 43 (a festival) | 5 (a quiet day) |
| Lane drift | 27 (retune it) | 0 (let it drift) |
| Settlers’ petition | 9 (grant it) | 10 (refuse) |
| A smugglers’ offer | 26 (buy) | 2 (report them) |
| A strike | 14 (meet their demands) | 3 (wait it out) |
