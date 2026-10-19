# The living map (increment 10)

**Status:** written 19 October 2026, before it was built, and built the same day (§8); part of
the visual direction ([VISUAL_DIRECTION.md](VISUAL_DIRECTION.md), D-26).

**Goal.** The map, where the whole game is played, looks like a place and not a diagram: the real
sky behind it, light in its stars, the powers' lanes alive, each power's reach visible at a glance,
and choosing and entering a system that move. It must stay as readable and as quick as it is now,
on a phone above all.

**Out of scope.** The interface over the map (panels, buttons, icons, sound): increment 11.
Borders that follow rules (claims, influence): a later milestone; the fields here only show where
a power is.

## 1. The sky behind the map

The Milky Way of the title ([FIRST_IMPRESSION.md](FIRST_IMPRESSION.md) §1, §7), baked once into a
cube map, and its faint stars, drawn behind everything and turning with the camera. In the flat
view the camera looks down on the plane of the celestial equator from the north, so the sky behind
it is the southern sky, where the band runs through Carina and Crux. It is dimmer than on the
title, so it never competes with the map. Where it lies is real; how it looks is an illustration.

## 2. Stars with light

Each star keeps its colour and size but gains a brighter core and a soft halo, and the brightest
kinds (G and above) four faint spikes, as on the title. Drawn into the stars' own sprites: no
full-screen bloom pass, which would cost a phone several milliseconds a frame and, overdone,
looks worse than none (VISUAL_DIRECTION.md §2).

## 3. Lanes alive

- **Open lanes** carry sparks of their power's colour, running outward from the capital along
  the web, so a power's network reads as one thing flowing from home.
- **Lanes being tuned** have their dashes creep forward, towards the end being tuned.
- **Dark lanes** stay still and dim.

## 4. Each power's reach

Every system a power holds (its capital, colonies, outposts and home web, as the map already
marks) lies in a soft field of its colour, larger round the capital. Fields of one power join
smoothly where they meet rather than brightening, so a power's territory reads as one region; drawn
under the lanes and stars, in both views.

## 5. Choosing and entering

- **Selection:** the ring round a chosen system settles in from larger, then breathes slowly; the
  hover ring fades in.
- **Entering a system:** the camera glides in on it for about a third of a second, the view dims,
  and the system in 3D comes up out of the dark. Leaving, the map comes back up where it was.

## 6. Power and motion

The map draws only when something changes. With these animations it draws all the time, but at
most 30 frames a second while only the sparks, the fields and the rings are moving (the camera
still gets every frame), never while the page is hidden or the system view is open, and only when
there is something to animate. With *reduced motion* nothing moves, the glide and the dimming are
skipped, and the map draws only when something changes, as now. Low quality draws fewer
background stars and a smaller sky.

## 7. Tests

- The map draws with its sky; its ambient motion stops with reduced motion.
- One field for each system a power holds; sparks on open lanes only.
- Entering a system still opens it (existing journeys), with the glide skipped under reduced motion.
- The existing journeys, which wait for the camera to stop, are not kept waiting by the ambient
  motion.
- Screenshots at the ten sizes.

## 8. As built

- **The sky** is the title's, shared from `src/render/milkyWay.ts`: baked when the map first
  draws (and again if the quality changes), drawn by a full-screen pass that samples it in the
  camera's direction, with the faint stars drawn as directions rather than places. Both work for
  the flat view's camera, which has no perspective, through a nominal 50° lens. It is drawn at
  62% strength in 3D and 45% in the flat view.
- **Stars** are a little larger, with a bright core, a soft halo and, for G stars and brighter,
  four spikes (fainter for K).
- **Sparks** are short dashes about 7 px long every 70 px, lighter than the power's colour,
  running outward at 36 px a second; each lane is drawn from the end nearer its power's capital
  through that power's own open lanes. Tuning dashes creep at 6 px a second.
- **Fields** are discs facing the camera, 3.2 ly in radius round a held system and 4.4 ly round a capital,
  joined with a *maximum* blend so a power's fields make one region; drawn under the lanes.
- **Selection:** the ring starts half again as large and settles in a tenth of a second, then
  breathes by 4% every few seconds.
- **The glide** moves the camera in on the system in about a third of a second while a veil
  darkens the map; the system view opens under the veil and the veil lifts over half a second.
  Leaving, the camera goes back to where it was before the glide and the veil lifts again.
- **The frame rate:** a change (the camera, the content, the selection) is drawn at once; the
  ambient motion alone is drawn at most every 30 ms, and less often (down to every 400 ms) on a
  device that takes long over a frame or cannot keep up, so it stays quick to answer a touch; nothing is drawn while the system view is
  open or with reduced motion unless something changes. The camera counts as still while only
  the ambient motion runs, so nothing waits for it.
- **Tests:** `tests/e2e/living.spec.ts` on the phone, tablet and desktop: a game's map has its
  sky, one field for each of the Cooperative's seven systems and sparks on its six lanes; the
  neighbourhood alone shows every power's web (21 fields, 18 lanes); the glide opens the system
  and the camera comes back exactly; with reduced motion nothing moves on its own.
