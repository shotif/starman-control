# Third-party data in this folder

`sky.json` is copied from [Starman Reborn](https://github.com/shotif/starman-reborn) by
`npm run data:import` (scripts/data/import-reborn.ts); the commit it was copied from is recorded in
the file. Every value carries its source. Most come from the archives directly (Gaia DR3, SIMBAD,
the NASA Exoplanet Archive, the Extrasolar Planets Encyclopaedia) as Reborn's sky snapshot of
30 September 2026 holds them. Two inputs carry licences of their own, as in Reborn's
`data/provisional/NOTICE.md`:

## HYG star database v4.0

The positions, distances and proper motions of **Procyon B** and **Ross 614 B** (and the spectral
type of Ross 614 B), marked `HYG v4.0` in their source fields, are derived from the HYG star
database v4.0 by David Nash (astronexus), <https://github.com/astronexus/HYG-Database>, licensed
under the Creative Commons Attribution-ShareAlike 4.0 International licence (CC BY-SA 4.0,
<https://creativecommons.org/licenses/by-sa/4.0/>). Those values are shared under the same
licence. Changes: converted to this project's schema.

## Open Exoplanet Catalogue

Planets whose source is marked `Open Exoplanet Catalogue` are derived from the Open Exoplanet
Catalogue, <https://github.com/OpenExoplanetCatalogue/open_exoplanet_catalogue> (Rein 2012,
<https://arxiv.org/abs/1211.7121>), under its licence:

    Copyright (C) 2012 Hanno Rein

    Permission is hereby granted, free of charge, to any person obtaining a copy of this database
    and associated scripts (the "Database"), to deal in the Database without restriction, including
    without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Database, and to permit persons to whom the Database is furnished to
    do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or
    substantial portions of the Database.
    A reference to the Database shall be included in all scientific publications that make use of
    the Database.

    THE DATABASE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
    BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE DATABASE OR THE USE OR OTHER DEALINGS IN THE DATABASE.

## The mean dwarf sequence

`dwarfs.json` is copied by `npm run data:import-dwarfs` (scripts/data/import-dwarfs.ts) from Eric
Mamajek's table *A Modern Mean Dwarf Stellar Color and Effective Temperature Sequence*,
<https://www.pas.rochester.edu/~emamajek/EEM_dwarf_UBVIJHK_colors_Teff.txt> (version 2022.04.16),
whose content is largely Table 5 of Pecaut & Mamajek (2013, ApJS 208, 9,
<https://ui.adsabs.harvard.edu/abs/2013ApJS..208....9P>), cited as its author asks. Only the
spectral type, effective temperature, luminosity (10^logL), radius and mass are kept. The game
uses it to estimate each star's light from its type, and says so.

## Sol

Sol's planets and moons (`src/content/sol.ts`) are from NASA's Planetary Fact Sheet and JPL's
planetary satellite physical parameters.

## A correction

Four planets' status notes in Reborn's data read "the Encyclopaedia calls it ." with the word
missing (from Reborn's `scripts/sky-process.ts`); the import drops that empty clause.

## The lanes

The lanes are fiction: Starman Reborn's jump network, made by its world generator. In Control
they are the old lanes from before the Lapse (D-19).
