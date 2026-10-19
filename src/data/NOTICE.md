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

## The lanes

The lanes are fiction: Starman Reborn's jump network, made by its world generator. In Control
they are the old lanes from before the Lapse (D-19).
