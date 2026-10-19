// Checks that each service's key works, without making (or paying for) a picture: lists the models
// the key can use and says whether the default image model is among them. A service without a key
// is skipped; the check fails if no service works, or if a key that is set is refused.
//
//   npm run art:ping

import { apiKey, KEY_NAMES } from './env.ts';
import { DEFAULT_MODELS, imageModelsFromPing, PROVIDERS, pingRequest } from './providers.ts';

let working = 0;
let failures = 0;
for (const provider of PROVIDERS) {
  const key = apiKey(provider);
  if (!key) {
    console.log(`${provider}: no ${KEY_NAMES[provider]} set; skipped.`);
    continue;
  }
  const call = pingRequest(provider, key);
  try {
    const res = await fetch(call.url, call.init);
    if (!res.ok) {
      console.log(`${provider}: the key was refused (${res.status}): ${(await res.text()).slice(0, 300)}`);
      failures++;
      continue;
    }
    const models = imageModelsFromPing(provider, await res.json());
    const def = DEFAULT_MODELS[provider];
    console.log(`${provider}: key works. Image models: ${models.join(', ') || '(none listed)'}`);
    console.log(`${provider}: default ${def} is ${models.includes(def) ? 'available' : 'NOT listed for this key'}.`);
    working++;
  } catch (err) {
    console.log(`${provider}: could not reach the service: ${(err as Error).message}`);
    failures++;
  }
}
if (working === 0 && failures === 0) console.log('No image service has a key yet (docs/ART_PIPELINE.md).');
process.exit(working > 0 && failures === 0 ? 0 : 1);
