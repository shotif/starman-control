// The settings screen (M1_PROOF.md §1): text size, reduced motion and quality, the same on a phone
// and a desktop. Every change applies at once and is kept on the device.

import { quality, reducedMotion, type Settings, settings, TEXT_SCALES, updateSettings } from '../../app/settings.ts';
import '../page.css';

/** Back where the player came from: the game, or the title. */
export function goBack(): void {
  if (history.length > 1) history.back();
  else location.hash = '#/';
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: readonly { value: T; text: string }[];
  onPick: (v: T) => void;
}) {
  return (
    <fieldset class="choices">
      <legend class="visually-hidden">{label}</legend>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          class="choice"
          aria-pressed={o.value === value}
          onClick={() => onPick(o.value)}
        >
          {o.text}
        </button>
      ))}
    </fieldset>
  );
}

export default function SettingsScreen() {
  const s: Settings = settings.value;
  return (
    <main class="page settings-page">
      <button type="button" class="back" onClick={goBack}>
        ← Back
      </button>
      <h1>Settings</h1>
      <section class="page-section" aria-labelledby="set-text">
        <h2 id="set-text">Text size</h2>
        <p>Every word in the game, on every screen.</p>
        <Choice
          label="Text size"
          value={s.textScale}
          options={TEXT_SCALES.map((t) => ({ value: t, text: `${Math.round(t * 100)}%` }))}
          onPick={(textScale) => updateSettings({ textScale })}
        />
      </section>
      <section class="page-section" aria-labelledby="set-motion">
        <h2 id="set-motion">Reduced motion</h2>
        <p>
          The map and the systems snap rather than glide, and the worlds stand still. Now{' '}
          {reducedMotion(s) ? 'reduced' : 'full'}.
        </p>
        <Choice
          label="Reduced motion"
          value={s.motion}
          options={[
            { value: 'system', text: 'As the device' },
            { value: 'reduce', text: 'On' },
            { value: 'full', text: 'Off' },
          ]}
          onPick={(motion) => updateSettings({ motion })}
        />
      </section>
      <section class="page-section" aria-labelledby="set-quality">
        <h2 id="set-quality">Quality</h2>
        <p>
          Low draws the worlds as plain spheres and the map at a lower resolution, for older phones. Now {quality(s)}.
        </p>
        <Choice
          label="Quality"
          value={s.quality}
          options={[
            { value: 'auto', text: 'Automatic' },
            { value: 'low', text: 'Low' },
            { value: 'medium', text: 'Medium' },
            { value: 'high', text: 'High' },
          ]}
          onPick={(q) => updateSettings({ quality: q })}
        />
      </section>
    </main>
  );
}
